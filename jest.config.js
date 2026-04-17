module.exports = {
    // BeforeAll
    //globalSetup: '<rootDir>/tests/setup/db.setup.js',

    // BeforeEach
    setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],

    // AfterAll
    //globalTeardown: '<rootDir>/tests/setup/db.teardown.js', // (опціонально)
};