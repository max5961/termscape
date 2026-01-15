import type { VisualNodeMap } from "../Types.js";
import type { DomElement } from "./DomElement.js";
import { FocusManager } from "./FocusManager.js";
import { TagNameEnum } from "../Constants.js";
import { LIST_ELEMENT } from "../Constants.js";
import type { Style } from "./style/Style.js";
import type { Props } from "./props/Props.js";

export class ListElement extends FocusManager<{
    Style: Style.List;
    Props: Props.List;
}> {
    protected static override identity = LIST_ELEMENT;

    constructor() {
        super();
    }

    public override get tagName(): typeof TagNameEnum.List {
        return "list";
    }

    protected override get defaultStyles(): Style.List {
        return {
            flexDirection: "column",
            flexWrap: "nowrap",
            overflow: "scroll",
            height: "100",
            width: "100",
        };
    }

    protected override get defaultProps(): Props.List {
        return {
            blockChildrenShrink: true,
            fallthrough: false,
            keepFocusedCenter: false,
            keepFocusedVisible: true, // TODO
        };
    }

    public focusNext(units = 1) {
        return this.isLTR() ? super.displaceRight(units) : super.displaceDown(units);
    }
    public focusPrev(units = 1) {
        return this.isLTR() ? super.displaceLeft(units) : super.displaceUp(units);
    }
    public focusFirst() {
        return this.isLTR() ? super.focusFirstX() : super.focusFirstY();
    }
    public focusLast() {
        return this.isLTR() ? super.focusLastX() : super.focusLastY();
    }
    public override focusChild(child: DomElement) {
        return super.focusChild(child);
    }
    public focusIndex(idx: number) {
        return this.isLTR() ? super.focusXIdx(idx) : super.focusYIdx(idx);
    }
    public getFocusedIndex(): number {
        const data = this.getFocusedData();
        return data?.xIdx || data?.yIdx || 0;
    }

    private isLTR(): boolean | undefined {
        return this.style.flexDirection?.includes("row");
    }

    protected override getNavigableChildren(): DomElement[] {
        return this._children.slice();
    }

    // CHORE - this always focuses the first appended child.  This might not be
    // the worst, as a `startingFocus` feature could still work with minimal
    // refactoring

    protected override handleAppendChild(child: DomElement): void {
        // In order to satisfy FocusNode dispatching focus change handlers ONLY when provider status changes, its important
        // to make sure NOT to use _setOwnProvider here.
        if (this._children.length === 1) {
            child._becomeProvider(true);
            this.focused = child;
        } else {
            child._becomeProvider(false);
        }
    }

    protected override handleRemoveChild(
        child: DomElement,
        freeRecursive?: boolean,
    ): void {
        child._focusNode.becomeConsumer(freeRecursive);
    }

    protected override buildVisualMap(children: DomElement[], vmap: VisualNodeMap): void {
        const isColumn = this.style.flexDirection?.includes("column");

        if (!isColumn) {
            const sortedX = children.sort((prev, curr) => {
                const prevStart = prev.unclippedRect?.corner.x ?? 0;
                const currStart = curr.unclippedRect?.corner.x ?? 0;
                return prevStart - currStart;
            });
            for (let i = 0; i < sortedX.length; ++i) {
                const curr = sortedX[i];
                const prev = sortedX[i - 1] as DomElement | undefined;
                const next = sortedX[i + 1] as DomElement | undefined;

                if (!vmap.has(curr)) {
                    vmap.set(curr, {});
                }
                const data = vmap.get(curr)!;

                data.xIdx = i;
                data.xArr = sortedX;
                data.left = prev;
                data.right = next;
            }
        } else {
            const sortedY = children.sort((prev, curr) => {
                const prevStart = prev.unclippedRect?.corner.y ?? 0;
                const currStart = curr.unclippedRect?.corner.y ?? 0;
                return prevStart - currStart;
            });
            for (let i = 0; i < sortedY.length; ++i) {
                const curr = sortedY[i];
                const prev = sortedY[i - 1] as DomElement | undefined;
                const next = sortedY[i + 1] as DomElement | undefined;

                if (!vmap.has(curr)) {
                    vmap.set(curr, {});
                }
                const data = vmap.get(curr)!;
                data.yIdx = i;
                data.yArr = sortedY;
                data.up = prev;
                data.down = next;
            }
        }
    }
}

