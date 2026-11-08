import { UserSchema } from '#database/schema'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider, type AccessToken } from '@adonisjs/auth/access_tokens'
import { withWeb3AuthFinder } from '@vite-spirite/web3-auth-adonisjs'
import nonceStore from '@vite-spirite/web3-auth-adonisjs/services/main'

const Web3AuthFinder = withWeb3AuthFinder({ nonceStore, autoCreate: true })

export default class User extends compose(UserSchema, withAuthFinder(hash), Web3AuthFinder) {
  static accessTokens = DbAccessTokensProvider.forModel(User)
  declare currentAccessToken?: AccessToken

  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }
}
