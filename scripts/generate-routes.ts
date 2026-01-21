/**
 * Route generator based on OpenAPI spec
 * This script is used to generate the routes.config.ts file
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yamljs';

const OPENAPI_PATH = path.resolve(__dirname, '../api/spec/openapi.yaml');
const OUTPUT_PATH = path.resolve(__dirname, '../src/config/routes.config.ts');

interface Route {
    path: string;
    method: string;
    access: string;
}

/**
 * Generate routes from OpenAPI spec
 */
function generateRoutes() {
    console.log('Generating routes from OpenAPI...');

    if (!fs.existsSync(OPENAPI_PATH)) {
        console.error(`Error: OpenAPI file not found at ${OPENAPI_PATH}`);
        process.exit(1);
    }

    const openapi = yaml.load(OPENAPI_PATH);
    const paths = openapi.paths;
    const rules: Route[] = [];

    for (const [routePath, methods] of Object.entries(paths)) {
        // Convert OpenAPI path params {userId} to Express :userId
        const expressPath = routePath.replace(/\{([^}]+)\}/g, ':$1');

        for (const [method, operation] of Object.entries(methods as any)) {
            const op = operation as any;
            const access = op['x-access-level'] || 'authenticated';

            rules.push({
                path: expressPath,
                method: method.toUpperCase(),
                access: access,
            });
        }
    }

    // Sort rules by specificity: more specific paths (more segments, fewer params) first
    rules.sort((a, b) => {
        const aSegments = a.path.split('/').length;
        const bSegments = b.path.split('/').length;
        if (aSegments !== bSegments) return bSegments - aSegments;

        const aParams = (a.path.match(/:/g) || []).length;
        const bParams = (b.path.match(/:/g) || []).length;
        return aParams - bParams;
    });

    const publicRules = rules.filter((r) => r.access === 'public');
    const authenticatedRules = rules.filter((r) => r.access === 'authenticated');
    const adminRules = rules.filter((r) => r.access === 'admin');

    const rulesCode = [
        '    // ==================== PUBLIC ====================',
        ...publicRules.map((r) => `    { path: '${r.path}', method: '${r.method}', access: 'public' },`),
        '',
        '    // ==================== AUTHENTICATED ====================',
        ...authenticatedRules.map((r) => `    { path: '${r.path}', method: '${r.method}', access: 'authenticated' },`),
        '',
        '    // ==================== ADMIN ONLY ====================',
        ...adminRules.map((r) => `    { path: '${r.path}', method: '${r.method}', access: 'admin' },`),
    ].join('\n');

    const header = `/**
 * Centralized Route Configuration - GENERATED FROM OPENAPI.YAML
 * DO NOT EDIT MANUALLY
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type AccessLevel = 'public' | 'authenticated' | 'admin';

export interface Route {
    path: string;
    method: HttpMethod | '*';
    access: AccessLevel;
}

/**
 * Route rules ordered by specificity (most specific first)
 */
export const ROUTES: Route[] = [`;

    const footer = [
        '];',
        '',
        '/**',
        ' * Converts a route pattern to a regex',
        '',
        ' * @param pattern The route pattern to convert',
        ' * @returns The regex pattern',
        ' */',
        'function patternToRegex(pattern: string): RegExp {',
        '    const escaped = pattern',
        "        .replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&') // Escape special regex chars",
        "        .replace(/:[^/]+/g, '[^/]+'); // Replace :param with wildcard",
        '    return new RegExp(`^${escaped}$`);',
        '}',
        '',
        '/**',
        ' * Check if a path matches a pattern',
        '',
        ' * @param pattern The route pattern to check',
        ' * @param path The path to check',
        ' * @returns True if the path matches the pattern, false otherwise',
        ' */',
        'function matchPath(pattern: string, path: string): boolean {',
        '    const regex = patternToRegex(pattern);',
        '    return regex.test(path);',
        '}',
        '',
        '/**',
        ' * Get the access level for a given path and method',
        '',
        ' * @param path The path to check',
        ' * @param method The method to check',
        ' * @returns The access level for the given path and method',
        ' */',
        'export function getAccessLevel(path: string, method: string): AccessLevel {',
        '    const HTTP_METHOD = method.toUpperCase() as HttpMethod;',
        '',
        '    for (const route of ROUTES) {',
        '        if (matchPath(route.path, path)) {',
        "            if (route.method === '*' || route.method === HTTP_METHOD) {",
        '                return route.access;',
        '            }',
        '        }',
        '    }',
        '',
        '    // Default: require authentication (safe default)',
        "    return 'authenticated';",
        '}',
        '',
    ].join('\n');

    const content = header + '\n' + rulesCode + '\n' + footer;

    fs.writeFileSync(OUTPUT_PATH, content);
    console.log(`Successfully generated ${OUTPUT_PATH}`);
}

generateRoutes();
