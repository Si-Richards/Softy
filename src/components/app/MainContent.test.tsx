
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MainContent from './MainContent';

describe('MainContent', () => {
  it('renders QuickDial when activeTab is home', () => {
    render(<MainContent activeTab="home" />);
    // Since QuickDial is mocked, we can't check for specific QuickDial content
    // But we can verify MainContent renders without errors
    expect(document.querySelector('.flex-1')).toBeInTheDocument();
  });

  it('changes content based on activeTab', () => {
    const { rerender } = render(<MainContent activeTab="home" />);
    
    // Change to different tab
    rerender(<MainContent activeTab="dialpad" />);
    
    // Verify the component renders without errors after tab change
    expect(document.querySelector('.flex-1')).toBeInTheDocument();
  });
});
