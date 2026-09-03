export const enum StateChange {
    Layout = 1 << 0,
    Style = 1 << 1,
    Scroll = 1 << 2,
    ZIndex = 1 << 3,
    Resize = 1 << 4,
    Screen = 1 << 5,
    StartRuntime = 1 << 6,
}
