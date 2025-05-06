
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock any browser APIs that might not be available in the test environment
window.HTMLMediaElement.prototype.play = vi.fn();
window.HTMLMediaElement.prototype.pause = vi.fn();

// Setup any global mocks needed for tests
vi.mock('@/components/dialpad/useJanusSetup', () => ({
  useJanusSetup: () => ({
    incomingCall: null,
    handleAcceptCall: vi.fn(),
    handleRejectCall: vi.fn(),
    isJanusConnected: false,
    errorMessage: null
  })
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  ...require('react-router-dom'),
  useNavigate: () => vi.fn(),
  useParams: () => ({ id: '1' })
}));

// Add any other global test setup here
