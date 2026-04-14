class ComputerController {
    constructor(computerService, loggerService) {
        this.computerService = computerService;
        this.loggerService = loggerService;
    }

    getAllComputers = async (req, res) => {
        try {
            const { search, status } = req.query;

            const { computers: computersWithSpecs, source } = await this.computerService.getComputersData(search, status);
            console.log(`Data source: ${source}`);

            let activeComputerId = null;
            if (req.session.user) {
                activeComputerId = await this.computerService.getActiveSessionComputerId(req.session.user.id);
            }

            const flashMessage = req.session.flash;
            delete req.session.flash;

            res.render('pages/dashboard', {
                computers: computersWithSpecs,
                activeComputerId: activeComputerId,
                query: req.query,
                flashMessage
            });
        } catch (e) {
            console.log("Error when requesting computers data: ", e);
            await this.loggerService.logAction(req, 'SYSTEM_ERROR_COMPUTERS_LIST', {
                error: e.message,
                stack: e.stack
            }, 'ERROR');
            res.status(500).render('pages/error', { message: "Помилка при отримані комп'ютерів" });
        }
    };

    getAddComputerForm = (req, res) => {
        res.render('pages/add-pc');
    };

    addComputer = async (req, res) => {
        try {
            const newPC = await this.computerService.createComputer(req.body);

            await this.loggerService.logAction(req, 'COMPUTER_CREATE', {
                computerId: newPC.id,
                invNumber: newPC.inventoryNumber
            });
            
            req.session.flash = { type: 'success', message: `Комп'ютер ${req.body.inventoryNumber} успішно додано!` };

            req.session.save(() => {
                res.redirect('/computer');
            });
        } catch (e) {
            console.error('Помилка при створенні комп\'ютера:', e);

            const isDuplicate = e.code === 'P2002';
            const level = isDuplicate ? 'WARNING' : 'ERROR';
            const action = isDuplicate ? 'COMPUTER_CREATE_DUPLICATE' : 'COMPUTER_CREATE_ERROR';

            await this.loggerService.logAction(req, action, {
                error: e.message,
                inventoryNumber: req.body.inventoryNumber
            }, level);

            if (isDuplicate) {
                req.session.flash = { type: 'danger', message: 'Такий ПК вже існує' };
                return req.session.save(() => res.redirect('/computer'));
            }
      
            req.session.flash = { type: 'danger', message: e.message || 'Помилка створення ПК' };
            req.session.save(() => res.redirect('/computer/create-form'));
        }
    };

    finishMaintenance = async (req, res) => {
        try {
            const { computerId } = req.body;

            await this.computerService.setMaintenanceStatus(computerId, 'AVAILABLE');

            await this.loggerService.logAction(req, 'MAINTENANCE_FINISH', { computerId });
            res.redirect('/computer');
        } catch (e) {
            console.error(e);

            await this.loggerService.logAction(req, 'MAINTENANCE_FINISH_ERROR', {
                computerId: req.body.computerId,
                error: e.message
            }, 'ERROR');

            res.status(500).send("Не вдалося завершити ремонт");
        }
    };

    startMaintenance = async (req, res) => {
        try {
            const { computerId } = req.body;

            await this.computerService.setMaintenanceStatus(computerId, 'MAINTENANCE');

            await this.loggerService.logAction(req, 'MAINTENANCE_START', { computerId });
            res.redirect('/computer');
        } catch (e) {
            console.error(e);
            await this.loggerService.logAction(req, 'MAINTENANCE_START_ERROR', {
                computerId: req.body.computerId,
                error: e.message
            }, 'ERROR');
            res.status(500).send("Не вдалося почати ремонт");
        }
    };

    deleteComputer = async (req, res) => {
        try {
            const { id } = req.body;

            if (!id) {
                req.session.flash = { type: 'danger', message: 'ID комп\'ютера не передано.' };
                return req.session.save(() => res.redirect('/computer'));
            }

            const archiveResult = await this.computerService.archiveComputer(id);

            if (!archiveResult.success) {
                req.session.flash = { 
                    type: archiveResult.reason.includes('активна сесія') ? 'warning' : 'danger', 
                    message: archiveResult.reason 
                };
                return req.session.save(() => res.redirect('/computer'));
            }

            await this.loggerService.logAction(req, 'COMPUTER_ARCHIVE', {
                computerId: id,
                oldInvNumber: archiveResult.oldInvNumber
            }, 'WARNING');

            req.session.flash = { type: 'success', message: 'Комп\'ютер успішно перенесено в архів.' };
            req.session.save(() => res.redirect('/computer'));

        } catch (e) {
            console.error("Помилка при видаленні ПК:", e);
            await this.loggerService.logAction(req, 'COMPUTER_DELETE_ERROR', {
                computerId: req.body.id,
                error: e.message
            }, 'ERROR');
            req.session.flash = { type: 'danger', message: 'Сталася помилка при спробі видалення.' };
            req.session.save(() => res.redirect('/computer'));
        }
    };
}

module.exports = ComputerController;