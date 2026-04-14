class LogsController {
    constructor(loggerService) {
        this.loggerService = loggerService;
    }

    getLogsPage = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 20;
            const search = req.query.search || '';
            const level = req.query.level || 'all';

            const { logs, totalPages, totalLogs } = await this.loggerService.getLogsData(page, limit, search, level);

            const flashMessage = req.session.flash;
            delete req.session.flash;

            res.render('pages/logs', {
                logs,
                currentPage: page,
                totalPages,
                totalLogs,
                search,
                level,
                user: req.session.user,
                flashMessage
            });

        } catch (e) {
            console.error('Logs Page Error:', e);
            res.status(500).render('pages/error', {
                message: "Помилка при завантаженні логів. Перевірте з'єднання з MongoDB."
            });
        }
    };

    clearLogs = async (req, res) => {
        try {
            const ip = req.ip || req.connection.remoteAddress;
            await this.loggerService.clearAuditLogs(req.session.user, ip);

            req.session.flash = { type: 'success', message: 'Журнал подій успішно очищено.' };

            res.redirect('/logs');
        } catch (e) {
            console.error('Clear Logs Error:', e);
            res.status(500).send("Помилка при очищенні логів");
        }
    };
}

module.exports = LogsController;