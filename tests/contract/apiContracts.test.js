const request = require('supertest');
const { hashPassword } = require('../../src/utils/passwordHasher');

jest.mock('../../src/config/redis', () => ({
    on: jest.fn(), connect: jest.fn(), get: jest.fn(), set: jest.fn()
}));
jest.mock('../../src/config/mongo', () => jest.fn());
jest.mock('connect-redis', () => {
    const session = require('express-session');
    return { RedisStore: session.MemoryStore };
});
jest.mock('../../src/services/loggerService', () => {
    return jest.fn().mockImplementation(() => ({
        logAction: jest.fn().mockResolvedValue()
    }));
});

const app = require('../../src/index');
const UserRepository = require('../../src/repositories/UserRepository');

describe('Web App Contract Tests (EJS & Redirects)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /auth/register', () => {
        test('testRegistrationResponseContract', async () => {
            //Arrange
            jest.spyOn(UserRepository.prototype, 'findByLogin').mockResolvedValue(null);
            jest.spyOn(UserRepository.prototype, 'create').mockResolvedValue({ id: 1 });

            //Act
            const response = await request(app)
                .post('/user/create')
                .send({
                    pib: 'Новий Студент',
                    login: 'contract_new_student',
                    password: 'SecurePass123',
                    role: 'USER'
                });

            // Assert
            expect(response.status).toBe(302);
            expect(response.headers.location).toBe('/auth/login');
        });
    });

    describe('POST /auth/login', () => {
        test('testLoginResponseContract', async () => {
            //Arrange
            const hashedPass = await hashPassword('CorrectPassword');


            jest.spyOn(UserRepository.prototype, 'findByLogin').mockResolvedValue({
                id: 10,
                pib: 'Студент КПІ',
                login: 'student_kpi',
                password: hashedPass,
                role: 'PROGRAMMER',
                accessGroup: 'development'
            });

            //Act
            const response = await request(app)
                .post('/auth/login')
                .send({
                    login: 'student_kpi',
                    password: 'CorrectPassword'
                });

            // Assert
            expect(response.status).toBe(302);
            expect(response.headers.location).toBe('/computer');

            expect(response.headers['set-cookie']).toBeDefined();
        });
    });
});