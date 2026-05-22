import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Smoke Test', () => {
  it('renders without crashing and shows navbar content', () => {
    render(<App />);
    const logoImgs = screen.getAllByAltText(/Quantum Qbit Logo/i);
    expect(logoImgs.length).toBeGreaterThan(0);
    expect(logoImgs[0]).toBeInTheDocument();
  });
});
