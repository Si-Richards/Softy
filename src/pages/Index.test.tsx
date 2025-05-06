
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Index from './Index';

// Mock the hooks and components
vi.mock('@/hooks/useAppState', () => ({
  useAppState: () => ({
    activeTab: 'home',
    setActiveTab: vi.fn(),
    connectionStatus: 'connected',
    doNotDisturb: false,
    userPresence: 'available',
    incomingCall: null,
    handleAcceptCall: vi.fn(),
    handleRejectCall: vi.fn(),
    handleDoNotDisturbChange: vi.fn()
  })
}));

vi.mock('@/components/app/AppLayout', () => ({
  default: (props: any) => (
    <div data-testid="app-layout-mock">
      App Layout with tab: {props.activeTab}
    </div>
  )
}));

describe('Index', () => {
  it('renders AppLayout with the correct props', () => {
    render(<Index />);
    expect(screen.getByTestId('app-layout-mock')).toBeInTheDocument();
    expect(screen.getByText(/App Layout with tab: home/i)).toBeInTheDocument();
  });
});
