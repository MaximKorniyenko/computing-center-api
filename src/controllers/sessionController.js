// controllers/SessionController.js
class SessionController {
    constructor(sessionService, logger) {
        this.sessionService = sessionService;
        this.logger = logger;
    }

    startSession = async (req, res) => {
        try {
            const userId = req.session.user?.id;
            const { computerId } = req.body;

            await this.sessionService.startSession(userId, computerId);
            await this.logger.logAction(req, 'SESSION_START', { computerId });

            res.redirect('/computer');
        } catch (e) {
            let msg = "Помилка при старті сесії";
            if (e.message === 'ALREADY_HAS_SESSION') msg = "Спочатку завершіть стару сесію!";
            if (e.message === 'COMPUTER_NOT_AVAILABLE') msg = "Комп'ютер вже зайнятий.";

            req.session.flash = { type: 'error', message: msg };
            req.session.save(() => res.redirect('/computer'));
        }
    };

    endSession = async (req, res) => {
        try {
            const userId = req.session.user?.id;
            await this.sessionService.endSession(userId);
            await this.logger.logAction(req, 'SESSION_END');
            res.redirect('/computer');
        } catch (e) {
            res.status(400).send(e.message);
        }
    };

    adminStopSession = async (req, res) => {
        try {
            const { computerId } = req.body;
            await this.sessionService.forceStop(computerId);
            await this.logger.logAction(req, 'SESSION_FORCE_STOP', { computerId }, 'WARNING');
            res.redirect('/computer');
        } catch (e) {
            res.status(400).send(e.message);
        }
    };

    getSessionsPage = async (req, res) => {
        try {
            const { page = 1, search = '', status = 'all' } = req.query;
            const limit = 10;

            const { sessions, count } = await this.sessionService.getSessionsData(Number(page), limit, search, status);

            res.render('pages/sessions', {
                sessions,
                totalPages: Math.ceil(count / limit) || 1,
                totalSessions: count,
                search,
                status,
                currentPage: Number(page),
                user: req.session.user
            });
        } catch (e) {
            res.redirect('/session');
        }
    };
}