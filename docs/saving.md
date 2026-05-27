# Traven Editor — Manual Saving & Auto-Save Customization Guide

This document describes how the Traven WYSIWYM Markdown Editor handles saving content. It explains how to intercept manual saving keyboard shortcuts and how to implement auto-saving patterns using change hooks.

---

## 1. Saving Philosophy

To maintain a clean separation of concerns, Traven does not make direct database writes or communicate with backend API storage endpoints itself. The server infrastructure, authentication details, and database queries are entirely owned by the host application or CMS.

Instead, Traven provides standard, highly customizable event listeners and callbacks that intercept user save commands (`Ctrl+S` / `Cmd+S`) and document modifications. 

---

## 2. Manual Saving (`Ctrl+S` / `Cmd+S`)

By default, Traven registers a keyboard event handler that intercepts manual saving shortcuts.
* When a user presses `Ctrl+S` (Windows/Linux) or `Cmd+S` (macOS), Traven prevents the browser's default "Save Page As..." dialog from opening.
* It extracts the current Markdown document content and triggers the save handlers.

You can intercept this event in two ways.

### A. Constructor Callback (`onSave`)
Provide an `onSave` callback function when instantiating the editor:

```javascript
const editor = new TravenEditor({
  element: document.getElementById("editor"),
  initialValue: "# Hello World",
  onSave: (markdown) => {
    console.log("Save triggered!");
    saveContentToBackend(markdown);
  }
});
```

### B. Event Listener (`save` Event)
Alternatively, bind a listener to the custom `save` event on the editor instance:

```javascript
const editor = new TravenEditor({
  element: document.getElementById("editor")
});

editor.on("save", (markdown) => {
  saveContentToBackend(markdown);
});
```

---

## 3. Auto-Saving (`onChange`)

For a modern writing experience, host applications often implement background auto-saving to save drafts. Rather than saving to the database on every single keystroke—which could bottleneck your server—you should utilize a **debounced change callback**.

A debounced function ensures that the auto-save action is delayed until the user pauses typing for a specified duration (e.g., 2 seconds).

### Integration Recipe: Debounced Auto-Save

Below is a complete recipe showing how to configure debounced auto-saving inside your CMS:

```javascript
// 1. Define a standard debounce utility
function debounce(func, delay = 2000) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    
    // Optional: Update your UI to show a "Saving draft..." indicator
    updateStatusIndicator("Typing...");
    
    timeoutId = setTimeout(() => {
      func.apply(null, args);
    }, delay);
  };
}

// 2. Define the save logic that communicates with your server
async function performAutoSave(content) {
  updateStatusIndicator("Saving draft...");
  try {
    const response = await fetch("/api/content/save-draft", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getCsrfToken()
      },
      body: JSON.stringify({ markdown: content })
    });
    
    if (response.ok) {
      updateStatusIndicator("Draft saved");
    } else {
      updateStatusIndicator("Error saving draft", true);
    }
  } catch (error) {
    updateStatusIndicator("Connection lost", true);
  }
}

// 3. Initialize the debounced auto-save function
const debouncedAutoSave = debounce(performAutoSave, 2000);

// 4. Instanitate Traven and bind the onChange callback
const editor = new TravenEditor({
  element: document.getElementById("editor"),
  onChange: (content) => {
    debouncedAutoSave(content);
  }
});

// UI feedback helper
function updateStatusIndicator(message, isError = false) {
  const statusEl = document.getElementById("save-status");
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.style.color = isError ? "#ef4444" : "#64748b";
  }
}
```

---

## 4. Summary of API Hooks

| Method / Option | Hook Type | Trigger Description |
| :--- | :--- | :--- |
| `options.onSave` | Constructor Option | Fires a function with the current editor content when `Ctrl+S` / `Cmd+S` is pressed. |
| `.on("save", callback)` | Event Listener | Triggers listeners with the current editor content when `Ctrl+S` / `Cmd+S` is pressed. |
| `options.onChange` | Constructor Option | Fires a function with the current editor content on every document change. |
| `.on("change", callback)` | Event Listener | Triggers listeners with the current editor content on every document change. |
