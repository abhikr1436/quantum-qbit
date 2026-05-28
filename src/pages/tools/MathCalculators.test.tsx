import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MathCalculators } from './MathCalculators';
import '@testing-library/jest-dom';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('MathCalculators Component Tests', () => {
  it('evaluates trigonometric functions in DEG mode by default', () => {
    render(<MathCalculators defaultTab="scientific" />);

    // Click buttons for sin(30)
    const sinBtn = screen.getByRole('button', { name: 'sin' });
    const threeBtn = screen.getByRole('button', { name: '3' });
    const zeroBtn = screen.getByRole('button', { name: '0' });
    const closeParenBtn = screen.getByRole('button', { name: ')' });
    const equalsBtn = screen.getByRole('button', { name: '=' });

    fireEvent.click(sinBtn);
    fireEvent.click(threeBtn);
    fireEvent.click(zeroBtn);
    fireEvent.click(closeParenBtn);
    fireEvent.click(equalsBtn);

    // Check display shows sin(30)
    expect(screen.getByText('sin(30)')).toBeInTheDocument();
    // Check result shows = 0.5
    expect(screen.getByText('= 0.5')).toBeInTheDocument();
  });

  it('evaluates trigonometric functions in RAD mode when toggled', () => {
    render(<MathCalculators defaultTab="scientific" />);

    // Toggle to RAD mode
    const radToggle = screen.getByRole('button', { name: /RAD/ });
    fireEvent.click(radToggle);

    // Click buttons for sin(30)
    const sinBtn = screen.getByRole('button', { name: 'sin' });
    const threeBtn = screen.getByRole('button', { name: '3' });
    const zeroBtn = screen.getByRole('button', { name: '0' });
    const closeParenBtn = screen.getByRole('button', { name: ')' });
    const equalsBtn = screen.getByRole('button', { name: '=' });

    fireEvent.click(sinBtn);
    fireEvent.click(threeBtn);
    fireEvent.click(zeroBtn);
    fireEvent.click(closeParenBtn);
    fireEvent.click(equalsBtn);

    // Check display shows sin(30)
    expect(screen.getByText('sin(30)')).toBeInTheDocument();
    // sin(30 radians) is approx -0.98803162
    expect(screen.getByText('= -0.98803162')).toBeInTheDocument();
  });

  it('shows Infinity and undefined instead of Error', () => {
    render(<MathCalculators defaultTab="scientific" />);

    // 1 / 0 = Infinity
    const oneBtn = screen.getByRole('button', { name: '1' });
    const divBtn = screen.getByRole('button', { name: '÷' });
    const zeroBtn = screen.getByRole('button', { name: '0' });
    const equalsBtn = screen.getByRole('button', { name: '=' });
    const clearBtn = screen.getByRole('button', { name: 'C' });

    fireEvent.click(oneBtn);
    fireEvent.click(divBtn);
    fireEvent.click(zeroBtn);
    fireEvent.click(equalsBtn);

    expect(screen.getByText('= Infinity')).toBeInTheDocument();

    // Clear
    fireEvent.click(clearBtn);

    // sqrt(-4) = undefined
    const sqrtBtn = screen.getByRole('button', { name: 'sqrt' });
    const minusBtn = screen.getByRole('button', { name: '-' });
    const fourBtn = screen.getByRole('button', { name: '4' });
    const closeParenBtn = screen.getByRole('button', { name: ')' });

    fireEvent.click(sqrtBtn);
    fireEvent.click(minusBtn);
    fireEvent.click(fourBtn);
    fireEvent.click(closeParenBtn);
    fireEvent.click(equalsBtn);

    expect(screen.getByText('= undefined')).toBeInTheDocument();
  });

  it('solves linear custom equations correctly', () => {
    render(<MathCalculators defaultTab="solver" />);

    const input = screen.getByPlaceholderText(/e.g. x\^2 - 5x \+ 6 = 0/i);
    const solveBtn = screen.getByRole('button', { name: /Solve Equation/i });

    fireEvent.change(input, { target: { value: '3x + 10 = 40' } });
    fireEvent.click(solveBtn);

    // 3x + 10 = 40 => x = 10
    expect(screen.getByText('x =')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText(/Subtract C from both sides/i)).toBeInTheDocument();
  });

  it('solves quadratic custom equations correctly', () => {
    render(<MathCalculators defaultTab="solver" />);

    const input = screen.getByPlaceholderText(/e.g. x\^2 - 5x \+ 6 = 0/i);
    const solveBtn = screen.getByRole('button', { name: /Solve Equation/i });

    fireEvent.change(input, { target: { value: 'x^2 - 5x + 6 = 0' } });
    fireEvent.click(solveBtn);

    // x^2 - 5x + 6 = 0 => x1 = 3, x2 = 2
    expect(screen.getByText('x₁ =')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('x₂ =')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/Calculate discriminant/i)).toBeInTheDocument();
  });

  it('solves transcendental equations numerically', () => {
    render(<MathCalculators defaultTab="solver" />);

    const input = screen.getByPlaceholderText(/e.g. x\^2 - 5x \+ 6 = 0/i);
    const solveBtn = screen.getByRole('button', { name: /Solve Equation/i });

    fireEvent.change(input, { target: { value: 'sin(x) = 0.5' } });
    fireEvent.click(solveBtn);

    // sin(x) = 0.5 has root at approx 0.523599 (pi/6) in [-100, 100]
    expect(screen.getByText(/Found \d+ approximate root/i)).toBeInTheDocument();
    expect(screen.getByText('0.523599')).toBeInTheDocument();
  });
});
