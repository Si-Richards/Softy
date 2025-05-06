
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from './Header';

describe('Header', () => {
  const defaultProps = {
    connectionStatus: "connected" as const,
    userPresence: "available" as const, 
    doNotDisturb: false,
    onDoNotDisturbChange: vi.fn()
  };

  it('renders correctly with default props', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('My Company')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('shows DND status when doNotDisturb is true', () => {
    render(<Header {...defaultProps} doNotDisturb={true} />);
    expect(screen.getByText('Do Not Disturb')).toBeInTheDocument();
  });

  it('calls onDoNotDisturbChange when DND switch is toggled', () => {
    render(<Header {...defaultProps} />);
    const dndSwitch = screen.getByLabelText(/DND/i);
    fireEvent.click(dndSwitch);
    expect(defaultProps.onDoNotDisturbChange).toHaveBeenCalledWith(true);
  });
});
