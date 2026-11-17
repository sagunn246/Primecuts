import { useEffect } from "react";

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  if (tagName === "input" || tagName === "textarea") return true;
  if (target.isContentEditable) return true;
  if (target.closest('input, textarea, [contenteditable="true"], [contenteditable=""], .select-text, .select-all')) {
    return true;
  }
  return false;
}

export default function DisableDevtools() {
  useEffect(() => {
    // Prevent mobile long-press context menu ("Share link", "Copy link", "Open in new tab", "Download image")
    // and desktop right-click menu on all non-input UI elements
    const handleContextMenu = (e: MouseEvent) => {
      if (!isEditableElement(e.target)) {
        e.preventDefault();
      }
    };

    // Prevent text selection initiation on non-editable elements
    const handleSelectStart = (e: Event) => {
      if (!isEditableElement(e.target)) {
        e.preventDefault();
      }
    };

    // Prevent dragging links/images which triggers browser link preview on mobile/desktop
    const handleDragStart = (e: DragEvent) => {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName.toLowerCase();
        if (tag === "a" || tag === "img" || e.target.closest("a, img")) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener("contextmenu", handleContextMenu, { passive: false });
    document.addEventListener("selectstart", handleSelectStart, { passive: false });
    document.addEventListener("dragstart", handleDragStart, { passive: false });

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, []);

  return null;
}

