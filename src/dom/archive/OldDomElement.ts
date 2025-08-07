// @ts-nocheck

// import Yoga from "yoga-wasm-web/auto";
// import { YogaNode } from "../../types.js";
// import { MouseEventHandler, MouseEvent } from "../MouseEvent.js";
// import { OldRoot } from "./archive/OldRoot.jss";
// import type { DOMRect, TTagNames, Style } from "../../types.js";
// import { type MouseEventType } from "../stdin/types.js";
//
// export type Helper<T extends keyof OldDomElement> = T;
// export type TupleUpdaterMethods = Helper<
//     "appendChild" | "insertBefore" | "removeChild" | "removeParent" | "hide" | "unhide"
// >;
//
// /** For accessing private members in trusted private package modules */
// export type OldFriendDomElement = {
//     // !!! This are changed to OldDomElement[] in OldDomElement
//     children: OldFriendDomElement[];
//
//     tagName: TTagNames;
//     node: YogaNode;
//     parentElement: null | OldDomElement;
//     eventListeners: Record<MouseEventType, Set<MouseEventHandler>>;
//     rect: DOMRect;
//     attributes: Map<string, unknown>;
//     style: Style;
//     scheduleRender: OldRoot["scheduleRender"];
//     removeAutoRenderProxy: () => void;
//     root: OldRoot | OldDomElement;
//
//     containsPoint: (x: number, y: number) => boolean;
//     executeListeners: (event: MouseEvent) => void;
// };
//
// export abstract class OldDomElement {
//     public children: OldDomElement[];
//
//     public node: OldFriendDomElement["node"];
//     public parentElement: OldFriendDomElement["parentElement"];
//     private rect: OldFriendDomElement["rect"];
//     private eventListeners: OldFriendDomElement["eventListeners"];
//     private attributes: OldFriendDomElement["attributes"];
//     public tagName: TTagNames;
//     protected removeAutoRenderProxy: OldFriendDomElement["removeAutoRenderProxy"];
//     protected root: OldFriendDomElement["root"];
//
//     public abstract style: OldFriendDomElement["style"];
//
//     constructor(tagName: TTagNames) {
//         this.root = this;
//         this.tagName = tagName;
//         this.node = Yoga.Node.create();
//         this.children = [];
//         this.parentElement = null;
//         this.rect = {
//             x: -1,
//             y: -1,
//             top: -1,
//             bottom: -1,
//             right: -1,
//             left: -1,
//             width: -1,
//             height: -1,
//         };
//
//         // Currently for mouse events only
//         this.eventListeners = {
//             // LEFT BTN
//             click: new Set(),
//             dblclick: new Set(),
//             mousedown: new Set(),
//             mouseup: new Set(),
//
//             // RIGHT BTN
//             rightclick: new Set(),
//             rightdblclick: new Set(),
//             rightmousedown: new Set(),
//             rightmouseup: new Set(),
//
//             // SCROLL WHEEL
//             scrollup: new Set(),
//             scrolldown: new Set(),
//             scrollclick: new Set(),
//             scrolldblclick: new Set(),
//             scrollbtndown: new Set(),
//             scrollbtnup: new Set(),
//
//             // MOVEMENT
//             mousemove: new Set(),
//             drag: new Set(),
//             dragstart: new Set(),
//             dragend: new Set(),
//         };
//
//         // Define custom attributes
//         this.attributes = new Map();
//
//         this.removeAutoRenderProxy = () => {};
//     }
//
//     public abstract setAttribute(): void;
//
//     public addEventListener(event: MouseEventType, handler: EventHandler): void {
//         this.eventListeners[event].add(handler);
//     }
//
//     public removeEventListener(event: MouseEventType, handler: EventHandler): void {
//         this.eventListeners[event].delete(handler);
//     }
//
//     public appendChild(child: OldDomElement): void {
//         this.node.insertChild(child.node, this.node.getChildCount());
//         this.children.push(child);
//         child.parentElement = this;
//
//         child.root = this.root;
//     }
//
//     public insertBefore(child: OldDomElement, beforeChild: OldDomElement): void {
//         const nextChildren = [] as OldDomElement[];
//         const idx = this.children.findIndex((el) => el === beforeChild);
//
//         for (let i = 0; i < this.children.length; ++i) {
//             if (i === idx) {
//                 nextChildren.push(child);
//             }
//             nextChildren.push(this.children[i]);
//         }
//
//         this.children = nextChildren;
//         this.node.insertChild(child.node, idx);
//         child.parentElement = this;
//         child.root = this.root;
//     }
//
//     public removeParent(): void {
//         const parent = this.parentElement;
//         parent?.removeChild(this);
//         this.parentElement = null;
//         this.root = this;
//     }
//
//     public removeChild(child: OldDomElement): void {
//         const idx = this.children.findIndex((el) => el === child);
//         child.removeParent();
//         this.children.splice(idx, 1);
//         this.node.removeChild(child.node);
//         child.node.freeRecursive();
//
//         child.root = child;
//     }
//
//     public hide(): void {
//         this.node.setDisplay(Yoga.DISPLAY_NONE);
//     }
//
//     public unhide(): void {
//         this.node.setDisplay(Yoga.DISPLAY_FLEX);
//     }
//
//     public getYogaChildren(): YogaNode[] {
//         const count = this.node.getChildCount();
//         let yogaNodes = [] as YogaNode[];
//         for (let i = 0; i < count; ++i) {
//             yogaNodes.push(this.node.getChild(i));
//         }
//         return yogaNodes;
//     }
//
//     public getBoundingClientRect(): DOMRect {
//         return this.rect;
//     }
//
//     public containsPoint: OldFriendDomElement["containsPoint"] = (
//         x: number,
//         y: number,
//     ): boolean => {
//         if (x < this.rect.x) return false;
//         if (y < this.rect.y) return false;
//         if (x >= this.rect.right) return false;
//         if (y >= this.rect.bottom) return false;
//         return true;
//     };
//
//     protected dfs(startNode: OldDomElement, cb: (elem: OldDomElement) => void): void {
//         cb(startNode);
//         startNode.children.forEach((child) => {
//             this.dfs(child, cb);
//         });
//     }
//
//     ////////////////////////////////////////
//     // Proxies & Auto-Rendering          //
//     ///////////////////////////////////////
//
//     protected isAttached() {
//         return this.root instanceof Root;
//     }
//
//     private wrapDomMethods(methods: TupleUpdaterMethods[]) {
//         const reset = [] as (() => void)[];
//
//         for (const method of methods) {
//             const original = this[method] as (...args: any[]) => any;
//             if (typeof original === "function") {
//                 (this[method] as (...args: any[]) => any) = (...args) => {
//                     original.apply(this, args);
//                     if (this.root instanceof Root) {
//                         this.root.scheduleRender({ resize: true });
//                     }
//                 };
//                 reset.push(() => {
//                     this[method] = original;
//                 });
//             }
//         }
//
//         return () => {
//             reset.forEach((resetter) => resetter());
//         };
//     }
//
//     protected createAutoRenderProxy() {
//         // STYLE PROXY
//         const originalStyle = { ...this.style };
//         // this.style = this.createStyleProxy();
//
//         const unwrapMethods = this.wrapDomMethods([
//             "appendChild",
//             "insertBefore",
//             "removeChild",
//             "removeParent",
//             "hide",
//             "unhide",
//         ]);
//
//         this.removeAutoRenderProxy = () => {
//             // this.style = originalStyle;
//             unwrapMethods();
//         };
//     }
// }
