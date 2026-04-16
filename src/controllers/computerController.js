class ComputerController {
    constructor(computerService, sessionService, logger) {
        this.computerService = computerService;
        this.sessionService = sessionService;
        this.logger = logger;
    }

    getAllComputers = async (req, res) => {
        try {
            const { search, status } = req.query;
            const { computers, source } = await this.computerService.getDashboardData(search, status);

            let activeComputerId = null;
            if (req.session.user) {
                activeComputerId = await this.sessionService.getActiveSessionComputerId(req.session.user.id);
            }

            res.render('pages/dashboard', {
                computers,
                activeComputerId,
                query: req.query,
                flashMessage: req.session.flash,
                user: req.session.user
            });
            delete req.session.flash;
        } catch (e) {
            console.error('Download Error:',e);
            res.status(500).render('pages/error', { message: "Помилка завантаження" });
        }
    };

    deleteComputer = async (req, res) => {
        try {
            const { id } = req.body;
            await this.computerService.archiveComputer(id);

            req.session.flash = { type: 'success', message: 'Комп\'ютер архівовано' };
            res.redirect('/computer');
        } catch (e) {
            let msg = 'Помилка видалення';
            if (e.message === 'HAS_ACTIVE_SESSION') msg = 'Неможливо видалити: активна сесія!';

            req.session.flash = { type: 'danger', message: msg };
            res.redirect('/computer');
        }
    };
}