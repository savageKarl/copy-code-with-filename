import * as path from 'node:path'
import ignore from 'ignore'
import * as vscode from 'vscode'

// 设置一个合理的内容总长度上限（例如 15MB），防止 "Invalid string length" 错误
const MAX_CONTENT_LENGTH = 15 * 1024 * 1024

const binaryFileExtensions = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'ico',
  'bmp',
  'svg',
  'mp3',
  'wav',
  'ogg',
  'flac',
  'mp4',
  'webm',
  'mkv',
  'avi',
  'mov',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'zip',
  'rar',
  '7z',
  'gz',
  'tar',
  'bz2',
  'exe',
  'dll',
  'so',
  'app',
  'dmg',
  'woff',
  'woff2',
  'ttf',
  'otf',
  'eot',
  'lockb',
  'DS_Store'
])

function isBinaryFile(filePath: string): boolean {
  const extension = path.extname(filePath).substring(1).toLowerCase()
  return binaryFileExtensions.has(extension)
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

async function getFormattedFileString(
  fileUri: vscode.Uri,
  workspaceFolder: vscode.WorkspaceFolder | undefined
): Promise<string> {
  const relativePath = workspaceFolder
    ? path.relative(workspaceFolder.uri.fsPath, fileUri.fsPath).replace(/\\/g, '/')
    : path.basename(fileUri.fsPath)

  if (isBinaryFile(fileUri.fsPath)) {
    return `File: ${relativePath}\n`
  }

  const fileContentBytes = await vscode.workspace.fs.readFile(fileUri)
  const fileContent = Buffer.from(fileContentBytes).toString('utf8')

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
 * 【已重构】高效地、递归地获取所有未被忽略的文件 URI。
 * 此版本修正了路径匹配的基准，确保正确应用 .gitignore 规则。
 * @param directoryUri 当前正在遍历的目录
 * @param rootUri 触发操作的根目录，是 .gitignore 规则的基准
 * @param ig ignore 实例
 */
async function getAllFileUris(
  directoryUri: vscode.Uri,
  rootUri: vscode.Uri,
  ig: ReturnType<typeof ignore>
): Promise<vscode.Uri[]> {
  const allFiles: vscode.Uri[] = []
  const entries = await vscode.workspace.fs.readDirectory(directoryUri)

  for (const [name, type] of entries) {
    const entryUri = vscode.Uri.joinPath(directoryUri, name)

    // 关键修正：相对路径必须基于触发命令的根目录(rootUri)计算，而不是工作区
    const relativePath = path.relative(rootUri.fsPath, entryUri.fsPath).replace(/\\/g, '/')

    if (ig.ignores(relativePath)) {
      continue
    }

    if (type === vscode.FileType.Directory) {
      allFiles.push(...(await getAllFileUris(entryUri, rootUri, ig)))
    } else if (type === vscode.FileType.File) {
      allFiles.push(entryUri)
    }
  }

  return allFiles
}

/**
 * 负责处理文件列表：串行读取、检查大小、拼接内容。
 * @returns [拼接好的内容, 处理的文件数, 是否因大小超限而中止]
 */
async function processUris(
  uris: vscode.Uri[],
  workspaceFolder: vscode.WorkspaceFolder | undefined
): Promise<[string, number, boolean]> {
  const allFormattedContents: string[] = []
  let currentLength = 0
  let stoppedEarly = false

  for (const uri of uris) {
    const formattedContent = await getFormattedFileString(uri, workspaceFolder)

    if (currentLength + formattedContent.length > MAX_CONTENT_LENGTH) {
      stoppedEarly = true
      break
    }

    allFormattedContents.push(formattedContent)
    currentLength += formattedContent.length
  }

  const finalContent = allFormattedContents.join('\n\n---\n\n')
  return [finalContent, allFormattedContents.length, stoppedEarly]
}

export function activate(context: vscode.ExtensionContext) {
  const copyCodeCommand = vscode.commands.registerCommand(
    'copy-code-with-path.copyCode',
    async (clickedUri: vscode.Uri, allSelectedUris?: vscode.Uri[]) => {
      // ... 此命令逻辑未改变，保持原样 ...
      const urisToProcess = allSelectedUris && allSelectedUris.length > 0 ? allSelectedUris : [clickedUri]

      if (!urisToProcess[0]) {
        vscode.window.showErrorMessage('无法获取文件路径，请从侧边栏文件管理器中使用。')
        return
      }

      try {
        const fileUris: vscode.Uri[] = []
        const stats = await Promise.all(urisToProcess.map((uri) => vscode.workspace.fs.stat(uri)))
        stats.forEach((stat, index) => {
          if (stat.type === vscode.FileType.File) {
            fileUris.push(urisToProcess[index])
          }
        })

        if (fileUris.length === 0) {
          vscode.window.showWarningMessage('所选内容中不包含任何文件。')
          return
        }

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUris[0])
        const [finalContent, processedCount, stoppedEarly] = await processUris(fileUris, workspaceFolder)

        await vscode.env.clipboard.writeText(finalContent)

        if (stoppedEarly) {
          vscode.window.showWarningMessage(
            `已复制 ${processedCount} 个文件的内容。因总大小超出限制，部分文件未被处理。`
          )
        } else if (fileUris.length > 1) {
          vscode.window.showInformationMessage(`已复制 ${fileUris.length} 个文件的内容。`)
        } else {
          vscode.window.showInformationMessage(`代码已复制: ${path.basename(fileUris[0].fsPath)}`)
        }
      } catch (error) {
        console.error(error)
        const message = getErrorMessage(error)
        vscode.window.showErrorMessage(`复制文件内容失败: ${message}`)
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
        if (!workspaceFolder) {
          vscode.window.showErrorMessage('无法确定工作区。')
          return
        }

        const ig = ignore()
        ig.add('.git')
        ig.add('node_modules')
        ig.add('dist')
        ig.add('build')
        ig.add('out')
        ig.add('coverage')
        ig.add('.vscode')
        ig.add('.idea')
        ig.add('package-lock.json')
        ig.add('yarn.lock')
        ig.add('pnpm-lock.yaml')
        ig.add('bun.lockb')

        const gitignoreUri = vscode.Uri.joinPath(folderUri, '.gitignore')
        try {
          const gitignoreContentBytes = await vscode.workspace.fs.readFile(gitignoreUri)
          const gitignoreContent = Buffer.from(gitignoreContentBytes).toString('utf8')
          ig.add(gitignoreContent)
        } catch {
          // .gitignore 不存在时静默处理
        }

        // 调用重构后的核心函数，并传入正确的基准路径 `folderUri`
        const allFileUris = await getAllFileUris(folderUri, folderUri, ig)

        if (allFileUris.length === 0) {
          vscode.window.showWarningMessage('所选文件夹为空或不包含任何可复制的文件。')
          return
        }

        const [finalContent, processedCount, stoppedEarly] = await processUris(allFileUris, workspaceFolder)

        await vscode.env.clipboard.writeText(finalContent)

        const folderName = path.basename(folderUri.fsPath)
        if (stoppedEarly) {
          vscode.window.showWarningMessage(
            `已复制 ${folderName} 文件夹中 ${processedCount} 个项目的内容。因总大小超出限制，部分文件未被处理。`
          )
        } else {
          vscode.window.showInformationMessage(`已复制 ${folderName} 文件夹中 ${allFileUris.length} 个项目的内容。`)
        }
      } catch (error) {
        console.error(error)
        const message = getErrorMessage(error)
        vscode.window.showErrorMessage(`复制文件夹内容失败: ${message}`)
      }
    }
  )

  context.subscriptions.push(copyCodeCommand, copyFolderCodeCommand)
}

export function deactivate() {}
