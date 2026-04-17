class SessionRepository {
    constructor(prisma) { this.prisma = prisma; }

    async findActiveByUserId(userId) {
        return await this.prisma.session.findFirst({
            where: { userId: parseInt(userId), endTime: null },
            include: { computer: true }
        });
    }

    async findActiveByComputerId(computerId) {
        return await this.prisma.session.findFirst({
            where: { computerId: parseInt(computerId), endTime: null }
        });
    }

    async createSession(tx, data) {
        return await tx.session.create({ data });
    }

    async closeSession(tx, sessionId) {
        return await tx.session.update({
            where: { id: sessionId },
            data: { endTime: new Date() }
        });
    }

    async getPaginated(where, skip, take) {
        return await this.prisma.$transaction([
            this.prisma.session.findMany({
                where, skip, take,
                orderBy: { startTime: "desc" },
                include: { user: true, computer: true }
            }),
            this.prisma.session.count({ where })
        ]);
    }

    async findByDateRange(start, end) {
        return await this.prisma.session.findMany({
            where: {
                startTime: { gte: start, lte: end }
            },
            include: { user: true }
        });
    }
}

module.exports = SessionRepository;