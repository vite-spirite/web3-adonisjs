import { errors } from '@adonisjs/auth'
import type { LucidModel } from '@adonisjs/lucid/types/model'
import { verifySignature, buildSiweMessage } from '../verify_signature.js'
import type { NonceStore } from '../contracts/nonce_store.js'

export interface Web3AuthFinderOptions {
  nonceStore: NonceStore
  walletAddressColumnName?: string
  autoCreate?: boolean
}

export function withWeb3AuthFinder(options: Web3AuthFinderOptions) {
  const { nonceStore, walletAddressColumnName = 'walletAddress', autoCreate = false } = options

  return <Model extends abstract new (...args: any[]) => any>(superclass: Model) => {
    abstract class Web3AuthFinderMixin extends superclass {
      static async verifyWeb3Credentials(
        this: LucidModel,
        address: string,
        signature: `0x${string}`,
        nonce: string
      ) {
        const normalized = address.toLowerCase()

        const validNonce = await nonceStore.consume(normalized, nonce)
        if (!validNonce) {
          throw new errors.E_INVALID_CREDENTIALS('Invalid or expired nonce')
        }

        const message = buildSiweMessage(nonce)
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
          user = await (this as any).create({ [walletAddressColumnName]: normalized })
        }

        return user
      }
    }

    return Web3AuthFinderMixin
  }
}
