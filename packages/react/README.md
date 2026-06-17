<p align="center">
  <img src="https://raw.githubusercontent.com/slpstream/traven/main/packages/core/assets/images/traven.png" alt="Traven Editor" width="400">
</p>

<p align="center">
  <strong>Official React Wrapper for Traven Editor</strong><br>A rich-text Markdown editor you can drop into any React application.
</p>

<p align="center">
  <a href="https://github.com/slpstream/traven/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://www.npmjs.com/package/@freedomware/traven-react"><img src="https://img.shields.io/npm/v/@freedomware/traven-react?color=orange" alt="NPM Version"></a>
</p>

---

## Installation

```bash
npm install @freedomware/traven @freedomware/traven-react
```

Note: `@freedomware/traven` is a peer dependency and must be installed alongside the React wrapper.

---

## Usage

Import the `TravenEditor` component and the required styles:

```jsx
import React, { useState } from 'react';
import { TravenEditor } from '@freedomware/traven-react';
import '@freedomware/traven/dist/traven.css';

function App() {
  const [content, setContent] = useState('# Hello Traven');

  return (
    <div className="editor-container">
      <TravenEditor
        value={content}
        onChange={(val) => setContent(val)}
        toolbar={true}
        placeholder="Start writing..."
      />
    </div>
  );
}

export default App;
```

---

## Documentation & Support

For full customization, configuration, and options, visit the main [Traven Documentation](https://traven.dev/docs/) and [GitHub Repository](https://github.com/slpstream/traven).

## License

Open-source, licensed under the [MIT License](https://github.com/slpstream/traven/blob/main/LICENSE).
