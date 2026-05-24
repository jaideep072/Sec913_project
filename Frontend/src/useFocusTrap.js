// useFocusTrap.js — reusable focus-trapping hook for modals.
//
// Usage:
//   const panelRef = useRef(null);
//   useFocusTrap(panelRef, isOpen);
//
// When `isOpen` becomes true, focus moves to the first focusable element
// inside the panel. Tab / Shift+Tab cycle within the panel. When the
// modal closes, focus returns to the element that was focused before
// it opened.

import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
];

export default function useFocusTrap(containerRef, isOpen) {
  const previousFocus = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      // Restore focus when the modal closes
      if (previousFocus.current && document.contains(previousFocus.current)) {
        previousFocus.current.focus({ preventScroll: true });
      }
      previousFocus.current = null;
      return;
    }

    // Save the currently focused element so we can restore it on close
    previousFocus.current = document.activeElement;

    // Small timeout lets the DOM finish rendering the modal first
    const id = setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;
      const first = el.querySelector(FOCUSABLE.join(', '));
      if (first) first.focus({ preventScroll: true });
    }, 0);

    const handler = (e) => {
      if (e.key !== 'Tab') return;
      const el = containerRef.current;
      if (!el) return;
      const focusable = el.querySelectorAll(FOCUSABLE.join(', '));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus({ preventScroll: true });
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus({ preventScroll: true });
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => {
      clearTimeout(id);
      document.removeEventListener('keydown', handler);
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps
}
