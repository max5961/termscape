type Data = any;
const parseBuffer = (buf: Buffer) => {};
const queryKittySupport = () => Promise.resolve(true);

type Opts = {
    /**
     * The stream from which the function reads *data* from
     * @default process.stdin
     */
    stream?: NodeJS.ReadStream;

    /**
     * Enable/disable mouse
     * @default true
     */
    mouse?: number | boolean;

    /**
     * How many characters should accumulate?  Makes keymapings like *dd* (delete
     * line in vim) possible
     * @default 1
     * */
    registerSize?: number;

    /**
     * Callback function that handles the parsed data
     */
    handleData: (data: Data) => unknown;
};

type InputSession = {
    stream: NonNullable<Opts["stream"]>;
    mouse: NonNullable<Opts["mouse"]>;
    registerSize: NonNullable<Opts["registerSize"]>;
    close: () => void;
};

export function inputSession(opts: Opts): InputSession {
    opts.stream = opts.stream ?? process.stdin;
    opts.registerSize = opts.registerSize ?? 1;
    opts.mouse = opts.mouse ? (opts.mouse === true ? 3 : opts.mouse) : 0;

    const createStreamHandler = (stream: NodeJS.ReadStream) => {
        const handler = (buf: Buffer) => {
            const data = parseBuffer(buf);
            opts.handleData(data);
        };
        stream.on("data", handler);

        return () => stream.off("data", handler);
    };

    const session = {
        detachStream: createStreamHandler(opts.stream),
        isExtendedLayout: false,
    };

    queryKittySupport().then((result) => (session.isExtendedLayout = result));

    return {
        set stream(s: NonNullable<Opts["stream"]>) {
            opts.stream = s;
            session.detachStream();
            session.detachStream = createStreamHandler(opts.stream);
        },
        get stream() {
            return opts.stream!;
        },
        set registerSize(n: NonNullable<Opts["registerSize"]>) {
            opts.registerSize = n;
        },
        get registerSize() {
            return opts.registerSize!;
        },
        set mouse(v: NonNullable<Opts["mouse"]>) {
            opts.mouse = v;
        },
        get mouse() {
            return opts.mouse!;
        },
        close() {
            //
        },
    };
}

// const stream1 = inputSession();
