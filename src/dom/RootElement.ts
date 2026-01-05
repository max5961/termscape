import EventEmitter from "events";
import { Yg, type TagNameEnum } from "../Constants.js";
import type { InputElement } from "./InputElement.js";
import type { EventEmitterMap, RuntimeConfig, WriteOpts } from "../Types.js";
import { DomElement } from "./DomElement.js";
import { Scheduler } from "../shared/Scheduler.js";
import { Renderer } from "../render/Renderer.js";
import { createRuntime, type Runtime } from "../shared/RuntimeFactory.js";
import { HooksManager, type Hook, type HookHandler } from "../render/hooks/Hooks.js";
import { ROOT_ELEMENT, TEST_ROOT_ELEMENT } from "../Constants.js";
import type { Style } from "./style/Style.js";
import type { Props } from "./props/Props.js";
import { MetaData, MetaDataRegister } from "./shared/MetaData.js";

export class Root extends DomElement<{
    Style: Style.Root;
    Props: Props.Root;
}> {
    protected static override identity = ROOT_ELEMENT;

    private hasRendered: boolean;
    public runtime: Runtime["api"];
    public hooks: HooksManager;
    private _register: MetaDataRegister;
    private scheduler: Scheduler;
    private renderer: Renderer;
    private runtimeCtl: Runtime["logic"];
    private emitter: EventEmitter<EventEmitterMap>;

    constructor(config: RuntimeConfig) {
        super();
        this._register = new MetaDataRegister(this);
        this.hooks = new HooksManager();
        this.renderer = new Renderer(this);
        this.scheduler = new Scheduler({ isTestRoot: this._is(TEST_ROOT_ELEMENT) });
        this.emitter = new EventEmitter();
        this.emitter.on("MouseEvent", this.handleMouseEvent);
        this.hasRendered = false;

        // attach root to itself
        this.afterAttached(this);
        this.setDefaultYogaStyles();

        const { api, logic } = createRuntime({
            config: config,
            root: this,
            scheduler: this.scheduler,
            emitter: this.emitter,
            actions: this._register.actions,
        });

        this.runtime = api;
        this.runtimeCtl = logic;

        if (config.startOnCreate !== false) {
            this.runtimeCtl.startRuntime();
        }
    }

    public override get tagName(): typeof TagNameEnum.Root {
        return "root";
    }

    protected override get defaultStyles(): Style.Root {
        return {};
    }
    protected override get defaultProps(): Props.Root {
        return {};
    }

    /** No op - Root cannot set styles */
    override set style(_stylesheet: Style.Root) {}

    /** Return empty object - Root cannot set styles */
    override get style(): Style.Root {
        return {};
    }

    private setDefaultYogaStyles() {
        this._node.setFlexWrap(Yg.WRAP_NO_WRAP);
        this._node.setFlexDirection(Yg.FLEX_DIRECTION_ROW);
        this._node.setFlexGrow(0);
        this._node.setFlexShrink(1);
    }

    public addHook<T extends Hook>(hook: T, cb: HookHandler<T>) {
        this.hooks.addHook(hook, cb);
    }

    public removeHook<T extends Hook>(hook: T, cb: HookHandler<T>) {
        this.hooks.removeHook(hook, cb);
    }

    /** @internal */
    public handleAttachment(metadata: MetaData) {
        this._register.attach(metadata);
    }

    /** @internal */
    public handleDetachment(metadata: MetaData) {
        this._register.detach(metadata);
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
            this._register.recalculateViewports();
        }

        if (opts.layoutChange || !this.hasRendered) {
            this._calculateYogaLayout();
        }

        if (this.hasRendered) {
            this.renderer.writeToStdout(opts);
        } else {
            this.renderer.writeToStdout({ ...opts, layoutChange: true });
        }

        this.hasRendered = true;
    };

    /** @internal */
    public _calculateYogaLayout = () => {
        this._node.calculateLayout(
            this.runtime.stdout.columns,
            undefined,
            Yg.DIRECTION_LTR,
        );
    };

    public scheduleRender(opts: WriteOpts = {}) {
        if (this.runtimeCtl.isStarted) {
            this.scheduler.scheduleUpdate(this.render, opts);
        }
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

    /** @internal */
    public requestInputStream() {
        this.runtimeCtl.resumeStdin();
    }

    /** @internal */
    public requestInputStreamOwnership(elem: InputElement): boolean {
        if (this.runtimeCtl.inputStreamOwner) {
            return false;
        }

        this.runtimeCtl.setInputStreamOwner(elem);
        return true;
    }

    /** @internal */
    public forfeitInputStreamOwnership(elem: InputElement) {
        if (this.runtimeCtl.inputStreamOwner === elem) {
            this.runtimeCtl.setInputStreamOwner(null);
        }
    }
}
