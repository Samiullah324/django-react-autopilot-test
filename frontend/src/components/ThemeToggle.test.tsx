import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ThemeProvider } from '../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe('ThemeToggle', () => {
  it('renders with accessible switch semantics in light mode', () => {
    renderToggle();

    const toggle = screen.getByRole('switch', { name: 'Switch to dark mode' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles theme and updates aria state', () => {
    renderToggle();

    const toggle = screen.getByRole('switch', { name: 'Switch to dark mode' });
    fireEvent.click(toggle);

    expect(screen.getByRole('switch', { name: 'Switch to light mode' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
