const UserService = require('../../../../src/services/userService');
const accessMapper = require('../../../../src/utils/accessMapper');
const passwordHasher = require('../../../../src/utils/passwordHasher'); // Додали новий імпорт
const UserBuilder = require('../../../builders/UserBuilder');

jest.mock('../../../../src/utils/accessMapper');
jest.mock('../../../../src/utils/passwordHasher');

describe('UserService - registerUser', () => {
    let userService, mockUserRepository, testData;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUserRepository = { create: jest.fn() };
        userService = new UserService(mockUserRepository);

        const user = new UserBuilder().withRole('PROGRAMMER').build();
        testData = {
            rawPassword: 'secretPassword123',
            expectedHash: 'hashed_secretPassword123',
            mappedRole: 'development',
            user: user,
            inputDto: { pib: user.pib, login: user.login, password: 'secretPassword123', role: user.role }
        };

        passwordHasher.hashPassword.mockResolvedValue(testData.expectedHash);
        accessMapper.getAccessGroup.mockReturnValue(testData.mappedRole);
        mockUserRepository.create.mockResolvedValue(testData.user);
    });

    test('registerUser_ValidData_SuccessfullyProcessesAndSavesUser', async () => {
        // Act
        const result = await userService.registerUser(testData.inputDto);

        // Assert
        expect(result).toEqual(testData.user);
        expect(passwordHasher.hashPassword).toHaveBeenCalledWith(testData.rawPassword);
        expect(mockUserRepository.create).toHaveBeenCalledWith(expect.objectContaining({
            password: testData.expectedHash,
            accessGroup: testData.mappedRole
        }));
    });

    describe('Error Conditions', () => {
        test('registerUser_HashingFails_ThrowsError', async () => {
            passwordHasher.hashPassword.mockRejectedValue(new Error('Hash fail'));

            // Act & Assert
            await expect(userService.registerUser(testData.inputDto)).rejects.toThrow('Hash fail');
        });

        test('registerUser_DuplicateLogin_ThrowsError', async () => {
            const dbError = new Error('P2002');
            mockUserRepository.create.mockRejectedValue(dbError);

            await expect(userService.registerUser(testData.inputDto)).rejects.toThrow('P2002');
        });
    });
});