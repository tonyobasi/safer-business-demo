import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useKeyboardViewport } from './useKeyboardViewport';

let viewport: EventTarget & { height: number; offsetTop: number; scale: number };
function Harness() {
  const ref = useKeyboardViewport();
  return (
    <div ref={ref} data-testid="shell">
      <textarea aria-label="Message" />
      <input type="checkbox" aria-label="Option" />
    </div>
  );
}
function flush() {
  act(() => {
    vi.runOnlyPendingTimers();
  });
}
beforeEach(() => {
  vi.useFakeTimers();
  viewport = Object.assign(new EventTarget(), { height: 844, offsetTop: 0, scale: 1 });
  vi.stubGlobal('visualViewport', viewport);
  vi.stubGlobal('innerWidth', 390);
  vi.stubGlobal('innerHeight', 844);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it('follows the reduced visible height and panning while typing, then restores', () => {
  render(<Harness />);
  act(() => screen.getByLabelText('Message').focus());
  flush();
  viewport.height = 440;
  viewport.offsetTop = 20;
  act(() => viewport.dispatchEvent(new Event('resize')));
  flush();
  const shell = screen.getByTestId('shell');
  expect(shell).toHaveAttribute('data-keyboard-open');
  expect(shell.style.getPropertyValue('--workspace-visible-height')).toBe('440px');
  expect(shell.style.getPropertyValue('--workspace-viewport-top')).toBe('20px');
  act(() => screen.getByLabelText('Message').blur());
  viewport.height = 844;
  viewport.offsetTop = 0;
  act(() => viewport.dispatchEvent(new Event('resize')));
  flush();
  expect(shell).not.toHaveAttribute('data-keyboard-open');
  expect(shell.style.getPropertyValue('--workspace-visible-height')).toBe('844px');
});
it('does not confuse pinch zoom or browser chrome with a keyboard', () => {
  render(<Harness />);
  act(() => screen.getByLabelText('Message').focus());
  flush();
  viewport.height = 790;
  act(() => viewport.dispatchEvent(new Event('resize')));
  flush();
  expect(screen.getByTestId('shell')).not.toHaveAttribute('data-keyboard-open');
  viewport.height = 400;
  viewport.scale = 2;
  act(() => viewport.dispatchEvent(new Event('resize')));
  flush();
  expect(screen.getByTestId('shell')).not.toHaveAttribute('data-keyboard-open');
});
it('does not hide navigation when a non-text control is focused', () => {
  render(<Harness />);
  act(() => screen.getByLabelText('Option').focus());
  flush();
  viewport.height = 440;
  act(() => viewport.dispatchEvent(new Event('resize')));
  flush();
  expect(screen.getByTestId('shell')).not.toHaveAttribute('data-keyboard-open');
});
it('clears mobile sizing when returning to desktop', () => {
  render(<Harness />);
  vi.stubGlobal('innerWidth', 1440);
  act(() => window.dispatchEvent(new Event('resize')));
  flush();
  expect(screen.getByTestId('shell').style.getPropertyValue('--workspace-visible-height')).toBe('');
});
