import { DomElement } from "./DomElement.js";
import { TagNameEnum, BOOK_ELEMENT } from "../Constants.js";
import type { BaseProps, Props } from "../Props.js";
import type { BaseStyle, BoxStyle } from "../style/Style.js";
import { ErrorMessages } from "../shared/ErrorMessages.js";

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
    Style: BoxStyle;
    Props: Props.Book;
}> {
    protected static override identity = BOOK_ELEMENT;

    private pages: DomElement[];
    private pagesSet: Set<DomElement>;

    constructor() {
        super();
        this.pages = [];
        this.pagesSet = new Set();
    }

    public override get tagName(): typeof TagNameEnum.Book {
        return "book";
    }

    protected override get defaultStyles(): BaseStyle {
        return {};
    }

    protected override get defaultProps(): BaseProps {
        return {};
    }

    /*
     * BookElement has only 1 real child at a time.  The rest are detached from
     * tree but privately stored.
     * */
    override get children(): readonly DomElement<{
        Style: BaseStyle;
        Props: BaseProps;
    }>[] {
        return this.pages;
    }

    private get pageIdx(): number {
        return this.pages.findIndex((page) => page === this.currentPage);
    }

    private hasPage(page: DomElement | undefined): boolean {
        if (!page) return false;
        return this.pagesSet.has(page);
    }

    public get currentPage(): DomElement | undefined {
        return super.children[0];
    }

    public override insertBefore(child: DomElement, beforeChild: DomElement): void {
        const nextPages: DomElement[] = [];
        let beforeChildExists = false;
        for (let i = 0; i < this.pages.length; ++i) {
            if (this.pages[i] === beforeChild) {
                beforeChildExists = true;
                nextPages.push(child);
            }
            nextPages.push(this.pages[i]);
        }

        this.pages = nextPages;
        this.pagesSet.add(child);

        if (!beforeChildExists) {
            this.throwError(ErrorMessages.insertBefore);
        }
    }

    public override appendChild(child: DomElement): void {
        this.pages.push(child);
        this.pagesSet.add(child);
        if (this.pages.length === 1) {
            super.appendChild(child);
        }
    }

    public override removeChild(child: DomElement, freeRecursive?: boolean): void {
        this.pagesSet.delete(child);

        // Display an adjacent page if removing currently displayed
        if (child === this.currentPage) {
            const idx = this.pageIdx;
            const nextPage = this.pages[idx - 1] || this.pages[idx + 1];
            this.displayPage(nextPage, freeRecursive, true);
        }

        // Handle the 'virtual' pages array that only exists in this class.
        const idx = this.pages.findIndex((page) => page === child);
        if (idx < 0) {
            this.throwError(ErrorMessages.removeChild);
        }

        this.pages.splice(idx, 1);
    }

    /*
     * Most important controller for the class. **Always** removes the
     * `currentPage` from the DomElement.children array, *then* attempts to
     * display the requested page
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
        this.displayPage(this.pages[idx]);
    }

    public focusPrevPage() {
        const idx = this.pageIdx - 1;
        this.displayPage(this.pages[idx]);
    }

    public focusPage(page: DomElement): void;
    public focusPage(index: number): void;
    public focusPage(pageOrIndex: DomElement | number): void {
        if (typeof pageOrIndex === "number") {
            this.displayPage(this.pages[pageOrIndex]);
        } else {
            this.displayPage(pageOrIndex);
        }
    }
}
