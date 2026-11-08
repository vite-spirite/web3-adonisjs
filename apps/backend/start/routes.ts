/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import app from '@adonisjs/core/services/app'
import User from '#models/user'

// start/routes.ts
router.get('/web3/nonce', async ({ request, response }) => {
  const address = request.qs().address
  if (!address) {
    return response.badRequest({ message: 'Missing address query parameter' })
  }

  const nonceStore = await app.container.make('web3.nonceStore')
  const nonce = await nonceStore.generate(address)
  return response.json({ nonce })
})

router.post('/web3/login', async ({ request, auth }) => {
  const { address, signature, nonce, email } = request.only([
    'address',
    'signature',
    'nonce',
    'email',
  ])
  const user = await User.verifyWeb3Credentials(address, signature, nonce, email)
  await auth.use('web').login(user)
  return user
})

router
  .get('/me', async ({ auth }) => {
    return auth.user
  })
  .use(middleware.auth())
