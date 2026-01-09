import type { ListUsers, CreateUser, GetUser, UpdateUser, DeleteUser, UpdateUserStatus } from '../api/generated';
import type { UserRepository } from '../repository/user.repository';

export function createUserHandlers(repository: UserRepository) {
    const listUsers: ListUsers = async (params, respond) => {
        const queryOptions = params.query || {};

        const users = await repository.findAll(queryOptions);

        return respond.with200().body({
            success: true,
            message: 'Utilisateurs récupérés avec succès',
            payload: users,
        });
    };

    const createUser: CreateUser = async (params, respond) => {
        const userData = params.body;

        const newUser = await repository.create(userData);

        return respond.with201().body({
            success: true,
            message: 'Utilisateur créé avec succès',
            payload: newUser,
        });
    };

    const getUser: GetUser = async (params, respond) => {
        const { userId } = params.params;

        const user = await repository.findById(userId);

        if (!user) {
            return respond.with404().body({
                success: false,
                message: 'Utilisateur non trouvé',
                payload: null,
            });
        }

        return respond.with200().body({
            success: true,
            message: 'Détails utilisateur récupérés avec succès',
            payload: user,
        });
    };

    const updateUser: UpdateUser = async (params, respond) => {
        const { userId } = params.params;
        const updates = params.body;

        const updatedUser = await repository.update(userId, updates);

        if (!updatedUser) {
            return respond.with404().body({
                success: false,
                message: 'Utilisateur non trouvé',
                payload: null,
            });
        }

        return respond.with200().body({
            success: true,
            message: 'Utilisateur mis à jour avec succès',
            payload: updatedUser,
        });
    };

    const deleteUser: DeleteUser = async (params, respond) => {
        const { userId } = params.params;

        const deleted = await repository.delete(userId);

        if (!deleted) {
            return respond.with404().body({
                success: false,
                message: 'Utilisateur non trouvé',
                payload: null,
            });
        }

        return respond.with200().body({
            success: true,
            message: 'Utilisateur supprimé avec succès',
            payload: null,
        });
    };

    const updateUserStatus: UpdateUserStatus = async (params, respond) => {
        const { userId } = params.params;
        const { status } = params.body;

        // If no status provided, just return the current user
        if (!status) {
            const user = await repository.findById(userId);
            if (!user) {
                return respond.with404().body({
                    success: false,
                    message: 'Utilisateur non trouvé',
                    payload: null,
                });
            }
            return respond.with200().body({
                success: true,
                message: 'Statut utilisateur inchangé',
                payload: user,
            });
        }

        const updatedUser = await repository.updateStatus(userId, status);

        if (!updatedUser) {
            return respond.with404().body({
                success: false,
                message: 'Utilisateur non trouvé',
                payload: null,
            });
        }

        return respond.with200().body({
            success: true,
            message: 'Statut utilisateur mis à jour avec succès',
            payload: updatedUser,
        });
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
