import transmit from '@adonisjs/transmit/services/main'
import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'

transmit.authorizeChannel('proxchat', async (ctx: HttpContext) => {
  if (!(await ctx.auth.check())) {
    return false
  }

  return env.get('ALLOWED_USER_IDS').split(',').includes(ctx.auth!.user!.userId)
})
