import app from '@adonisjs/core/services/app'

/**
 * Nonce store shared by the web3 routes and the `withWeb3AuthFinder` mixin.
 *
 * Resolved straight from the container: providers are registered before
 * preload files (models, routes) are imported, so the singleton is ready
 * here. Do NOT gate this behind `app.booted()` — mixins capture the value
 * at import time and awaiting boot from a preload would hang the boot.
 */
const nonceStore = await app.container.make('web3.nonceStore')

export { nonceStore as default }
