import Yoga from "yoga-wasm-web/auto";
import EventEmitter from "events";
import { RenderHooksManager } from "../render/RenderHooks.js";
import { DomElement } from "./DomElement.js";
import { Scheduler } from "./Scheduler.js";
import { Renderer, type WriteOpts } from "../render/Renderer.js";
import { createRuntime, type Runtime } from "./RuntimeFactory.js";
import { type EventEmitterMap, type RuntimeConfig, type TTagNames } from "../types.js";
import { type Action } from "term-keymap";

/** Internal access symbol */
export const ROOT_BRIDGE_DOM_ELEMENT = Symbol.for("termscape.root.bridge_dom_element");

export class Root extends DomElement {
    public tagName: TTagNames;
    public hooks: RenderHooksManager;
    public runtime: Runtime["api"];

    protected override readonly rootRef: { readonly root: Root };

    private scheduler: Scheduler;
    private renderer: Renderer;
    private runtimeCtl: Runtime["logic"];
    private Emitter: EventEmitter<EventEmitterMap>;
    private exitPromiseResolvers: (() => void)[];
    private attached: {
        actions: Map<DomElement, Set<Action>>;
        dynamicEls: Set<DomElement>;
    };

    constructor(config: RuntimeConfig) {
        super();
        this.tagName = "ROOT_ELEMENT";
        this.rootRef = { root: this };

        this.node.setFlexWrap(Yoga.WRAP_NO_WRAP);
        this.node.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);
        this.node.setFlexGrow(0);
        this.node.setFlexShrink(1);

        this.renderer = new Renderer(this);
        this.hooks = new RenderHooksManager(this.renderer.hooks);
        this.scheduler = new Scheduler();

        this.Emitter = new EventEmitter();
        this.Emitter.on("MouseEvent", this.handleMouseEvent);

        this.attached = {
            actions: new Map(),
            dynamicEls: new Set(),
        };

        // Root element is considered attached to itself.
        this.afterAttached();

        const { api, logic } = createRuntime({
            config: config,
            root: this,
            scheduler: this.scheduler,
            emitter: this.Emitter,
            attached: this.attached,
        });

        this.runtime = api;
        this.runtimeCtl = logic;

        this.exitPromiseResolvers = [];

        this.runtimeCtl.startRuntime();
    }

    /**
     * This is called post attach and pre detach in DomElement.
     * ON ATTACH:
     * It connects the `actions` Set<Action> in DomElement to this Root.
     * It passes the `dynamicEls` Set<DomElement> set to the DomElement.  In
     * DomElement, dynamicStyles are added through a helper function which updates
     * the Root's dynamicEls set as well as the DomElements dynamicStyles set.
     * ON DETACH:
     * These references are removed.
     * */
    public [ROOT_BRIDGE_DOM_ELEMENT](
        metadata: DomElement["metadata"],
        { attached }: { attached: boolean },
    ) {
        const elem = metadata.ref;
        const { actions, dynamicStyles } = metadata;

        if (attached) {
            this.attached.actions.set(elem, actions);
            metadata.dynamicEls = this.attached.dynamicEls;

            if (dynamicStyles.size) {
                metadata.dynamicEls.add(elem);
            }
        } else {
            this.attached.actions.delete(elem);
            this.attached.dynamicEls.delete(elem);
            metadata.dynamicEls = null;
        }
    }

    public exit<T extends Error | undefined>(error?: T): T extends Error ? never : void {
        this.runtimeCtl.endRuntime(error);
        this.exitPromiseResolvers.forEach((res) => res());
        this.exitPromiseResolvers = [];
        return undefined as T extends Error ? never : void;
    }

    // ** Promise resolves when execution  */
    public run() {
        return new Promise<void>((res) => {
            this.exitPromiseResolvers.push(() => res());
        });
    }

    public getLayoutHeight() {
        return this.renderer.lastCanvas?.grid.length ?? 0;
    }

    public render(opts: WriteOpts = {}) {
        if (opts.resize) {
            this.attached.dynamicEls.forEach((elem) => {
                /* Force recalculate dimensions via style proxy */
                /* eslint-disable no-self-assign */
                elem.style.height = elem.style.height;
                elem.style.width = elem.style.width;
                elem.style.minHeight = elem.style.minHeight;
                elem.style.minWidth = elem.style.minWidth;
            });
        }

        if (!opts.skipCalculateLayout) {
            this.node.calculateLayout(
                process.stdout.columns,
                undefined,
                Yoga.DIRECTION_LTR,
            );
        }

        this.renderer.writeToStdout(opts);
    }

    // FUTURE-BUG: scheduler needs to coalesce WriteOpts as well
    public scheduleRender(opts: WriteOpts = {}) {
        this.scheduler.scheduleUpdate(() => {
            this.render(opts);
        });
    }

    public requestInputStream() {
        this.runtimeCtl.resumeStdin();
    }

    private handleMouseEvent: (...args: EventEmitterMap["MouseEvent"]) => unknown = (
        x,
        y,
        type,
    ) => {
        const element = this.renderer.rects.findTargetElement(x, y);
        if (!element) return;

        this.propagateMouseEvent(x, y, type, element);
    };
}
