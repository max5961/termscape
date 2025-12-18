import type { TagNameEnum } from "../Constants.js";
import type { BaseProps } from "../Props.js";
import { ErrorMessages, throwError } from "../shared/ThrowError.js";
import type { BaseStyle } from "../style/Style.js";
import { DomElement } from "./DomElement.js";

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
    Style: BaseStyle;
    Props: BaseProps;
}> {
    private pages: DomElement[];

    constructor() {
        super();
        this.pages = [];
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

    private getIdx(): number {
        return this.pages.findIndex((page) => page === this.currentPage);
    }

    private hasPage(page: DomElement | undefined): boolean {
        if (!page) return false;
        return this.pages.includes(page);
    }

    public get currentPage(): DomElement | undefined {
        return this.children[0];
    }

    // TODO
    public override insertBefore(_child: DomElement, _beforeChild: DomElement): void {
        throwError(this.getRoot(), "PageElement - todo");
    }

    public override appendChild(child: DomElement): void {
        this.pages.push(child);
        if (this.pages.length === 1) {
            super.appendChild(child);
        }
    }

    // TODO
    public override removeChild(child: DomElement, freeRecursive?: boolean): void {
        // Handle the 'display' array (DomElement.children)
        if (child === this.currentPage) {
            const idx = this.getIdx();
            const nextPage = this.pages[idx - 1] || this.pages[idx + 1];
            this.displayPage(nextPage, freeRecursive, true);
        }

        // Handle the 'virtual' pages array that only exists in this class.
        const idx = this.pages.findIndex((page) => page === child);
        if (idx < 0) {
            throwError(this.getRoot(), ErrorMessages.removeChild);
        }

        this.pages.splice(idx, 1);
    }

    /**
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
        const hasPage = this.hasPage(page);

        if (currentPage && (forceRemove || hasPage)) {
            super.removeChild(currentPage, freeRecursive);
        }
        if (page && hasPage) {
            super.appendChild(page);
        }
    }

    public focusNextPage() {
        const idx = this.getIdx() + 1;
        this.displayPage(this.pages[idx]);
    }

    public focusPrevPage() {
        const idx = this.getIdx() - 1;
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
