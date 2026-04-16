const ROLE_TO_GROUP_MAP = {
    'DB_ADMIN': 'root',
    'PROGRAMMER': 'development',
    'OPERATOR': 'support',
    'HARDWARE_SPECIALIST': 'hardware',
    'USER': 'guest'
};

const getAccessGroup = (role) => ROLE_TO_GROUP_MAP[role] || 'guest';

module.exports = { getAccessGroup};