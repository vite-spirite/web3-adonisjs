import type { NonceChallenge, NonceStore, NonceStoreOptions } from '../contracts/nonce_store.ts'
import { generateSiweNonce } from 'viem/siwe'
import { normalizeAddress, resolveOptions } from '../contracts/nonce_store.ts'
import { buildSiweMessage } from '../siwe.ts'

type CacheLike = {
  set(opts: { key: string; value: unknown; ttl?: number | undefined }): Promise<unknown>
  get(opts: { key: string }): Promise<unknown>
  delete(opts: { key: string }): Promise<unknown>
}

export class CacheNonceStore implements NonceStore {
  #cache: CacheLike
  #options?: NonceStoreOptions

  constructor(cache?: CacheLike, options?: NonceStoreOptions) {
    this.#cache = cache as CacheLike
    this.#options = options
  }

  async #getCache(): Promise<CacheLike> {
    if (this.#cache) return this.#cache
    const { default: cache } = await import('@adonisjs/cache/services/main')
    return cache
  }

  async generate(address: string): Promise<NonceChallenge> {
    const cache = await this.#getCache()
    const { ttlSeconds, siwe } = resolveOptions(this.#options)

    const normalized = normalizeAddress(address)
    const nonce = generateSiweNonce()
    const message = buildSiweMessage({ ...siwe, address: normalized, nonce, ttlSeconds })

    await cache.set({
      key: `web3-auth-nonce:${normalized}`,
      value: { nonce, message },
      // BentoCache expects milliseconds
      ttl: ttlSeconds * 1000,
    })

    return { nonce, message }
  }

  async consume(address: string, nonce: string): Promise<string | null> {
    const cache = await this.#getCache()

    const key = `web3-auth-nonce:${normalizeAddress(address)}`
    const stored = (await cache.get({ key })) as { nonce: string; message: string } | null

    if (!stored || stored.nonce !== nonce) return null

    await cache.delete({ key })
    return stored.message
  }

  async cleanup(): Promise<number> {
    return 0
  }
}
