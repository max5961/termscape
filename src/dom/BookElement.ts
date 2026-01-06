import { DomElement } from "./DomElement.js";
import { TagNameEnum, BOOK_ELEMENT } from "../Constants.js";
import type { Style } from "./style/Style.js";
import { ErrorMessages } from "../shared/ErrorMessages.js";
import type { Props } from "./props/Props.js";

/**
 * The `BookElement` does not manage focus like `ListElement` and `PageElement`,
 * rather it keeps a virtual array of children, and decides the which one
 * of the children is displayed by adding the current page to the 'real' children
 * array and removing when the next page is focused.  A perf benefit of this is
 * that unfocused pages are not part of the rendering process.  Unfocused pages
 * are also disconnected from the RootElement, so they aren't considered during
 * mouse or key events.
 */

export class BookElement extends DomElement<{
    Style: Style.Book;
    Props: Props.Book;
}> {
    protected static override identity = BOOK_ELEMENT;

    private _pages: DomElement[];
    private _pagesSet: Set<DomElement>;

    constructor() {
        super();
        this._pages = [];
        this._pagesSet = new Set();
    }

    public override get tagName(): typeof TagNameEnum.Book {
        return "book";
    }

    protected override get defaultStyles(): Style.Book {
        return {};
    }

    protected override get defaultProps(): Props.Book {
        return {};
    }

    /*
     * BookElement has only 1 real child at a time.  The rest are detached from
     * tree but privately stored.
     * */
    override get children(): readonly DomElement[] {
        return this._pages;
    }

    private get pageIdx(): number {
        return this._pages.findIndex((page) => page === this.currentPage);
    }

    private hasPage(page: DomElement | undefined): boolean {
        if (!page) return false;
        return this._pagesSet.has(page);
    }

    public get currentPage(): DomElement | undefined {
        return super.children[0];
    }

    public override insertBefore(child: DomElement, beforeChild: DomElement): void {
        const nextPages: DomElement[] = [];
        let beforeChildExists = false;
        for (let i = 0; i < this._pages.length; ++i) {
            if (this._pages[i] === beforeChild) {
                beforeChildExists = true;
                nextPages.push(child);
            }
            nextPages.push(this._pages[i]);
        }

        this._pages = nextPages;
        this._pagesSet.add(child);

        if (!beforeChildExists) {
            this._throwError(ErrorMessages.insertBefore);
        }
    }

    public override appendChild(child: DomElement): void {
        this._pages.push(child);
        this._pagesSet.add(child);
        if (this._pages.length === 1) {
            super.appendChild(child);
        }
    }

    public override removeChild(child: DomElement, freeRecursive?: boolean): void {
        this._pagesSet.delete(child);

        // Display an adjacent page if removing currently displayed
        if (child === this.currentPage) {
            const idx = this.pageIdx;
            const nextPage = this._pages[idx - 1] || this._pages[idx + 1];
            this.displayPage(nextPage, freeRecursive, true);
        }

        // Handle the 'virtual' pages array that only exists in this class.
        const idx = this._pages.findIndex((page) => page === child);
        if (idx < 0) {
            this._throwError(ErrorMessages.removeChild);
        }

        this._pages.splice(idx, 1);
    }

    /*
     * **Always** removes the `currentPage` from the DomElement.children array,
     * *then* attempts to display the requested page
     * */
    private displayPage(
        page: DomElement | undefined,
        freeRecursive?: boolean,
        forceRemove?: boolean,
    ): void {
        if (!forceRemove) {
            if (!page || this.currentPage === page || !this.hasPage(page)) return;
        }

        const currentPage = this.currentPage;
        const nextPage = page;

        if (currentPage && super.children.length && super.children[0] === currentPage) {
            super.removeChild(currentPage, freeRecursive);
        }

        if (nextPage) {
            super.appendChild(nextPage);
        }
    }

    public focusNextPage() {
        const idx = this.pageIdx + 1;
        this.displayPage(this._pages[idx]);
    }

    public focusPrevPage() {
        const idx = this.pageIdx - 1;
        this.displayPage(this._pages[idx]);
    }

    public focusPage(page: DomElement): void;
    public focusPage(index: number): void;
    public focusPage(pageOrIndex: DomElement | number): void {
        if (typeof pageOrIndex === "number") {
            this.displayPage(this._pages[pageOrIndex]);
        } else {
            this.displayPage(pageOrIndex);
        }
    }
}
