import { describe, test, expect } from "vitest";
import { Focus } from "../../src/dom/Context.js";

describe("Focus - appends", () => {
    let nodes = getNodes();

    describe("predictable", () => {
        const { root, c1, checkpoint1, c2, c3, checkpoint2, c4 } = nodes;

        root.appendChild(c1);
        c1.appendChild(checkpoint1);
        checkpoint1.appendChild(c2);
        c2.appendChild(c3);
        c3.appendChild(checkpoint2);
        checkpoint2.appendChild(c4);

        checkpoint1.becomeCheckpoint(false);
        checkpoint2.becomeCheckpoint(true);
        testAll("predictable");
    });

    describe("reverse appends and removes", () => {
        nodes = getNodes();
        const { root, c1, checkpoint1, c2, c3, checkpoint2, c4 } = nodes;

        checkpoint2.appendChild(c4);
        c3.appendChild(checkpoint2);
        c2.appendChild(c3);
        checkpoint1.appendChild(c2);
        c1.appendChild(checkpoint1);
        root.appendChild(c1);

        checkpoint1.becomeCheckpoint(false);
        checkpoint2.becomeCheckpoint(true);

        testAll("reverse appends");

        test("post toggle checkpoint 1 - checkpoint 1", () => {
            checkpoint1.updateCheckpoint(true);
            expect(checkpoint1.getStatus()).toEqual({ focus: true, shallowFocus: false });
        });

        test("post toggle checkpoint 1 - checkpoint 2", () => {
            expect(checkpoint2.getStatus()).toEqual({ focus: true, shallowFocus: false });
        });

        test("post toggle checkpoint 1 back to false - checkpoint 1", () => {
            checkpoint1.updateCheckpoint(false);
            expect(checkpoint1.getStatus()).toEqual({
                focus: false,
                shallowFocus: false,
            });
        });

        test("post toggle checkpoint 1 back to false - checkpoint 2", () => {
            expect(checkpoint2.getStatus()).toEqual({ focus: false, shallowFocus: true });
        });

        test("checkpoint 2 becomes non-checkpoint", () => {
            checkpoint2.becomeNormal();
            expect(checkpoint2.getStatus()).toEqual({
                focus: false,
                shallowFocus: false,
            });
            expect(c4.getStatus()).toEqual({ focus: false, shallowFocus: false });
        });
    });

    function testAll(type: string) {
        test("root " + type, () => {
            expect(nodes.root.getStatus()).toEqual({ focus: true, shallowFocus: false });
        });

        test("c1 " + type, () => {
            expect(nodes.c1.getStatus()).toEqual({ focus: true, shallowFocus: false });
        });

        test("checkpoint1 " + type, () => {
            expect(nodes.checkpoint1.getStatus()).toEqual({
                focus: false,
                shallowFocus: false,
            });
        });

        test("c2 " + type, () => {
            expect(nodes.c2.getStatus()).toEqual({ focus: false, shallowFocus: false });
        });

        test("c3 " + type, () => {
            expect(nodes.c3.getStatus()).toEqual({ focus: false, shallowFocus: false });
        });

        test("checkpoint2 " + type, () => {
            expect(nodes.checkpoint2.getStatus()).toEqual({
                focus: false,
                shallowFocus: true,
            });
        });

        test("c4 " + type, () => {
            expect(nodes.c4.getStatus()).toEqual({ focus: false, shallowFocus: true });
        });
    }
});

function getNodes() {
    return {
        root: new Focus(),
        c1: new Focus(),
        checkpoint1: new Focus(),
        c2: new Focus(),
        c3: new Focus(),
        checkpoint2: new Focus(),
        c4: new Focus(),
    };
}
