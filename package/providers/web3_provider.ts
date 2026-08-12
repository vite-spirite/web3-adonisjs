import type { ApplicationService } from '@adonisjs/core/types'
import type { Web3Config } from '../src/types.ts'
import type { NonceStore } from '../src/contracts/nonce_store.ts'
import { resolveNonceStore } from '../src/resolve_nonce_store.ts'

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    'web3.nonceStore': NonceStore
  }
}

export default class Web3Provider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton('web3.nonceStore', async () => {
      const config = this.app.config.get<Web3Config | null>('web3', null)
      if (!config) {
        throw new Error(
          'Invalid config exported from "config/web3.ts" file. Make sure to use the defineConfig method'
        )
      }

      return resolveNonceStore(config.strategy)
    })
  }
}
