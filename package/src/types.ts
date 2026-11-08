import type { SiweOptions } from './contracts/nonce_store.ts'

export type Web3Config = {
  strategy: 'cache' | 'db'
  ttlSeconds?: number
  siwe: SiweOptions
}
