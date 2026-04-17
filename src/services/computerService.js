class ComputerService {
    constructor(computerRepo, detailsRepo, sessionService, redis) {
        this.computerRepo = computerRepo;
        this.detailsRepo = detailsRepo;
        this.sessionService = sessionService;
        this.redis = redis;
    }

    async getDashboardData(search, status) {
        const CACHE_KEY = 'computers:dashboard_list';
        const isCacheable = !search && !status;

        if (isCacheable) {
            const cached = await this.redis.get(CACHE_KEY);
            if (cached) return { computers: JSON.parse(cached), source: 'REDIS' };
        }

        const computers = await this.computerRepo.findAllActive(search, status);
        const computerIds = computers.map(pc => pc.id);

        const specsDocs = await this.detailsRepo.findByComputerIds(computerIds);
        const specsMap = new Map(specsDocs.map(d => [d.computerId, d.specs]));

        const enriched = computers.map(pc => ({
            ...pc,
            specs: specsMap.get(pc.id) || null
        }));

        if (isCacheable && enriched.length > 0) {
            await this.redis.setEx(CACHE_KEY, 60, JSON.stringify(enriched));
        }

        return { computers: enriched, source: 'DB' };
    }

    async createComputer(data) {
        const { inventoryNumber, location, cpu, ram, gpu, storage } = data;
        if (!inventoryNumber || !location) throw new Error("Інвентарний номер та локація обов'язкові!");

        const newPC = await this.computerRepo.create({
            inventoryNumber,
            location,
            status: "AVAILABLE"
        });

        await this.detailsRepo.create(newPC.id, {
            cpu: cpu || 'Не вказано',
            ram: ram || 'Не вказано',
            gpu: gpu || 'Не вказано',
            storage: storage || 'SSD 256GB'
        });

        await this.redis.del('computers:dashboard_list');
        return newPC;
    }

    async setMaintenanceStatus(id, statusToSet) {
        const validStatuses = ['AVAILABLE', 'MAINTENANCE'];
        if (!validStatuses.includes(statusToSet)) throw new Error("Invalid status");

        const updated = await this.computerRepo.update(id, { status: statusToSet });
        await this.redis.del('computers:dashboard_list');
        return updated;
    }

    async archiveComputer(id) {
        const activeSession = await this.sessionService.getActiveSessionByComputerId(id);
        if (activeSession) throw new Error('HAS_ACTIVE_SESSION');

        const pc = await this.computerRepo.findById(id);
        if (!pc) throw new Error('NOT_FOUND');

        await this.computerRepo.update(id, {
            deletedAt: new Date(),
            status: 'ARCHIVED',
            inventoryNumber: `${pc.inventoryNumber}_DEL_${Date.now()}`
        });

        await this.redis.del('computers:dashboard_list');
        return pc.inventoryNumber;
    }
}

module.exports = ComputerService;