const BaseController = require('./BaseController');

class ComputerController extends BaseController {
    constructor(computerService, sessionService, loggerService) {
        super(loggerService);
        this.computerService = computerService;
        this.sessionService = sessionService;
    }

    getAllComputers = async (req, res) => {
        try {
            const { search, status } = req.query;

            const { computers, source } = await this.computerService.getDashboardData(search, status);

            let activeComputerId = null;
            if (req.session.user) {
                activeComputerId = await this.sessionService.getActiveSessionComputerId(req.session.user.id);
            }

            const flashMessage = req.session.flash;
            delete req.session.flash;

            res.render('pages/dashboard', {
                computers,
                activeComputerId,
                query: req.query,
                flashMessage,
                user: req.session.user
            });
        } catch (e) {
            await this.log(req, 'SYSTEM_ERROR_COMPUTERS_LIST', { error: e.message }, 'ERROR');
            res.status(500).render('pages/error', { message: "Помилка при отриманні комп'ютерів" });
        }
    };

    getAddComputerForm = (req, res) => {
        res.render('pages/add-pc', { user: req.session.user });
    };


    addComputer = async (req, res) => {
        try {
            const newPC = await this.computerService.createComputer(req.body);

            await this.log(req, 'COMPUTER_CREATE', {
                computerId: newPC.id,
                invNumber: newPC.inventoryNumber
            });

            req.session.flash = { type: 'success', message: `Комп'ютер ${newPC.inventoryNumber} успішно додано!` };
            req.session.save(() => res.redirect('/computer'));

        } catch (e) {
            const isDuplicate = e.code === 'P2002';
            await this.log(req, isDuplicate ? 'COMPUTER_CREATE_DUPLICATE' : 'COMPUTER_CREATE_ERROR',
                { error: e.message, inventoryNumber: req.body.inventoryNumber },
                isDuplicate ? 'WARNING' : 'ERROR'
            );

            req.session.flash = {
                type: 'danger',
                message: isDuplicate ? 'Такий ПК вже існує' : (e.message || 'Помилка створення ПК')
            };
            res.redirect(isDuplicate ? '/computer' : '/computer/create-form');
        }
    };

    startMaintenance = async (req, res) => {
        try {
            const { computerId } = req.body;
            await this.computerService.setMaintenanceStatus(computerId, 'MAINTENANCE');

            await this.log(req, 'MAINTENANCE_START', { computerId });
            res.redirect('/computer');
        } catch (e) {
            await this.log(req, 'MAINTENANCE_START_ERROR', { computerId: req.body.computerId, error: e.message }, 'ERROR');
            res.status(500).send("Не вдалося почати ремонт");
        }
    };


    finishMaintenance = async (req, res) => {
        try {
            const { computerId } = req.body;
            await this.computerService.setMaintenanceStatus(computerId, 'AVAILABLE');

            await this.log(req, 'MAINTENANCE_FINISH', { computerId });
            res.redirect('/computer');
        } catch (e) {
            await this.log(req, 'MAINTENANCE_FINISH_ERROR', { computerId: req.body.computerId, error: e.message }, 'ERROR');
            res.status(500).send("Не вдалося завершити ремонт");
        }
    };

    deleteComputer = async (req, res) => {
        try {
            const { id } = req.body;
            if (!id) throw new Error('ID комп\'ютера не передано.');

            await this.computerService.archiveComputer(id);

            await this.log(req, 'COMPUTER_ARCHIVE', { computerId: id }, 'WARNING');
            req.session.flash = { type: 'success', message: 'Комп\'ютер успішно перенесено в архів.' };
            req.session.save(() => res.redirect('/computer'));

        } catch (e) {
            let type = 'danger';
            let msg = e.message;

            if (e.message === 'HAS_ACTIVE_SESSION') {
                type = 'warning';
                msg = 'Неможливо видалити: на цьому комп\'ютері зараз активна сесія!';
            }

            await this.log(req, 'COMPUTER_DELETE_ERROR', { computerId: req.body.id, error: e.message }, 'ERROR');
            req.session.flash = { type, message: msg };
            req.session.save(() => res.redirect('/computer'));
        }
    };
}

module.exports = ComputerController;