import type { Action } from "term-keymap";
import type { Root } from "../RootElement.js";
import type { ViewportStyle } from "../../Types.js";
import type { DomElement } from "../DomElement.js";
import { recalculateStyle } from "../util/recalculateStyle.js";

/**
 * To enforce private references don't leak into the public interface but can
 * still be carefully accessed by MetaDataRegister.
 * */
const __register = Symbol("termscape.metadata_register");
const __host = Symbol("termscape.metadata_host");
const __actions = Symbol("termscape.metadata_actions");
const __viewportStyles = Symbol("termscape.metadata_viewport_styles");
const __hasRequestedStdin = Symbol("termscape.metadata_has_req_stdin");

export class MetaData {
    private readonly [__host]: DomElement;

    private [__register]: MetaDataRegister | undefined = undefined;
    private [__hasRequestedStdin] = false;
    private readonly [__actions] = new Set<Action>();
    private readonly [__viewportStyles] = new Set<ViewportStyle>();

    private get register() {
        return this[__register];
    }
    private get host() {
        return this[__host];
    }
    private get actions() {
        return this[__actions];
    }
    private get viewportStyles() {
        return this[__viewportStyles];
    }

    constructor(host: DomElement) {
        this[__host] = host;
    }

    public getRoot(): Root | undefined {
        return this.register?.root;
    }

    public addAction(action: Action) {
        if (this.register && !this.actions.size) {
            this.register.actions.set(this.host, this.actions);
        }

        this.actions.add(action);
        return () => this.actions.delete(action);
    }

    public removeAction(action: Action) {
        this.actions.delete(action);

        if (this.register && !this.actions.size) {
            this.register.actions.delete(this.host);
        }
    }

    /** For simplicity, once marked as having a viewport style, this is permanent */
    public markAsViewport(style: ViewportStyle) {
        this.viewportStyles.add(style);

        if (this.register) {
            this.register.viewportEls.add(this.host);
        }
    }

    /** Once called, this function permanently marks this node as requiring stdin */
    public requestStdin() {
        this[__hasRequestedStdin] = true;

        const root = this.register?.root;
        if (root) {
            root.requestInputStream();
        }
    }
}

/**
 * Gives the Root element a live reference to the metadata of attached
 * DomElements
 * */
export class MetaDataRegister {
    private readonly _root: Root;
    private readonly _actions: Map<DomElement, Set<Action>>;
    private readonly _viewportEls: Set<DomElement>;

    public get root() {
        return this._root;
    }
    public get actions() {
        return this._actions;
    }
    public get viewportEls() {
        return this._viewportEls;
    }

    constructor(root: Root) {
        this._root = root;
        this._actions = new Map();
        this._viewportEls = new Set();
    }

    public attach(metadata: MetaData) {
        metadata[__register] = this;

        if (metadata[__actions].size) {
            this._actions.set(metadata[__host], metadata[__actions]);
        }

        if (metadata[__viewportStyles].size) {
            this._viewportEls.add(metadata[__host]);
            metadata[__viewportStyles].forEach((style) =>
                recalculateStyle(metadata[__host], style),
            );
        }

        if (metadata[__hasRequestedStdin]) {
            this._root.requestInputStream();
        }
    }

    public detach(metadata: MetaData) {
        metadata[__register] = undefined;
        this._actions.delete(metadata[__host]);
        this._viewportEls.delete(metadata[__host]);
    }

    public recalculateViewports() {
        this._viewportEls.forEach((el) => {
            recalculateStyle(el, "height", "width", "minHeight", "minWidth");
        });
    }
}

// ----Old System----
// public handleAttachmentChange(
//     metadata: DomElement["_metadata"],
//     { attached }: { attached: boolean },
// ) {
//     const elem = metadata.ref;
//     const { actions, viewportStyles } = metadata;
//
//     if (attached) {
//         this.attached.actions.set(elem, actions);
//
//         metadata.viewportEls = this.attached.viewportEls;
//         viewportStyles.forEach((style) => recalculateStyle(metadata.ref, style));
//         if (viewportStyles.size) {
//             metadata.viewportEls.add(elem);
//         }
//     } else {
//         this.attached.actions.delete(elem);
//         this.attached.viewportEls.delete(elem);
//         metadata.viewportEls = null;
//     }
// }
