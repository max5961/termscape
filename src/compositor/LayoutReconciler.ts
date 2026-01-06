import { FOCUS_MANAGER } from "../Constants.js";
import type { DomElement } from "../dom/DomElement.js";

type Level = {
    focusManagers: (() => boolean)[];
    scrollManagers: (() => boolean)[];
    afterLayout: (() => boolean)[];
};

/**
 * Stores callbacks from elements which may request layout reconciliation after
 * the layout is completed.  This is necessary to allow reconciliation within the
 * same render, rather than offloading side effects to the next render.  These
 * are returned in sorted order so that parent effects are applied before child
 * effects.
 *
 * This handles the following examples:
 * - A resize event creates a larger content area and as a result de-optimizes
 *   the corner offset of an element managing its scrollable content or the same
 *   resize event moves the focused element out of view.
 * - A user creates an afterLayout callback.
 * */
export class LayoutReconciler {
    private _levels: Record<number, Level>;

    constructor() {
        this._levels = {};
    }

    public handleElement(elem: DomElement, level: number) {
        if (elem._is(FOCUS_MANAGER) && elem._lastOffsetChangeWasFocus) {
            this.prepareLevel(level);
            this.getLevel(level).focusManagers.push(() => {
                return elem._adjustOffsetToFocus();
            });
        }

        if (elem._shadowStyle.overflow === "scroll") {
            this.prepareLevel(level);
            this.getLevel(level).scrollManagers.push(() => {
                return elem._adjustScrollToFillContainer();
            });
        }

        if (elem._afterLayoutHandlers.size) {
            this.prepareLevel(level);
            this.getLevel(level).afterLayout.push(...elem._afterLayoutHandlers.values());
        }
    }

    public getSorted() {
        const composite: Level = {
            focusManagers: [],
            scrollManagers: [],
            afterLayout: [],
        };

        const sortedKeys = Object.keys(this._levels).sort();
        sortedKeys.forEach((key) => {
            const level = this._levels[Number(key)];
            composite.afterLayout.push(...level.afterLayout);
            composite.focusManagers.push(...level.focusManagers);
            composite.scrollManagers.push(...level.scrollManagers);
        });

        return composite;
    }

    private prepareLevel(level: number) {
        if (!this._levels[level]) {
            this._levels[level] = {
                focusManagers: [],
                scrollManagers: [],
                afterLayout: [],
            };
        }
    }

    private getLevel(level: number) {
        return this._levels[level];
    }
}
