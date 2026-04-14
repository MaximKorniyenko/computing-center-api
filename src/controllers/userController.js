class UserController {
    constructor(userService, loggerService) {
        this.userService = userService;
        this.loggerService = loggerService;
    }

    getUsersPage = async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const search = req.query.search || "";
        const limit = 10;

        const [users, amountUsers, code] = await this.userService.getNUsers(page, limit, search);
        const totalPages = Math.ceil(amountUsers / limit) || 1;

        const flashMessage = req.session.flash;
        delete req.session.flash;

        if (code === 200) {
            await this.loggerService.logAction(req, 'USERS_List_VIEW', { page, search });
            res.render('pages/users', {
                users,
                totalPages,
                search,
                currentPage: page,
                totalUsers: amountUsers,
                flashMessage
            });
        }
        else {
            res.redirect('/computer');
        }
    };

    getRegisterForm = (req, res) => {
        res.render('pages/add-user', { error: null });
    };

    registerUser = async (req, res) => {
        try {
            const { pib, login, password, role } = req.body;

            if (!pib || !login || !password || !role) {
                return res.render('pages/add-user', { user: req.session.user, error: "Всі поля обов'язкові!" });
            }

            const [newUser, status] = await this.userService.registerUsr(pib, login, password, role);

            if (status === 201) {
                req.session.flash = { type: 'success', message: `Користувача ${login} створено!` };
                return req.session.save(() => res.redirect('/user'));
            } 
            else if (status === 409) {
                return res.render('pages/add-user', { user: req.session.user, error: "Користувач з таким логіном вже існує!" });
            } 
            else {
                throw new Error("Service error");
            }
        } 
        catch (e) {
            console.error(e);
            await this.loggerService.logAction(req, 'USER_CREATE_ERROR', {
                loginAttempt: req.body.login,
                error: e.message
            }, 'ERROR');
            res.render('pages/add-user', { user: req.session.user, error: "Помилка сервера при створенні." });
        }
    };

    getEditUserForm = async (req, res) => {
        const userId = req.params.id;
        
        if (parseInt(userId) === req.session.user.id) {
            req.session.flash = { type: 'danger', message: 'Ви не можете редагувати власні права доступу.' };
            return req.session.save(() => res.redirect('/user'));
        }

        const userToEdit = await this.userService.getUserById(userId);
        
        if (!userToEdit) {
            req.session.flash = { type: 'danger', message: 'Користувача не знайдено' };
            return req.session.save(() => res.redirect('/user'));
        }

        res.render('pages/edit-user', { user: req.session.user, userToEdit, error: null });
    };

    updateUser = async (req, res) => {
        try {
            const { id, pib, login, password, role } = req.body;

            let updateData = { pib, login, role, password };

            const [updated, status] = await this.userService.updateUser(id, updateData);

            if (status === 200) {
                req.session.flash = { type: 'success', message: `Дані користувача ${login} оновлено.` };
                req.session.save(() => res.redirect('/user'));
            } 
            else if (status === 409) {
                const userToEdit = await this.userService.getUserById(id); 
                res.render('pages/edit-user', { user: req.session.user, userToEdit, error: "Такий логін вже зайнятий!" });
            } 
            else {
                throw new Error("Update failed");
            }
        } catch (e) {
            console.error(e);
            await this.loggerService.logAction(req, 'USER_UPDATE_ERROR', {
                targetUserId: req.body.id,
                error: e.message
            }, 'ERROR');
            req.session.flash = { type: 'danger', message: 'Помилка оновлення' };
            req.session.save(() => res.redirect('/user'));
        }
    };

    deleteUser = async (req, res) => {
        const id = parseInt(req.params.id);

        if (id === req.session.user.id) {
            req.session.flash = { type: 'danger', message: 'Ви не можете видалити самі себе!' };
            return req.session.save(() => res.redirect('/user'));
        }

        const status = await this.userService.deleteUser(id);

        if (status === 200) {
            req.session.flash = { type: 'success', message: 'Користувача видалено.' };
        } 
        else {
            req.session.flash = { type: 'danger', message: 'Не вдалося видалити користувача.' };
        }
        req.session.save(() => res.redirect('/user'));
    };
}

module.exports = UserController;