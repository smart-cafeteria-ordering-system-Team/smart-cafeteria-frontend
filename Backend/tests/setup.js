/**
 * ================================================================
 * SMART CAFETERIA ORDERING SYSTEM - TEST SETUP
 * ================================================================
 * Configures global test environment, mocks, and cleanup hooks.
 * ================================================================
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = 5001;

// Global timeout for asynchronous operations
jest.setTimeout(10000);

// Global setup before all tests run
beforeAll(async () => {
    console.log('Starting Test Suite for Smart Cafeteria Ordering System...');
});

// Clean up after each individual test
afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
});

// Global teardown after all tests complete
afterAll(async () => {
    console.log('Test Suite Completed.');
});

// Mock console errors/warnings globally if needed to keep test output clean
global.console = {
    ...console,
    // error: jest.fn(), // Uncomment to suppress console.errors during tests
    warn: jest.fn(),
};