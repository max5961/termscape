import ReactReconciler from "react-reconciler";
import { Document } from "../dom/Document.js";
import { Props, TagName } from "../dom/DomElement.js";

type A = "A";
type B = "B";
type C = "C";
type D = "D";
type E = "E";
type F = "F";
type G = "G";
type H = "H";
type I = "I";
type J = "J";
type K = "K";
type L = "L";
type M = "M";

type Type = TagName;
type P = Props;
type Container = C;
type Instance = D;
type TextInstance = E;
type SuspenseInstance = F;
type HydrateableInstance = G;
type PublicInstance = H;
type HostContext = I;
type UpdatePayload = J;
type ChildSet = K;
type TimeoutHandle = L;
type NoTimeout = M;

// @ts-ignore
const renderer = ReactReconciler<
    Type,
    P,
    Container,
    Instance,
    TextInstance,
    SuspenseInstance,
    HydrateableInstance,
    PublicInstance,
    HostContext,
    UpdatePayload,
    ChildSet,
    TimeoutHandle,
    NoTimeout
>({
    supportsMutation: true,
    supportsPersistence: false,
    // @ts-ignore
    createInstance(type, newProps, rootContainer, hostContext, internalHandle) {
        const element = Document.createElement(type);

        if (type === "BOX_ELEMENT") {
            // Document.setBoxProps(instance, newProps);
        }

        if (type === "TEXT_ELEMENT") {
            // Document.setTextProps(instance, textProps);
        }
    },
});
