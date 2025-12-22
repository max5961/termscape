export const ErrorMessages = {
    insertBefore:
        "Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.",
    removeChild:
        "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.",
    invalidOverflowStyleForScroll:
        process.env["NODE_ENV"] === "development"
            ? `
Cannot perform a scroll operation on an element whose 'style.overflow' is not 
set to 'scroll'.

This requirement enforces intentionality: scrolling adjusts an element's 
position within the layout.  Accidentally scrolling the parent container of a 
scroll container would not be yield the intended result.
`
            : ` Cannot perform a scroll operation on an element whose 'style.overflow' is not 
set to 'scroll'.`,
} as const;
