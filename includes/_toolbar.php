<button class="toolbar-btn btn-undo" onclick="triggerUndo()" title="Undo (Ctrl+Z)">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="24 56 24 104 72 104" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M67.59,192A88,88,0,1,0,65.77,65.77L24,104" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
</button>
<button class="toolbar-btn btn-redo" onclick="triggerRedo()" title="Redo (Ctrl+Y)">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="184 104 232 104 232 56" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M188.4,192a88,88,0,1,1,1.83-126.23L232,104" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
</button>
<button class="toolbar-btn btn-bold" onclick="applyFormat('**', '**', 'bold text')" title="Bold">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M80,120h80a40,40,0,0,1,0,80H80V48h68a36,36,0,0,1,0,72" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
</button>
<button class="toolbar-btn btn-del" onclick="applyFormat('~~', '~~', 'strikethrough')" title="Strikethrough">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="40" y1="128" x2="216" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M76.33,96a25.71,25.71,0,0,1-1.22-8c0-22.09,22-40,52.89-40,23,0,40.24,9.87,48,24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M72,168c0,22.09,25.07,40,56,40s56-17.91,56-40c0-23.77-21.62-33-45.6-40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
</button>
<button class="toolbar-btn btn-italic" onclick="applyFormat('*', '*', 'italic text')" title="Italic">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="152" y1="56" x2="104" y2="200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="64" y1="200" x2="144" y2="200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="112" y1="56" x2="192" y2="56" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
</button>
<button class="toolbar-btn btn-code" onclick="applyFormat('`', '`', 'code')" title="Inline Code">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="64 88 16 128 64 168" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="192 88 240 128 192 168" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="160" y1="40" x2="96" y2="216" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
</button>
<button class="toolbar-btn btn-quote" onclick="applyBlockquote()" title="Blockquote">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M108,144H40a8,8,0,0,1-8-8V72a8,8,0,0,1,8-8h60a8,8,0,0,1,8,8v88a40,40,0,0,1-40,40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M224,144H156a8,8,0,0,1-8-8V72a8,8,0,0,1,8-8h60a8,8,0,0,1,8,8v88a40,40,0,0,1-40,40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
</button>
<button class="toolbar-btn btn-list-ul" onclick="applyList('ul')" title="Unordered List">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="88" y1="64" x2="216" y2="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="88" y1="128" x2="216" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="88" y1="192" x2="216" y2="192" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><circle cx="44" cy="64" r="12"/><circle cx="44" cy="128" r="12"/><circle cx="44" cy="192" r="12"/></svg>
</button>
<button class="toolbar-btn btn-list-ol" onclick="applyList('ol')" title="Ordered List">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="104" y1="128" x2="216" y2="128" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="104" y1="64" x2="216" y2="64" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="104" y1="192" x2="216" y2="192" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="56 104 56 40 40 48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M72,208H40l28.68-38.37a15.69,15.69,0,0,0-3.24-22.41,16.78,16.78,0,0,0-23.06,3.15,15.85,15.85,0,0,0-2.38,4.3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
</button>
<button class="toolbar-btn btn-hr" onclick="applyHR()" title="Horizontal Rule">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="24" y1="128" x2="232" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
</button>
<div class="toolbar-dropdown" id="heading-dropdown">
  <button class="toolbar-btn btn-heading" type="button" title="Heading" aria-haspopup="true" aria-expanded="false">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="56" y1="56" x2="56" y2="200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="200" y1="128" x2="56" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="200" y1="56" x2="200" y2="200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
    <svg class="dropdown-caret" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="8" height="8">
      <polyline points="80 96 128 144 176 96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/>
    </svg>
  </button>
  <div class="toolbar-dropdown-menu" role="menu">
    <button class="toolbar-dropdown-item" data-level="1" role="menuitem" title="Heading 1" type="button">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="40" y1="56" x2="40" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="116" x2="40" y2="116" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="56" x2="144" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="224 208 224 112 200 128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
    </button>
    <button class="toolbar-dropdown-item" data-level="2" role="menuitem" title="Heading 2" type="button">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="40" y1="56" x2="40" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="116" x2="40" y2="116" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="56" x2="144" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M240,208H192l43.17-57.56A24,24,0,1,0,193.37,128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
    </button>
    <button class="toolbar-dropdown-item" data-level="3" role="menuitem" title="Heading 3" type="button">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="40" y1="56" x2="40" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="116" x2="40" y2="116" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="56" x2="144" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M192,112h48l-28,40a28,28,0,1,1-20,47.6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
    </button>
    <button class="toolbar-dropdown-item" data-level="4" role="menuitem" title="Heading 4" type="button">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="40" y1="56" x2="40" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="116" x2="40" y2="116" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="56" x2="144" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="248 184 176 184 232 112 232 208" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
    </button>
    <button class="toolbar-dropdown-item" data-level="5" role="menuitem" title="Heading 5" type="button">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="40" y1="56" x2="40" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="116" x2="40" y2="116" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="56" x2="144" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M240,112H200l-8,48a27.57,27.57,0,0,1,20-8,28,28,0,0,1,0,56,27.57,27.57,0,0,1-20-8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
    </button>
    <button class="toolbar-dropdown-item" data-level="6" role="menuitem" title="Heading 6" type="button">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="40" y1="56" x2="40" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="116" x2="40" y2="116" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="56" x2="144" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><circle cx="212" cy="180" r="28" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="187.75" y1="166" x2="220" y2="112" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
    </button>
  </div>
