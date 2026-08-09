import { test } from '@japa/runner'
import { CacheNonceStore } from '../src/stores/cache_nonce_store.ts'
import { createTestCache } from '../test_helpers/cache.ts'

test.group('CacheNonceStore', (group) => {
  let cache: ReturnType<typeof createTestCache>
  let store: CacheNonceStore

  group.each.setup(() => {
    cache = createTestCache()
    store = new CacheNonceStore(cache)
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
})
