class SessionService {
    constructor(sessionRepo, computerRepo, prisma, redis) {
        this.sessionRepo = sessionRepo;
        this.computerRepo = computerRepo;
        this.prisma = prisma;
        this.redis = redis;
    }

    async startSession(userId, computerId) {
        if (!userId) throw new Error('UNAUTHORIZED');

        return await this.prisma.$transaction(async (tx) => {
            const active = await this.sessionRepo.findActiveByUserId(userId);
            if (active) throw new Error('ALREADY_HAS_SESSION');

            const pc = await this.computerRepo.findById(computerId);
            if (!pc || pc.status !== "AVAILABLE") throw new Error('COMPUTER_NOT_AVAILABLE');

            const session = await this.sessionRepo.createSession(tx, {
                userId: parseInt(userId),
                computerId: parseInt(computerId),
                startTime: new Date()
            });

            await this.computerRepo.updateStatus(tx, computerId, "BUSY");
            await this.redis.del('computers:dashboard_list');
            return session;
        });
    }

    async endSession(userId) {
        return await this.prisma.$transaction(async (tx) => {
            const active = await this.sessionRepo.findActiveByUserId(userId);
            if (!active) throw new Error('NO_ACTIVE_SESSION');

            await this.sessionRepo.closeSession(tx, active.id);
            await this.computerRepo.updateStatus(tx, active.computerId, "AVAILABLE");
            await this.redis.del('computers:dashboard_list');
            return active;
        });
    }

    async forceStop(computerId) {
        return await this.prisma.$transaction(async (tx) => {
            const active = await this.sessionRepo.findActiveByComputerId(computerId);
            if (!active) throw new Error('NO_SESSION_ON_PC');

            await this.sessionRepo.closeSession(tx, active.id);
            await this.computerRepo.updateStatus(tx, computerId, "AVAILABLE");
            await this.redis.del('computers:dashboard_list');
        });
    }

    async getSessionsData(page, limit, search, status) {
        const where = {
            ...(status === 'active' && { endTime: null }),
            ...(status === 'finished' && { endTime: { not: null } }),
            ...(search && {
                OR: [
                    { user: { pib: { contains: search, mode: 'insensitive' } } },
                    { computer: { inventoryNumber: { contains: search, mode: 'insensitive' } } }
                ]
            })
        };

        const [sessions, count] = await this.sessionRepo.getPaginated(where, (page - 1) * limit, limit);
        return { sessions, count };
    }
}