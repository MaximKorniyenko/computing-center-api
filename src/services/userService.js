const bcrypt = require('bcrypt');

class UserService {
    constructor(prisma) {
        this.prisma = prisma;
    }

    async getNUsers(page, limit, search) {
        try {
            const offset = (page - 1) * limit;

            const whereClause = search ? {
                OR: [
                    { pib: { contains: search, mode: 'insensitive' } },
                    { login: { contains: search, mode: 'insensitive' } }
                ]
            } : {};

            whereClause.deletedAt = null;

            const [users, counter] = await this.prisma.$transaction(async (tx) => {
                const users = await tx.user.findMany({
                    where: whereClause,
                    skip: offset,
                    take: limit,
                    orderBy: { createdAt: "desc" }
                });

                const count = await tx.user.count({ where: whereClause });
                return [users, count];
            });

            return [users, counter, 200];
        } catch (e) {
            console.log("Yo err!");
            return [[], 0, 400];
        }
    }

    async registerUsr(pib, login, password, role) {
        try {
            const roleToGroupMap = {
                'DB_ADMIN': 'root',
                'PROGRAMMER': 'development',
                'OPERATOR': 'support',
                'HARDWARE_SPECIALIST': 'hardware',
                'USER': 'guest'
            };

            const accessGroup = roleToGroupMap[role] || 'guest';

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await this.prisma.user.create({
                data: {
                    pib: pib,
                    login: login,
                    password: hashedPassword,
                    role: role,
                    accessGroup
                }
            });
            return [newUser, 201];
        } catch (e) {
            if (e.code === 'P2002') {
                return [null, 409];
            }
            console.error("Error creating user:", e);
            return [null, 500];
        }
    }

    async getUserById(id) {
        return await this.prisma.user.findUnique({ where: { id: parseInt(id) } });
    }

    async updateUser(id, data) {
        try {
            const roleToGroupMap = {
                'DB_ADMIN': 'root',
                'PROGRAMMER': 'development',
                'OPERATOR': 'support',
                'HARDWARE_SPECIALIST': 'hardware',
                'USER': 'guest'
            };

            const accessGroup = data.role ? (roleToGroupMap[data.role] || 'guest') : data.accessGroup;

            const updateData = {
                pib: data.pib,
                login: data.login,
                role: data.role,
                accessGroup: accessGroup
            };

            if (data.password && data.password.trim() !== "") {
                updateData.password = await bcrypt.hash(data.password, 10);
            }

            const updatedUser = await this.prisma.user.update({
                where: { id: parseInt(id) },
                data: updateData
            });
            return [updatedUser, 200];
        } catch (e) {
            if (e.code === 'P2002') return [null, 409];
            console.error(e);
            return [null, 500];
        }
    }

    async deleteUser(id) {
        try {
            const user = await this.prisma.user.findUnique({ where: { id: parseInt(id) } });
            if (!user) return 404;

            await this.prisma.user.update({
                where: { id: parseInt(id) },
                data: {
                    deletedAt: new Date(),
                    login: `${user.login}_deleted_${Date.now()}`
                }
            });

            return 200;
        } catch (e) {
            console.error(e);
            return 500;
        }
    }
}

module.exports = UserService;