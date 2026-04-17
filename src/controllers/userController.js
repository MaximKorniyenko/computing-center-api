const BaseController = require('./BaseController');

class UserController extends BaseController{
    constructor(userService, loggerService) {
        super(loggerService);
        this.userService = userService;
    }
    getUsersPage = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const search = req.query.search || "";
            const limit = 10;

            const { users, total } = await this.userService.getUsersPage(page, limit, search);
            const totalPages = Math.ceil(total / limit) || 1;

            const flashMessage = req.session.flash;
            delete req.session.flash;

            await this.log(req, 'USERS_LIST_VIEW', { page, search });

            res.render('pages/users', {
                users,
                totalPages,
                search,
                currentPage: page,
                totalUsers: total,
                flashMessage,
                user: req.session.user
            });
        } catch (e) {
            console.error("Помилка при отриманні списку користувачів:", e);
            res.redirect('/computer');
        }
    };

    getRegisterForm = (req, res) => {
        res.render('pages/add-user', { user: req.session.user, error: null });
    };

    registerUser = async (req, res) => {
        const { pib, login, password, role } = req.body;

        try {
            if (!pib || !login || !password || !role) {
                return res.render('pages/add-user', {
                    user: req.session.user,
                    error: "Всі поля обов'язкові!"
                });
            }

            const newUser = await this.userService.registerUser({ pib, login, password, role });

            req.session.flash = {
                type: 'success',
                message: `Користувача ${newUser.login} створено!`
            };

            req.session.save(() => res.redirect('/user'));

        } catch (e) {
            if (e.code === 'P2002') {
                return res.render('pages/add-user', {
                    user: req.session.user,
                    error: "Користувач з таким логіном вже існує!"
                });
            }

            await this.log(req, 'USER_CREATE_ERROR', {
                loginAttempt: login,
                error: e.message
            }, 'ERROR');

            res.render('pages/add-user', {
                user: req.session.user,
                error: "Помилка сервера при створенні користувача."
            });
        }
    };

    getEditUserForm = async (req, res) => {
        try {
            const userId = req.params.id;
            if (parseInt(userId) === req.session.user.id) {
                req.session.flash = {
                    type: 'danger',
                    message: 'Ви не можете редагувати власні права доступу.'
                };
                return req.session.save(() => res.redirect('/user'));
            }

            const userToEdit = await this.userService.getUserById(userId);

            if (!userToEdit) {
                req.session.flash = { type: 'danger', message: 'Користувача не знайдено' };
                return req.session.save(() => res.redirect('/user'));
            }

            res.render('pages/edit-user', {
                user: req.session.user,
                userToEdit,
                error: null
            });
        } catch (e) {
            console.error(e);
            res.redirect('/user');
        }
    };

    updateUser = async (req, res) => {
        const { id, pib, login, password, role } = req.body;

        try {
            const updateData = { pib, login, role };
            if (password && password.trim() !== "") {
                updateData.password = password;
            }

            await this.userService.updateUser(id, updateData);

            await this.log(req, 'USER_CREATE_SUCCESS', {
                createdUserId: newUser.id,
                login: newUser.login
            });

            req.session.flash = {
                type: 'success',
                message: `Дані користувача ${login} оновлено.`
            };
            req.session.save(() => res.redirect('/user'));

        } catch (e) {
            if (e.code === 'P2002') {
                const userToEdit = await this.userService.getUserById(id);
                return res.render('pages/edit-user', {
                    user: req.session.user,
                    userToEdit,
                    error: "Такий логін вже зайнятий!"
                });
            }

            await this.log(req, 'USER_UPDATE_ERROR', {
                targetUserId: id,
                error: e.message
            }, 'ERROR');

            req.session.flash = { type: 'danger', message: 'Помилка оновлення даних' };
            req.session.save(() => res.redirect('/user'));
        }
    };

    deleteUser = async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) throw new Error('INVALID_ID');

            if (id === req.session.user.id) {
                req.session.flash = { type: 'danger', message: 'Ви не можете видалити самі себе!' };
                return req.session.save(() => res.redirect('/user'));
            }

            await this.userService.softDelete(id);

            req.session.flash = { type: 'success', message: 'Користувача видалено.' };
            req.session.save(() => res.redirect('/user'));

        } catch (e) {
            console.error("Помилка видалення:", e);
            req.session.flash = { type: 'danger', message: 'Не вдалося видалити користувача.' };
            req.session.save(() => res.redirect('/user'));
        }
    };
}

module.exports = UserController;