import { randomUUID } from 'node:crypto'

export interface NonceStore {
  generate(address: string): Promise<string>
  consume(address: string, nonce: string): Promise<boolean>
}

const NONCE_TTL_SECONDS = 5 * 60

function normalizeAddress(address: string) {
  return address.toLowerCase()
}

export { randomUUID, normalizeAddress, NONCE_TTL_SECONDS }
