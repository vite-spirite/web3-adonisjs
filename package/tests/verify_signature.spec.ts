import { test } from '@japa/runner'
import { privateKeyToAccount } from 'viem/accounts'
import { verifySignature } from '../src/verify_signature.ts'

const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f3ff80'
const MESSAGE = 'Sign in to example.com'

test.group('verifySignature', () => {
  test('returns true for a valid signature', async ({ assert }) => {
    const account = privateKeyToAccount(TEST_PRIVATE_KEY)
    const signature = await account.signMessage({ message: MESSAGE })

    const result = await verifySignature({
      address: account.address,
      message: MESSAGE,
      signature,
    })

    assert.isTrue(result)
  })

  test('returns false for an invalid signature', async ({ assert }) => {
    const account = privateKeyToAccount(TEST_PRIVATE_KEY)

    const result = await verifySignature({
      address: account.address,
      message: MESSAGE,
      signature: '0xdeadbeef' as `0x${string}`,
    })

    assert.isFalse(result)
  })

  test('returns false for a malformed address', async ({ assert }) => {
    const result = await verifySignature({
      address: 'not-an-address',
      message: 'test',
      signature: '0xdeadbeef' as `0x${string}`,
    })

    assert.isFalse(result)
  })

  test('returns false when the signature matches a different message', async ({ assert }) => {
    const account = privateKeyToAccount(TEST_PRIVATE_KEY)
    const signature = await account.signMessage({ message: 'message-A' })

    const result = await verifySignature({
      address: account.address,
      message: 'message-B', // message différent
      signature,
    })

    assert.isFalse(result)
  })
})
