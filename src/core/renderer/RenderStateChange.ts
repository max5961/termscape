// snafu:
// the compositor only needs to now about layout, style, scroll, and zindex
// but the renderer must know about renders triggered by resizes and screen changes.
//
// This wouldn't be an issue, but the bitmask is excellent for checking if there
// was *only* a certain change...but I guess this isn't bad...because if there
// was a style change and a resize, we might not have anything that created the
// need for a layout change, but it doesn't hurt to do a full layout change.
//
// Still...the renderer is what chooses how it writes...it should know...okay
// we don't care how the compositor gave us the grid, we need to write it and if
// there is a screen change, it needs to be a refresh write...if its a resize
// we also need to refresh write, but again we don't care how compositor got the
// grid.  On a resize, it would be common for that to trigger a Layout flag being
// changed because it would recalc viewport elements and that would be the only
// way a resize would trigger a layout change.
//
// The other issue is that its nice to enforce scheduleRender passing in a StateChange
// flag as the reason. However, a resize event or a screen change event NEEDS a
// re-render, but these alone give the compositor no useful information, and then
// subsequently ruin the bitmask usefulness.  Creating a private lil Scheduler.scheduleWithoutFlag()
// if fucking disgusting.  It would be better to just make it such that you didn't
// NEED to pass a flag to scheduler.scheduleRender and if you didn't it would
// bitwise OR a Style flag.  That is probably the best, but it also makes it
// fucking annoying that you can now call scheduleRender without a flag.  I could
// potentially make it such that you must call scheduleRender from root with a
// flag, but root could bypass that privately by calling the scheduler privately.
//
// The other issue is that passing flags to the renderer is an easy way to tell the
// renderer whats up.  So yeah, we can delagate this to renderer to reduce

export const enum StateChange {
    Layout = 1 << 0,
    Style = 1 << 1,
    Scroll = 1 << 2,
    ZIndex = 1 << 3,
    Resize = 1 << 4,
    Screen = 1 << 5,
}
