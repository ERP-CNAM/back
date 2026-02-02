#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

: "${ADMIN_EMAIL:?Set ADMIN_EMAIL}"
: "${ADMIN_PASSWORD:?Set ADMIN_PASSWORD}"

USER_PASSWORD="${USER_PASSWORD:-DemoPass123!}"
MONTHLY_AMOUNT="${MONTHLY_AMOUNT:-15.0}"
PROMO_CODE="${PROMO_CODE:-B1M20}"

START_DATE="${START_DATE:-2026-06-01}"
END_MONTH="2026-12"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required. Install it first." >&2
  exit 1
fi

request() {
  local method="$1"
  local url="$2"
  local data="${3:-}"
  local token="${4:-}"

  if [ -n "$data" ]; then
    curl -sS -X "$method" "$url" \
      -H "Content-Type: application/json" \
      ${token:+-H "Authorization: Bearer $token"} \
      -d "$data"
  else
    curl -sS -X "$method" "$url" \
      ${token:+-H "Authorization: Bearer $token"}
  fi
}

# Admin login once
admin_login_payload=$(jq -n --arg email "$ADMIN_EMAIL" --arg password "$ADMIN_PASSWORD" '{email:$email,password:$password}')
admin_login_resp=$(request POST "$BASE_URL/auth/admin/login" "$admin_login_payload")
ADMIN_TOKEN=$(echo "$admin_login_resp" | jq -r '.payload.token')
if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
  echo "Admin login failed" >&2
  echo "$admin_login_resp" >&2
  exit 1
fi

# Create 5 users + login + subscribe
USER_IDS=()
USER_EMAILS=()
SUB_IDS=()

for i in 1 2 3 4 5; do
  ts=$(date +%s)
  email="demo${i}+${ts}@example.com"
  contract="C-DEMO-${i}-${ts}"

  create_user_payload=$(jq -n \
    --arg firstName "Demo${i}" \
    --arg lastName "User" \
    --arg email "$email" \
    --arg password "$USER_PASSWORD" \
    --arg phone "+3361234567${i}" \
    --arg address "${i} Rue de la Demo" \
    --arg city "Paris" \
    --arg postalCode "7500${i}" \
    --arg country "FR" \
    '{firstName:$firstName,lastName:$lastName,email:$email,password:$password,phone:$phone,address:$address,city:$city,postalCode:$postalCode,country:$country,
      paymentMethod:{type:"SEPA",iban:"FR76****************1234"}}')

  create_user_resp=$(request POST "$BASE_URL/users" "$create_user_payload")
  user_id=$(echo "$create_user_resp" | jq -r '.payload.id')
  if [ -z "$user_id" ] || [ "$user_id" = "null" ]; then
    echo "User creation failed (user $i)" >&2
    echo "$create_user_resp" >&2
    exit 1
  fi

  login_payload=$(jq -n --arg email "$email" --arg password "$USER_PASSWORD" '{email:$email,password:$password}')
  login_resp=$(request POST "$BASE_URL/auth/login" "$login_payload")
  user_token=$(echo "$login_resp" | jq -r '.payload.token')
  if [ -z "$user_token" ] || [ "$user_token" = "null" ]; then
    echo "User login failed (user $i)" >&2
    echo "$login_resp" >&2
    exit 1
  fi

  sub_payload=$(jq -n \
    --arg userId "$user_id" \
    --arg contractCode "$contract" \
    --arg startDate "$START_DATE" \
    --arg promoCode "$PROMO_CODE" \
    --argjson monthlyAmount "$MONTHLY_AMOUNT" \
    '{userId:$userId,contractCode:$contractCode,startDate:$startDate,monthlyAmount:$monthlyAmount,promoCode:$promoCode}')

  sub_resp=$(request POST "$BASE_URL/subscriptions" "$sub_payload" "$user_token")
  sub_id=$(echo "$sub_resp" | jq -r '.payload.id')
  if [ -z "$sub_id" ] || [ "$sub_id" = "null" ]; then
    echo "Subscription creation failed (user $i)" >&2
    echo "$sub_resp" >&2
    exit 1
  fi

  USER_IDS+=("$user_id")
  USER_EMAILS+=("$email")
  SUB_IDS+=("$sub_id")
  sleep 1

done

# Month loop: June 2026 -> December 2026
current_month="2026-06"
while [ "$current_month" != "2027-01" ]; do
  month_start="${current_month}-01"
  billing_date=$(date -d "$month_start +1 month -1 day" +%Y-%m-%d)
  execution_date=$(date -d "$month_start +1 month" +%Y-%m-%d)

  echo "--- Month $current_month ---"
  echo "Billing date: $billing_date"
  echo "Execution date: $execution_date"

  billing_payload=$(jq -n --arg billingDate "$billing_date" '{billingDate:$billingDate}')
  billing_resp=$(request POST "$BASE_URL/billing/monthly" "$billing_payload" "$ADMIN_TOKEN")
  if [ "$(echo "$billing_resp" | jq -r '.success')" != "true" ]; then
    echo "Billing failed for $billing_date" >&2
    echo "$billing_resp" >&2
    exit 1
  fi

  export_resp=$(request GET "$BASE_URL/exports/banking/direct-debits?executionDate=$execution_date" "" "$ADMIN_TOKEN")

  # Filter orders for our users
  orders=$(echo "$export_resp" | jq -c --argjson users "$(printf '%s
' "${USER_IDS[@]}" | jq -R . | jq -s .)" '.payload[] | select(.userId as $u | $users | index($u))')

  if [ -n "$orders" ]; then
    # Build payment updates as EXECUTED for our orders
    updates=$(echo "$orders" | jq -s '[.[] | {invoiceId:.invoiceId,status:"EXECUTED"}]')
    update_resp=$(request POST "$BASE_URL/bank/payment-updates" "$updates" "$ADMIN_TOKEN")
    if [ "$(echo "$update_resp" | jq -r '.success')" != "true" ]; then
      echo "Payment update failed for $execution_date" >&2
      echo "$update_resp" >&2
      exit 1
    fi
  fi

  # Show invoice statuses for our users for this month
  for uid in "${USER_IDS[@]}"; do
    invoices_resp=$(request GET "$BASE_URL/invoices?userId=$uid" "" "$ADMIN_TOKEN")
    echo "$invoices_resp" | jq -r --arg billingDate "$billing_date" '.payload[] | select(.billingDate==$billingDate) | "invoice=\(.id) status=\(.status) userId=\(.userId)"'
  done

  # advance month
  current_month=$(date -d "$month_start +1 month" +%Y-%m)
  if [ "$current_month" = "2027-01" ]; then
    break
  fi
done

echo "Done. Created ${#USER_IDS[@]} users and ran scenario from 2026-06 to 2026-12."
