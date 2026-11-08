import type { NonceStore, NonceStoreOptions } from './contracts/nonce_store.ts'
import { CacheNonceStore } from './stores/cache_nonce_store.ts'
import { DatabaseNonceStore } from './stores/database_nonce_store.ts'

export type NonceStrategy = 'cache' | 'db'

export function resolveNonceStore(
  strategy: NonceStrategy,
  options?: NonceStoreOptions
): NonceStore {
  switch (strategy) {
    case 'cache':
      return new CacheNonceStore(undefined, options)
    case 'db':
      return new DatabaseNonceStore(undefined, options)
  }

  throw new Error(
    `[web3-auth-adonisjs] Invalid nonceStore strategy "${strategy}" in config/web3.ts. Expected "cache" or "db".`
  )
}
