export interface NonceChallenge {
  nonce: string
  message: string
}

export interface SiweOptions {
  domain: string
  uri?: string
  chainId?: number
  statement?: string
}

export interface NonceStoreOptions {
  ttlSeconds?: number
  siwe?: SiweOptions
}

export interface NonceStore {
  generate(address: string): Promise<NonceChallenge>
  consume(address: string, nonce: string): Promise<string | null>
  cleanup(): Promise<number>
}

const NONCE_TTL_SECONDS = 5 * 60

const DEFAULT_SIWE_OPTIONS: SiweOptions = { domain: 'localhost' }

function normalizeAddress(address: string) {
  return address.toLowerCase()
}

function resolveOptions(options?: NonceStoreOptions) {
  return {
    ttlSeconds: options?.ttlSeconds ?? NONCE_TTL_SECONDS,
    siwe: { ...DEFAULT_SIWE_OPTIONS, ...options?.siwe },
  }
}

export { normalizeAddress, resolveOptions, NONCE_TTL_SECONDS }
