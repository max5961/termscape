import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default defineConfig([
    tseslint.configs.recommended,
    {
        files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
        languageOptions: {
            globals: {
                ...globals.jest,
                ...globals.node,
                NodeJS: true,
            },
        },
        plugins: { js },
        extends: ["js/recommended"],
        rules: {
            ["@typescript-eslint/no-explicit-any"]: "off",
        },
    },
]);
