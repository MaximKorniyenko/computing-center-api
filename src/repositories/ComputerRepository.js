class ComputerRepository {
    constructor(prisma) { this.prisma = prisma; }

    async findAllActive(search, status) {
        const where = {
            deletedAt: null,
            ...(status && { status }),
            ...(search && {
                OR: [
                    { inventoryNumber: { contains: search, mode: 'insensitive' } },
                    { location: { contains: search, mode: 'insensitive' } }
                ]
            })
        };
        return await this.prisma.computer.findMany({ where, orderBy: { inventoryNumber: "asc" } });
    }

    async create(data) {
        return await this.prisma.computer.create({ data });
    }

    async update(id, data) {
        return await this.prisma.computer.update({ where: { id: parseInt(id) }, data });
    }

    async findById(id) {
        return await this.prisma.computer.findUnique({ where: { id: parseInt(id) } });
    }

    async updateStatus(tx, id, status) {
        return await tx.computer.update({
            where: { id: parseInt(id) },
            data: { status }
        });
    }
}