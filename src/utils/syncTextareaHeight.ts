/**
 * Grow a textarea to fit its content without shifting the surrounding scroll view.
 * - Snapshots scroll positions on overflow ancestors + window (dashboard uses <main overflow-auto>).
 * - Restores immediately and again on the next animation frames so browser "scroll into view"
 *   on caret/focus cannot win permanently.
 */
export function syncTextareaHeight(textarea: HTMLTextAreaElement | null): void {
  if (!textarea) return;

  type Snap = { node: HTMLElement; top: number; left: number };
  const snaps: Snap[] = [];

  let node: HTMLElement | null = textarea;
  while (node) {
    if (node.tagName === 'BODY') break;
    const style = window.getComputedStyle(node);
    const oy = style.overflowY;
    const scrollable =
      oy === 'auto' || oy === 'scroll' || oy === 'overlay';
    // Always track <main> (primary app scroller) even if height math is edge-casey.
    if (scrollable || node.tagName === 'MAIN') {
      snaps.push({ node, top: node.scrollTop, left: node.scrollLeft });
    }
    node = node.parentElement;
  }

  const winY = window.scrollY;
  const winX = window.scrollX;

  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;

  const restore = () => {
    for (const { node, top, left } of snaps) {
      if (node.scrollTop !== top) node.scrollTop = top;
      if (node.scrollLeft !== left) node.scrollLeft = left;
    }
    if (window.scrollY !== winY || window.scrollX !== winX) {
      window.scrollTo(winX, winY);
    }
  };

  restore();
  requestAnimationFrame(() => {
    restore();
    requestAnimationFrame(restore);
  });
}
