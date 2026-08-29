import { describe, test, expect, beforeEach } from "vitest";
import { CoreElement } from "../../src/core/CoreElement.js";
import { CoreRootElement } from "../../src/core/CoreRootElement.js";

describe("TreeNode", () => {
    let root: CoreRootElement;
    let a: CoreElement,
        b: CoreElement,
        c: CoreElement,
        d: CoreElement,
        e: CoreElement,
        f: CoreElement;

    beforeEach(() => {
        root = new CoreRootElement();
        a = new CoreElement();
        b = new CoreElement();
        c = new CoreElement();
        d = new CoreElement();
        e = new CoreElement();
        f = new CoreElement();
    });

    describe("appendChild", () => {
        test("append new children", () => {
            root.treeNode.appendChild(a);
            root.treeNode.appendChild(b);
            root.treeNode.appendChild(c);
            expect(root.treeNode.children).toEqual([a, b, c]);
        });

        test("append child that is already a child", () => {
            root.treeNode.appendChild(a);
            root.treeNode.appendChild(b);
            root.treeNode.appendChild(c);
            root.treeNode.appendChild(a);
            expect(root.treeNode.children).toEqual([b, c, a]);
        });
    });

    describe("insertBefore", () => {
        test("insertBefore a child that is not yet a child", () => {
            root.treeNode.appendChild(a);
            root.treeNode.appendChild(b);
            root.treeNode.insertBefore(c, a);
            expect(root.treeNode.children).toEqual([c, a, b]);
        });

        test("insertBefore a child that is already a child", () => {
            root.treeNode.appendChild(a);
            root.treeNode.appendChild(b);
            root.treeNode.appendChild(c);
            root.treeNode.insertBefore(b, a);
            expect(root.treeNode.children).toEqual([b, a, c]);
        });
    });

    describe("removeChild", () => {
        test("remove at beginning", () => {
            root.treeNode.appendChild(a);
            root.treeNode.appendChild(b);
            root.treeNode.appendChild(c);
            root.treeNode.removeChild(a);
            expect(root.treeNode.children).toEqual([b, c]);
        });

        test("remove in middle", () => {
            root.treeNode.appendChild(a);
            root.treeNode.appendChild(b);
            root.treeNode.appendChild(c);
            root.treeNode.removeChild(b);
            expect(root.treeNode.children).toEqual([a, c]);
        });

        test("remove at end", () => {
            root.treeNode.appendChild(a);
            root.treeNode.appendChild(b);
            root.treeNode.appendChild(c);
            root.treeNode.removeChild(c);
            expect(root.treeNode.children).toEqual([a, b]);
        });

        test("remove only child", () => {
            root.treeNode.appendChild(a);
            root.treeNode.removeChild(a);
            expect(root.treeNode.children).toEqual([]);
        });
    });

    describe("getters", () => {
        test("parentElement", () => {
            expect(a.treeNode.parentElement).toBe(undefined);
            root.treeNode.appendChild(a);
            expect(a.treeNode.parentElement).toBe(root);
            expect(root.treeNode.parentElement).toBe(undefined);
        });

        test("firstElementChild", () => {
            expect(root.treeNode.firstElementChild).toBe(undefined);
            root.treeNode.appendChild(a);
            root.treeNode.appendChild(b);
            root.treeNode.appendChild(c);
            expect(root.treeNode.firstElementChild).toBe(a);
        });

        test("lastElementChild", () => {
            expect(root.treeNode.lastElementChild).toBe(undefined);
            root.treeNode.appendChild(a);
            root.treeNode.appendChild(b);
            root.treeNode.appendChild(c);
            expect(root.treeNode.lastElementChild).toBe(c);
        });
    });

    test("replaceChildren", () => {
        root.treeNode.appendChild(a);
        root.treeNode.appendChild(b);
        root.treeNode.appendChild(c);
        root.treeNode.appendChild(d);
        root.treeNode.replaceChildren([e, f]);

        expect(root.treeNode.children).toEqual([e, f]);
        expect(a.treeNode.parentElement).toBe(undefined);
        expect(b.treeNode.parentElement).toBe(undefined);
        expect(c.treeNode.parentElement).toBe(undefined);
        expect(d.treeNode.parentElement).toBe(undefined);
    });

    describe("Integrates with RootEmulator", () => {
        test("nodes detached from root have undefined root core references", () => {
            // A -> B -> C
            b.treeNode.appendChild(c);
            a.treeNode.appendChild(b);

            expect(a.root.getReference()).toBe(undefined);
            expect(b.root.getReference()).toBe(undefined);
            expect(c.root.getReference()).toBe(undefined);
        });

        test("once a node is attached to the root, it propagates the root reference", () => {
            // Root -> A -> B -> C
            b.treeNode.appendChild(c);
            a.treeNode.appendChild(b);
            root.treeNode.appendChild(a);
            expect(a.root.getReference()).toBe(root);
            expect(b.root.getReference()).toBe(root);
            expect(c.root.getReference()).toBe(root);
        });

        test("once a node is detached from the root, it propagates the severed root reference", () => {
            // Root -> A -> ..... B -> C
            b.treeNode.appendChild(c);
            a.treeNode.appendChild(b);
            root.treeNode.appendChild(a);
            a.treeNode.removeChild(b);
            expect(a.root.getReference()).toBe(root);
            expect(b.root.getReference()).toBe(undefined);
            expect(c.root.getReference()).toBe(undefined);
        });
    });
});
