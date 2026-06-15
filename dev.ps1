$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot
# Turbo expects a pnpm binary on PATH; npx bootstraps pnpm when Corepack/global pnpm is missing.
npx --yes pnpm@9.15.4 exec turbo run dev
