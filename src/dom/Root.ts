import Yoga from "yoga-wasm-web/auto";
import EventEmitter from "events";
import { type Action } from "term-keymap";
import { RenderHooksManager } from "../render/RenderHooks.js";
import { DomElement } from "./DomElement.js";
import { Scheduler } from "../shared/Scheduler.js";
import { Renderer } from "../render/Renderer.js";
import { createRuntime, type Runtime } from "../shared/RuntimeFactory.js";
import type { EventEmitterMap, RuntimeConfig, WriteOpts } from "../Types.js";
import type { BaseStyle } from "../style/Style.js";
import { recalculateStyle } from "../style/util/recalculateStyle.js";
import type { BaseProps } from "../Props.js";
import type { TagNameEnum } from "../Constants.js";

export class Root extends DomElement {
    public hooks: RenderHooksManager;
    public runtime: Runtime["api"];

    protected override readonly rootRef: { readonly root: Root };

    private hasRendered: boolean;
    private scheduler: Scheduler;
    private renderer: Renderer;
    private runtimeCtl: Runtime["logic"];
    private Emitter: EventEmitter<EventEmitterMap>;
    private attached: {
        actions: Map<DomElement, Set<Action>>;
        viewportEls: Set<DomElement>;
    };

    // Handle work that can only be done once the Yoga layout is known
    private postLayoutOps: (() => unknown)[];

    constructor(config: RuntimeConfig) {
        super();
        this.rootRef = { root: this };
        this.hasRendered = false;
        this.postLayoutOps = [];

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
            viewportEls: new Set(),
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
        if (config.startOnCreate ?? true) {
            this.runtimeCtl.startRuntime();
        }
    }

    public override get tagName(): typeof TagNameEnum.Root {
        return "root";
    }

    protected override get defaultStyles(): BaseStyle {
        return {};
    }
    protected override get defaultProps(): BaseProps {
        return {};
    }

    /**
     * @internal
     *
     * This is called post attach and pre detach in DomElement.
     * ON ATTACH:
     * It connects the `actions` Set<Action> in DomElement to this Root.
     * It passes the `viewportEls` Set<DomElement> set to the DomElement.  In
     * DomElement, viewportStyles are added through a helper function which updates
     * the Root's viewportEls set as well as the DomElements viewportStyles set.
     * ON DETACH:
     * These references are removed.
     * */
    public bridgeDomElement(
        metadata: DomElement["metadata"],
        { attached }: { attached: boolean },
    ) {
        const elem = metadata.ref;
        const { actions, viewportStyles } = metadata;

        if (attached) {
            this.attached.actions.set(elem, actions);
            metadata.viewportEls = this.attached.viewportEls;

            if (viewportStyles.size) {
                metadata.viewportEls.add(elem);
            }
        } else {
            this.attached.actions.delete(elem);
            this.attached.viewportEls.delete(elem);
            metadata.viewportEls = null;
        }
    }

    public exit<T extends Error | undefined>(error?: T): T extends Error ? never : void {
        this.runtimeCtl.endRuntime(error);
        return undefined as T extends Error ? never : void;
    }

    public startRuntime() {
        this.runtimeCtl.startRuntime();
        this.scheduleRender();
    }

    public waitUntilExit() {
        return this.runtimeCtl.createExitHandler();
    }

    public getLayoutHeight() {
        return this.renderer.lastCanvas?.grid.length ?? 0;
    }

    public render = (opts: WriteOpts = {}) => {
        if (opts.resize) {
            this.attached.viewportEls.forEach((elem) => {
                recalculateStyle(elem, "height", "width", "minHeight", "minWidth");
            });
        }

        if (opts.layoutChange || !this.hasRendered) {
            this.node.calculateLayout(
                process.stdout.columns,
                undefined,
                Yoga.DIRECTION_LTR,
            );
        }

        if (this.hasRendered) {
            this.renderer.writeToStdout(opts);
        } else {
            this.renderer.writeToStdout({ ...opts, layoutChange: true });
        }

        this.hasRendered = true;
    };

    public scheduleRender(opts: WriteOpts = {}) {
        if (this.runtimeCtl.isStarted) {
            this.scheduler.scheduleUpdate(this.render, opts);
        }
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
