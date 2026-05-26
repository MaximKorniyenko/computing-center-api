class UserBuilder {
    constructor(user = null) {
        this.user = user || {
            id: 1,
            pib: 'Тест Тестенко',
            login: 'test_user',
            password: 'hashed_password_123',
            role: 'USER',
            accessGroup: 'guest',
            createdAt: new Date('2026-01-01T10:00:00Z'),
            deletedAt: null
        };
    }

    withId(id) {
        return new UserBuilder({ ...this.user, id });
    }

    withLogin(login) {
        return new UserBuilder({ ...this.user, login });
    }

    withRole(role) {
        return new UserBuilder({ ...this.user, role });
    }

    withAccessGroup(group) {
        return new UserBuilder({ ...this.user, accessGroup: group });
    }

    deleted() {
        return new UserBuilder({ ...this.user, deletedAt: new Date() });
    }

    build() {
        // Заморожуємо об'єкт, щоб сам тест не міг його випадково мутувати
        return Object.freeze({ ...this.user });
    }
}

module.exports = UserBuilder;