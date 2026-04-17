const BaseController = require('./BaseController');

class AuthController extends BaseController{
    constructor(authService, loggerService) {
        super(loggerService);
        this.authService = authService;
    }

    login = async (req, res) => {
        const { login, password } = req.body;

        try {
            if (!login || !password) {
                return res.render('pages/login', { error: 'Будь ласка, введіть логін та пароль' });
            }

            const user = await this.authService.authenticateUser(login, password);

            const { id, pib, role, accessGroup } = user;

            req.session.user = {
                id,
                pib,
                role,
                login,
                accessGroup
            };

            req.session.save(async (err) => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.render('pages/login', { error: 'Помилка збереження сесії' });
                }

                await this.log(req, 'LOGIN_SUCCESS', { role: user.role });
                res.redirect('/computer');
            });

        } catch (e) {
            let errorMessage = 'Сталася критична помилка на сервері';

            if (e.message === 'INVALID_CREDENTIALS') {
                errorMessage = 'Невірний логін або пароль';
            }

            await this.log(req, 'AUTH_ERROR', { error: e.message }, 'ERROR');
            res.render('pages/login', { error: errorMessage });
        }
    };

    logout = async (req, res) => {
        await this.log(req, 'LOGOUT');

        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ message: 'Не вдалося вийти з системи' });
            }
            res.redirect('/computer');
        });
    };

    getLoginPage = (req, res) => {
        if (req.session.user) return res.redirect('/computer');
        res.render('pages/login', { error: null });
    };
}

module.exports = AuthController;