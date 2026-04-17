class LogsController {
    constructor(loggerService) {
        this.loggerService = loggerService;
    }

    getLogsPage = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const search = req.query.search || '';
            const level = req.query.level || 'all';
            const limit = 20;

            const data = await this.loggerService.getLogsData(page, limit, search, level);

            res.render('pages/logs', {
                ...data,
                currentPage: page,
                search,
                level,
                user: req.session.user,
                flashMessage: req.session.flash
            });
            delete req.session.flash;
        } catch (e) {
            console.error('Logs Page Error:', e);
            res.status(500).render('pages/error', { message: "Помилка бази даних." });
        }
    };

    clearLogs = async (req, res) => {
        try {
            const ip = req.ip || req.connection.remoteAddress;
            await this.loggerService.clearAllLogs(req.session.user, ip);

            req.session.flash = { type: 'success', message: 'Журнал подій очищено.' };
            res.redirect('/logs');
        } catch (e) {
            console.error('Помилка при очищенні логів:', e);
            res.status(500).send("Помилка при очищенні.");
        }
    };
}

module.exports = LogsController;