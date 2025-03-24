import { BoxProps } from "./dom/elements/attributes/box/BoxProps.ts";
import { BoxMetaData } from "./dom/elements/attributes/box/BoxMetaData.ts";
import { TextProps } from "./dom/elements/attributes/text/TextProps.ts";
import React from "react";

declare global {
    namespace JSX {
        interface IntrinsicElement {
            [TagNames.Box]: BoxElement;
            [TagNames.Text]: TextElement;
        }
    }
}

export type IntrinsicAttr = {
    Box: Scope<BoxProps, BoxMetaData>;
    Text: Scope<TextProps, TextMetaData>;
};

type Scope<Props, MetaData> = {
    props: Props;
    metadata: MetaData & { [attr: string]: unknown };
} & { ref?: React.Ref; key?: React.Key; children?: React.ReactNode };
