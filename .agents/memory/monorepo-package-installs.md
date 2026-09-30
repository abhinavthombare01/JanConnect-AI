---
name: Artifact dependency installs in pnpm workspaces
description: Add runtime and type dependencies to the correct workspace package when the generic package installer targets the root.
---

In this Replit pnpm monorepo, the generic `installLanguagePackages` callback runs `pnpm add` from the workspace root and does not accept pnpm filter flags as package names. This fails with pnpm's workspace-root guard instead of adding dependencies to a leaf artifact.

**Why:** Frontend dependencies must belong to the artifact package, not the monorepo root, so package ownership and reproducible installs remain correct.

**How to apply:** Try the package callback first. If it cannot target the leaf workspace, use a scoped command such as `pnpm --filter @workspace/<slug> add <packages>`, then run the affected package typecheck and restart its managed workflow.