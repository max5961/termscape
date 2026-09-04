import { describe, test, expect, beforeEach } from "vitest";
import { CoreElement } from "../../src/core/CoreElement.js";
import { CoreRootElement } from "../../src/core/CoreRootElement.js";
import { DomElement } from "../../src/dom/DomElement.js";

describe("TreeNode", () => {
    const shell = undefined as unknown as DomElement;
    let root: CoreRootElement;
    let a: CoreElement,
        b: CoreElement,
        c: CoreElement,
        d: CoreElement,
        e: CoreElement,
        f: CoreElement;

    beforeEach(() => {
        root = new CoreRootElement(shell, { startOnCreate: false });
        a = new CoreElement(shell, {});
        b = new CoreElement(shell, {});
        c = new CoreElement(shell, {});
        d = new CoreElement(shell, {});
        e = new CoreElement(shell, {});
        f = new CoreElement(shell, {});
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

            expect(a.root.getAttachedRoot()).toBe(undefined);
            expect(b.root.getAttachedRoot()).toBe(undefined);
            expect(c.root.getAttachedRoot()).toBe(undefined);
        });

        test("once a node is attached to the root, it propagates the root reference", () => {
            // Root -> A -> B -> C
            b.treeNode.appendChild(c);
            a.treeNode.appendChild(b);
            root.treeNode.appendChild(a);
            expect(a.root.getAttachedRoot()).toBe(root);
            expect(b.root.getAttachedRoot()).toBe(root);
            expect(c.root.getAttachedRoot()).toBe(root);
        });

        test("once a node is detached from the root, it propagates the severed root reference", () => {
            // Root -> A -> ..... B -> C
            b.treeNode.appendChild(c);
            a.treeNode.appendChild(b);
            root.treeNode.appendChild(a);
            a.treeNode.removeChild(b);
            expect(a.root.getAttachedRoot()).toBe(root);
            expect(b.root.getAttachedRoot()).toBe(undefined);
            expect(c.root.getAttachedRoot()).toBe(undefined);
        });
    });
});
