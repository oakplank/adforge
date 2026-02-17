import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

vi.mock('./components/CanvasEditor', () => ({
  CanvasEditor: () => <div data-testid="canvas-editor">Canvas Mock</div>,
}));

describe('App', () => {
  it('renders AdForge Studio heading', () => {
    render(<App />);
    expect(screen.getByText('AdForge Studio')).toBeInTheDocument();
  });
});
