import { useEffect } from "react";

import { useSearchStore } from "../stores/searchStore";

function isFocusableElement(target: EventTarget | null): boolean {
  if (!(target && target instanceof HTMLElement)) {
    return false;
  }

  const focusableTags = ["INPUT", "TEXTAREA", "SELECT"];
  return target.isContentEditable || focusableTags.includes(target.tagName);
}

export function useSearchKeyboardShortcut() {
  const openModal = useSearchStore((state) => state.openModal);
  const closeModal = useSearchStore((state) => state.closeModal);
  const toggleModal = useSearchStore((state) => state.toggleModal);
  const isOpen = useSearchStore((state) => state.isOpen);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;

      const isModifier = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (isModifier && key === "k") {
        if (isFocusableElement(event.target)) return;
        event.preventDefault();
        openModal();
        return;
      }

      if (key === "/" && !isFocusableElement(event.target)) {
        event.preventDefault();
        openModal();
        return;
      }

      if (key === "escape" && isOpen) {
        closeModal();
      }
    };

    const handleOpenEvent = () => openModal();
    const handleCloseEvent = () => closeModal();
    const handleToggleEvent = () => toggleModal();

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("cmdk:open", handleOpenEvent);
    window.addEventListener("cmdk:close", handleCloseEvent);
    window.addEventListener("cmdk:toggle", handleToggleEvent);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("cmdk:open", handleOpenEvent);
      window.removeEventListener("cmdk:close", handleCloseEvent);
      window.removeEventListener("cmdk:toggle", handleToggleEvent);
    };
  }, [openModal, closeModal, toggleModal, isOpen]);
}
