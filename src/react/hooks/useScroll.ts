import React from "react";
import { type ScrollData, Scroll } from "../../shared/Scroll.js";
import { deepStrictEqual } from "../../shared/DeepStrictEqual.js";

/*
 * Exposes the control for the Scroll object and tracks its state in a react state
 * object.  This way you only need to worry about forwarding the opts to this hook
 *
 * This hook does 2 main things:
 * 1) Ensures that every function call from the control object updates the React
 * state object
 *
 * 2) Prevents stale context for the Scroll object by updating the Opts (context
 * necessary to decide window) on every render
 * */
export function useScroll(opts: Scroll["opts"]): {
    data: ScrollData;
    control: ReturnType<Scroll["getControl"]>;
    opts: Scroll["opts"];
} {
    const scroll = React.useMemo(() => new Scroll(opts), []);
    scroll.updateOpts(opts);

    const [data, setData] = React.useState<ScrollData>(scroll.getData());

    // Changes to opts may effect scroll data
    React.useEffect(() => {
        if (!deepStrictEqual(scroll.getData(), data)) {
            setData(scroll.getData());
        }
    }, [
        opts.length,
        opts.windowsize,
        opts.stickyIdxOnShift,
        opts.autoShiftOnAppend,
        opts.centerScroll,
        opts.fallthrough,
    ]);

    React.useEffect(() => {
        if (opts.startIndex) {
            scroll.goToIndex(opts.startIndex);
        }
    }, []);

    const control = scroll.getControl((nextData) => {
        if (!deepStrictEqual(data, nextData)) {
            setData(nextData);
        }
    });

    // Scroll.updateOpts normalizes opts such as when windowsize > length
    const normalizedOpts = scroll.getOpts();

    return { data, control, opts: normalizedOpts };
}
