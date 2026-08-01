# User Instruction Memory

This file records user instructions, preferences, and teachings for reference in future interactions.

## Format

### User Instruction Entry
User instruction entries should follow this format:

[User Instruction Summary]
- Date: [YYYY-MM-DD]
- Context: [Mentioned scenario or time]
- Instructions:
  - [Content of user teaching or instruction, described line by line]

### Project Knowledge Entry
Entries discovered by the Agent during task execution should follow this format:

[Project Knowledge Summary]
- Date: [YYYY-MM-DD]
- Context: Discovered by Agent while performing [specific task description]
- Category: [Operations & Deployment|Build Methods|Testing Methods|Troubleshooting & Debugging|Workflow & Collaboration|Environment Configuration]
- Instructions:
  - [Specific knowledge points, described line by line]

## Deduplication Strategy
- Before adding a new entry, check for similar or identical instructions.
- If a duplicate is found, skip the new entry or merge it with the existing one.
- When merging, update the context or date information.
- This helps avoid redundant entries and keeps the memory file tidy.

## Entries

[Project Knowledge Summary]
- Date: 2026-08-01
- Context: Discovered by Agent while converting 账号本子 to installable Android PWA and deploying preview
- Category: Build Methods
- Instructions:
  - 生产构建：`pnpm build`，产物在 `dist/`，typecheck 用 `pnpm check`，lint 用 `pnpm lint`（既有 4 个 error 与 PWA 改动无关）
  - 本项目配置了 PWA：`public/manifest.webmanifest`、`public/sw.js`（离线缓存）、`public/icons/`（192/512/maskable 图标）
  - Vite `base` 为 `/account-book/`，manifest 与 SW 均按此前缀引用；预览 dev server 需 `pnpm dev -- --base /account-book/ --host 0.0.0.0` 才能让 PWA 路径生效
  - `vite.config.ts` 已配置 `server.allowedHosts: ['.monkeycode-ai.online']`，否则预览域名被拦截返回 403
  - pnpm v11 忽略构建脚本：需在 `pnpm-workspace.yaml` 配置 `allowBuilds: { esbuild: true }`，否则 vite 构建失败
