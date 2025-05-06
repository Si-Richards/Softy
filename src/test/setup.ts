// Basic test setup without @testing-library/jest-dom dependency

// Mock the window.Janus object
global.window.Janus = {
  init: jest.fn(({ callback }) => callback()),
  debug: jest.fn(),
};

// Other mocks as needed for your tests
beforeAll(() => {
  // Setup mocks before all tests
  console.log('Test setup complete');
});

afterAll(() => {
  // Cleanup after all tests
  console.log('Test cleanup complete');
});
