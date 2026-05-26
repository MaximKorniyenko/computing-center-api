const UserService = require('../../../../src/services/userService');
const UserBuilder = require('../../../builders/UserBuilder');

describe('UserService - softDelete', () => {
    let userService, mockUserRepository, testData;

    const fixedDate = new Date('2026-04-17T12:00:00Z');
    const fixedTimestamp = fixedDate.getTime();

    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(fixedDate);
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockUserRepository = {
            findById: jest.fn(),
            update: jest.fn()
        };
        userService = new UserService(mockUserRepository);

        const targetUser = new UserBuilder().withId(1).withLogin('test_user').build();

        testData = {
            targetId: 1,
            originalUser: targetUser,
            expectedDeletedLogin: `test_user_deleted_${fixedTimestamp}`
        };
    });

    describe('Happy Paths', () => {
        test('softDelete_UserExists_UpdatesDeletedAtAndModifiesLogin', async () => {
            //Arrange
            mockUserRepository.findById.mockResolvedValue(testData.originalUser);
            mockUserRepository.update.mockResolvedValue({
                ...testData.originalUser,
                deletedAt: fixedDate,
                login: testData.expectedDeletedLogin
            });

            //Act
            await userService.softDelete(testData.targetId);

            //Assert
            expect(mockUserRepository.findById).toHaveBeenCalledWith(testData.targetId);
            expect(mockUserRepository.update).toHaveBeenCalledWith(testData.targetId, {
                deletedAt: fixedDate,
                login: testData.expectedDeletedLogin
            });
        });
    });

    describe('Error Conditions (Right-BICEP)', () => {
        test('softDelete_UserNotFound_ThrowsNotFoundErrorAndStops', async () => {
            //Arrange
            mockUserRepository.findById.mockResolvedValue(null);

            //Act & Assert
            await expect(userService.softDelete(testData.targetId))
                .rejects.toThrow('NOT_FOUND');


            expect(mockUserRepository.update).not.toHaveBeenCalled();
        });

        test('softDelete_DatabaseFailsOnFind_ThrowsError', async () => {
            //Arrange
            mockUserRepository.findById.mockRejectedValue(new Error('Connection lost'));

            //Act & Assert
            await expect(userService.softDelete(testData.targetId))
                .rejects.toThrow('Connection lost');
            expect(mockUserRepository.update).not.toHaveBeenCalled();
        });
    });
});