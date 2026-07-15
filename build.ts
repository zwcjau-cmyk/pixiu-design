import tailwind from 'bun-plugin-tailwind'
import { $ } from 'bun'

const result = await Bun.build({
  entrypoints: ['./index.html', './storybook-ui.html'],
  outdir: './dist',
  target: 'browser',
  minify: true,
  plugins: [tailwind],
})

if (!result.success) {
  for (const log of result.logs) console.error(log)
  process.exit(1)
}

for (const output of result.outputs) {
  console.log(`${output.kind}: ${output.path}`)
}

await $`cp -R ./public/. ./dist/`

for (const htmlFile of ['index.html', 'storybook-ui.html']) {
  const path = `./dist/${htmlFile}`
  const html = await Bun.file(path).text()
  if (!html.includes('pixiu-env.js')) {
    await Bun.write(
      path,
      html.replace(
        '<div id="root"></div>',
        `<div id="root"></div>
    <script src="./pixiu-env.js"></script>`,
      ),
    )
  }
}
