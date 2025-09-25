# Copy Code with filename

[](https://marketplace.visualstudio.com/items?itemName=yuchuan.copy-code-with-filename)
[](https://marketplace.visualstudio.com/items?itemName=yuchuan.copy-code-with-filename)
[](https://opensource.org/licenses/MIT)

一款简洁而强大的 VS Code 扩展，旨在让你能够高效地复制文件或文件夹的代码内容，并自动附带其相对路径，输出为格式优美的 Markdown。

无论是编写技术文档、向AI提问、还是与同事分享代码片段，这个插件都能帮你保留重要的文件上下文，让沟通更清晰。

## ✨ 功能特性

  * **复制单个文件**: 右键单击任何文件，即可复制其完整内容和路径。
  * **复制多个文件**: 同时选择多个文件，一键复制所有文件的内容。
  * **复制文件夹**: 右键单击一个文件夹，递归复制其中所有文件的内容。
  * **智能格式化**: 输出内容会自动包裹在 Markdown 代码块中，并正确识别语言类型。
  * **保留上下文**: 每个代码块前都会清晰地标出文件相对于工作区的路径。

## 🚀 使用指南

所有功能都通过 VS Code 资源管理器的右键上下文菜单触发。

### 1\. 复制单个文件

在文件浏览器中，右键点击你想要复制的文件（例如 `src/extension.ts`），然后选择 **Copy Code**。

**剪贴板中的内容会是这样：**

````markdown
File: src/extension.ts

```typescript
import * as path from 'node:path'
import * as vscode from 'vscode'

// ... a's a'f'f'f'f ...

export function deactivate() {}
```
````

### 2\. 复制多个文件

按住 `Ctrl` (Windows/Linux) 或 `Cmd` (Mac) 并点选多个文件。然后，在任意一个选中的文件上右键，选择 **Copy Code**。

**剪贴板中的内容会是这样 (示例：复制 `package.json` 和 `src/extension.ts`):**

````markdown
File: package.json

```json
{
  "name": "copy-code-with-filename",
  "displayName": " Copy Code with filename",
  // ... a's a'f'f'f'f ...
}
```


---


File: src/extension.ts

```typescript
import * as path from 'node:path'
import * as vscode from 'vscode'

// ... a's a'f'f'f'f ...

export function deactivate() {}
```
````

### 3\. 复制文件夹内容

在文件浏览器中，右键点击你想要复制的文件夹（例如 `src`），然后选择 **Copy Folder Code**。扩展将会递归地读取该文件夹下的所有文件内容并复制。

**剪贴板中的内容将会包含 `src/` 目录下所有文件的内容，格式与多文件复制相同。**

## 💻 安装

1.  打开 **Visual Studio Code**。
2.  按下 `Ctrl+Shift+X` 打开 **扩展** 侧边栏。
3.  在搜索框中输入 `Copy Code with filename`。
4.  找到本扩展，点击 **Install** 按钮。

## 🤝 贡献

如果你发现了 Bug 或者有功能建议，欢迎到 [GitHub 仓库](https://www.google.com/search?q=https://github.com/savageKarl/copy-code-with-filename) 提交 Issue。

## 📜 许可证

本项目基于 [MIT License](https://opensource.org/licenses/MIT) 开源。