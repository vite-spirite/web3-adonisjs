import { createSiweMessage, parseSiweMessage } from 'viem/siwe'
import { NONCE_TTL_SECONDS } from './contracts/nonce_store.ts'

export interface SiweChallengeParams {
  domain: string
  address: string
  uri?: string
  nonce: string
  chainId?: number
  statement?: string
  ttlSeconds?: number
}

/**
 * Builds an EIP-4361 (SIWE) message binding the nonce to the relying party.
 * The text is what the wallet displays and signs — it carries the domain,
 * chain, issuance and expiration so a signature cannot be replayed on
 * another site.
 */
export function buildSiweMessage(params: SiweChallengeParams): string {
  const { domain, address, nonce, chainId = 1, statement, ttlSeconds = NONCE_TTL_SECONDS } = params
  const uri = params.uri ?? `https://${domain}`

  const issuedAt = new Date()
  return createSiweMessage({
    address: address as `0x${string}`,
    chainId,
    domain,
    nonce,
    uri,
    version: '1',
    statement,
    issuedAt,
    expirationTime: new Date(issuedAt.getTime() + ttlSeconds * 1000),
  })
}

/**
 * Defense-in-depth check on a server-stored challenge message: the embedded
 * nonce must match and the message must not be past its expiration time.
 */
export function isSiweChallengeValid(message: string, nonce: string): boolean {
  let parsed: ReturnType<typeof parseSiweMessage>
  try {
    parsed = parseSiweMessage(message)
  } catch {
    return false
  }

  if (parsed.nonce !== nonce) {
    return false
  }

  if (parsed.expirationTime && parsed.expirationTime <= new Date()) {
    return false
  }

  return true
}
