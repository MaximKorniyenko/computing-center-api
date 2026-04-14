const bcrypt = require('bcrypt');

class AuthService {
    constructor(prisma) {
        this.prisma = prisma;
    }

    async authenticateUser(login, password) {
        if (!login || !password) {
            return { error: 'Будь ласка, введіть логін та пароль' };
        }

        try {
            const user = await this.prisma.user.findUnique({
                where: { login: login }
            });

            if (!user || !(await bcrypt.compare(password, user.password))) {
                return { error: 'Невірний логін або пароль' };
            }

            return { user };
        } catch (e) {
            console.error('Authentication error:', e);
            throw e;
        }
    }
}

module.exports = AuthService;
