# Arklet Plugin

这是一个 VSCode 插件，它允许你通过右键菜单使用 tsx 执行 TypeScript/JavaScript 文件。

## 功能

- 在文件资源管理器中右键点击 `.ts` 或 `.js` 文件
- 选择 "Run with Arklet" 选项
- 插件会使用 tsx 命令执行选中的文件
- 详细的执行信息会显示在输出面板中
- 如果生成了 response.json 文件，会显示其大小

## 使用要求

- VSCode 1.80.0 或更高版本
- Node.js 和 pnpm 已安装
- tsx 已全局安装 (`pnpm install -g tsx`)
- **重要**: 项目根目录下的 `package.json` 文件必须包含 `"arklet": true` 字段

## 项目配置

要启用插件功能，您需要在项目的 `package.json` 中添加以下配置：

```json
{
  "name": "your-project",
  "version": "1.0.0",
  // 其他配置...
  "arklet": true
}
```

如果项目中没有添加 `"arklet": true` 配置，右键菜单中不会显示 "Run with Arklet" 选项。

## 安装步骤

1. 克隆此仓库
2. 运行 `pnpm install` 安装依赖
3. 在 VSCode 中按 F5 启动调试
4. 在新的 VSCode 窗口中测试插件

## 使用方法

1. 打开一个包含正确配置的项目（package.json 中有 `"arklet": true`）
2. 在 VSCode 的文件资源管理器中右键点击 `.ts` 或 `.js` 文件
3. 在上下文菜单中选择 "Run with Arklet"
4. 执行结果将显示在底部的输出面板中
5. 如果执行成功并生成了 response.json 文件，将显示文件大小

## 输出说明

执行文件时，插件会：

1. 在输出面板中显示详细信息，包括：
   - 执行的命令
   - 标准输出
   - 错误输出（如果有）
   - 生成的文件信息

2. 在通知中显示简要信息：
   - 执行成功或失败
   - 如果生成了 response.json 文件，会显示其大小

## 注意事项

- 确保已全局安装 tsx (`pnpm install -g tsx`)
- 确保选择的文件是可执行的 TypeScript/JavaScript 文件
- 确保项目的 package.json 中包含 `"arklet": true` 配置
- 如果修改了 package.json 文件，插件会自动检测变化并更新功能状态

## 发布插件

如果您想将此插件发布到 VSCode 插件市场，请按照以下步骤操作：

### 准备工作

1. 确保您有一个 [Azure DevOps](https://dev.azure.com/) 账号
2. 在 [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage) 创建一个发布者账号
3. 安装最新版本的发布工具：
   ```bash
   npm install -g @vscode/vsce
   ```

### 获取发布令牌 (PAT)

1. 登录 [Azure DevOps](https://dev.azure.com/)
2. 点击右上角头像，选择"个人访问令牌"
3. 点击"新建令牌"
4. 设置描述，如 "VSCode Marketplace Publishing"
5. 过期时间根据需要设置
6. 在"作用域"部分，选择 "Marketplace" -> "Manage"（或选择 "Full access"）
7. 点击"创建"并保存生成的令牌

### 发布步骤

1. 登录您的发布者账号：
   ```bash
   vsce login <您的发布者ID>
   ```
   输入您之前获取的 PAT

2. 打包插件：
   ```bash
   vsce package --no-dependencies
   ```
   这将生成一个 `.vsix` 文件

3. 发布插件：
   ```bash
   vsce publish --no-dependencies
   ```

4. 更新插件版本（后续更新时）：
   ```bash
   # 自动增加修订版本号 (0.0.1 -> 0.0.2)
   vsce publish patch
   
   # 自动增加次版本号 (0.0.1 -> 0.1.0)
   vsce publish minor
   
   # 自动增加主版本号 (0.0.1 -> 1.0.0)
   vsce publish major
   ```

### 手动安装

如果您只想在本地使用此插件而不发布到市场：

1. 打包插件生成 `.vsix` 文件：
   ```bash
   vsce package
   ```

2. 在 VSCode 中选择"扩展" -> "..." -> "从 VSIX 安装..."，然后选择生成的 `.vsix` 文件

## 疑难解答

如果插件不显示或不工作：

1. 检查项目根目录下是否有 package.json 文件
2. 确认 package.json 中包含 `"arklet": true` 字段
3. 确保全局安装了 tsx
4. 查看 VSCode 输出面板中的 "Arklet" 通道获取详细日志

如果发布过程中遇到问题：

1. 确保 package.json 中的 "publisher" 字段与您在 Marketplace 注册的发布者 ID 一致
2. 检查 PAT 是否有效，可能需要重新生成
3. 更新 vsce 工具到最新版本
4. 尝试使用详细模式获取更多错误信息：`vsce publish -v` 