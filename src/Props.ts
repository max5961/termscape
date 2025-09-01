export type BaseProps = {
    id?: string;
    className?: string;
};

export type FocusManagerScrollProps = {
    fallthrough?: boolean;
    scrollOff?: number;
    keepFocusedCenter?: boolean;
    keepFocusedVisible?: boolean;
};

export type FocusManagerBaseProps = {
    /**
     * If `true`, children will have a locked `flexShrink` of `0`.  If `false`,
     * children will be able to set flexShrink to any valid value.
     *
     * Why?  Because a list that overflows will shrink/disappear any shrinkable
     * children in order to fit everything, instead of allowing overflow and letting
     * the list scroll as intended. If overflow is not expected, then this
     * behavior can be toggled off.
     *
     * @default `true`
     */
    blockChildrenShrink?: boolean;
};

// prettier-ignore
export type FocusManagerProps = 
    BaseProps &
    FocusManagerBaseProps &
    FocusManagerScrollProps;

export namespace Props {
    export type Box = BaseProps;
    export type Text = BaseProps;
    export type Layout = BaseProps & FocusManagerBaseProps;
    export type LayoutNode = BaseProps;
    export type List = BaseProps & FocusManagerProps;
    export type Pages = BaseProps;
    export type Root = BaseProps;
}
