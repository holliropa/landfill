import { useEffect, useRef } from "react";

export type KeyboardShortcutKey =
  | "Escape"
  | "Enter"
  | " "
  | "Tab"
  | "Backspace"
  | "Delete"
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | "Home"
  | "End"
  | "PageUp"
  | "PageDown"
  | "F1"
  | "F2"
  | "F3"
  | "F4"
  | "F5"
  | "F6"
  | "F7"
  | "F8"
  | "F9"
  | "F10"
  | "F11"
  | "F12"
  | (string & {});

type ShortcurOptions = {
  enabled?: boolean;
  ignoreEditableTargets?: boolean;
  preventDefault?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
};

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

export function useKeyboardShortcut(
  key: KeyboardShortcutKey,
  handler: (event: KeyboardEvent) => void,
  {
    enabled = true,
    ignoreEditableTargets = true,
    preventDefault = true,
    ctrlKey,
    metaKey,
    shiftKey,
    altKey,
  }: ShortcurOptions = {},
) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (ignoreEditableTargets && isEditableTarget(event.target)) {
        return;
      }

      if (event.key !== key) {
        return;
      }

      if (ctrlKey !== undefined && event.ctrlKey !== ctrlKey) {
        return;
      }

      if (metaKey !== undefined && event.metaKey !== metaKey) {
        return;
      }

      if (shiftKey !== undefined && event.shiftKey !== shiftKey) {
        return;
      }

      if (altKey !== undefined && event.altKey !== altKey) {
        return;
      }

      if (preventDefault) {
        event.preventDefault();
      }

      handlerRef.current(event);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    key,
    enabled,
    ignoreEditableTargets,
    preventDefault,
    ctrlKey,
    metaKey,
    shiftKey,
    altKey,
  ]);
}
