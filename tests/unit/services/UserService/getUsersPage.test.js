const UserService = require('../../../../src/services/userService');
const UserBuilder = require('../../../builders/UserBuilder');

describe('UserService - getUsersPage', () => {
    let userService;
    let mockUserRepository;

    beforeEach(() => {
        mockUserRepository = {
            findActive: jest.fn()
        };
        userService = new UserService(mockUserRepository);
        jest.clearAllMocks();
    });

    test('getUsersPage_ValidParamsWithSearch_ReturnsUsersAndTotal', async () => {
        //Arrange
        const page = 1;
        const limit = 10;
        const search = 'Іван';
        const mockUsers = [new UserBuilder().withLogin('ivan').build()];
        const mockTotal = 1;

        mockUserRepository.findActive.mockResolvedValue([mockUsers, mockTotal]);

        //Act
        const result = await userService.getUsersPage(page, limit, search);

        //Assert
        expect(result).toEqual({ users: mockUsers, total: mockTotal });
        expect(mockUserRepository.findActive).toHaveBeenCalledTimes(1);
        expect(mockUserRepository.findActive).toHaveBeenCalledWith(page, limit, search);
    });

    test('getUsersPage_WithoutSearchParam_PassesUndefinedToRepository', async () => {
        //Arrange
        const page = 2;
        const limit = 5;
        const mockUsers = [
            new UserBuilder().withId(1).build(),
            new UserBuilder().withId(2).build()
        ];
        const mockTotal = 15;

        mockUserRepository.findActive.mockResolvedValue([mockUsers, mockTotal]);

        //Act
        const result = await userService.getUsersPage(page, limit, undefined);

        //Assert
        expect(result.users).toHaveLength(2);
        expect(result.total).toBe(mockTotal);
        expect(mockUserRepository.findActive).toHaveBeenCalledWith(page, limit, undefined);
    });

    //
    test('getUsersPage_EmptyDatabase_ReturnsEmptyArrayAndZeroTotal', async () => {
        //Arrange
        mockUserRepository.findActive.mockResolvedValue([[], 0]);

        //Act
        const result = await userService.getUsersPage(1, 10, 'non_existent_user');

        //Assert
        expect(result).toEqual({ users: [], total: 0 });
    });

    test('getUsersPage_RepositoryThrowsError_ReturnsException', async () => {
        //Arrange
        const dbError = new Error('Database connection failed');
        mockUserRepository.findActive.mockRejectedValue(dbError);

        //Act & Assert
        await expect(userService.getUsersPage(1, 10))
            .rejects
            .toThrow('Database connection failed');

        expect(mockUserRepository.findActive).toHaveBeenCalledTimes(1);
    });
});