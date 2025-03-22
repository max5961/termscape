import ReactReconciler from "react-reconciler";
import { Document } from "../dom/Document.js";
import { DomElement, Props, TagName } from "../dom/DomElement.js";
import { TextElement } from "../dom/elements/TextElement.js";
import { deepStrictEqual } from "../util/deepStrictEqual.js";

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
type Container = DomElement; // The root node
type Instance = DomElement;
type TextInstance = TextElement;
type SuspenseInstance = DomElement;
type HydrateableInstance = G;
type PublicInstance = DomElement | TextElement;
type HostContext = I; // *
type UpdatePayload = J; // *
type ChildSet = K;
type TimeoutHandle = L;
type NoTimeout = M;

// @ts-ignore
// const renderer = ReactReconciler<
//     Type,
//     P,
//     Container,
//     Instance,
//     TextInstance,
//     SuspenseInstance,
//     HydrateableInstance,
//     PublicInstance,
//     HostContext,
//     UpdatePayload,
//     ChildSet,
//     TimeoutHandle,
//     NoTimeout
// >({
//     supportsMutation: true,
//     supportsPersistence: false,
//     createInstance(type, newProps, rootContainer, hostContext, internalHandle) {
//         const element = Document.createElement(type);
//         element.setProps(newProps);
//         return element;
//     },
//
//     // @ts-ignore
//     createTextInstance(text, rootContainer, hostContext, internalHandle) {
//         const element = Document.createTextNode(text);
//         return element;
//     },
//
//     // @ts-ignore
//     appendInitialChild(parentInstance, child) {
//         parentInstance.appendChild(child);
//     },
//
//     appendChild(parentInstance, child) {
//         parentInstance.appendChild(child);
//     },
//
//     appendChildToContainer(container, child) {
//         container.appendChild(child);
//     },
//
//     insertBefore(parentInstance, child, beforeChild) {
//         parentInstance.insertBefore(child, beforeChild);
//     },
//
//     insertInContainerBefore(container, child, beforeChild) {
//         container.insertBefore(child, beforeChild);
//     },
//
//     removeChild(parentInstance, child) {
//         parentInstance.removeChild(child);
//     },
//
//     removeChildFromContainer(container, child) {
//         container.removeChild(child);
//     },
//
//     resetTextContent(instance) {
//         if ((instance as TextElement).setTextContent) {
//             (instance as TextElement).setTextContent("");
//         }
//     },
//
//     commitTextUpdate(textInstance, oldText, newText) {
//         textInstance.setTextContent(newText);
//     },
//
//     commitMount(instance, type, props, internalInstanceHandle) {
//         //
//     },
//
//     commitUpdate(instance, updatePayload, type, prevProps, nextProps, internalHandle) {
//         //
//     },
//
//     finalizeInitialChildren(instance, type, props, rootContainer) {
//         // return false;
//     },
//
//     shouldSetTextContent(type, props) {
//         // return false
//     },
//
//     getRootHostContext(rootContainer) {
//         // return null
//     },
//
//     getChildHostContext(parentHostContext, type, rootContainer) {
//         //
//     },
//
//     getPublicInstance(instance) {
//         return instance;
//     },
//
//     hideInstance(instance) {
//         instance.hide();
//     },
//
//     unhideInstance(instance, props) {
//         instance.unhide();
//     },
//
//     prepareForCommit(containerInfo) {
//         //
//     },
//
//     // Optional but important - read lsp notes.  Determines if commitUpdate is ran
//     // on the node.  null return = no commitUpdate on this node.  What is returned
//     // is passed to the UpdatePaylaod argument for commitUpdate on the node
//     prepareUpdate(instance, type, oldProps, newProps, rootContainer, hostContext) {
//         return deepStrictEqual(oldProps, newProps) ? newProps : null;
//     },
//
//     resetAfterCommit(containerInfo) {
//         //
//     },
//
//     preparePortalMount(containerInfo) {
//         //
//     },
// });
