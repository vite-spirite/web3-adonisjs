import { test } from '@japa/runner'
import { DatabaseNonceStore } from '../src/stores/database_nonce_store.ts'
import { createTestDatabase } from '../test_helpers/database.ts'

test.group('DatabaseNonceStore', (group) => {
  let db: Awaited<ReturnType<typeof createTestDatabase>>
  let store: DatabaseNonceStore

  group.each.setup(async () => {
    db = await createTestDatabase()
    store = new DatabaseNonceStore(db)
  })

  group.each.teardown(async () => {
    await db.manager.closeAll()
  })

  test('generates and consumes a valid nonce', async ({ assert }) => {
    const nonce = await store.generate('0xABC123')
    const result = await store.consume('0xabc123', nonce)

    assert.isTrue(result)
  })

  test('rejects an already consumed nonce (single use)', async ({ assert }) => {
    const nonce = await store.generate('0xDEF456')
    await store.consume('0xDEF456', nonce)

    const secondAttempt = await store.consume('0xDEF456', nonce)
    assert.isFalse(secondAttempt)
  })

  test('rejects a wrong nonce for a valid address', async ({ assert }) => {
    await store.generate('0x111222')
    const result = await store.consume('0x111222', 'wrong-nonce')

    assert.isFalse(result)
  })

  test('rejects a nonce for an unknown address', async ({ assert }) => {
    const result = await store.consume('0xNEVERGENERATED', 'some-nonce')

    assert.isFalse(result)
  })

  test('regenerating a nonce for the same address invalidates the previous one', async ({
    assert,
  }) => {
    const firstNonce = await store.generate('0x999888')
    const secondNonce = await store.generate('0x999888')

    const firstAttempt = await store.consume('0x999888', firstNonce)
    assert.isFalse(firstAttempt)

    const secondAttempt = await store.consume('0x999888', secondNonce)
    assert.isTrue(secondAttempt)
  })

  test('normalizes address casing (checksum vs lowercase)', async ({ assert }) => {
    const nonce = await store.generate('0xAbCdEf1234567890')
    const result = await store.consume('0xabcdef1234567890', nonce)

    assert.isTrue(result)
  })
})
