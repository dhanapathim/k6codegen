import fs from "fs";
import path from "path";

export class CodeFenceCleaner {
  constructor(rootFolder, extensions = [".js", ".ts", ".java", ".json"]) {
    this.rootFolder = rootFolder;
    this.extensions = extensions;

    // Supported code fences (auto-expandable)
    this.fenceStartPatterns = [
      /^```$/,                     // ```
      /^```js$/,                  // ```js
      /^```javascript$/,          // ```javascript
      /^```ts$/,                  // ```ts
      /^```typescript$/,          // ```typescript
      /^```java$/,                // ```java
      /^```python$/,              // ```python (optional)
      /^```javascripts$/,         // your typo case
      /^```json$/,                // ```json
    ];

    // End fence always: ```
    this.fenceEndPattern = /^```$/;
  }

  clean() {
    this.#walk(this.rootFolder);
    console.log(`✅ Cleaned all files in: ${this.rootFolder}`);
  }

  #walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        this.#walk(fullPath);
      } else if (this.extensions.some(ext => entry.name.endsWith(ext))) {
        this.#processFile(fullPath);
      }
    }
  }

  #processFile(filePath) {
    let content = fs.readFileSync(filePath, "utf-8");
    let lines = content.split(/\r?\n/);

    // Remove starting fences
    while (lines.length && this.fenceStartPatterns.some(p => p.test(lines[0].trim()))) {
      lines.shift();
    }

    // Remove ending fences
    while (lines.length && this.fenceEndPattern.test(lines[lines.length - 1].trim())) {
      lines.pop();
    }

    fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
  }
}
