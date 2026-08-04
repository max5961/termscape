import type { Props } from "./Props.js";

export class DefaultProps {
    public static readonly DomElement: Props.All = {};

    public static readonly Box: Props.Box = {};

    public static readonly Root: Props.Root = {};

    public static readonly Text: Props.Text = {};

    public static readonly Book: Props.Book = {};

    public static readonly Canvas: Props.Canvas = {
        draw: (_pen) => {},
    };

    public static readonly Layout: Props.Layout = {
        // TODO - feat: add more props to Layout
        blockChildrenShrink: false,
    };

    public static readonly LayoutNode: Props.Layout = {};

    public static readonly List: Props.List = {
        blockChildrenShrink: true,
        fallthrough: false,
        keepFocusedCenter: false,
        keepFocusedVisible: true, // TODO
    };

    public static readonly Input: Props.Input = {
        enter: [{ key: "return" }],
        exit: [{ key: "esc" }, { key: "return" }],
        cursorLeft: [{ key: "alt", input: "h" }],
        cursorRight: [{ key: "alt", input: "l" }],
        prevWord: [{ key: "alt", input: "b" }],
        nextWord: [{ key: "alt", input: "w" }],
        deleteWord: [{ key: "alt", input: "d" }],
        deleteChar: [{ key: "alt", input: "x" }],
        startOfLine: [{ key: "alt", input: "0" }],
        endOfLine: [{ key: "alt", input: "A" }],
        tabWidth: 4,
    };

    public static readonly VirtualList: Props.VirtualList<unknown> = {
        offset: 0,
        initialIndex: 0,
        expandStrategy: "fillEnd",
        compressStrategy: "clipEnd",
    };
}
