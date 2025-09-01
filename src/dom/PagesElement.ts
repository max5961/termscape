import type { BaseProps } from "../Props.js";
import type { BaseShadowStyle, BaseStyle } from "../style/Style.js";
import type { TTagNames } from "../Types.js";
import { DomElement } from "./DomElement.js";

/**
 * The `PagesElement` does not manage focus like `ListElement` and `PageElement`,
 * rather it keeps a virtual array of children, and decides the which one
 * of the children is displayed by adding the current page to the 'real' children
 * array and removing when the next page is focused.  A perf benefit of this is
 * that unfocused pages are not part of the rendering process.  Unfocused pages
 * are also disconnected from the RootElement, so they aren't considered during
 * mouse or key events.
 */

export class PagesElement extends DomElement<BaseStyle, BaseShadowStyle> {
    public override tagName: TTagNames;
    private _idx: number;
    private pages: DomElement[];

    constructor() {
        super();
        this.tagName = "PAGES_ELEMENT";
        this._idx = 0;
        this.pages = [];
    }

    protected override defaultStyles: BaseStyle = {};
    protected override get defaultProps(): BaseProps {
        return {};
    }

    // TODO
    public override insertBefore(_child: DomElement, _beforeChild: DomElement): void {}

    public override appendChild(child: DomElement): void {
        this.pages.push(child);
        if (this.pages.length === 1) {
            super.appendChild(child);
        }
    }

    public override removeChild(_child: DomElement, _freeRecursive?: boolean): void {
        // const idx = this.pages.indexOf(child);
        // if (idx === -1) throwError(this.getRoot(), "invalid child");
        // this.pages.splice(idx, 1);
        // super.removeChild(child, freeRecursive);
        //
        // if (!this.currentPage) {
        //     this.idx = this.pages.length - 1;
        // }
    }

    private get idx() {
        return this._idx;
    }

    private set idx(nextIdx: number) {
        if (nextIdx >= 0 && nextIdx <= this.pages.length - 1) {
            const prev = this.pages[this.idx];
            const next = this.pages[nextIdx];
            this.swapDisplayedPage(prev, next);
            this._idx = nextIdx;
        }
    }

    private swapDisplayedPage(
        prev: DomElement | undefined,
        next: DomElement | undefined,
    ) {
        if (prev && next) {
            super.removeChild(prev);
        }
        if (next) {
            super.appendChild(next);
        }
    }

    public get currentPage(): DomElement | undefined {
        return this.pages[this.idx];
    }

    public focusNextPage() {
        if (this.idx + 1 <= this.pages.length - 1) {
            ++this.idx;
        }
    }

    public focusPrevPage() {
        if (this.idx - 1 >= 0) {
            --this.idx;
        }
    }

    public focusPage(page: DomElement) {
        if (this.currentPage === page) return;
        const idx = this.pages.indexOf(page);
        if (idx >= 0) {
            this.idx = idx;
        }
    }
}
