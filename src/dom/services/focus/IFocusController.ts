import type {
    FocusControllerService,
    VirtualFocusControllerService,
    VisualFocusControllerService,
} from "./FocusControllerService.js";

export interface IFocusController {
    /** @internal */
    _focusService: FocusControllerService;
}

export interface IVisualFocusController extends IFocusController {
    /** @internal */
    _focusService: VisualFocusControllerService;
}

export interface IVirtualFocusController extends IFocusController {
    /** @internal */
    _focusService: VirtualFocusControllerService;
}
