// src/extension.ts

import * as vscode from 'vscode';
import * as path from 'path'; // 引入 Node.js 的 path 模块

// 扩展被激活时调用的方法
export function activate(context: vscode.ExtensionContext) {

	// 注册 `copy-code-with-path.copyCode` 命令
	const copyCodeCommand = vscode.commands.registerCommand('copy-code-with-path.copyCode', async (fileUri: vscode.Uri) => {
		// fileUri 是通过右键菜单点击时，VS Code 自动传入的被点击文件的 URI

		if (!fileUri) {
			vscode.window.showErrorMessage('无法获取文件路径，请从侧边栏文件管理器中右键使用此功能。');
			return;
		}

		try {
			// 1. 获取文件内容
			const fileContentBytes = await vscode.workspace.fs.readFile(fileUri);
			const fileContent = Buffer.from(fileContentBytes).toString('utf8');

			// 2. 获取文件的相对路径
			const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
			const relativePath = workspaceFolder 
				? path.relative(workspaceFolder.uri.fsPath, fileUri.fsPath).replace(/\\/g, '/') // 兼容 windows
				: path.basename(fileUri.fsPath);

			// 3. 获取文件语言 ID，用于 markdown 代码块
			// 首先尝试从打开的文档中获取，如果文件未打开，则从文件名猜测
			let language = 'plaintext';
			const doc = vscode.workspace.textDocuments.find(d => d.uri.fsPath === fileUri.fsPath);
			if (doc) {
				language = doc.languageId;
			} else {
				// 简单的从文件后缀名推断
				const extension = path.extname(fileUri.fsPath).substring(1);
				if (extension) {
					language = extension;
				}
			}
			

			// 4. 格式化最终要复制的字符串
			const formattedContent = `File: ${relativePath}\n\n\`\`\`${language}\n${fileContent}\n\`\`\``;

			// 5. 将内容写入剪贴板
			await vscode.env.clipboard.writeText(formattedContent);

			// 6. 给用户一个成功的提示
			vscode.window.showInformationMessage(`代码已复制到剪贴板 (路径: ${relativePath})`);

		} catch (error) {
			console.error(error);
			vscode.window.showErrorMessage('复制文件内容失败！');
		}
	});

	// 将命令注册到扩展的上下文中，以便在禁用时可以被清理
	context.subscriptions.push(copyCodeCommand);
}

// 扩展被禁用时调用的方法
export function deactivate() {}