import { test } from '@japa/runner'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { withWeb3AuthFinder } from '../src/mixins/with_web3_auth_finder.ts'
import { buildSiweMessage } from '../src/siwe.ts'
import type { NonceChallenge, NonceStore } from '../src/contracts/nonce_store.ts'

const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f3ff80'

class FakeNonceStore implements NonceStore {
  challenges = new Map<string, NonceChallenge>()

  async generate(address: string): Promise<NonceChallenge> {
    const normalized = address.toLowerCase()
    const nonce = `noncefor${normalized.replace('0x', '')}`
    const challenge = {
      nonce,
      message: buildSiweMessage({ domain: 'example.com', address, nonce }),
    }
    this.challenges.set(normalized, challenge)
    return challenge
  }

  async consume(address: string, nonce: string): Promise<string | null> {
    const challenge = this.challenges.get(address.toLowerCase())
    if (!challenge || challenge.nonce !== nonce) return null
    this.challenges.delete(address.toLowerCase())
    return challenge.message
  }

  async cleanup(): Promise<number> {
    return 0
  }
}

type FakeUserRow = { id: number; walletAddress: string; email?: string }

function createUserModel(nonceStore: NonceStore, autoCreate: boolean) {
  const rows = new Map<string, FakeUserRow>()

  class FakeUser {
    static query() {
      return {
        where(_column: string, value: string) {
          return { first: async () => rows.get(value) ?? null }
        },
      }
    }

    static async create(data: { walletAddress: string; email?: string }) {
      const row = { id: rows.size + 1, ...data }
      rows.set(data.walletAddress, row)
      return row
    }
  }

  const mixin = withWeb3AuthFinder({ nonceStore, autoCreate })
  return mixin(FakeUser as any) as any
}

async function signChallenge(account: ReturnType<typeof privateKeyToAccount>) {
  const store = new FakeNonceStore()
  const { nonce, message } = await store.generate(account.address)
  const signature = await account.signMessage({ message })
  return { store, nonce, message, signature }
}

test.group('withWeb3AuthFinder', () => {
  test('returns the existing user for a valid signature', async ({ assert }) => {
    const account = privateKeyToAccount(TEST_PRIVATE_KEY)
    const { store, nonce, signature } = await signChallenge(account)
    const User = createUserModel(store, false)
    await User.create({ walletAddress: account.address.toLowerCase() })

    const user = await User.verifyWeb3Credentials(account.address, signature, nonce)

    assert.strictEqual(user.walletAddress, account.address.toLowerCase())
  })

  test('auto-creates the user on first login when enabled', async ({ assert }) => {
    const account = privateKeyToAccount(TEST_PRIVATE_KEY)
    const { store, nonce, signature } = await signChallenge(account)
    const User = createUserModel(store, true)

    const user = await User.verifyWeb3Credentials(
      account.address,
      signature,
      nonce,
      'new@example.com'
    )

    assert.strictEqual(user.walletAddress, account.address.toLowerCase())
    assert.strictEqual(user.email, 'new@example.com')
  })

  test('rejects an unknown wallet when autoCreate is disabled', async ({ assert }) => {
    const account = privateKeyToAccount(TEST_PRIVATE_KEY)
    const { store, nonce, signature } = await signChallenge(account)
    const User = createUserModel(store, false)

    const error = await User.verifyWeb3Credentials(account.address, signature, nonce).catch(
      (e: any) => e
    )

    assert.strictEqual(error.code, 'E_INVALID_CREDENTIALS')
  })

  test('rejects an unknown or already consumed nonce', async ({ assert }) => {
    const account = privateKeyToAccount(TEST_PRIVATE_KEY)
    const { store, nonce, signature } = await signChallenge(account)
    const User = createUserModel(store, true)

    await User.verifyWeb3Credentials(account.address, signature, nonce)

    const replay = await User.verifyWeb3Credentials(account.address, signature, nonce).catch(
      (e: any) => e
    )
    assert.strictEqual(replay.code, 'E_INVALID_CREDENTIALS')
    assert.strictEqual(store.challenges.size, 0)
  })

  test('rejects a signature made for a different message', async ({ assert }) => {
    const account = privateKeyToAccount(TEST_PRIVATE_KEY)
    const store = new FakeNonceStore()
    const { nonce } = await store.generate(account.address)
    const otherSignature = await account.signMessage({ message: 'something else' })
    const User = createUserModel(store, true)

    const error = await User.verifyWeb3Credentials(account.address, otherSignature, nonce).catch(
      (e: any) => e
    )

    assert.strictEqual(error.code, 'E_INVALID_CREDENTIALS')
  })

  test('rejects a signature from a different wallet', async ({ assert }) => {
    const account = privateKeyToAccount(TEST_PRIVATE_KEY)
    const attacker = privateKeyToAccount(generatePrivateKey())
    const store = new FakeNonceStore()
    const { nonce, message } = await store.generate(account.address)
    const attackerSignature = await attacker.signMessage({ message })
    const User = createUserModel(store, true)

    const error = await User.verifyWeb3Credentials(account.address, attackerSignature, nonce).catch(
      (e: any) => e
    )

    assert.strictEqual(error.code, 'E_INVALID_CREDENTIALS')
  })
})
