export type State = {
    start: number;
    end: number;
    idx: number;
    opts: {
        length: number;
        windowsize: number;
        centerScroll?: boolean;
        fallthrough?: boolean;
        startIndex?: number;

        /* Append behavior opts */

        // Shift window the amount added
        autoShiftOnAppend?: boolean;
        // If window shifts, prevent idx from changing
        stickyIdxOnShift?: boolean;

        /* Delete behavior opts - todo */
        // shiftIdxOnDelete?: boolean
    };
};

export type ScrollData = Omit<State, "opts">;

/*
 * idx can equal start.  If idx === start - 1, then we know the window must be shifted
 * idx can equal up to end - 1, but not end.  If idx === end, then we know the window
 * must be shifted
 *
 * windowsize = end - start.  This means a windowsize of 3 could be:
 * {start: 0, end: 3} and the viewable indexes would be 0,1,2
 *
 * length is important because a windowsize > length must be accounted for and
 * the windowsize must be shrunk accordingly
 * */

export class Scroll {
    private start: State["start"];
    private end: State["end"];
    private idx: State["idx"];
    private opts!: State["opts"];
    private prevLength: number;

    constructor(opts: State["opts"]) {
        this.idx = 0;
        this.start = 0;
        this.end = Math.min(opts.windowsize, opts.length);
        this.prevLength = Math.min(opts.windowsize, opts.length);
        this.updateOpts(opts);
    }

    public getData(): ScrollData {
        return {
            start: this.start,
            end: this.end,
            idx: this.idx,
        };
    }

    public getOpts(): Scroll["opts"] {
        return this.opts;
    }

    // Opts provide context external to this class that may effect start, end,
    // or idx.  This needs to be called on every render (useScroll handles that)
    // so that any impossible start, end, or idx values can be adjusted
    public updateOpts = (c: State["opts"]): void => {
        this.opts = c;
        this.opts.centerScroll = this.opts.centerScroll ?? false;
        this.opts.fallthrough = this.opts.fallthrough ?? false;
        this.opts.autoShiftOnAppend = this.opts.autoShiftOnAppend ?? false;
        this.opts.stickyIdxOnShift = this.opts.stickyIdxOnShift ?? true;

        // length < windowsize creates impossible bounds
        this.opts.windowsize = Math.min(this.opts.length, this.opts.windowsize);

        // Its possible that the new length cannot account for the *idx* or the
        // *end* value.  For example, this would be the case when you are at the
        // end of a list and delete an item.  The idx and end must be shifted
        // within the new range of possible values
        this.idx = Math.min(this.opts.length - 1, this.idx);
        this.end = Math.min(this.end, this.opts.length);
        this.start = Math.min(this.start, this.end);

        // If windowsize has changed, the start and end values must be adjusted.
        // If windowsize has not been changed, nothing is modified
        this.modifyWinSize(this.opts.windowsize);

        if (this.prevLength < this.opts.length && this.opts.autoShiftOnAppend) {
            this.shiftWindow(this.opts.length - this.prevLength);
        }

        this.prevLength = this.opts.length;
    };

    // Modifies the windowsize and in the event that the windowsize is greater than
    // the length, shrinks the windowsize to the length.
    public modifyWinSize = (nextWinSize: number): void => {
        if (nextWinSize === 0) {
            this.start = this.idx;
            this.end = this.idx;
            return;
        }

        // Always start by shifting end index as much as possible, *then* start index
        const d = this.end - this.start > nextWinSize ? -1 : 1;
        while (this.end - this.start !== nextWinSize) {
            if (this.isValidEnds(this.start, this.end + d)) {
                this.end += d;
            } else if (this.isValidEnds(this.start - d, this.end)) {
                this.start -= d;
            } else {
                // Cannot safely modify the window, so modifications are ended
                break;
            }
        }
    };

    // Todo: ensure its impossible for start and end to go out of range here, which
    // should be the case as long as the nextIdx value is valid
    public goToIndex = (nextIdx: number, center?: boolean): void => {
        nextIdx = Math.floor(nextIdx);
        if (!this.isValidIdx(nextIdx)) return;

        // Shift idx until nextIdx or until idx bumps end of window
        const d = this.idx < nextIdx ? 1 : -1;
        while (this.idx !== nextIdx) {
            this.idx += d;
            if (this.idx === this.end || this.idx === this.start - 1) {
                this.end += d;
                this.start += d;
                break;
            }
        }

        // slide window and idx together until idx === nextIdx
        const diff = nextIdx - this.idx;
        this.idx += diff;
        this.start += diff;
        this.end += diff;

        if (this.opts.centerScroll || center) {
            this.centerIdx();
        }
    };

