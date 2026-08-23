import EventEmitter from "events";
import { ElementIdentities, Yg } from "../Constants.js";
import type { InputElement } from "./InputElement.js";
import type { WriteOpts, EventPayloadMap } from "../Types.js";
import { DomElement } from "./DomElement.js";
import { Renderer } from "../render/Renderer.js";
import { HooksManager, type Hook, type HookHandler } from "../render/hooks/Hooks.js";
import type { Style } from "./style/Style.js";
import type { Props } from "./props/Props.js";
import { MetaData, MetaDataRegister } from "./services/MetaData.js";
import { DefaultStyles } from "./style/DefaultStyles.js";
import { RootCanvas } from "../compositor/Canvas.js";
import {
    RuntimeService,
    type IRuntimeService,
    type RuntimeConfig,
} from "../shared/RuntimeService.js";

export class Root extends DomElement<{
    Style: Style.Root;
    Props: Props.Root;
}> {
    protected override readonly identities = ElementIdentities.Root;

    protected runtimeService: RuntimeService;
    public hooks: HooksManager;
    protected hasRendered: boolean;
    /** @internal */
    public _register: MetaDataRegister;
    /** @internal */
    protected renderer: Renderer;
    protected emitter: EventEmitter<EventPayloadMap>;
    /** @internal */
    public override readonly _canvas: RootCanvas;

    constructor(config: RuntimeConfig) {
        super(DefaultStyles.Root);
        this._register = new MetaDataRegister(this);
        this.hooks = new HooksManager();
        this.renderer = new Renderer(this);
        this.emitter = new EventEmitter();
        this.emitter.on("MouseEvent", this.handleMouseEvent);
        this.hasRendered = false;

        // attach root to itself
        this.afterAttached(this);
        this.setDefaultYogaStyles();
        this.runtimeService = new RuntimeService(this, config);

        this._canvas = new RootCanvas(this);

        if ((config.startOnCreate ??= true)) {
            this.runtimeService.startRuntime();
        }
    }

    public get runtime(): IRuntimeService {
        return this.runtimeService;
    }

    protected get scheduler() {
        return this.runtimeService.scheduler;
    }

    // CHORE - changed the Style.Root type so this needs to be changed to allow
    // root to set the allowed styles

    /** No op - Root cannot set styles */
    override set style(_stylesheet: Style.Root) {}

    /** Return empty object - Root cannot set styles */
    override get style(): Style.Root {
        return {};
    }

    // CHORE - Need to override appendChild/insertChild to throw when trying to
    // append another instance of Root

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

    // CHORE - these handle pre/post DomElement attachment to the Root.  The name
    // is vague given that DomElement is not part of the name

    /** @internal */
    public handleAttachment(metadata: MetaData) {
        this._register.attach(metadata);
    }

    /** @internal */
    public handleDetachment(metadata: MetaData) {
        this._register.detach(metadata);
    }

    public exit<T extends Error | undefined>(error?: T): T extends Error ? never : void {
        this.runtimeService.endRuntime(error);
        return undefined as T extends Error ? never : void;
    }

    public startRuntime() {
        this.runtimeService.startRuntime();
        this.scheduleRender();
    }

    public waitUntilExit() {
        return this.runtimeService.createExitResolver();
    }

    public getLayoutHeight() {
        return this.renderer.layoutHeight;
    }

    // TODO
    // public get onExit() {
    //     return this._domEventService.getSingle("exit");
    // }
    // public set onExit(cb: () => unknown) {
    //     this._domEventService.setSingle("exit");
    // }

    // CHORE - underscore prefix these internals

    /** @internal */
    public render = (opts: WriteOpts = {}) => {
        if (opts.resize) {
            this._register.recalculateViewports();
        }

        if (this.hasRendered) {
            this.renderer.renderTree(opts);
        } else {
            this.renderer.renderTree({ ...opts, layoutChange: true });
            this.hasRendered = true;
        }
    };

    /** @internal */
    public scheduleRender(opts: WriteOpts = {}) {
        if (this.runtimeService.getState().hasStarted) {
            this.scheduler.scheduleUpdate(this.render, opts);
        }
    }

    private handleMouseEvent = (...[x, y, type]: EventPayloadMap["MouseEvent"]) => {
        const target = this.renderer.getRects().findTargetElement(x, y);
        if (!target) return;

        target._domEventService.dispatchMouseEvent(x, y, type);
    };

    /** @internal */
    public requestInputStream() {
        this.runtimeService.requestStdin();
    }

    /** @internal */
    public requestInputStreamOwnership(elem: InputElement): boolean {
        if (this.runtimeService.getInputStreamOwner()) {
            return false;
        }

        this.runtimeService.setInputStreamOwner(elem);
        return true;
    }

    /** @internal */
    public forfeitInputStreamOwnership(elem: InputElement) {
        if (this.runtimeService.getInputStreamOwner() === elem) {
            this.runtimeService.setInputStreamOwner(undefined);
        }
    }
}
