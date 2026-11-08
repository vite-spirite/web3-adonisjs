import type { Database } from '@adonisjs/lucid/database'
import type { NonceChallenge, NonceStore, NonceStoreOptions } from '../contracts/nonce_store.ts'
import { DateTime } from 'luxon'
import { generateSiweNonce } from 'viem/siwe'
import { normalizeAddress, resolveOptions } from '../contracts/nonce_store.ts'
import { buildSiweMessage } from '../siwe.ts'

export class DatabaseNonceStore implements NonceStore {
  #db: Database
  #options?: NonceStoreOptions

  constructor(db?: Database, options?: NonceStoreOptions) {
    this.#db = db as Database
    this.#options = options
  }

  async #getDb(): Promise<Database> {
    if (this.#db) return this.#db
    const { default: db } = await import('@adonisjs/lucid/services/db')
    return db
  }

  async generate(address: string): Promise<NonceChallenge> {
    const db = await this.#getDb()
    const { ttlSeconds, siwe } = resolveOptions(this.#options)

    const normalized = normalizeAddress(address)
    const nonce = generateSiweNonce()
    const message = buildSiweMessage({ ...siwe, address: normalized, nonce, ttlSeconds })
    const expiresAt = DateTime.now().plus({ second: ttlSeconds })

    await db
      .table('web3_nonces')
      .insert({
        address: normalized,
        nonce,
        message,
        expires_at: expiresAt.toSQL(),
      })
      .onConflict('address')
      .merge()

    return { nonce, message }
  }

  async consume(address: string, nonce: string): Promise<string | null> {
    const db = await this.#getDb()
    const normalized = normalizeAddress(address)

    const row = await db
      .from('web3_nonces')
      .where('address', normalized)
      .where('nonce', nonce)
      .where('expires_at', '>', DateTime.now().toSQL())
      .first()

    if (!row) return null

    await db.from('web3_nonces').where('address', normalized).delete()

    return row.message as string
  }

  async cleanup(): Promise<number> {
    const db = await this.#getDb()

    const deleted = await db
      .from('web3_nonces')
      .where('expires_at', '<=', DateTime.now().toSQL())
      .delete()

    return typeof deleted === 'number' ? deleted : deleted.length
  }
}
