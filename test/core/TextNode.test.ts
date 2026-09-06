import { describe, test, expect, beforeEach } from "vitest";
import { Text, TextNode } from "../../src/core/text/TextNode.js";

describe("TextNode", () => {
    let root: TextNode;

    beforeEach(() => {
        root = new TextNode({});
    });

    test("flatten and convert to string", () => {
        const a = new Text({}, "a");
        const b = new Text({}, "b");
        const c = new Text({}, "c");
        const d = new Text({}, "d");
        const e = new Text({}, "e");

        const node1 = new TextNode({});
        const node2 = new TextNode({});

        root.append(a);
        root.append(node1);
        root.append(node2);
        node1.append(b);
        node1.append(c);
        node2.append(d);
        root.append(e);

        // flatten pre-order traverses and pushes non TextNodes to an array
        //
        //   ___root____________
        //  /    |     \        \
        // a   node1    node2    e
        //    /    \   /
        //   b     c  d

        const flattened = root
            .flatten()
            .map((text) => text.content)
            .join("");

        expect(flattened).toBe("abcde");
    });

    test("bro", () => {
        root.style = { color: "blue" };
        root.append(new Text({}, "foo"));

        expect(root.__flattenToTestable()).toEqual([
            { text: "foo", style: { color: "blue" } },
        ]);
    });

    test("defined parent node styles change all undefined descendent styles", () => {
        root.style = { color: "blue" };
        const a = new Text({}, "a");

        const node1 = new TextNode({ dimColor: true });
        const b = new Text({}, "b");
        const c = new Text({ color: "red" }, "c");
        const node2 = new TextNode({ color: "green" });
        const d = new Text({}, "d");

        const e = new Text({ italic: true }, "e");

        root.append(a);
        root.append(node1);
        root.append(node2);
        node1.append(b);
        node1.append(c);
        node2.append(d);
        root.append(e);

        //   ___root____________
        //  /    |     \        \
        // a   node1    node2    e
        //    /    \   /
        //   b     c  d

        expect(root.__flattenToTestable()).toEqual([
            { text: "a", style: { color: "blue" } },
            { text: "b", style: { color: "blue", dimColor: true } },
            { text: "c", style: { color: "red", dimColor: true } },
            { text: "d", style: { color: "green" } },
            { text: "e", style: { color: "blue", italic: true } },
        ]);
    });
});
