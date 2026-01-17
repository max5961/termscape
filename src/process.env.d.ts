declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV?: "test" | "development" | "production";
        CURSOR_DEBUG?: string;
        LOGGER?: string;
        OVERWRITE_SNAPSHOTS?: string;
    }
}
