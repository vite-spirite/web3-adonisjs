# web3-auth-adonisjs

[![checks](https://github.com/vite-spirite/web3-adonisjs/actions/workflows/checks.yml/badge.svg)](https://github.com/vite-spirite/web3-adonisjs/actions/workflows/checks.yml)
[![npm](https://img.shields.io/npm/v/@vite-spirite/web3-auth-adonisjs)](https://www.npmjs.com/package/@vite-spirite/web3-auth-adonisjs)
[![license](https://img.shields.io/badge/license-MIT-blue)](./package/LICENSE.md)

Sign-in with Ethereum for AdonisJS v6. Wallets authenticate by signing an [EIP-4361 (SIWE)](https://eips.ethereum.org/EIPS/eip-4361) challenge: the server issues a single-use nonce bound to its domain, the user signs it, the server verifies the signature with [viem](https://viem.sh) and logs the user in.

This monorepo holds the publishable package plus a demo application.

## Packages

| Package | Description |
| --- | --- |
| [`package/`](./package) | `@vite-spirite/web3-auth-adonisjs` — the provider: SIWE challenges, nonce stores (`db`/`cache`), Lucid auth mixin. See its [README](./package/README.md). Published to [npm](https://www.npmjs.com/package/@vite-spirite/web3-auth-adonisjs). |
| [`apps/backend/`](./apps/backend) | Demo AdonisJS API consuming the package (`GET /web3/nonce`, `POST /web3/login`). |
| [`apps/frontend/`](./apps/frontend) | Empty placeholder for a future demo client. |

## Requirements

- Node.js 26 (see [`.nvmrc`](./.nvmrc))
- npm 10+ (workspaces)

## Quickstart

```sh
npm ci          # install all workspaces
npm run dev     # turbo dev (backend on http://localhost:3333)
```

Backend demo flow:

1. Copy `apps/backend/.env.example` to `apps/backend/.env` and generate a key: `cd apps/backend && node ace generate:key`
2. Run migrations: `node ace migration:run`
3. `GET /web3/nonce?address=0x...` → `{ nonce, message }`
4. Sign `message` with the wallet, then `POST /web3/login` with `{ address, signature, nonce, email? }`

## Scripts (turbo, from the root)

| Command | Description |
| --- | --- |
| `npm run dev` | Run everything in dev mode |
| `npm run build` | Build all workspaces |
| `npm run test` | Tests (package: Japa, 34 tests · backend: `ace test`) |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc --noEmit` everywhere |
| `npm run release:package` | Cut a release (used by CI, see below) |

## CI & releases

- Push/PR runs [checks](./.github/workflows/checks.yml): lint, typecheck, tests (Ubuntu + Windows, Node 26).
- Publishing is manual: **Actions → release → Run workflow**. It re-runs checks, then `release-it` bumps the version from conventional commits, tags, creates the GitHub release and publishes to npm with Sigstore provenance.
