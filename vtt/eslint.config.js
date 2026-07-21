/**
 * STᚱ VTT — ESLint Config
 *
 * Intentionally minimal. The project uses `oxlint` for linting
 * (run via `npm run lint`). TypeScript compilation errors are
 * caught by `tsc --noEmit`.
 *
 * This config exists only for tooling compatibility and declares
 * which paths ESLint should ignore to avoid false-positive errors
 * from its base parser when scanning the workspace.
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
      "public/**",
      "src/**/*.tsx",
      "src/**/*.ts",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.d.ts",
    ],
  },
];
