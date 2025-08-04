import ansi from "ansi-escape-sequences";

/**
 * This is a wrapper for the utilities used from `ansi-escape-sequences` as well as
 * utilities not included in that package, so that all ansi sequences are consolidated
 * in one place.
 */
export const Ansi = {
    ...ansi,

    /**
     * @link https://vt100.net/docs/vt510-rm/DECRPM.html
     * @link https://hugotunius.se/2019/12/29/efficient-terminal-drawing-in-rust.html
     * */
    beginSynchronizedUpdate: "\x1b[?2026h",

    /**
     * @link https://vt100.net/docs/vt510-rm/DECRPM.html
     * @link https://hugotunius.se/2019/12/29/efficient-terminal-drawing-in-rust.html
     * */
    endSynchronizedUpdate: "\x1b[?2026l",

    /**
     * @link https://vt100.net/docs/vt510-rm/DECRPM.html
     * @link https://hugotunius.se/2019/12/29/efficient-terminal-drawing-in-rust.html
     * */
    querySynchronizedUpdate: "\x1b[?2026$p",

    /** `\x1b[0m` */
    reset: ansi.style.reset,

    /** Enter alternate term screen */
    enterAltScreen: "\x1b[?1049h",

    /** Exit alt term screen */
    exitAltScreen: "\x1b[?1049l",
} as const;
