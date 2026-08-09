import { BentoCache, bentostore } from 'bentocache'
import { memoryDriver } from 'bentocache/drivers/memory'

export function createTestCache() {
  const bento = new BentoCache({
    default: 'testCache',
    stores: {
      testCache: bentostore().useL1Layer(memoryDriver({ maxSize: '10mb' })),
    },
  })

  return bento
}
