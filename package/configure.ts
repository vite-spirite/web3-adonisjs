/*
|--------------------------------------------------------------------------
| Configure hook
|--------------------------------------------------------------------------
|
| The configure hook is called when someone runs "node ace configure <package>"
| command. You are free to perform any operations inside this function to
| configure the package.
|
| To make things easier, you have access to the underlying "Configure"
| instance and you can use codemods to modify the source files.
|
*/

import type Configure from '@adonisjs/core/commands/configure'
import { stubsRoot } from './stubs/main.ts'

export async function configure(_command: Configure) {
  const codemods = await _command.createCodemods()

  await codemods.makeUsingStub(stubsRoot, 'migrations/create_nonce_store.stub', {})
  await codemods.makeUsingStub(stubsRoot, 'migrations/make_password_nullable.stub', {})
  await codemods.makeUsingStub(stubsRoot, 'migrations/make_wallet_address.stub', {})
  await codemods.makeUsingStub(stubsRoot, 'config/web3.stub', {})

  await codemods.updateRcFile((rcFiles) => {
    rcFiles.addProvider('@vite-spirite/web3-auth-adonisjs/web3_provider')
  })
}
