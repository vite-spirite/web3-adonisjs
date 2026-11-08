# web3-auth-adonisjs

Sign-in with Ethereum for AdonisJS v6. Wallets authenticate by signing an [EIP-4361 (SIWE)](https://eips.ethereum.org/EIPS/eip-4361) challenge: the server issues a single-use nonce bound to its domain, the user signs it, the server verifies the signature with [viem](https://viem.sh) and logs the user in.

## Install

```sh
node ace configure @vite-spirite/web3-auth-adonisjs
```

This publishes `config/web3.ts`, three migrations (`web3_nonces` table, nullable `password`, `wallet_address`) and registers the provider. Then run migrations:

```sh
node ace migration:run
```

## Config

```ts
// config/web3.ts
import { defineConfig } from '@vite-spirite/web3-auth-adonisjs'

export default defineConfig({
  strategy: 'db', // 'db' or 'cache'
  ttlSeconds: 300, // challenge lifetime, default 5 minutes
  siwe: {
    domain: 'myapp.com', // requesting authority shown in the wallet
    uri: 'https://myapp.com/login', // defaults to https://<domain>
    chainId: 1, // defaults to 1
    statement: 'Sign in to MyApp', // optional line shown in the wallet
  },
})
```

`strategy: 'db'` persists challenges in the `web3_nonces` table (works across instances). `strategy: 'cache'` uses the [AdonisJS cache](https://docs.adonisjs.com/guides/cache) (needs the cache provider). Expired `db` rows can be purged with `nonceStore.cleanup()` (returns the deleted count) — call it from a scheduler.

## User model

Compose the mixin into your Lucid model. Keep `withAuthFinder` if you also want email/password login:

```ts
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { withWeb3AuthFinder } from '@vite-spirite/web3-auth-adonisjs'
import nonceStore from '@vite-spirite/web3-auth-adonisjs/services/main'

const Web3AuthFinder = withWeb3AuthFinder({ nonceStore, autoCreate: true })

export default class User extends compose(BaseModel, withAuthFinder(hash), Web3AuthFinder) {
  // needs a `walletAddress` column (see published migration)
}
```

`verifyWeb3Credentials(address, signature, nonce, email?)` consumes the nonce (single use), checks the signature against the stored SIWE message, then finds the user by wallet address — or creates them when `autoCreate` is on (the optional `email` is used at creation). Failures throw `E_INVALID_CREDENTIALS`.

## Routes

```ts
router.get('/web3/nonce', async ({ request, response }) => {
  const address = request.qs().address
  const nonceStore = await app.container.make('web3.nonceStore')
  // { nonce, message } — have the wallet sign `message`
  return response.json(await nonceStore.generate(address))
})

router.post('/web3/login', async ({ request, auth }) => {
  const { address, signature, nonce, email } = request.only([
    'address',
    'signature',
    'nonce',
    'email',
  ])
  const user = await User.verifyWeb3Credentials(address, signature, nonce, email)
  await auth.use('web').login(user)
  return user
})
```

## API

- `buildSiweMessage({ domain, address, uri?, nonce, chainId?, statement?, ttlSeconds? })` — EIP-4361 text.
- `verifySignature({ address, message, signature })` — `Promise<boolean>` via viem.
- `generateSiweNonce()` — SIWE-compliant nonce (re-exported from viem).
- `isSiweChallengeValid(message, nonce)` — nonce-match + expiration check.
- `resolveNonceStore(strategy, { ttlSeconds?, siwe? })` — build a store manually.
- `CacheNonceStore`, `DatabaseNonceStore` — implement `NonceStore` (`generate`, `consume`, `cleanup`).

## Security notes

- Challenges are single-use and expire (`ttlSeconds`, default 5 min).
- The signed message embeds your `domain` (plus chain, issuance and expiration), so a signature cannot be replayed on another site — keep `domain` exact.
- The `db` strategy is recommended for multi-instance deployments.

## Testing

```sh
npm run quick:test # japa, no lint/coverage
npm test # lint + coverage
```
