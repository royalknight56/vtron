export type Editable = HTMLInputElement | HTMLTextAreaElement | HTMLElement;

export function editableIn(root: HTMLElement, node: EventTarget | null): Editable | null {
  if (!(node instanceof HTMLElement) || !root.contains(node)) return null;
  if (node instanceof HTMLTextAreaElement) return node.disabled || node.readOnly ? null : node;
  if (node instanceof HTMLInputElement)
    return !node.disabled &&
      !node.readOnly &&
      ['text', 'search', 'url', 'tel', 'password', 'email'].includes(node.type)
      ? node
      : null;
  const editor = node.closest<HTMLElement>('[contenteditable="true"], [contenteditable="plaintext-only"]');
  return editor && root.contains(editor) ? editor : null;
}

function dispatchInput(root: HTMLElement, target: Editable, data: string | null, inputType: string) {
  // Keep synthesized editor input inside its Vtron System. Legacy terminal apps listen on document.
  const contain = (event: Event) => {
    if (event.target === target) event.stopPropagation();
  };
  root.addEventListener('input', contain);
  try {
    target.dispatchEvent(new InputEvent('input', { bubbles: true, data, inputType }));
  } finally {
    root.removeEventListener('input', contain);
  }
}

export function editText(root: HTMLElement, target: Editable, key: string) {
  if (!target.isConnected || !root.contains(target)) return false;
  target.focus({ preventScroll: true });
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    let start = target.selectionStart ?? target.value.length;
    let end = target.selectionEnd ?? start;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) {
      if (key === 'ArrowLeft') start = Math.max(0, start - 1);
      else if (key === 'ArrowRight') start = Math.min(target.value.length, end + 1);
      else if (key === 'Home') start = target.value.lastIndexOf('\n', start - 1) + 1;
      else if (key === 'End') {
        const next = target.value.indexOf('\n', start);
        start = next < 0 ? target.value.length : next;
      } else {
        const lineStart = target.value.lastIndexOf('\n', start - 1) + 1;
        const column = start - lineStart;
        if (key === 'ArrowUp') {
          const previous = target.value.lastIndexOf('\n', lineStart - 2) + 1;
          start = Math.min(previous + column, Math.max(0, lineStart - 1));
        } else {
          const next = target.value.indexOf('\n', start);
          start = next < 0 ? target.value.length : Math.min(target.value.length, next + 1 + column);
        }
      }
      try {
        target.setSelectionRange(start, start);
      } catch {
        return false;
      }
      return true;
    }
    let value = key === 'Enter' ? '\n' : key;
    if (key === 'Enter' && target instanceof HTMLInputElement) return false;
    if (key === 'Backspace') {
      value = '';
      if (start === end) {
        const before = Array.from(target.value.slice(0, start));
        start -= before.pop()?.length || 0;
      }
    }
    if (key === 'Delete') {
      value = '';
      if (start === end) end += Array.from(target.value.slice(end))[0]?.length || 0;
    }
    const inputType =
      key === 'Backspace'
        ? 'deleteContentBackward'
        : key === 'Delete'
          ? 'deleteContentForward'
          : key === 'Enter'
            ? 'insertLineBreak'
            : 'insertText';
    const before = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      data: value || null,
      inputType,
    });
    if (!target.dispatchEvent(before)) return false;
    const maxLength = target.maxLength;
    if (maxLength >= 0)
      value = value.slice(0, Math.max(0, maxLength - (target.value.length - (end - start))));
    target.value = target.value.slice(0, start) + value + target.value.slice(end);
    try {
      target.setSelectionRange(start + value.length, start + value.length);
    } catch {
      /* Email inputs do not expose a text selection. */
    }
    dispatchInput(root, target, value || null, inputType);
    return true;
  }
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) return false;
  const contain = (event: Event) => {
    if (target.contains(event.target as Node)) event.stopPropagation();
  };
  root.addEventListener('input', contain);
  try {
    if (key === 'Backspace') return document.execCommand('delete');
    if (key === 'Delete') return document.execCommand('forwardDelete');
    if (key === 'Enter') return document.execCommand('insertLineBreak');
    return document.execCommand('insertText', false, key);
  } finally {
    root.removeEventListener('input', contain);
  }
}
