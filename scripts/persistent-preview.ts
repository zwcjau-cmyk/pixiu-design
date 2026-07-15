const root = '/private/tmp/pixiu-storybook-preview/dist'
const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
}

Bun.serve({
  hostname: '127.0.0.1',
  port: 4174,
  async fetch(request) {
    const url = new URL(request.url)
    const pathname = decodeURIComponent(url.pathname === '/' ? '/storybook-ui.html' : url.pathname)

    if (pathname.includes('..')) return new Response('Not found', { status: 404 })

    const file = Bun.file(`${root}${pathname}`)
    if (!(await file.exists())) return new Response('Not found', { status: 404 })
    const extension = pathname.match(/\.[^.\/]+$/)?.[0].toLowerCase() || ''
    return new Response(file, {
      headers: { 'Content-Type': contentTypes[extension] || 'application/octet-stream' },
    })
  },
})

console.log('Persistent preview ready at http://localhost:4174/storybook-ui.html')
