const bcrypt = require('bcrypt');
const { hashPassword, comparePasswords } = require('../../../src/utils/passwordHasher');

jest.mock('bcrypt');

describe('Utils - passwordHasher', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('hashPassword_CallsBcryptHashWithCorrectParams', async () => {
        bcrypt.hash.mockResolvedValue('hashed_value');

        const result = await hashPassword('my_password');

        expect(result).toBe('hashed_value');
        expect(bcrypt.hash).toHaveBeenCalledWith('my_password', 10);
    });

    test('comparePasswords_CallsBcryptCompareCorrectly', async () => {
        bcrypt.compare.mockResolvedValue(true);

        const result = await comparePasswords('my_password', 'hashed_value');

        expect(result).toBe(true);
        expect(bcrypt.compare).toHaveBeenCalledWith('my_password', 'hashed_value');
    });
});