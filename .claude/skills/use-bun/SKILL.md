---
name: use-bun
description: Use Bun instead of npm/yarn/pnpm for all package management and script execution in this repo. Triggers whenever installing, adding, removing, or running packages or scripts.
---

This project uses Bun (see `bun.lock`), not npm/yarn/pnpm. Always use the Bun equivalents:

| Instead of | Use |
|---|---|
| `npm install` / `npm ci` | `bun install` |
| `npm install <pkg>` | `bun add <pkg>` |
| `npm install -D <pkg>` | `bun add -d <pkg>` |
| `npm uninstall <pkg>` | `bun remove <pkg>` |
| `npm run <script>` | `bun run <script>` |
| `npx <cmd>` | `bunx <cmd>` |
| `npm exec` | `bunx` |

Never create or commit a `package-lock.json` or `yarn.lock` — `bun.lock` is the source of truth. If one appears, delete it.
