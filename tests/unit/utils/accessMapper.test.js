const { getAccessGroup } = require('../../../src/utils/accessMapper');

describe('Utils - accessMapper', () => {
    test('getAccessGroup_ValidRoles_ReturnsMappedGroups', () => {
        expect(getAccessGroup('DB_ADMIN')).toBe('root');
        expect(getAccessGroup('PROGRAMMER')).toBe('development');
        expect(getAccessGroup('OPERATOR')).toBe('support');
        expect(getAccessGroup('HARDWARE_SPECIALIST')).toBe('hardware');
        expect(getAccessGroup('USER')).toBe('guest');
    });

    test('getAccessGroup_InvalidOrMissingRole_ReturnsDefaultGuest', () => {
        expect(getAccessGroup('UNKNOWN_ROLE')).toBe('guest');
        expect(getAccessGroup(null)).toBe('guest');
        expect(getAccessGroup(undefined)).toBe('guest');
    });
});