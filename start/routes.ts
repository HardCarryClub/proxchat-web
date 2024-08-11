/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import User from '#models/user'
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import env from '#start/env'
import transmit from '@adonisjs/transmit/services/main'

router
  .get('/', ({ auth, inertia }) => {
    if (!env.get('ALLOWED_USER_IDS').split(',').includes(auth.user!.userId)) {
      return inertia.render('errors/unauthorized')
    }

    const user = auth.user

    return inertia.render('home', {
      ...user?.$original,
    })
  })
  .as('home')
  .use(middleware.auth())

router.on('/login').renderInertia('auth/login').as('login')

router
  .get('/logout', ({ auth, response }) => {
    auth.use('web').logout()
    response.redirect().toRoute('home')
  })
  .use(middleware.auth())
  .as('logout')

router
  .get('/auth/discord/redirect', ({ ally }) => {
    return ally.use('discord').redirect()
  })
  .as('auth.discord.redirect')

router
  .get('/auth/discord/callback', async ({ ally, response, auth }) => {
    try {
      const discord = ally.use('discord')
      const discordUser = await discord.user()
      const user = {
        userId: discordUser.original.id,
        email: discordUser.original.email,
        username: discordUser.original.username,
        displayName: discordUser.original.global_name,
        avatar: discordUser.avatarUrl,
      }

      const dbUser = await User.firstOrCreate({ userId: user.userId }, user)

      await auth.use('web').login(dbUser)

      response.redirect().toRoute('home')
    } catch (error) {
      console.error(error)
      response.redirect().toRoute('home')
    }
  })
  .as('auth.discord.callback')

router
  .group(() => {
    router
      .post('log-line', ({ request, response }) => {
        const keyHeader = request.header('X-Master-Key')

        if (keyHeader !== env.get('MASTER_KEY')) {
          return response.unauthorized({ message: 'Unauthorized' })
        }

        const body = request.body()

        // console.log(body)

        if (!body.line) {
          return response.badRequest({ message: 'Missing line' })
        }

        const line = JSON.parse(body.line)

        transmit.broadcast('proxchat', line)

        return response.ok({ message: 'ok' })
      })
      .as('log-line')
  })
  .prefix('api')
  .as('api')
