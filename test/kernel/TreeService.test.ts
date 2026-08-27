import { describe, test, expect } from "vitest";
import { RootKernel } from "../../src/kernel/RootKernel.js";
import { Kernel } from "../../src/kernel/Kernel.js";

describe("TreeService", () => {
    describe("appendChild", () => {
        const root = new RootKernel();
        const c1 = new Kernel();
        const c2 = new Kernel();
        const c3 = new Kernel();

        test("append new children", () => {
            root.treeService.appendChild(c1);
            root.treeService.appendChild(c2);
            root.treeService.appendChild(c3);
            expect(root.treeService.children).toEqual([c1, c2, c3]);
        });

        test("append child that is already a child", () => {
            root.treeService.appendChild(c1);
            expect(root.treeService.children).toEqual([c2, c3, c1]);
        });
    });

    describe("insertBefore", () => {
        const root = new RootKernel();
        const c1 = new Kernel();
        const c2 = new Kernel();
        const c3 = new Kernel();

        test("insertBefore a child that is not yet a child", () => {
            root.treeService.appendChild(c1);
            root.treeService.appendChild(c2);
            root.treeService.insertBefore(c3, c1);
            expect(root.treeService.children).toEqual([c3, c1, c2]);
        });

        test("insertBefore a child that is already a child", () => {
            root.treeService.insertBefore(c2, c3);
            expect(root.treeService.children).toEqual([c2, c3, c1]);
        });
    });

    describe("removeChild", () => {
        const root = new RootKernel();
        const c1 = new Kernel();
        const c2 = new Kernel();
        const c3 = new Kernel();
        const c4 = new Kernel();

        root.treeService.appendChild(c1);
        root.treeService.appendChild(c2);
        root.treeService.appendChild(c3);
        root.treeService.appendChild(c4);

        test("remove at beginning", () => {
            root.treeService.removeChild(c1);
            expect(root.treeService.children).toEqual([c2, c3, c4]);
        });

        test("remove in middle", () => {
            root.treeService.removeChild(c3);
            expect(root.treeService.children).toEqual([c2, c4]);
        });

        test("remove at end", () => {
            root.treeService.removeChild(c4);
            expect(root.treeService.children).toEqual([c2]);
        });

        test("remove only child", () => {
            root.treeService.removeChild(c2);
            expect(root.treeService.children).toEqual([]);
        });
    });

    describe("getters", () => {
        const root = new RootKernel();
        const c1 = new Kernel();
        const c2 = new Kernel();
        const c3 = new Kernel();
        root.treeService.appendChild(c1);
        root.treeService.appendChild(c2);
        root.treeService.appendChild(c3);

        test("parentElement", () => {
            expect(c1.treeService.parentElement).toBe(root);
        });

        test("firstElementChild", () => {
            expect(root.treeService.firstElementChild).toBe(c1);
        });

        test("lastElementChild", () => {
            expect(root.treeService.lastElementChild).toBe(c3);
        });
    });

    describe("Integrates with RootEmulator", () => {
        const root = new RootKernel();
        const a = new Kernel();
        const b = new Kernel();
        const c = new Kernel();

        b.treeService.appendChild(c);
        a.treeService.appendChild(b);

        test("nodes detached from root have undefined root kernel references", () => {
            expect(a.root.getKernel()).toBe(undefined);
            expect(b.root.getKernel()).toBe(undefined);
            expect(c.root.getKernel()).toBe(undefined);
        });

        test("once a node is attached to the root, it propagates the root reference", () => {
            root.treeService.appendChild(a);
            expect(a.root.getKernel()).toBe(root);
            expect(b.root.getKernel()).toBe(root);
            expect(c.root.getKernel()).toBe(root);
        });

        test("once a node is detached from the root, it propagates the severed root reference", () => {
            a.treeService.removeChild(b);
            expect(a.root.getKernel()).toBe(root);
            expect(b.root.getKernel()).toBe(undefined);
            expect(c.root.getKernel()).toBe(undefined);
        });
    });
});
