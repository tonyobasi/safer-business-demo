import { useEffect, useRef } from 'react';

function isTextEntry(element: Element | null): boolean {
  if (element instanceof HTMLTextAreaElement) return !element.disabled && !element.readOnly;
  if (element instanceof HTMLInputElement)
    return (
      !element.disabled &&
      !element.readOnly &&
      ![
        'button',
        'submit',
        'reset',
        'checkbox',
        'radio',
        'file',
        'range',
        'color',
        'hidden',
      ].includes(element.type)
    );
  return element instanceof HTMLElement && element.isContentEditable;
}

/** Follow the visible screen when the mobile keyboard resizes/pans the viewport. */
export function useKeyboardViewport() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    let fullHeight = Math.max(window.innerHeight, viewport?.height || 0);
    let width = window.innerWidth;
    let frame = 0;
    const clear = () => {
      const shell = ref.current;
      shell?.style.removeProperty('--workspace-visible-height');
      shell?.style.removeProperty('--workspace-viewport-top');
      shell?.removeAttribute('data-keyboard-open');
    };
    const update = () => {
      frame = 0;
      const shell = ref.current;
      if (!shell) return;
      if (window.innerWidth > 1020) {
        clear();
        return;
      }
      // Preserve normal pinch-to-zoom behavior and avoid interpreting it as a keyboard.
      if (viewport && Math.abs(viewport.scale - 1) > 0.05) return;
      const height = viewport?.height || window.innerHeight;
      const editing = isTextEntry(document.activeElement);
      if (Math.abs(window.innerWidth - width) > 80) {
        fullHeight = Math.max(window.innerHeight, height);
        width = window.innerWidth;
      }
      if (!editing) fullHeight = Math.max(window.innerHeight, height);
      else fullHeight = Math.max(fullHeight, window.innerHeight, height);
      const keyboardOpen = editing && fullHeight - height > 140;
      shell.style.setProperty('--workspace-visible-height', `${Math.round(height)}px`);
      shell.style.setProperty(
        '--workspace-viewport-top',
        `${Math.round(viewport?.offsetTop || 0)}px`,
      );
      shell.toggleAttribute('data-keyboard-open', keyboardOpen);
    };
    const schedule = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', schedule);
      viewport?.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('focusin', schedule);
      document.removeEventListener('focusout', schedule);
      clear();
    };
  }, []);
  return ref;
}
