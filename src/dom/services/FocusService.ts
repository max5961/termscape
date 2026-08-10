import { FocusNode } from "./FocusNode.js";

export interface IFocusService {
    focus(): void;
    blur(): void;
    getFocus(): boolean;
    getShallowFocus(): boolean;
}

export class FocusService implements IFocusService {
    public node: FocusNode;

    constructor() {
        this.node = new FocusNode();
    }

    public focus() {
        this.node.focusSelf();
    }
    public blur() {
        this.node.blurSelf();
    }
    public getFocus() {
        return this.node.status.focus;
    }
    public getShallowFocus(): boolean {
        return this.node.status.shallow;
    }

    public addChild(child: FocusService) {
        this.node.addChild(child.node);
    }
    public removeChild(child: FocusService) {
        this.node.removeChild(child.node);
    }
}
