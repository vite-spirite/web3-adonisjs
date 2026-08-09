import { Database } from '@adonisjs/lucid/database'
import { Application } from '@adonisjs/core/app'
import { Logger } from '@adonisjs/core/logger'
import { Emitter } from '@adonisjs/core/events'

export async function createTestDatabase() {
  const app = new Application(new URL('./', import.meta.url), {
    environment: 'test',
  })
  await app.init()

  const emitter = new Emitter(app)
  const logger = new Logger({})

  const db = new Database(
    {
      connection: 'sqlite',
      connections: {
        sqlite: {
          client: 'better-sqlite3', // ou 'sqlite3' selon ce que tu as installé
          connection: { filename: ':memory:' },
          useNullAsDefault: true,
        },
      },
    },
    logger,
    emitter
  )

  // Créer la table directement, sans passer par le système de migration complet
  await db.connection().schema.createTable('web3_nonces', (table) => {
    table.increments('id')
    table.string('address').notNullable()
    table.string('nonce').notNullable()
    table.timestamp('expires_at').notNullable()
    table.unique(['address'])
  })

  return db
}
