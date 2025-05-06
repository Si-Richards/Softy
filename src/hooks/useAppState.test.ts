
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppState } from './useAppState';

// Mock the useJanusSetup hook
vi.mock('@/components/dialpad/useJanusSetup', () => ({
  useJanusSetup: () => ({
    incomingCall: null,
    handleAcceptCall: vi.fn(),
    handleRejectCall: vi.fn(),
    isJanusConnected: true
  })
}));

describe('useAppState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useAppState());
    
    expect(result.current.activeTab).toBe('home');
    expect(result.current.connectionStatus).toBe('connected');
    expect(result.current.doNotDisturb).toBe(false);
    expect(result.current.userPresence).toBe('available');
  });

  it('allows changing the active tab', () => {
    const { result } = renderHook(() => useAppState());
    
    act(() => {
      result.current.setActiveTab('dialpad');
    });
    
    expect(result.current.activeTab).toBe('dialpad');
  });

  it('toggles do not disturb mode', () => {
    const { result } = renderHook(() => useAppState());
    
    act(() => {
      result.current.handleDoNotDisturbChange(true);
    });
    
    expect(result.current.doNotDisturb).toBe(true);
  });
});
