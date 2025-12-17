import process from 'node:process'
import esbuild from 'esbuild'

const production = process.argv.includes('--production')
const watch = process.argv.includes('--watch')

/**
 * @type {import('esbuild').BuildOptions['plugins']}
 */
const plugins = [
  {
    name: 'esbuild-problem-matcher',
    setup(build) {
      build.onStart(() => {
        console.log('[watch] build started')
      })
      build.onEnd((result) => {
        result.errors.forEach(({ text, location }) => {
          console.error(`✘ [ERROR] ${text}`)
          console.error(`    ${location.file}:${location.line}:${location.column}:`)
        })
        console.log('[watch] build finished')
      })
    }
  }
]

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs', // 输出依然保持 CommonJS，因为 VS Code 插件宿主对 CJS 支持最稳健
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: 'dist/extension.js',
    external: ['vscode'],
    logLevel: 'silent',
    plugins
  })

  if (watch) {
    await ctx.watch()
  } else {
    await ctx.rebuild()
    await ctx.dispose()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
