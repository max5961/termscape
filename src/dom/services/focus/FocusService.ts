import type { FocusStatus } from "../../../Types.js";
import type { DomElement } from "../../DomElement.js";
import { FocusNode } from "./FocusNode.js";

export interface IFocusService {
    focus(): void;
    blur(): void;
    getFocus(): boolean;
    getShallowFocus(): boolean;
    getFocusStatus(): FocusStatus;
}

export class FocusService implements IFocusService {
    protected _node: FocusNode;
    public get node() {
        return this._node;
    }
    public host: DomElement;

    constructor(host: DomElement) {
        this._node = new FocusNode(host);
        this.host = host;
    }

    public focus() {
        this._node.focusSelf();
    }
    public blur() {
        this._node.blurSelf();
    }
    public getFocus() {
        return this._node.status.focus;
    }
    public getShallowFocus(): boolean {
        return this._node.status.shallowFocus;
    }
    public getFocusStatus(): FocusStatus {
        return this._node.status;
    }

    public addFocusNodeChild(child: FocusService) {
        this.node.addChild(child._node);
    }
    public removeFocusNodeChild(child: FocusService) {
        this.node.removeChild(child._node);
    }
}
