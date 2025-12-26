type Border = {
    top: string;
    topLeft: string;
    topRight: string;
    left: string;
    right: string;
    bottom: string;
    bottomLeft: string;
    bottomRight: string;
};

export type BorderMap = [
    [string, string, string],
    [string, string, string],
    [string, string, string],
];

export function createBox(chars: BorderMap): Border {
    return {
        top: chars[0][1],
        topLeft: chars[0][0],
        topRight: chars[0][2],
        left: chars[1][0],
        right: chars[1][2],
        bottom: chars[2][1],
        bottomLeft: chars[2][0],
        bottomRight: chars[2][2],
    };
}

export const Borders = {
    round: createBox([
        ["╭", "─", "╮"],
        ["│", " ", "│"],
        ["╰", "─", "╯"],
    ]),

    bold: createBox([
        ["┏", "━", "┓"],
        ["┃", " ", "┃"],
        ["┗", "━", "┛"],
    ]),

    single: createBox([
        ["┌", "─", "┐"],
        ["│", " ", "│"],
        ["└", "─", "┘"],
    ]),

    double: createBox([
        ["╔", "═", "╗"],
        ["║", " ", "║"],
        ["╚", "═", "╝"],
    ]),
    doubleY: createBox([
        ["╒", "═", "╕"],
        ["│", " ", "│"],
        ["╘", "═", "╛"],
    ]),
    doubleX: createBox([
        ["╓", "─", "╖"],
        ["║", " ", "║"],
        ["╙", "─", "╜"],
    ]),
    classic1: createBox([
        ["+", "-", "+"],
        ["|", " ", "|"],
        ["+", "-", "+"],
    ]),
    classic2: createBox([
        ["/", "-", "\\"],
        ["|", " ", "|"],
        ["\\", "-", "/"],
    ]),
    block: createBox([
        ["█", "▀", "█"],
        ["█", " ", "█"],
        ["█", "▄", "█"],
    ]),
} as const;

export const TitleBorders = {
    ["strikethrough"]: {
        "─": { left: "", right: "" },
        "━": { left: "", right: "" },
        "═": { left: "", right: "" },
        "▀": { left: "", right: "" },
        "-": { left: "", right: "" },
    },
    ["capped"]: {
        "─": { left: "┤", right: "├" },
        "━": { left: "┫", right: "┣" },
        "═": { left: "╣", right: "╠" },
        "▀": { left: "", right: "" },
        "-": { left: "|", right: "|" },
    },
    ["capped-reverse"]: {
        "─": { left: "┼", right: "┼" },
        "━": { left: "╋", right: "╋" },
        "═": { left: "╬", right: "╬" },
        "▀": { left: "", right: "" },
        "-": { left: "+", right: "+" },
    },
    ["bracket-top"]: {
        "─": { left: "┘", right: "└" },
        "━": { left: "┛", right: "┗" },
        "═": { left: "╝", right: "╚" },
        "▀": { left: "█", right: "█" },
        "-": { left: "]", right: "[" },
    },

    ["bracket-bottom"]: {
        "─": { left: "┐", right: "┌" },
        "━": { left: "┓", right: "┏" },
        "═": { left: "╗", right: "╔" },
        "▀": { left: "", right: "" },
        "-": { left: "]", right: "[" },
    },
};
