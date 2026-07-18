/**
 * STᚱ VTT — ESLint Config
 *
 * Intentionally minimal loose config.
 * The project uses `oxlint` for linting (via `npx oxlint@latest`).
 * TypeScript compilation errors are caught by `tsc --noEmit`.
 * This config exists only for tooling compatibility.
 */
export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "test-results/**",
      "venv/**",
      "scripts/**",
      "docs/**",
    ],
  },
];
