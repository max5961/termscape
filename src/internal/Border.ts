export type IBorder = {
    top: string;
    topLeft: string;
    topRight: string;
    left: string;
    right: string;
    bottom: string;
    bottomLeft: string;
    bottomRight: string;
};

export type IBorderMap = [
    [string, string, string],
    [string, string, string],
    [string, string, string],
];

export default {
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
} as const;

export function createBox(chars: IBorderMap): IBorder {
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
