import { errors } from '@adonisjs/auth'
import { verifySignature } from '../verify_signature.ts'
import { isSiweChallengeValid } from '../siwe.ts'
import { normalizeAddress, type NonceStore } from '../contracts/nonce_store.ts'
import type { NormalizeConstructor } from '@adonisjs/core/types/helpers'
import type { BaseModel } from '@adonisjs/lucid/orm'

export interface Web3AuthFinderOptions {
  nonceStore: NonceStore
  walletAddressColumnName?: string
  autoCreate?: boolean
}

export function withWeb3AuthFinder(options: Web3AuthFinderOptions) {
  const { nonceStore, walletAddressColumnName = 'walletAddress', autoCreate = false } = options

  return <Model extends NormalizeConstructor<typeof BaseModel>>(superclass: Model) => {
    class Web3AuthFinderMixin extends superclass {
      static async verifyWeb3Credentials(
        this: Model,
        address: string,
        signature: `0x${string}`,
        nonce: string,
        email?: string
      ) {
        const normalized = normalizeAddress(address)

        const message = await nonceStore.consume(normalized, nonce)
        if (!message) {
          throw new errors.E_INVALID_CREDENTIALS('Invalid or expired nonce')
        }

        if (!isSiweChallengeValid(message, nonce)) {
          throw new errors.E_INVALID_CREDENTIALS('Invalid or expired challenge')
        }

        const isValid = await verifySignature({ address: normalized, message, signature })
        if (!isValid) {
          throw new errors.E_INVALID_CREDENTIALS('Invalid signature')
        }

        const query = (this as any).query().where(walletAddressColumnName, normalized)
        let user = await query.first()

        if (!user) {
          if (!autoCreate) {
            throw new errors.E_INVALID_CREDENTIALS('Unknown wallet address')
          }
          user = await (this as any).create({ [walletAddressColumnName]: normalized, email })
        }

        return user
      }
    }

    return Web3AuthFinderMixin
  }
}
