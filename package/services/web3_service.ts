import app from '@adonisjs/core/services/app'
import type { NonceStore } from '../src/contracts/nonce_store.ts'

let nonceStore: NonceStore

await app.booted(async () => {
  nonceStore = await app.container.make('web3.nonceStore')
})

export { nonceStore as default }
