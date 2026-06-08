// @ts-check
/**
 * Traven generic, accessible modal system.
 * Handles overlay creation, focus trapping, Escape key listener, and focus restoration.
 *
 * @param {Object} options
 * @param {string} options.title - Header title.
 * @param {HTMLElement|string} options.body - Body content.
 * @param {Array<Object>} [options.buttons] - Array of { text, type, onClick } button configs.
 * @param {HTMLElement} [options.triggerElement] - The button element that triggered the modal.
 * @param {string|null} [options.className] - Optional extra class on the dialog element.
 * @param {Function|null} [options.onClose] - Callback when modal is closed.
 */
export function openModal({ title, body, buttons = [], triggerElement = null, className = null, onClose = null }) {
  const overlay = document.createElement("div");
  overlay.className = "traven-modal-overlay";
  if (document.querySelector(".cm-wysiwym-dark")) {
    overlay.classList.add("cm-wysiwym-dark");
  }
  overlay.setAttribute("role", "presentation");

  const dialog = document.createElement("div");
  dialog.className = className ? `traven-modal ${className}` : "traven-modal";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "traven-modal-title-id");

  // Header
  const header = document.createElement("div");
  header.className = "traven-modal-header";

  const titleEl = document.createElement("h3");
  titleEl.className = "traven-modal-title";
  titleEl.id = "traven-modal-title-id";
  titleEl.textContent = title;

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "traven-modal-close";
  closeBtn.setAttribute("aria-label", "Close dialog");
  closeBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
      <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>
    </svg>
  `;

  header.appendChild(titleEl);
  header.appendChild(closeBtn);
  dialog.appendChild(header);

  // Body
  const bodyEl = document.createElement("div");
  bodyEl.className = "traven-modal-body";
  if (body instanceof HTMLElement) {
    bodyEl.appendChild(body);
  } else {
    bodyEl.innerHTML = body;
  }
  dialog.appendChild(bodyEl);

  // Footer / Buttons
  let footer = null;
  if (buttons.length > 0) {
    footer = document.createElement("div");
    footer.className = "traven-modal-footer";

    buttons.forEach((btnConfig) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `traven-modal-btn btn-${btnConfig.type || "secondary"}`;
      btn.textContent = btnConfig.text;
      btn.addEventListener("click", (e) => {
        btnConfig.onClick(e, overlay);
      });
      footer.appendChild(btn);
    });
    dialog.appendChild(footer);
  }

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  // Trigger browser paint then animate active class
  requestAnimationFrame(() => {
    overlay.classList.add("is-active");
  });

  /**
   * @returns {HTMLElement[]}
   */
  const getFocusableElements = () => {
    return /** @type {HTMLElement[]} */ (
      Array.from(
        dialog.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable]'
        )
      ).filter((el) => !el.hasAttribute("disabled") && el.getAttribute("tabindex") !== "-1")
    );
  };

  const focusable = getFocusableElements();
  if (focusable.length > 0) {
    focusable[0].focus();
  }

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      closeModal();
      return;
    }

    if (e.key === "Tab") {
      const focusableEls = getFocusableElements();
      if (focusableEls.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
  };

  const closeModal = () => {
    overlay.classList.remove("is-active");
    const style = window.getComputedStyle(overlay);
    const duration = parseFloat(style.transitionDuration) || 0;
    const finish = () => {
      overlay.remove();
      if (triggerElement && typeof triggerElement.focus === "function") {
        triggerElement.focus();
      }
      if (typeof onClose === "function") {
        onClose();
      }
    };
    if (duration === 0) {
      finish();
    } else {
      overlay.addEventListener("transitionend", finish, { once: true });
    }
    document.removeEventListener("keydown", handleKeyDown);
  };

  // Wire close triggers
  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  document.addEventListener("keydown", handleKeyDown);
}
