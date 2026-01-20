import { describe, test, expect } from "vitest";
import { FocusNode } from "@src/dom/shared/FocusNode.js";
import termscape from "@src/index.js";

describe("FocusNode - appends", () => {
    let nodes = getNodes();

    describe("predictable", () => {
        const { root, c1, checkpoint1, c2, c3, checkpoint2, c4 } = nodes;

        root.addChild(c1);
        c1.addChild(checkpoint1);
        checkpoint1.addChild(c2);
        c2.addChild(c3);
        c3.addChild(checkpoint2);
        checkpoint2.addChild(c4);

        checkpoint1.becomeProvider(false);
        checkpoint2.becomeProvider(true);
        testAll("predictable");
    });

    describe("reverse appends and removes", () => {
        nodes = getNodes();
        const { root, c1, checkpoint1, c2, c3, checkpoint2, c4 } = nodes;

        checkpoint2.addChild(c4);
        c3.addChild(checkpoint2);
        c2.addChild(c3);
        checkpoint1.addChild(c2);
        c1.addChild(checkpoint1);
        root.addChild(c1);

        checkpoint1.becomeProvider(false);
        checkpoint2.becomeProvider(true);

        testAll("reverse appends");

        test("post toggle checkpoint 1 - checkpoint 1", () => {
            checkpoint1.setOwnProvider(true);
            expect(checkpoint1.getFocusState()).toEqual({
                focus: true,
                shallowFocus: false,
            });
        });

        test("post toggle checkpoint 1 - checkpoint 2", () => {
            expect(checkpoint2.getFocusState()).toEqual({
                focus: true,
                shallowFocus: false,
            });
        });

        test("post toggle checkpoint 1 back to false - checkpoint 1", () => {
            checkpoint1.setOwnProvider(false);
            expect(checkpoint1.getFocusState()).toEqual({
                focus: false,
                shallowFocus: false,
            });
        });

        test("post toggle checkpoint 1 back to false - checkpoint 2", () => {
            expect(checkpoint2.getFocusState()).toEqual({
                focus: false,
                shallowFocus: true,
            });
        });

        test("checkpoint 2 becomes non-checkpoint", () => {
            checkpoint2.becomeConsumer();
            expect(checkpoint2.getFocusState()).toEqual({
                focus: false,
                shallowFocus: false,
            });
            expect(c4.getFocusState()).toEqual({ focus: false, shallowFocus: false });
        });
    });

    function testAll(type: string) {
        test("root " + type, () => {
            expect(nodes.root.getFocusState()).toEqual({
                focus: true,
                shallowFocus: false,
            });
        });

        test("c1 " + type, () => {
            expect(nodes.c1.getFocusState()).toEqual({
                focus: true,
                shallowFocus: false,
            });
        });

        test("checkpoint1 " + type, () => {
            expect(nodes.checkpoint1.getFocusState()).toEqual({
                focus: false,
                shallowFocus: false,
            });
        });

        test("c2 " + type, () => {
            expect(nodes.c2.getFocusState()).toEqual({
                focus: false,
                shallowFocus: false,
            });
        });

        test("c3 " + type, () => {
            expect(nodes.c3.getFocusState()).toEqual({
                focus: false,
                shallowFocus: false,
            });
        });

        test("checkpoint2 " + type, () => {
            expect(nodes.checkpoint2.getFocusState()).toEqual({
                focus: false,
                shallowFocus: true,
            });
        });

        test("c4 " + type, () => {
            expect(nodes.c4.getFocusState()).toEqual({
                focus: false,
                shallowFocus: true,
            });
        });
    }
});

function getNodes() {
    return {
        root: new FocusNode(termscape.create.box()),
        c1: new FocusNode(termscape.create.box()),
        checkpoint1: new FocusNode(termscape.create.box()),
        c2: new FocusNode(termscape.create.box()),
        c3: new FocusNode(termscape.create.box()),
        checkpoint2: new FocusNode(termscape.create.box()),
        c4: new FocusNode(termscape.create.box()),
    };
}