    // Idx changes have already been made but we want to center the idx within the
    // viewing window
    public centerIdx = (): void => {
        const mid = Math.floor((this.start + this.end) / 2);
        const diff = this.idx - mid;
        const ds = this.start + diff;
        const de = this.end + diff;
        if (this.isValidEnds(ds, de)) {
            this.start = ds;
            this.end = de;
        }
    };

    public shiftWindow = (dp: number): void => {
        let diff = 0;
        let maxShift = 0;
        if (dp > 0) {
            // maxShift = maximum shift before sliding past idx
            maxShift = this.idx - this.start;
            diff = Math.min(dp, this.opts.length - this.end, maxShift);
        } else {
            maxShift = this.end - 1 - this.idx;
            diff = Math.min(-dp, this.start, maxShift);
        }

        if (!this.opts.stickyIdxOnShift) {
            if (dp > 0) {
                diff = Math.min(dp, this.opts.length - this.end);
            } else {
                diff = Math.min(-dp, this.start);
            }
        }

        const ds = this.start + diff;
        const de = this.end + diff;
        if (this.isValidEnds(ds, de, { checkIdx: false })) {
            this.start = ds;
            this.end = de;
        }

        // If window cuts off idx, bring back into viewing window.  This would
        // only happen if this.opts.stickyIdxOnShift is false
        if (this.idx >= this.end) {
            this.idx = this.end - 1;
        }
        // Putting this conditional at end accounts for this.start === this.end
        // edge case since would correct the first conditional throwing idx out of range
        if (this.idx < this.start) {
            this.idx = this.start;
        }
    };

    private isValidIdx = (nextIdx: number): boolean => {
        nextIdx = Math.floor(nextIdx);

        if (this.opts.length === 0) return false;
        if (this.start === 0 && this.end === 0) return false;
        if (this.start === this.end) return false;
        if (nextIdx >= this.opts.length) return false;
        if (nextIdx < 0) return false;

        return true;
    };

    private isValidEnds = (
        start: number,
        end: number,
        opts = { checkIdx: true },
    ): boolean => {
        if (start < 0) return false;
        if (start > end) return false;
        if (end < 0) return false;
        if (end > this.opts.length) return false;
        if (opts.checkIdx) {
            if (end <= this.idx) return false;
            if (start > this.idx) return false;
        }

        return true;
    };

    // cb argument allows useScroll to make sure state is synced on every control
    // function call
    public getControl = (cb?: (d: ScrollData) => void) => {
        const update = () => cb?.(this.getData());

        return {
            nextItem: (): void => {
                if (this.opts.fallthrough && this.idx + 1 >= this.opts.length) {
                    this.goToIndex(0);
                } else {
                    this.goToIndex(this.idx + 1);
                }

                update();
            },
            prevItem: (): void => {
                if (this.opts.fallthrough && this.idx - 1 < 0) {
                    this.goToIndex(this.opts.length - 1);
                } else {
                    this.goToIndex(this.idx - 1);
                }

                update();
            },
            scrollUp: (n?: number): void => {
                const halfWindow = Math.floor(this.opts.windowsize / 2);
                const displacement = n ?? halfWindow;
                const nextIdx = this.idx - displacement;
                if (this.opts.fallthrough && nextIdx < 0) {
                    const diff = displacement - this.idx;
                    this.goToIndex(this.opts.length - diff);
                } else {
                    this.goToIndex(Math.max(0, nextIdx));
                }

                update();
            },
            scrollDown: (n?: number): void => {
                const halfWindow = Math.floor(this.opts.windowsize / 2);
                const displacement = n ?? halfWindow;
                const nextIdx = this.idx + displacement;

                if (this.opts.fallthrough && nextIdx >= this.opts.length) {
                    const diff = this.opts.length - this.idx - 1;
                    return this.goToIndex(displacement - diff - 1);
                }

                this.goToIndex(Math.min(this.opts.length - 1, nextIdx));
                update();
            },
            modifyWinSize: (nextWinSize: number): void => {
                this.modifyWinSize(nextWinSize);
                update();
            },
            goToIndex: (index: number, center?: boolean): void => {
                this.goToIndex(index, center);
                update();
            },
        };
    };
}
