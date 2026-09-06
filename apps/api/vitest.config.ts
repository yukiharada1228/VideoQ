import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./test/setup.ts"],
    exclude: ["test/workers/**", "node_modules/**", "dist/**"],
  },
});