</div>
<select id="skin-select" class="toolbar-btn btn-skin-select" style="padding: 4px 8px; font-family: inherit;" title="Change Editor Skin">
  <option value="skin-default">Default Skin</option>
  <option value="skin-colorful">Colorful Skin</option>
  <option value="skin-dark">Dark Skin</option>
</select>

<script>
  (function() {
    // 1. Formatting helpers
    window.applyFormat = (before, after, placeholder) => {
      if (window.editor) {
        window.editor.insertSnippet(before, after, placeholder);
      }
    };

    window.applyHR = () => {
      if (!window.editor) return;
      const view = window.editor.getView();
      const state = view.state;
      const { from, to } = state.selection.main;
      
      const insertion = '---';
      
      const charBefore = from > 0 ? state.sliceDoc(from - 1, from) : '\n';
      const charAfter = to < state.doc.length ? state.sliceDoc(to, to + 1) : '\n';
      
      const secondCharBefore = from > 1 ? state.sliceDoc(from - 2, from - 1) : '\n';
      const secondCharAfter = to < state.doc.length - 1 ? state.sliceDoc(to + 1, to + 2) : '\n';

      let prefixSpacing = '';
      if (charBefore !== '\n') {
        prefixSpacing = '\n\n';
      } else if (secondCharBefore !== '\n') {
        prefixSpacing = '\n';
      }
      
      let suffixSpacing = '';
      if (charAfter !== '\n') {
        suffixSpacing = '\n';
      }
      
      const finalInsert = `${prefixSpacing}${insertion}${suffixSpacing}`;
      
      view.dispatch({
        changes: { from, to, insert: finalInsert },
        selection: { anchor: from + prefixSpacing.length + insertion.length }
      });
      view.focus();
    };

    window.applyHeading = (prefix) => {
      if (!window.editor) return;
      const view  = window.editor.getView();
      const state = view.state;
      const pos   = state.selection.main.head;
      const line  = state.doc.lineAt(pos);
      const existingPrefix = line.text.match(/^(#{1,6}\s*)/)?.[0] || '';

      if (existingPrefix === prefix) {
        view.dispatch({
          changes: { from: line.from, to: line.from + existingPrefix.length, insert: '' }
        });
      } else {
        view.dispatch({
          changes: { from: line.from, to: line.from + existingPrefix.length, insert: prefix }
        });
      }
      view.focus();
    };

    window.applyBlockquote = () => {
      if (!window.editor) return;
      const view = window.editor.getView();
      const state = view.state;
      const { from, to } = state.selection.main;
      
      if (from === to) {
        const pos = from;
        const line = state.doc.lineAt(pos);
        const existingPrefix = line.text.match(/^(>\s*)/)?.[0] || '';
        
        if (existingPrefix) {
          view.dispatch({
            changes: { from: line.from, to: line.from + existingPrefix.length, insert: '' }
          });
        } else {
          view.dispatch({
            changes: { from: line.from, to: line.from, insert: '> ' }
          });
        }
      } else {
        let selectedText = state.sliceDoc(from, to);
        const lines = selectedText.split(/\r?\n/);
        const quotedLines = lines.map(line => `> ${line}`);
        let insertion = quotedLines.join('\n');
        
        const charBefore = from > 0 ? state.sliceDoc(from - 1, from) : '\n';
        const charAfter = to < state.doc.length ? state.sliceDoc(to, to + 1) : '\n';
        const secondCharBefore = from > 1 ? state.sliceDoc(from - 2, from - 1) : '\n';
        const secondCharAfter = to < state.doc.length - 1 ? state.sliceDoc(to + 1, to + 2) : '\n';

        let prefixSpacing = '';
        if (charBefore !== '\n') {
          prefixSpacing = '\n\n';
        } else if (secondCharBefore !== '\n') {
          prefixSpacing = '\n';
        }
        
        let suffixSpacing = '';
        if (charAfter !== '\n') {
          suffixSpacing = '\n\n';
        } else if (secondCharAfter !== '\n') {
          suffixSpacing = '\n';
        }
        
        const finalInsert = `${prefixSpacing}${insertion}${suffixSpacing}`;
        
        view.dispatch({
          changes: { from, to, insert: finalInsert },
          selection: { anchor: from + prefixSpacing.length, head: from + prefixSpacing.length + insertion.length }
        });
      }
      view.focus();
    };

    window.applyList = (type) => {
      if (!window.editor) return;
      const view = window.editor.getView();
      const state = view.state;
      const { from, to } = state.selection.main;
      
      const isOL = type === 'ol';
      const getPrefix = (index) => isOL ? `${index + 1}. ` : '- ';
      
      if (from === to) {
        const pos = from;
        const line = state.doc.lineAt(pos);
        const text = line.text;
        const ulMatch = text.match(/^(-\s+)/);
        const olMatch = text.match(/^(\d+\.\s+)/);
        
        if (ulMatch) {
          const matchText = ulMatch[0];
          if (!isOL) {
            view.dispatch({ changes: { from: line.from, to: line.from + matchText.length, insert: '' } });
          } else {
            view.dispatch({ changes: { from: line.from, to: line.from + matchText.length, insert: '1. ' } });
          }
        } else if (olMatch) {
          const matchText = olMatch[0];
          if (isOL) {
            view.dispatch({ changes: { from: line.from, to: line.from + matchText.length, insert: '' } });
          } else {
            view.dispatch({ changes: { from: line.from, to: line.from + matchText.length, insert: '- ' } });
          }
        } else {
          const insertPrefix = getPrefix(0);
          view.dispatch({ changes: { from: line.from, to: line.from, insert: insertPrefix } });
        }
      } else {
        let selectedText = state.sliceDoc(from, to);
        const lines = selectedText.split(/\r?\n/);
        
        const listLines = lines.map((lineText, idx) => {
          const cleanLine = lineText.replace(/^([-\d+\.\s]+)/, '');
          return `${getPrefix(idx)}${cleanLine}`;
        });
        const insertion = listLines.join('\n');
        
        const charBefore = from > 0 ? state.sliceDoc(from - 1, from) : '\n';
        const charAfter = to < state.doc.length ? state.sliceDoc(to, to + 1) : '\n';
        const secondCharBefore = from > 1 ? state.sliceDoc(from - 2, from - 1) : '\n';
        const secondCharAfter = to < state.doc.length - 1 ? state.sliceDoc(to + 1, to + 2) : '\n';

        let prefixSpacing = '';
        if (charBefore !== '\n') {
          prefixSpacing = '\n\n';
        } else if (secondCharBefore !== '\n') {
          prefixSpacing = '\n';
        }
        
        let suffixSpacing = '';
        if (charAfter !== '\n') {
          suffixSpacing = '\n\n';
        } else if (secondCharAfter !== '\n') {
          suffixSpacing = '\n';
        }
        
        const finalInsert = `${prefixSpacing}${insertion}${suffixSpacing}`;
        
        view.dispatch({
          changes: { from, to, insert: finalInsert },
          selection: { anchor: from + prefixSpacing.length, head: from + prefixSpacing.length + insertion.length }
        });
      }
      view.focus();
    };

    window.triggerUndo = () => {
      if (window.editor) {
        window.editor.undo();
      }
    };

    window.triggerRedo = () => {
      if (window.editor) {
        window.editor.redo();
      }
    };

    // 2. Heading dropdown controller
    const wrapper = document.getElementById('heading-dropdown');
    if (wrapper) {
      const trigger = wrapper.querySelector('.btn-heading');
      const menu = wrapper.querySelector('.toolbar-dropdown-menu');

      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = wrapper.classList.toggle('is-open');
        trigger.setAttribute('aria-expanded', isOpen);
      });

      document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
          wrapper.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
        }
      });

      menu.addEventListener('click', (e) => {
        const item = e.target.closest('[data-level]');
        if (!item || !window.editor) return;
        const level = parseInt(item.dataset.level);
        const prefix = '#'.repeat(level) + ' ';
        window.applyHeading(prefix);
        wrapper.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      });
    }

    // 3. Dynamic skin selector
    document.getElementById('skin-select')?.addEventListener('change', (e) => {
      const skinLink = document.getElementById('editor-skin-link');
      if (skinLink) {
        skinLink.href = 'assets/skins/' + e.target.value + '.css';
      }
    });
  })();
</script>
