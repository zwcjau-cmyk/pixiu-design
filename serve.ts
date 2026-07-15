import index from './dist/index.html'
import storybook from './dist/storybook-ui.html'

Bun.serve({
  hostname: '0.0.0.0',
  port: Number(Bun.env.PORT || 4173),
  routes: {
    '/': index,
    '/storybook-ui.html': storybook,
    '/images/*': request => {
      const path = decodeURIComponent(new URL(request.url).pathname)
      return new Response(Bun.file(`./dist${path}`))
    },
  },
})

console.log(`Preview ready at http://localhost:${Bun.env.PORT || 4173}`)
