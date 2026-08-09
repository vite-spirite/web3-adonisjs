import type { Database } from '@adonisjs/lucid/database'
import type { NonceStore } from '../contracts/nonce_store.ts'
import { DateTime } from 'luxon'
import { NONCE_TTL_SECONDS, normalizeAddress, randomUUID } from '../contracts/nonce_store.ts'

export class DatabaseNonceStore implements NonceStore {
  #db: Database

  constructor(db?: Database) {
    this.#db = db as Database
  }

  async #getDb(): Promise<Database> {
    if (this.#db) return this.#db
    const { default: db } = await import('@adonisjs/lucid/services/db')
    return db
  }

  async generate(address: string): Promise<string> {
    const db = await this.#getDb()
    const nonce = randomUUID()
    const expiresAt = DateTime.now().plus({ second: NONCE_TTL_SECONDS })

    await db
      .table('web3_nonces')
      .insert({
        address: normalizeAddress(address),
        nonce,
        expires_at: expiresAt.toSQL(),
      })
      .onConflict('address')
      .merge()

    return nonce
  }

  async consume(address: string, nonce: string): Promise<boolean> {
    const db = await this.#getDb()
    const normalized = normalizeAddress(address)

    const row = await db
      .from('web3_nonces')
      .where('address', normalized)
      .where('nonce', nonce)
      .where('expires_at', '>', DateTime.now().toSQL())
      .first()

    if (!row) return false

    await db.from('web3_nonces').where('address', normalized).delete()

    return true
  }
}
