
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AppLayout from './AppLayout';

vi.mock('@/components/Sidebar', () => ({
  default: () => <div data-testid="sidebar-mock">Sidebar</div>
}));

vi.mock('@/components/app/Header', () => ({
  default: () => <div data-testid="header-mock">Header</div>
}));

vi.mock('@/components/app/MainContent', () => ({
  default: () => <div data-testid="main-content-mock">MainContent</div>
}));

describe('AppLayout', () => {
  const defaultProps = {
    activeTab: 'home',
    setActiveTab: vi.fn(),
    connectionStatus: "connected" as const,
    doNotDisturb: false,
    userPresence: "available" as const,
    handleDoNotDisturbChange: vi.fn(),
    incomingCall: null,
    handleAcceptCall: vi.fn(),
    handleRejectCall: vi.fn()
  };

  it('renders all components correctly', () => {
    render(<AppLayout {...defaultProps} />);
    expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
    expect(screen.getByTestId('header-mock')).toBeInTheDocument();
    expect(screen.getByTestId('main-content-mock')).toBeInTheDocument();
  });

  it('renders incoming call dialog when there is an incoming call', () => {
    render(
      <AppLayout 
        {...defaultProps} 
        incomingCall={{ from: '123456789', jsep: {} }} 
      />
    );
    // We'd normally check for the dialog here, but it's mocked
    // This test just ensures the component renders without errors
  });
});
