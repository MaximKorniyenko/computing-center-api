class UserRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }

    async findActive(page, limit, search) {
        const offset = (page - 1) * limit;
        const where = {
            deletedAt: null,
            ...(search && {
                OR: [
                    { pib: { contains: search, mode: 'insensitive' } },
                    { login: { contains: search, mode: 'insensitive' } }
                ]
            })
        };

        return await this.prisma.$transaction([
            this.prisma.user.findMany({ where, skip: offset, take: limit, orderBy: { createdAt: "desc" } }),
            this.prisma.user.count({ where })
        ]);
    }

    async create(data) {
        return await this.prisma.user.create({ data });
    }

    async findById(id) {
        return await this.prisma.user.findUnique({ where: { id: parseInt(id) } });
    }

    async update(id, data) {
        return await this.prisma.user.update({ where: { id: parseInt(id) }, data });
    }

    async findByLogin(login) {
        return await this.prisma.user.findUnique({
            where: { login: login }
        });
    }
}

module.exports = UserRepository;