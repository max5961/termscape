declare module "ansi-escape-sequences" {
    /**
     * @exports ansi-escape-sequences
     * @typicalname ansi
     * @example
     * import ansi from 'ansi-escape-sequences'
     */
    const ansi: {
        /**
         * Various formatting styles (aka Select Graphic Rendition codes).
         * @enum {string}
         * @example
         * console.log(ansi.style.red + 'this is red' + ansi.style.reset)
         */
        style: {
            reset: "\x1b[0m";
            bold: "\x1b[1m";
            italic: "\x1b[3m";
            underline: "\x1b[4m";
            fontDefault: "\x1b[10m";
            font2: "\x1b[11m";
            font3: "\x1b[12m";
            font4: "\x1b[13m";
            font5: "\x1b[14m";
            font6: "\x1b[15m";
            imageNegative: "\x1b[7m";
            imagePositive: "\x1b[27m";
            black: "\x1b[30m";
            red: "\x1b[31m";
            green: "\x1b[32m";
            yellow: "\x1b[33m";
            blue: "\x1b[34m";
            magenta: "\x1b[35m";
            cyan: "\x1b[36m";
            white: "\x1b[37m";
            grey: "\x1b[90m";
            gray: "\x1b[90m";
            brightRed: "\x1b[91m";
            brightGreen: "\x1b[92m";
            brightYellow: "\x1b[93m";
            brightBlue: "\x1b[94m";
            brightMagenta: "\x1b[95m";
            brightCyan: "\x1b[96m";
            brightWhite: "\x1b[97m";
            "bg-black": "\x1b[40m";
            "bg-red": "\x1b[41m";
            "bg-green": "\x1b[42m";
            "bg-yellow": "\x1b[43m";
            "bg-blue": "\x1b[44m";
            "bg-magenta": "\x1b[45m";
            "bg-cyan": "\x1b[46m";
            "bg-white": "\x1b[47m";
            "bg-grey": "\x1b[100m";
            "bg-gray": "\x1b[100m";
            "bg-brightRed": "\x1b[101m";
            "bg-brightGreen": "\x1b[102m";
            "bg-brightYellow": "\x1b[103m";
            "bg-brightBlue": "\x1b[104m";
            "bg-brightMagenta": "\x1b[105m";
            "bg-brightCyan": "\x1b[106m";
            "bg-brightWhite": "\x1b[107m";
        };

        /**
         * Returns a 24-bit "true colour" foreground colour escape sequence.
         * @param {number} r - Red value.
         * @param {number} g - Green value.
         * @param {number} b - Blue value.
         * @returns {string}
         * @example
         * > ansi.rgb(120, 0, 120)
         * '\u001b[38;2;120;0;120m'
         */
        rgb(r: number, g: number, b: number): string;

        /**
         * Returns a 24-bit "true colour" background colour escape sequence.
         * @param {number} r - Red value.
         * @param {number} g - Green value.
         * @param {number} b - Blue value.
         * @returns {string}
         * @example
         * > ansi.bgRgb(120, 0, 120)
         * '\u001b[48;2;120;0;120m'
         */
        bgRgb(r: number, g: number, b: number): string;

        styles(styles: string[]): string;
    };
    export default ansi;
}
