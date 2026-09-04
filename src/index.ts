import { create } from "./dom/create.js";
import { key } from "term-keymap";

export { create, key };

export default {
    create,
    key,
} as const;
