import * as path from 'node:path'
import * as vscode from 'vscode'

/**
 * 处理单个文件，返回其格式化的字符串内容。
 * 这个函数集中了处理单个文件的所有逻辑，方便复用。
 * @param fileUri 文件的 URI
 * @param workspaceFolder 当前工作区文件夹
 * @returns 格式化后的文件内容字符串
 */
async function getFormattedFileString(
  fileUri: vscode.Uri,
  workspaceFolder: vscode.WorkspaceFolder | undefined
): Promise<string> {
  const fileContentBytes = await vscode.workspace.fs.readFile(fileUri)
  const fileContent = Buffer.from(fileContentBytes).toString('utf8')

  const relativePath = workspaceFolder
    ? path.relative(workspaceFolder.uri.fsPath, fileUri.fsPath).replace(/\\/g, '/')
    : path.basename(fileUri.fsPath)

  let language = 'plaintext'
  const doc = vscode.workspace.textDocuments.find((d) => d.uri.fsPath === fileUri.fsPath)
  if (doc) {
    language = doc.languageId
  } else {
    const extension = path.extname(fileUri.fsPath).substring(1)
    if (extension) {
      language = extension
    }
  }

  return `File: ${relativePath}\n\n\`\`\`${language}\n${fileContent}\n\`\`\`\n`
}

/**
 * 递归地查找一个目录下的所有文件 URI
 * @param directoryUri 目录的 URI
 * @returns 包含所有文件 URI 的数组
 */
async function getAllFileUris(directoryUri: vscode.Uri): Promise<vscode.Uri[]> {
  const allFiles: vscode.Uri[] = []
  const entries = await vscode.workspace.fs.readDirectory(directoryUri)

  for (const [name, type] of entries) {
    const entryUri = vscode.Uri.joinPath(directoryUri, name)
    if (type === vscode.FileType.File) {
      allFiles.push(entryUri)
    } else if (type === vscode.FileType.Directory) {
      // 可在此处添加逻辑以排除 .git, node_modules 等目录
      allFiles.push(...(await getAllFileUris(entryUri)))
    }
  }

  return allFiles
}

export function activate(context: vscode.ExtensionContext) {
  const copyCodeCommand = vscode.commands.registerCommand(
    'copy-code-with-path.copyCode',
    async (fileUri: vscode.Uri) => {
      if (!fileUri) {
        vscode.window.showErrorMessage('无法获取文件路径，请从侧边栏文件管理器中使用。')
        return
      }

      try {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri)
        const formattedContent = await getFormattedFileString(fileUri, workspaceFolder)

        await vscode.env.clipboard.writeText(formattedContent)
        vscode.window.showInformationMessage(`代码已复制: ${path.basename(fileUri.fsPath)}`)
      } catch (error) {
        console.error(error)
        vscode.window.showErrorMessage('复制文件内容失败！')
      }
    }
  )

  const copyFolderCodeCommand = vscode.commands.registerCommand(
    'copy-code-with-path.copyFolderCode',
    async (folderUri: vscode.Uri) => {
      if (!folderUri) {
        vscode.window.showErrorMessage('无法获取文件夹路径，请从侧边栏文件管理器中使用。')
        return
      }

      try {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(folderUri)
        const allFileUris = await getAllFileUris(folderUri)

        if (allFileUris.length === 0) {
          vscode.window.showWarningMessage('所选文件夹为空或不包含任何文件。')
          return
        }

        const allFormattedContents = await Promise.all(
          allFileUris.map((uri) => getFormattedFileString(uri, workspaceFolder))
        )

        const finalContent = allFormattedContents.join('\n\n---\n\n')
        await vscode.env.clipboard.writeText(finalContent)

        const folderName = path.basename(folderUri.fsPath)
        vscode.window.showInformationMessage(`已复制 ${folderName} 文件夹中 ${allFileUris.length} 个文件的内容。`)
      } catch (error) {
        console.error(error)
        vscode.window.showErrorMessage('复制文件夹内容失败！')
      }
    }
  )

  context.subscriptions.push(copyCodeCommand, copyFolderCodeCommand)
}

export function deactivate() {}
