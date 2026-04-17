class BaseController {
    constructor(loggerService) {
        this.loggerService = loggerService;
    }

    async log(req, action, details = {}, level = 'INFO') {
        if (!this.loggerService) return;

        const user = req.session?.user;
        const logData = {
            action,
            level,
            details,
            ip: req.ip || req.connection.remoteAddress,
            userId: user?.id || null,
            userRole: user?.role || 'GUEST',
            userName: user ? `${user.login} (${user.pib})` : 'Unauthenticated'
        };

        return await this.loggerService.logAction(logData);
    }
}

module.exports = BaseController;