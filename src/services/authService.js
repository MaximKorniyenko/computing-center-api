const { comparePasswords } = require('../utils/passwordHasher');

class AuthService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async authenticateUser(login, password) {
        const user = await this.userRepository.findByLogin(login);

        if (!user || !(await comparePasswords(password, user.password))) {
            throw new Error('INVALID_CREDENTIALS');
        }

        return user;
    }
}

module.exports = AuthService;