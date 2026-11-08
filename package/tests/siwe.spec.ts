import { test } from '@japa/runner'
import { privateKeyToAccount } from 'viem/accounts'
import { buildSiweMessage, isSiweChallengeValid } from '../src/siwe.ts'
import { verifySignature } from '../src/verify_signature.ts'

const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f3ff80'
const ADDRESS = '0xf39Ff6eB72863D3A0a483B7Ea0e6B5B25A5F7E33'

test.group('buildSiweMessage', () => {
  test('produces an EIP-4361 message bound to domain, address and nonce', ({ assert }) => {
    const message = buildSiweMessage({ domain: 'example.com', address: ADDRESS, nonce: 'abc12345' })

    assert.include(message, 'example.com wants you to sign in with your Ethereum account')
    assert.include(message, 'URI: https://example.com')
    assert.include(message, 'Chain ID: 1')
    assert.include(message, 'Nonce: abc12345')
    assert.include(message, 'Issued At:')
    assert.include(message, 'Expiration Time:')
  })

  test('honours chainId, uri and statement overrides', ({ assert }) => {
    const message = buildSiweMessage({
      domain: 'example.com',
      address: ADDRESS,
      nonce: 'abc12345',
      chainId: 8453,
      uri: 'https://app.example.com/login',
      statement: 'Welcome, please sign in',
    })

    assert.include(message, 'Welcome, please sign in')
    assert.include(message, 'URI: https://app.example.com/login')
    assert.include(message, 'Chain ID: 8453')
  })

  test('roundtrips through wallet signing and verification', async ({ assert }) => {
    const account = privateKeyToAccount(TEST_PRIVATE_KEY)
    const message = buildSiweMessage({
      domain: 'example.com',
      address: account.address,
      nonce: 'roundtrip01',
    })
    const signature = await account.signMessage({ message })

    assert.isTrue(await verifySignature({ address: account.address, message, signature }))
  })
})

test.group('isSiweChallengeValid', () => {
  test('accepts a fresh challenge with a matching nonce', ({ assert }) => {
    const message = buildSiweMessage({
      domain: 'example.com',
      address: ADDRESS,
      nonce: 'freshnonce',
    })

    assert.isTrue(isSiweChallengeValid(message, 'freshnonce'))
  })

  test('rejects a mismatched nonce', ({ assert }) => {
    const message = buildSiweMessage({
      domain: 'example.com',
      address: ADDRESS,
      nonce: 'expected01',
    })

    assert.isFalse(isSiweChallengeValid(message, 'othernonce'))
  })

  test('rejects an expired challenge', ({ assert }) => {
    const message = buildSiweMessage({
      domain: 'example.com',
      address: ADDRESS,
      nonce: 'oldnonce01',
      ttlSeconds: -1,
    })

    assert.isFalse(isSiweChallengeValid(message, 'oldnonce01'))
  })

  test('rejects a non-SIWE message', ({ assert }) => {
    assert.isFalse(isSiweChallengeValid('just some text', 'whatever'))
  })
})
