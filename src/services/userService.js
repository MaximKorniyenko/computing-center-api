const { getAccessGroup, hashPassword } = require('../utils/accessMapper');

class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async getUsersPage(page, limit, search) {
        const [users, total] = await this.userRepository.findActive(page, limit, search);
        return { users, total };
    }

    async registerUser({ pib, login, password, role }) {
        const hashedPassword = await hashPassword(password);
        const accessGroup = getAccessGroup(role);

        return await this.userRepository.create({
            pib, login, password: hashedPassword, role, accessGroup
        });
    }

    async updateUser(id, data) {
        const updateData = { ...data };
        if (data.role) updateData.accessGroup = getAccessGroup(data.role);
        if (data.password) updateData.password = await hashPassword(data.password);

        return await this.userRepository.update(id, updateData);
    }

    async softDelete(id) {
        const user = await this.userRepository.findById(id);
        if (!user) throw new Error('NOT_FOUND');

        return await this.userRepository.update(id, {
            deletedAt: new Date(),
            login: `${user.login}_deleted_${Date.now()}`
        });
    }
}