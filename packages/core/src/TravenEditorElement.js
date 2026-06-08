import { TravenEditor, DEFAULT_TOOLBAR } from "./TravenEditor.js";

/**
 * TravenEditorElement - Web Component wrapper for TravenEditor.
 */
export class TravenEditorElement extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return [
      "name",
      "theme",
      "read-only",
      "vim-mode",
      "toolbar-mode",
      "line-numbers",
      "toolbar",
    ];
  }

  constructor() {
    super();
    this._internals = this.attachInternals ? this.attachInternals() : null;
    this._editor = null;
    this._hiddenTextarea = null;
  }

  connectedCallback() {
    // 1. Read Initial State
    // If remounting, preserve the value from the existing textarea
    const isRemount = this._hiddenTextarea !== null;
    const initialValue = isRemount
      ? this._hiddenTextarea.value
      : this.textContent || "";
    const nameAttr = this.getAttribute("name");

    // 2. Clear DOM
    this.innerHTML = "";

    // 3. Hidden Fallback
    this._hiddenTextarea = document.createElement("textarea");
    this._hiddenTextarea.style.display = "none";
    if (nameAttr) {
      this._hiddenTextarea.name = nameAttr;
    }
    this._hiddenTextarea.value = initialValue;
    this.appendChild(this._hiddenTextarea);

    // 4. Parse Attributes
    const options = {
      element: this,
      initialValue: initialValue,
      onChange: (val) => {
        if (this._internals && this._internals.setFormValue) {
          this._internals.setFormValue(val);
        }
        if (this._hiddenTextarea) {
          this._hiddenTextarea.value = val;
        }
      },
    };

    if (this.hasAttribute("theme")) options.theme = this.getAttribute("theme");
    if (this.hasAttribute("read-only"))
      options.readOnly =
        this.hasAttribute("read-only") &&
        this.getAttribute("read-only") !== "false";
    if (this.hasAttribute("vim-mode"))
      options.vimMode =
        this.hasAttribute("vim-mode") &&
        this.getAttribute("vim-mode") !== "false";
    if (this.hasAttribute("toolbar-mode"))
      options.toolbarMode = this.getAttribute("toolbar-mode");
    if (this.hasAttribute("line-numbers"))
      options.lineNumbers =
        this.hasAttribute("line-numbers") &&
        this.getAttribute("line-numbers") !== "false";
    if (this.hasAttribute("auto-load-styles"))
      options.autoLoadStyles =
        this.getAttribute("auto-load-styles") !== "false";
    if (this._codeLanguages) options.codeLanguages = this._codeLanguages;

    if (this.hasAttribute("toolbar")) {
      const tbAttr = this.getAttribute("toolbar");
      if (tbAttr === "false") {
        options.toolbar = false;
      } else if (tbAttr === "true" || tbAttr === "default" || tbAttr === "") {
        options.toolbar = DEFAULT_TOOLBAR;
      } else {
        options.toolbar = tbAttr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    // 5. Instantiate
    this._editor = new TravenEditor(options);

    // Set initial form value
    if (this._internals && this._internals.setFormValue) {
      this._internals.setFormValue(initialValue);
    }
  }

  disconnectedCallback() {
    if (this._editor) {
      this._editor.destroy();
      this._editor = null;
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this._editor) return;

    switch (name) {
      case "name":
        if (this._hiddenTextarea) {
          if (newValue) {
            this._hiddenTextarea.setAttribute("name", newValue);
          } else {
            this._hiddenTextarea.removeAttribute("name");
          }
        }
        break;
      case "theme":
        this._editor.setTheme(newValue);
        break;
      case "read-only":
        this._editor.setReadOnly(newValue !== null && newValue !== "false");
        break;
      case "vim-mode":
        this._editor.setVimMode(newValue !== null && newValue !== "false");
        break;
      case "toolbar":
        console.warn(
          "Traven: 'toolbar' is a construction-only attribute. Ignoring dynamic change.",
        );
        break;
    }
  }

  get value() {
    return this._editor
      ? this._editor.getValue()
      : this._hiddenTextarea
        ? this._hiddenTextarea.value
        : "";
  }

  set value(v) {
    if (this._editor) {
      this._editor.setValue(v);
    } else if (this._hiddenTextarea) {
      this._hiddenTextarea.value = v;
    }
  }

  get form() {
    return this._internals ? this._internals.form : null;
  }

  get name() {
    return this.getAttribute("name") || "";
  }

  set name(n) {
    this.setAttribute("name", n);
  }

  get type() {
    return "text";
  }

  get editor() {
    return this._editor;
  }

  get codeLanguages() {
    return this._codeLanguages || null;
  }

  set codeLanguages(langs) {
    this._codeLanguages = langs;
  }
}

// Auto-define side effect
if (
  typeof window !== "undefined" &&
  window.customElements &&
  !window.customElements.get("traven-editor")
) {
  window.customElements.define("traven-editor", TravenEditorElement);
}