type BigListProps<T> = {
    initialNumToRender: number;
    renderItem: (item: T) => DomElement;
    getData: () => T[];
};

export class BigList<T> extends ListElement {
    private winstart: number;
    private winend!: number;
    private initialNumToRender: number;
    private renderItem: (_item: T) => DomElement;
    private getData: () => T[];
    private data: ReturnType<BigListProps<T>["getData"]>;
    private generatedItems: DomElement[];
    private focusedIdx: number;

    constructor(props: BigListProps<T>) {
        super();
        this.initialNumToRender = props.initialNumToRender;
        this.renderItem = props.renderItem;
        this.getData = props.getData;
        this.data = this.updateData();
        this.winstart = this.initialNumToRender ?? 0;
        this.updateMaxWin();
        this.generatedItems = [];
        this.focusedIdx = this.winstart;

        this.handleSliceChange();
    }

    private updateData(): T[] {
        this.data = this.getData();
        return this.data;
    }

    private handleIdxChange(nextIdx: number) {
        if (nextIdx < 0 || nextIdx >= this.data.length) return;

        let displacement = 0;
        if (nextIdx < this.winstart) {
            displacement = -(this.winstart - nextIdx);
        }
        if (nextIdx >= this.winend) {
            displacement = nextIdx - this.winend + 1;
        }

        if (!displacement) {
            this.focusedIdx = nextIdx;
            return this.handleFocusChange();
        }

        this.winstart += displacement;
        this.winend += displacement;
        this.focusedIdx = nextIdx;
        return this.handleSliceChange();
    }

    private handleSliceChange() {
        this.updateRealChildren();
        return this.handleFocusChange();
    }

    private handleFocusChange() {
        const fromEnd = this.winend - this.focusedIdx;
        const virFocusIdx = this.generatedItems.length - fromEnd;
        const item = this.generatedItems[virFocusIdx];
        return this.focusChild(item);
    }

    private updateRealChildren(): void {
        this.generatedItems = [];

        for (let i = this.winstart; i < this.winend; ++i) {
            const dataItem = this.data[i];
            if (dataItem) {
                this.generatedItems.push(this.renderItem(dataItem));
            }
        }

        // This is where FocusManager is 'picking' an index to focus and running
        // focusChild automatically, see 'FocusManager.removeChild' which checks to
        // see if the child being removed is focused, if it is then it shifts focus
        [...this._children].forEach((child) => this.removeChild(child));
        this.generatedItems.forEach((child) => this.appendChild(child));

        // The real issue with this design is that once you remove or add a child
        // you need to refresh the visual map to be safe. For the first render, this
        // shouldn't really be an issue because there is no stdin to manipulate the
        // list.  However, to ultimately be **safe**, it you may need to refresh
        // the vmap on every tree manip and that could end up with a lot of redundancy
        this.refreshVisualMap();
    }

    private updateMaxWin(): void {
        const rows = this.getRoot()?.runtime.stdout.rows ?? 0;
        const cols = this.getRoot()?.runtime.stdout.columns ?? 0;
        const isColumn = this.style.flexDirection?.includes("column");
        const max = Math.max(
            rows,
            cols,
            isColumn
                ? this.getRoot()?.runtime.stdout.rows ?? process.stdout.rows
                : this.getRoot()?.runtime.stdout.columns ?? process.stdout.columns,
        );

        this.winend = this.winstart + max + 1;
    }

    public override focusNext(units = 1) {
        return this.handleIdxChange(this.focusedIdx + units);
    }

    public override focusPrev(units = 1) {
        return this.handleIdxChange(this.focusedIdx - units);
    }
}
