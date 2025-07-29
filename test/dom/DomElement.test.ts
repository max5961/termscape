import { describe, test, expect } from "vitest";
import { Document } from "@src/dom/Document.js";
import { DomElement } from "@src/dom/DomElement.js";

// The only way to test equality between nodes returned from YogaNode.getChild(n) is
// to first calculate the layout, then read computed dimensions.  The nodes are
// always returned as different references
describe.todo("DOMElement mirrors YogaNode operations", () => {
    test("get non existant yoga child should return null", () => {
        const root = Document.createElement("BOX_ELEMENT");
        expect(root.node.getChild(0)).toBe(null);
    });

    test("appendChild", () => {
        const { root, c1, c2, c3 } = getElements();
        root.appendChild(c1);
        root.appendChild(c2);
        root.appendChild(c3);
        const { g1, g2, g3 } = getNumbers(root);

        expect(g1).toEqual(1);
        expect(g2).toEqual(2);
        expect(g3).toEqual(3);
        expect(c1).toBe(root.children[0]);
        expect(c2).toBe(root.children[1]);
        expect(c3).toBe(root.children[2]);
    });

    test("insertBefore", () => {
        const { root, c1, c2, c3 } = getElements();
        root.appendChild(c1);
        root.insertBefore(c2, c1);
        root.insertBefore(c3, c2);
        const { g1, g2, g3 } = getNumbers(root);

        expect(g1).toEqual(3);
        expect(g2).toEqual(2);
        expect(g3).toEqual(1);
        expect(c1).toBe(root.children[2]);
        expect(c2).toBe(root.children[1]);
        expect(c3).toBe(root.children[0]);
    });

    test("removeChild", () => {
        const { root, c1, c2, c3 } = getElements();
        root.appendChild(c1);
        root.appendChild(c2);
        root.appendChild(c3);

        root.removeChild(c2);
        root.node.calculateLayout();
        expect(root.node.getChild(1).getComputedWidth()).toEqual(3);
        expect(root.children[1]).toBe(c3);
    });
});

function getElements() {
    // Setting attr so that nodes can get checked for identity with getComputedWidth
    // root.getComputedLayout();
    const root = Document.createElement("BOX_ELEMENT");
    const c1 = Document.createElement("BOX_ELEMENT");
    const c2 = Document.createElement("BOX_ELEMENT");
    const c3 = Document.createElement("BOX_ELEMENT");
    c1.setAttributes({ props: { style: { width: 1 } }, metadata: {} });
    c2.setAttributes({ props: { style: { width: 2 } }, metadata: {} });
    c3.setAttributes({ props: { style: { width: 3 } }, metadata: {} });

    return { root, c1, c2, c3 };
}

function getNumbers(root: DomElement) {
    root.node.calculateLayout();
    const g1 = root.node.getChild(0);
    const g2 = root.node.getChild(1);
    const g3 = root.node.getChild(2);
    return {
        g1: g1?.getComputedWidth(),
        g2: g2?.getComputedWidth(),
        g3: g3?.getComputedWidth(),
    };
}
