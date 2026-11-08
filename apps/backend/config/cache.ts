import { defineConfig, store, drivers } from '@adonisjs/cache'
import type { InferStores } from '@adonisjs/cache/types'

const cacheConfig = defineConfig({
  default: 'memoryOnly',

  stores: {
    memoryOnly: store().useL1Layer(drivers.memory()),
  },
})

export default cacheConfig

declare module '@adonisjs/cache/types' {
  interface CacheStores extends InferStores<typeof cacheConfig> {}
}
