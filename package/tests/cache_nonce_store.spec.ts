import { test } from '@japa/runner'
import { setTimeout as sleep } from 'node:timers/promises'
import { CacheNonceStore } from '../src/stores/cache_nonce_store.ts'
import { createTestCache } from '../test_helpers/cache.ts'

const options = { siwe: { domain: 'example.com' } }

const ADDR_A = '0x1111111111111111111111111111111111111111'
const ADDR_B = '0x2222222222222222222222222222222222222222'
const ADDR_C = '0x3333333333333333333333333333333333333333'
const ADDR_D = '0x4444444444444444444444444444444444444444'
const ADDR_E = '0x5555555555555555555555555555555555555555'
const ADDR_UNKNOWN = '0x6666666666666666666666666666666666666666'

test.group('CacheNonceStore', (group) => {
  let cache: ReturnType<typeof createTestCache>
  let store: CacheNonceStore

  group.each.setup(() => {
    cache = createTestCache()
    store = new CacheNonceStore(cache, options)
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

  test('rejects an expired challenge', async ({ assert }) => {
    const shortLived = new CacheNonceStore(cache, { ...options, ttlSeconds: 1 })
    const { nonce } = await shortLived.generate(ADDR_E)

    await sleep(1200)

    assert.isNull(await shortLived.consume(ADDR_E, nonce))
  })

  test('cleanup is a no-op, expiry is owned by the cache driver', async ({ assert }) => {
    assert.strictEqual(await store.cleanup(), 0)
  })
})
