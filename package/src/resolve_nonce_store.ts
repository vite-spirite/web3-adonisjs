import type { NonceStore } from './contracts/nonce_store.ts'
import { CacheNonceStore } from './stores/cache_nonce_store.ts'
import { DatabaseNonceStore } from './stores/database_nonce_store.ts'

export type NonceStrategy = 'cache' | 'db'

export function resolveNonceStore(strategy: NonceStrategy): NonceStore {
  switch (strategy) {
    case 'cache':
      return new CacheNonceStore()
    case 'db':
      return new DatabaseNonceStore()
  }

  throw new Error(
    `[web3-adonis] Invalid nonceStore strategy "${strategy}" in config/web3.ts. Expected "cache" or "database".`
  )
}
