/**
 * ANSI utilities used for Termscape.
 *
 * This code is based on and influenced by `ansi-escape-sequences` v6.2.4 by
 * Lloyd Brookes. The original project is licensed under the MIT license.
 *
 * https://www.npmjs.com/package/ansi-escape-sequences
 * https://github.com/75lb/ansi-escape-sequences
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014-25 Lloyd Brookes <opensource@75lb.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * */

import { objectKeys } from "../util.js";
import type { IAnsiEffectStyle } from "./style/IStyle.js";

export const Ansi = {
    reset: "\x1b[0m",

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

    /** This must occur for stdin to work properly once the process exits. */
    restoreFromKittyProtocol: "\x1b[<u",

    /** Returns the 1-based index cursor position. Term responds with `\x1b[<x>;<y>R` */
    queryCursorPosition: "\x1b[6n",

    /** Enter alternate term screen */
    enterAltScreen: "\x1b[?1049h",

    /** Exit alt term screen */
    exitAltScreen: "\x1b[?1049l",

    color: {
        black: "\x1b[30m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m",
        grey: "\x1b[90m",
        gray: "\x1b[90m",
        brightRed: "\x1b[91m",
        brightGreen: "\x1b[92m",
        brightYellow: "\x1b[93m",
        brightBlue: "\x1b[94m",
        brightMagenta: "\x1b[95m",
        brightCyan: "\x1b[96m",
        brightWhite: "\x1b[97m",
    },
    backgroundColor: {
        black: "\x1b[40m",
        red: "\x1b[41m",
        green: "\x1b[42m",
        yellow: "\x1b[43m",
        blue: "\x1b[44m",
        magenta: "\x1b[45m",
        cyan: "\x1b[46m",
        white: "\x1b[47m",
        grey: "\x1b[100m",
        gray: "\x1b[100m",
        brightRed: "\x1b[101m",
        brightGreen: "\x1b[102m",
        brightYellow: "\x1b[103m",
        brightBlue: "\x1b[104m",
        brightMagenta: "\x1b[105m",
        brightCyan: "\x1b[106m",
        brightWhite: "\x1b[107m",
    },
    rgb: (arr: (string | number)[]) => {
        if (arr.length !== 3) return "";
        return `\x1b[38;2;${arr[0]};${arr[1]};${arr[2]}m`;
    },
    backgroundRgb: (arr: (string | number)[]) => {
        if (arr.length !== 3) return "";
        return `\x1b[48;2;${arr[0]};${arr[1]};${arr[2]}m`;
    },
    effects: {
        bold: "\x1b[1m",
        dimColor: "\x1b[2m",
        italic: "\x1b[3m",
        underline: "\x1b[4m",
        strikethrough: "\x1b[9m",
        imageNegative: "\x1b[7m",
        imagePositive: "\x1b[27m",
    },
    cursor: {
        /** Shows the cursor */
        show: "\x1b[?25h",

        /** Hides the cursor */
        hide: "\x1b[?25l",

        /**
         * Moves the cursor to column x and row y.
         *
         * [NOTE:] Uses 0-based indexing and increments the values to conform to the
         * ANSI standard which uses 1-based indexing.
         * */
        position: (x: number, y: number) => {
            return `\x1b[${y + 1};${x + 1}H`;
        },

        /**
         * Moves the cursor `units` cells up.  If the cursor is already at the edge
         * of the screen this has no effect.
         * */
        up: (units: number) => {
            if (units < 1) return "";
            return `\x1b[${units}A`;
        },

        /**
         * Moves the cursor `units` cells down.  If the cursor is already at the edge
         * of the screen this has no effect.
         * */
        down: (units: number) => {
            if (units < 1) return "";
            return `\x1b[${units}B`;
        },

        /**
         * Moves the cursor `units` cells right.  If the cursor is already at the edge
         * of the screen this has no effect.
         * */
        right: (units: number) => {
            if (units < 1) return "";
            return `\x1b[${units}C`;
        },

        /**
         * Moves the cursor `units` cells left.  If the cursor is already at the edge
         * of the screen this has no effect.
         * */
        left: (units: number) => {
            if (units < 1) return "";
            return `\x1b[${units}D`;
        },
        /**
         * Moves the cursor `lines` cells down.
         * @default lines=1
         * */
        nextLine: (lines = 1) => {
            if (lines < 1) return "";
            return `\x1b[${lines || 1}E`;
        },

        /**
         * Moves the cursor `lines` cells down.
         * @default lines=1
         * */
        prevLine: (lines = 1) => {
            if (lines < 1) return "";
            return `\x1b[${lines || 1}F`;
        },

        /**
         * Moves the cursor to the given column.
         *
         * [NOTE:] Uses 0-based indexing and increments the values to conform to the
         * ANSI standard which uses 1-based indexing.
         * */
        moveToCol: (col: number) => {
            if (col < 0) return "";
            return `\x1b[${col + 1}G`;
        },
    },

    clear: {
        /**
         * Clears everything from cursor to end of screen, but does not move cursor.
         * */
        display: "\x1b[J",

        /**
         * Clears from the cursor to the end of the line
         * */
        fromCursorToEdge: `\x1b[0K`,

        /** Clear all stdout rows and move cursor to top row */
        screen: "\x1b[2J\x1b[H",

        /** Clear all stdout rows including scrollback and move cursor to top row */
        scrollback: "\x1b[3J\x1b[H",
    },
} as const;
