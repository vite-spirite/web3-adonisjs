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

  async boot() {
    const config = this.app.config.get<Web3Config>('web3')
    const nonceStore = resolveNonceStore(config.strategy)

    this.app.container.singleton('web3.nonceStore', () => nonceStore)
  }
}
