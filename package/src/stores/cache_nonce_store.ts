import type { NonceStore } from '../contracts/nonce_store.ts'
import { randomUUID, normalizeAddress, NONCE_TTL_SECONDS } from '../contracts/nonce_store.ts'

type CacheLike = {
  set(opts: { key: string; value: unknown; ttl?: number }): Promise<unknown>
  get(opts: { key: string }): Promise<unknown>
  delete(opts: { key: string }): Promise<unknown>
}

export class CacheNonceStore implements NonceStore {
  #cache: CacheLike

  constructor(cache?: CacheLike) {
    this.#cache = cache as CacheLike
  }

  async #getCache(): Promise<CacheLike> {
    if (this.#cache) return this.#cache
    const { default: cache } = await import('@adonisjs/cache/services/main')
    return cache
  }

  async generate(address: string): Promise<string> {
    const cache = await this.#getCache()
    const nonce = randomUUID()

    cache.set({
      key: `web3-auth-nonce:${normalizeAddress(address)}`,
      value: nonce,
      ttl: NONCE_TTL_SECONDS,
    })

    return nonce
  }

  async consume(address: string, nonce: string): Promise<boolean> {
    const cache = await this.#getCache()

    const key = `web3-auth-nonce:${normalizeAddress(address)}`
    const stored = await cache.get({ key })

    if (stored !== nonce) return false

    await cache.delete({ key })
    return true
  }
}
