const UserService = require('../../../../src/services/userService');
const accessMapper = require('../../../../src/utils/accessMapper');
const passwordHasher = require('../../../../src/utils/passwordHasher'); // Додали новий імпорт
const UserBuilder = require('../../../builders/UserBuilder');

jest.mock('../../../../src/utils/accessMapper');
jest.mock('../../../../src/utils/passwordHasher');

describe('UserService - updateUser', () => {
    let userService, mockUserRepository, testData;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUserRepository = { update: jest.fn(), findById: jest.fn() };
        userService = new UserService(mockUserRepository);

        const targetUser = new UserBuilder().withId(1).withRole('ADMIN').build();

        testData = {
            targetId: 1,
            rawPassword: 'newSecurePassword',
            expectedHash: 'hashed_newSecurePassword',
            mappedRole: 'root',
            returnedUser: targetUser,
        };

        passwordHasher.hashPassword.mockResolvedValue(testData.expectedHash);
        accessMapper.getAccessGroup.mockReturnValue(testData.mappedRole);
        mockUserRepository.update.mockResolvedValue(testData.returnedUser);
    });

    describe('Happy Paths (Branch Coverage & Partial Updates)', () => {
        test('updateUser_WithRoleAndPassword_UpdatesBothAndSaves', async () => {
            //Arrange
            const inputData = { pib: 'Нове ПІБ', role: 'ADMIN', password: testData.rawPassword };

            //Act
            const result = await userService.updateUser(testData.targetId, inputData);

            expect(result).toEqual(testData.returnedUser);
            expect(accessMapper.getAccessGroup).toHaveBeenCalledWith(inputData.role);
            expect(passwordHasher.hashPassword).toHaveBeenCalledWith(inputData.password);
            expect(mockUserRepository.update).toHaveBeenCalledWith(testData.targetId, {
                pib: inputData.pib,
                role: inputData.role,
                accessGroup: testData.mappedRole,
                password: testData.expectedHash
            });
        });

        test('updateUser_WithRoleOnly_UpdatesRoleAndGroupButNotPassword', async () => {
            //Arrange
            const inputData = { pib: 'Нове ПІБ', role: 'ADMIN' };

            //Act
            await userService.updateUser(testData.targetId, inputData);

            //Assert
            expect(accessMapper.getAccessGroup).toHaveBeenCalledWith(inputData.role);
            expect(passwordHasher.hashPassword).not.toHaveBeenCalled();

            expect(mockUserRepository.update).toHaveBeenCalledWith(testData.targetId, {
                pib: inputData.pib,
                role: inputData.role,
                accessGroup: testData.mappedRole
            });
        });

        test('updateUser_WithPasswordOnly_UpdatesHashButNotGroup', async () => {
            //Arrange
            const inputData = { pib: 'Нове ПІБ', password: testData.rawPassword };

            //Act
            await userService.updateUser(testData.targetId, inputData);

            //Assert
            expect(passwordHasher.hashPassword).toHaveBeenCalledWith(inputData.password);
            expect(accessMapper.getAccessGroup).not.toHaveBeenCalled();

            expect(mockUserRepository.update).toHaveBeenCalledWith(testData.targetId, {
                pib: inputData.pib,
                password: testData.expectedHash
            });
        });


        test('updateUser_WithoutRoleAndPassword_UpdatesOnlyProvidedFields', async () => {
            const inputData = { pib: 'Тільки ПІБ' };
            await userService.updateUser(testData.targetId, inputData);

            expect(accessMapper.getAccessGroup).not.toHaveBeenCalled();
            expect(passwordHasher.hashPassword).not.toHaveBeenCalled();
            expect(mockUserRepository.update).toHaveBeenCalledWith(testData.targetId, {
                pib: 'Тільки ПІБ'
            });
        });
    });

    describe('Error Conditions (Right-BICEP)', () => {
        test('updateUser_HashingFails_ThrowsErrorAndStops', async () => {
            const inputData = { password: '123' };
            passwordHasher.hashPassword.mockRejectedValue(new Error('Bcrypt Error'));

            await expect(userService.updateUser(testData.targetId, inputData))
                .rejects.toThrow('Bcrypt Error');
            expect(mockUserRepository.update).not.toHaveBeenCalled();
        });

        test('updateUser_RepositoryThrowsError_BubblesUp', async () => {
            const inputData = { pib: 'Нове' };
            mockUserRepository.update.mockRejectedValue(new Error('DB Error'));

            await expect(userService.updateUser(testData.targetId, inputData))
                .rejects.toThrow('DB Error');
        });

        test('softDelete_DatabaseFailsOnUpdate_BubblesUpError', async () => {
            //Arrange
            mockUserRepository.findById.mockResolvedValue(testData.returnedUser);
            const dbUpdateError = new Error('Database timeout during update');
            mockUserRepository.update.mockRejectedValue(dbUpdateError);

            //Act & Assert
            await expect(userService.softDelete(testData.targetId))
                .rejects.toThrow('Database timeout during update');

            expect(mockUserRepository.update).toHaveBeenCalledTimes(1);
        });
    });
});