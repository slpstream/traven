// @ts-check
import { openModal } from "./modal-base.js";
import { getSnippets, addSnippet, updateSnippet, deleteSnippet } from "./snippet-store.js";

/**
 * @param {Object} options
 * @param {import("../TravenEditor.js").TravenEditor} options.editor
 * @param {HTMLElement} options.triggerElement
 */
export function openSnippetModal({ editor, triggerElement }) {
  let snippets = getSnippets();

  const openSnippetAlert = (message) => {
    openModal({
      title: "",
      body: message,
      className: "traven-modal-confirm",
      triggerElement,
      buttons: [
        {
          text: "OK",
          type: "primary",
          onClick: (e, overlay) => {
            overlay.querySelector(".traven-modal-close").click();
          }
        }
      ]
    });
  };

  const openSnippetConfirm = (message, onConfirm) => {
    openModal({
      title: "",
      body: message,
      className: "traven-modal-confirm",
      triggerElement,
      buttons: [
        {
          text: "Cancel",
          type: "secondary",
          onClick: (e, overlay) => {
            overlay.querySelector(".traven-modal-close").click();
          }
        },
        {
          text: "OK",
          type: "primary",
          onClick: (e, overlay) => {
            onConfirm();
            overlay.querySelector(".traven-modal-close").click();
          }
        }
      ]
    });
  };

  const container = document.createElement("div");
  container.className = "traven-snippet-manager";

  const listContainer = document.createElement("div");
  listContainer.className = "traven-snippet-list";
  
  const editContainer = document.createElement("div");
  editContainer.className = "traven-snippet-edit";
  editContainer.style.display = "none";

  // Editor fields
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "Snippet Name (e.g. My Signature)";
  nameInput.className = "traven-modal-input traven-snippet-name";
  nameInput.style.marginBottom = "10px";

  const contentInput = document.createElement("textarea");
  contentInput.placeholder = "Snippet Content (Markdown, HTML or plain text)";
  contentInput.className = "traven-modal-input traven-snippet-content";
  contentInput.style.minHeight = "100px";
  contentInput.style.fontFamily = "monospace";
  contentInput.style.marginBottom = "10px";
  contentInput.style.resize = "vertical";

  let editingSnippetId = null;

  const cancelEditBtn = document.createElement("button");
  cancelEditBtn.type = "button";
  cancelEditBtn.className = "traven-modal-btn btn-secondary";
  cancelEditBtn.textContent = "Cancel";
  
  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "traven-modal-btn btn-primary";
  saveBtn.textContent = "Save Snippet";
  saveBtn.style.marginLeft = "10px";

  const editActions = document.createElement("div");
  editActions.appendChild(cancelEditBtn);
  editActions.appendChild(saveBtn);

  editContainer.appendChild(nameInput);
  editContainer.appendChild(contentInput);
  editContainer.appendChild(editActions);

  function renderList() {
    listContainer.innerHTML = "";
    if (snippets.length === 0) {
      const emptyMsg = document.createElement("p");
      emptyMsg.textContent = "No snippets saved yet.";
      emptyMsg.style.color = "var(--traven-text-muted)";
      listContainer.appendChild(emptyMsg);
    } else {
      snippets.forEach(snippet => {
        const row = document.createElement("div");
        row.className = "traven-snippet-row";

        const nameSpan = document.createElement("span");
        nameSpan.textContent = snippet.name;
        nameSpan.className = "traven-snippet-name-span";

        const actionsDiv = document.createElement("div");
        actionsDiv.className = "traven-snippet-actions";
        
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.title = "Edit Snippet";
        editBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="16" height="16">
            <rect width="256" height="256" fill="none"/>
            <path d="M92.69,216H48a8,8,0,0,1-8-8V163.31a8,8,0,0,1,2.34-5.65L165.66,34.34a8,8,0,0,1,11.31,0L221.66,79a8,8,0,0,1,0,11.31L98.34,213.66A8,8,0,0,1,92.69,216Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
            <line x1="136" y1="64" x2="192" y2="120" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
          </svg>`;
        editBtn.className = "traven-snippet-action-btn btn-edit";
        editBtn.onclick = () => startEdit(snippet);

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.title = "Delete Snippet";
        deleteBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="16" height="16">
            <rect width="256" height="256" fill="none"/>
            <line x1="216" y1="56" x2="40" y2="56" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
            <line x1="104" y1="104" x2="104" y2="168" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
            <line x1="152" y1="104" x2="152" y2="168" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
            <path d="M200,56V208a8,8,0,0,1-8,8H64a8,8,0,0,1-8-8V56" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
            <path d="M168,56V40a16,16,0,0,0-16-16H104A16,16,0,0,0,88,40V56" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/>
          </svg>`;
        deleteBtn.className = "traven-snippet-action-btn btn-delete";
        deleteBtn.onclick = () => {
          openSnippetConfirm(`Delete snippet "${snippet.name}"?`, () => {
            deleteSnippet(snippet.id);
            snippets = getSnippets();
            renderList();
          });
        };

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        row.appendChild(nameSpan);
        row.appendChild(actionsDiv);
        listContainer.appendChild(row);
      });
    }
  }

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "traven-modal-btn btn-secondary";
  addBtn.textContent = "+ Add Snippet";
  addBtn.style.marginTop = "15px";
  addBtn.onclick = () => startEdit(null);

  container.appendChild(listContainer);
  container.appendChild(addBtn);
  container.appendChild(editContainer);

  function startEdit(snippet) {
    if (snippet) {
      editingSnippetId = snippet.id;
      nameInput.value = snippet.name;
      contentInput.value = snippet.content;
    } else {
      editingSnippetId = null;
      nameInput.value = "";
      contentInput.value = "";
    }
    editContainer.style.display = "block";
    addBtn.style.display = "none";
    listContainer.style.opacity = "0.5";
    listContainer.style.pointerEvents = "none";
    const footer = /** @type {HTMLElement|null} */ (container.closest(".traven-modal")?.querySelector(".traven-modal-footer") || null);
    if (footer) {
      footer.style.display = "none";
    }
    nameInput.focus();
  }

  function endEdit() {
    editingSnippetId = null;
    editContainer.style.display = "none";
    addBtn.style.display = "inline-block";
    listContainer.style.opacity = "1";
    listContainer.style.pointerEvents = "auto";
    const footer = /** @type {HTMLElement|null} */ (container.closest(".traven-modal")?.querySelector(".traven-modal-footer") || null);
    if (footer) {
      footer.style.display = "flex";
    }
  }

  saveBtn.onclick = () => {
    const name = nameInput.value.trim();
    const content = contentInput.value;
    if (!name) {
      openSnippetAlert("Snippet name is required.");
      return;
    }
    if (!content.trim()) {
      openSnippetAlert("Snippet content is required.");
      return;
    }
    if (editingSnippetId) {
      updateSnippet(editingSnippetId, name, content);
    } else {
      addSnippet(name, content);
    }
    snippets = getSnippets();
    renderList();
    endEdit();
  };

  cancelEditBtn.onclick = endEdit;

  renderList();

  openModal({
    title: "Manage Snippets",
    body: container,
    className: "traven-modal-snippet",
    triggerElement,
    buttons: [
      {
        text: "Done",
        type: "primary",
        onClick: (e, overlay) => {
          overlay.querySelector(".traven-modal-close").click();
        }
      }
    ],
    onClose: () => {
      // Once modal is closed, if we need to re-trigger the dropdown update, 
      // the dom-button.js getChildren mechanism will handle it next time it's clicked.
    }
  });
}
