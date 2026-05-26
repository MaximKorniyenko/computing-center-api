const request = require('supertest');
const express = require('express');
const session = require('express-session');
const { isAuthenticated, hasRole } = require('../../../src/middlewares/authMiddleware');

const createTestApp = (middleware, mockUser = null) => {
    const app = express();

    app.use(session({
        secret: 'test_secret',
        resave: false,
        saveUninitialized: false
    }));

    if (mockUser) {
        app.use((req, res, next) => {
            req.session.user = mockUser;
            next();
        });
    }

    app.get('/protected', middleware, (req, res) => {
        res.status(200).send('ACCESS_GRANTED');
    });

    return app;
};

describe('Integration Security - Auth Middleware', () => {

    describe('isAuthenticated Middleware', () => {

        test('IsAuthenticated_NoSession_ThrowsError', async () => {
            //Arrange
            const app = createTestApp(isAuthenticated, null);

            //Act
            const response = await request(app).get('/protected');

            //Assert
            expect(response.status).toBe(302);
            expect(response.headers.location).toBe('/auth/login');
        });

        test('IsAuthenticated_ValidSession_GrantAccess', async () => {
            // Arrange
            const app = createTestApp(isAuthenticated, { id: 1, login: 'test' });

            // Act
            const response = await request(app).get('/protected');

            // Assert
            expect(response.status).toBe(200);
            expect(response.text).toBe('ACCESS_GRANTED');
        });
    });

    describe('hasRole Middleware', () => {
        const adminOnly = hasRole('DB_ADMIN');

        test('HasRole_NoSession_ThrowsError', async () => {
            const app = createTestApp(adminOnly, null);

            const response = await request(app).get('/protected');

            expect(response.status).toBe(302);
            expect(response.headers.location).toBe('/auth/login');
        });

        test('HasRole_WrongRole_ThrowsError', async () => {
            const app = createTestApp(adminOnly, { id: 1, role: 'USER' });

            const response = await request(app).get('/protected');

            expect(response.status).toBe(302);
            expect(response.headers.location).toBe('/computer');
        });

        test('HasRole_CorrectSingleRole_GrantAccess', async () => {
            const app = createTestApp(adminOnly, { id: 1, role: 'DB_ADMIN' });

            const response = await request(app).get('/protected');

            expect(response.status).toBe(200);
            expect(response.text).toBe('ACCESS_GRANTED');
        });

        test('HasRole_CorrectRoleFromArray_GrantAccess', async () => {
            const multiRole = hasRole(['DB_ADMIN', 'PROGRAMMER']);
            const app = createTestApp(multiRole, { id: 2, role: 'PROGRAMMER' });

            const response = await request(app).get('/protected');

            expect(response.status).toBe(200);
            expect(response.text).toBe('ACCESS_GRANTED');
        });
    });
});