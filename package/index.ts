/*
|--------------------------------------------------------------------------
| Package entrypoint
|--------------------------------------------------------------------------
|
| Export values from the package entrypoint as you see fit.
|
*/

export { configure } from './configure.ts'
export { stubsRoot } from './stubs/main.ts'
export { defineConfig } from './src/define_config.ts'
export type { Web3Config } from './src/types.ts'
export { resolveNonceStore, type NonceStrategy } from './src/resolve_nonce_store.ts'
export {
  withWeb3AuthFinder,
  type Web3AuthFinderOptions,
} from './src/mixins/with_web3_auth_finder.ts'
export { verifySignature, type VerifySignatureOptions } from './src/verify_signature.ts'
export { buildSiweMessage, isSiweChallengeValid, type SiweChallengeParams } from './src/siwe.ts'
export {
  normalizeAddress,
  NONCE_TTL_SECONDS,
  type NonceStore,
  type NonceChallenge,
  type NonceStoreOptions,
  type SiweOptions,
} from './src/contracts/nonce_store.ts'
export { generateSiweNonce } from 'viem/siwe'
export { CacheNonceStore } from './src/stores/cache_nonce_store.ts'
export { DatabaseNonceStore } from './src/stores/database_nonce_store.ts'
