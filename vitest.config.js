import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";

export default defineConfig({
    plugins: [tsconfigPaths()],
    resolve: {
        alias: {
            "@src": path.resolve("./src/"),
        },
    },
});
