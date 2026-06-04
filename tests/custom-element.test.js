import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TravenEditorElement } from "../src/index.js";

describe("TravenEditorElement (Web Component)", () => {
  beforeEach(() => {
    // Ensure the element is registered for tests if not already
    if (!customElements.get("traven-editor")) {
      customElements.define("traven-editor", TravenEditorElement);
    }
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("mounts and initializes with textContent as the value", () => {
    const el = document.createElement("traven-editor");
    el.textContent = "# Initial Value";
    document.body.appendChild(el);

    expect(el.value).toBe("# Initial Value");
    expect(el.editor).toBeDefined();
    expect(el.editor.getValue()).toBe("# Initial Value");
  });

  it("creates a hidden textarea fallback with the correct name and value", () => {
    const el = document.createElement("traven-editor");
    el.setAttribute("name", "content-body");
    el.textContent = "Test content";
    document.body.appendChild(el);

    const textarea = el.querySelector("textarea");
    expect(textarea).not.toBeNull();
    // It must be a direct child for FormData serialization to pick it up properly
    expect(textarea.parentElement).toBe(el);
    expect(textarea.name).toBe("content-body");
    expect(textarea.value).toBe("Test content");
    expect(textarea.style.display).toBe("none");
  });

  it("synchronizes value changes back to the hidden textarea", () => {
    const el = document.createElement("traven-editor");
    document.body.appendChild(el);
    
    // Simulate user typing / programmatic change
    el.value = "New value";
    
    const textarea = el.querySelector("textarea");
    expect(textarea.value).toBe("New value");
  });

  it("reacts to dynamic attribute changes (theme, name, read-only)", () => {
    const el = document.createElement("traven-editor");
    document.body.appendChild(el);
    
    // Test name
    el.setAttribute("name", "new-name");
    const textarea = el.querySelector("textarea");
    expect(textarea.name).toBe("new-name");

    // Test read-only
    expect(el.editor.isReadOnly()).toBe(false);
    el.setAttribute("read-only", "true");
    expect(el.editor.isReadOnly()).toBe(true);

    // Test removing attribute (falsy)
    el.removeAttribute("read-only");
    expect(el.editor.isReadOnly()).toBe(false);
  });

  it("survives create and remove in the same tick (race condition guard)", () => {
    const el = document.createElement("traven-editor");
    
    // Expect no throws when immediately mounting and unmounting
    expect(() => {
      document.body.appendChild(el);
      el.remove();
    }).not.toThrow();
  });

  it("parses the toolbar attribute correctly", () => {
    const el1 = document.createElement("traven-editor");
    el1.setAttribute("toolbar", "false");
    document.body.appendChild(el1);
    // There shouldn't be a toolbar rendered in the DOM for this editor
    expect(el1.querySelector(".traven-toolbar")).toBeNull();

    const el2 = document.createElement("traven-editor");
    el2.setAttribute("toolbar", "bold, italic");
    document.body.appendChild(el2);
    // Just a basic check that it didn't crash and parsed something
    expect(el2.editor).toBeDefined();
  });
});
