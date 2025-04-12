export type ParsedData = { input?: string; key?: string };
export type HandleParsed = ({ input, key }: ParsedData) => unknown;
export type HandleData = (buf: Buffer) => unknown;
