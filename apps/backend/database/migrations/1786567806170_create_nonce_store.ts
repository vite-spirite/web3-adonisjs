import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'web3_nonces'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('address').notNullable()
      table.string('nonce').notNullable()
      table.timestamp('expires_at').notNullable()
      table.unique(['address'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
