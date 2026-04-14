class LoggerService {
    constructor(AuditLog) {
        this.AuditLog = AuditLog;
    }

    async logAction(req, action, details = {}, level = 'INFO') {
        try {
            const user = req.session?.user || null;

            const logEntry = {
                action,
                level,
                ip: req.ip || req.connection.remoteAddress,
                details: details,
                userId: user ? user.id : null,
                userRole: user ? user.role : 'GUEST',
                userName: user ? `${user.login} (${user.pib})` : 'Unauthenticated'
            };

            await this.AuditLog.create(logEntry);
            console.log(`LOG [${action}]: saved to Mongo`); //прибрати
        } catch (err) {
            console.error('Logger Service Error:', err.message);
        }
    }

    async getLogsData(page, limit, search, level) {
        const query = {};

        if (level !== 'all') {
            query.level = level;
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { action: searchRegex },
                { userName: searchRegex },
                { ip: searchRegex },
                { userRole: searchRegex }
            ];
        }

        const totalLogs = await this.AuditLog.countDocuments(query);

        const logs = await this.AuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const totalPages = Math.ceil(totalLogs / limit) || 1;

        return { logs, totalPages, totalLogs };
    }

    async clearAuditLogs(user, ip) {
        await this.AuditLog.deleteMany({});

        await this.AuditLog.create({
            action: 'LOGS_CLEARED',
            level: 'CRITICAL',
            ip: ip,
            userId: user.id,
            userRole: user.role,
            userName: user.login,
            details: { message: 'Адміністратор очистив історію подій' }
        });
    }
}

module.exports = LoggerService;