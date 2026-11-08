import { test } from '@japa/runner'
import { DatabaseNonceStore } from '../src/stores/database_nonce_store.ts'
import { createTestDatabase } from '../test_helpers/database.ts'

const options = { siwe: { domain: 'example.com' } }

const ADDR_A = '0x1111111111111111111111111111111111111111'
const ADDR_B = '0x2222222222222222222222222222222222222222'
const ADDR_C = '0x3333333333333333333333333333333333333333'
const ADDR_D = '0x4444444444444444444444444444444444444444'
const ADDR_MIXED = '0xF39FF6EB72863D3A0A483B7EA0E6B5B25A5F7E33'
const ADDR_EXPIRED = '0x5555555555555555555555555555555555555555'
const ADDR_VALID = '0x7777777777777777777777777777777777777777'
const ADDR_UNKNOWN = '0x6666666666666666666666666666666666666666'

test.group('DatabaseNonceStore', (group) => {
  let db: Awaited<ReturnType<typeof createTestDatabase>>
  let store: DatabaseNonceStore

  group.each.setup(async () => {
    db = await createTestDatabase()
    store = new DatabaseNonceStore(db, options)
  })

  group.each.teardown(async () => {
    await db.manager.closeAll()
  })

  test('generates a challenge binding the message to the domain and nonce', async ({ assert }) => {
    const challenge = await store.generate(ADDR_A)

    assert.isString(challenge.nonce)
    assert.isString(challenge.message)
    assert.include(challenge.message, 'example.com')
    assert.include(challenge.message, `Nonce: ${challenge.nonce}`)
  })

  test('consumes a valid nonce and returns the stored message', async ({ assert }) => {
    const { nonce, message } = await store.generate(ADDR_A)
    const result = await store.consume(ADDR_A, nonce)

    assert.strictEqual(result, message)
  })

  test('rejects an already consumed nonce (single use)', async ({ assert }) => {
    const { nonce } = await store.generate(ADDR_B)
    await store.consume(ADDR_B, nonce)

    const secondAttempt = await store.consume(ADDR_B, nonce)
    assert.isNull(secondAttempt)
  })

  test('rejects a wrong nonce for a valid address', async ({ assert }) => {
    await store.generate(ADDR_C)
    const result = await store.consume(ADDR_C, 'wrong-nonce')

    assert.isNull(result)
  })

  test('rejects a nonce for an unknown address', async ({ assert }) => {
    const result = await store.consume(ADDR_UNKNOWN, 'some-nonce')

    assert.isNull(result)
  })

  test('regenerating a challenge for the same address invalidates the previous one', async ({
    assert,
  }) => {
    const first = await store.generate(ADDR_D)
    const second = await store.generate(ADDR_D)

    const firstAttempt = await store.consume(ADDR_D, first.nonce)
    assert.isNull(firstAttempt)

    const secondAttempt = await store.consume(ADDR_D, second.nonce)
    assert.strictEqual(secondAttempt, second.message)
  })

  test('normalizes address casing (checksum vs lowercase)', async ({ assert }) => {
    const { nonce, message } = await store.generate(ADDR_MIXED)
    const result = await store.consume(ADDR_MIXED.toLowerCase(), nonce)

    assert.strictEqual(result, message)
  })

  test('rejects an expired nonce', async ({ assert }) => {
    const shortLived = new DatabaseNonceStore(db, { ...options, ttlSeconds: -1 })
    const { nonce } = await shortLived.generate(ADDR_EXPIRED)

    assert.isNull(await shortLived.consume(ADDR_EXPIRED, nonce))
  })

  test('cleanup deletes expired challenges and keeps valid ones', async ({ assert }) => {
    const shortLived = new DatabaseNonceStore(db, { ...options, ttlSeconds: -1 })
    await shortLived.generate(ADDR_EXPIRED)
    const { nonce } = await store.generate(ADDR_VALID)

    assert.strictEqual(await store.cleanup(), 1)
    assert.isNull(await store.consume(ADDR_EXPIRED, 'whatever'))
    assert.isString(await store.consume(ADDR_VALID, nonce))
  })
})
