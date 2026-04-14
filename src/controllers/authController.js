class AuthController {
    constructor(authService, loggerService) {
        this.authService = authService;
        this.loggerService = loggerService;
    }

    login = async (req, res) => {
        try {
            const { login, password } = req.body;

            const authResult = await this.authService.authenticateUser(login, password);

            if (authResult.error) {
                return res.render('pages/login', { error: authResult.error });
            }

            const { user } = authResult;

            req.session.user = {
                id: user.id,
                pib: user.pib,
                role: user.role,
                login: user.login,
                accessGroup: user.accessGroup
            };

            req.session.save(async (err) => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.render('pages/login', { error: 'Помилка сервера при створенні сесії користувача' });
                }
                await this.loggerService.logAction(req, 'LOGIN_SUCCESS', { role: user.role });
                res.redirect('/computer'); 
            });
        } catch (e) {
            console.error('Login error:', e);
            try {
                await this.loggerService.logAction(req, 'AUTH_SYSTEM_ERROR', { error: e.message }, 'ERROR');
            } catch (logErr) { console.error('Logger failed too:', logErr); }
            res.render('pages/login', { error: 'Сталася критична помилка на сервері' });
        }
    };
    
    logout = async (req, res) => {
        await this.loggerService.logAction(req, 'LOGOUT');
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
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