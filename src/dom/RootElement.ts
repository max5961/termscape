import { DomElement, MetaData, Props } from "./DomElement.js";

export class RootElement extends DomElement {
    constructor() {
        super();
        this.isRoot = true;
    }

    public setAttributes(props: Props & MetaData): void {
        //
    }

    public addEventListener(): void {
        //
    }
}
