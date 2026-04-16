// services/LoggerService.js
class LoggerService {
    constructor(logRepository) {
        this.logRepository = logRepository;
    }

    async logAction(actionData) {
        try {
            const logEntry = {
                action: actionData.action,
                level: actionData.level || 'INFO',
                ip: actionData.ip,
                details: actionData.details || {},
                userId: actionData.userId,
                userRole: actionData.userRole || 'GUEST',
                userName: actionData.userName || 'Unauthenticated'
            };

            await this.logRepository.create(logEntry);
        } catch (err) {
            console.error('Logger Service Error:', err.message);
        }
    }

    async getLogsData(page, limit, search, level) {
        const query = {};
        if (level !== 'all') query.level = level;

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { action: searchRegex }, { userName: searchRegex },
                { ip: searchRegex }, { userRole: searchRegex }
            ];
        }

        const { logs, total } = await this.logRepository.findPaginated(query, page, limit);
        const totalPages = Math.ceil(total / limit) || 1;

        return { logs, totalPages, totalLogs: total };
    }

    async clearAllLogs(adminUser, ip) {
        await this.logRepository.deleteAll();

        await this.logAction({
            action: 'LOGS_CLEARED',
            level: 'CRITICAL',
            ip: ip,
            userId: adminUser.id,
            userRole: adminUser.role,
            userName: adminUser.login,
            details: { message: 'Адміністратор очистив історію подій' }
        });
    }
}

module.exports = LoggerService;