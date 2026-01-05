import type {
  ListUsers,
  CreateUser,
  GetUser,
  UpdateUser,
  DeleteUser,
  UpdateUserStatus
} from '../api/generated';
import type { UserRepository } from '../repository/user.repository';

export function createUserHandlers(repository: UserRepository) {
  const listUsers: ListUsers = async (params, respond) => {
    const queryOptions = params.query || {};

    const users = await repository.findAll(queryOptions);

    return respond.with200().body(users);
  };

  const createUser: CreateUser = async (params, respond) => {
    const userData = params.body;

    const newUser = await repository.create(userData);

    return respond.with201().body(newUser);
  };

  const getUser: GetUser = async (params, respond) => {
    const { userId } = params.params;

    const user = await repository.findById(userId);

    if (!user) {
      return respond.with404().body();
    }

    return respond.with200().body(user);
  };

  const updateUser: UpdateUser = async (params, respond) => {
    const { userId } = params.params;
    const updates = params.body;

    const updatedUser = await repository.update(userId, updates);

    if (!updatedUser) {
      return respond.with404().body();
    }

    return respond.with200().body(updatedUser);
  };

  const deleteUser: DeleteUser = async (params, respond) => {
    const { userId } = params.params;

    const deleted = await repository.delete(userId);

    if (!deleted) {
      return respond.with404().body();
    }

    return respond.with204().body();
  };

  const updateUserStatus: UpdateUserStatus = async (params, respond) => {
    const { userId } = params.params;
    const { status } = params.body;

    // If no status provided, just return the current user
    if (!status) {
      const user = await repository.findById(userId);
      if (!user) {
        return respond.with404().body();
      }
      return respond.with200().body(user);
    }

    const updatedUser = await repository.updateStatus(userId, status);

    if (!updatedUser) {
      return respond.with404().body();
    }

    return respond.with200().body(updatedUser);
  };

  return {
    listUsers,
    createUser,
    getUser,
    updateUser,
    deleteUser,
    updateUserStatus,
  };
}


