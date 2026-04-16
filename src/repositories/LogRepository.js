class LogRepository {
    constructor(AuditLogModel) {
        this.AuditLog = AuditLogModel;
    }

    async create(logData) {
        return await this.AuditLog.create(logData);
    }

    async findPaginated(query, page, limit) {
        const logs = await this.AuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await this.AuditLog.countDocuments(query);
        return { logs, total };
    }

    async deleteAll() {
        return await this.AuditLog.deleteMany({});
    }
}

module.exports = LogRepository;