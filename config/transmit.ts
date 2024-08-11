import { defineConfig } from '@adonisjs/transmit'

export default defineConfig({
  pingInterval: false,
  transport: null,
  async routeHandlerModifier(route) {
    if (route.getPattern() === '__transmit/events') {
      // route.use(middleware.auth())
      route.use(async (ctx, next) => {
        if (await ctx.auth.check()) {
          next()
        } else {
          ctx.response.unauthorized({ message: 'Unauthorized' })
        }
      })

      return
    }
  },
})
