import { defineConfig } from '@vite-spirite/web3-auth-adonisjs'

export default defineConfig({
  strategy: 'db',
  siwe: {
    domain: 'localhost:3333',
    statement: 'Sign in to Web3 Auth demo',
  },
})
