import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import UMLTemplates from './UMLTemplates';

// Mock the icons since they are not relevant for functionality testing
jest.mock('react-icons/fi', () => ({
  FiBox: () => <span data-testid="icon-box" />,
  FiActivity: () => <span data-testid="icon-activity" />,
  FiShuffle: () => <span data-testid="icon-shuffle" />,
  FiArrowRight: () => <span data-testid="icon-arrow-right" />,
}));

describe('UMLTemplates', () => {
  const mockOnInsertTemplate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders all template buttons', () => {
    render(<UMLTemplates onInsertTemplate={mockOnInsertTemplate} />);

    expect(screen.getByRole('button', { name: /Insert Class Diagram template/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Insert Sequence Diagram template/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Insert Activity Diagram template/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Insert Use Case Diagram template/i })).toBeInTheDocument();
  });

  it('calls onInsertTemplate with correct code when a template is clicked', () => {
    render(<UMLTemplates onInsertTemplate={mockOnInsertTemplate} />);

    const classDiagramButton = screen.getByRole('button', { name: /Insert Class Diagram template/i });
    fireEvent.click(classDiagramButton);

    expect(mockOnInsertTemplate).toHaveBeenCalledTimes(1);
    expect(mockOnInsertTemplate).toHaveBeenCalledWith(expect.stringContaining('classDiagram'));
  });

  it('sets active state on click and clears it after timeout', () => {
    render(<UMLTemplates onInsertTemplate={mockOnInsertTemplate} />);

    const button = screen.getByRole('button', { name: /Insert Class Diagram template/i });

    // Initial state (inactive)
    // Based on the code: inactive has 'bg-surface/60'
    expect(button).toHaveClass('bg-surface/60');
    expect(button).not.toHaveClass('bg-accent/10');

    // Click
    fireEvent.click(button);

    // Active state
    // Based on the code: active has 'bg-accent/10'
    expect(button).toHaveClass('bg-accent/10');
    expect(button).not.toHaveClass('bg-surface/60');

    // Advance timers by 600ms
    act(() => {
      jest.advanceTimersByTime(600);
    });

    // Back to inactive state
    expect(button).toHaveClass('bg-surface/60');
    expect(button).not.toHaveClass('bg-accent/10');
  });

  it('only activates the clicked template', () => {
    render(<UMLTemplates onInsertTemplate={mockOnInsertTemplate} />);

    const classButton = screen.getByRole('button', { name: /Insert Class Diagram template/i });
    const sequenceButton = screen.getByRole('button', { name: /Insert Sequence Diagram template/i });

    fireEvent.click(classButton);

    expect(classButton).toHaveClass('bg-accent/10');
    expect(sequenceButton).toHaveClass('bg-surface/60');
  });
});
