import { CoreRootElement, type RuntimeSetup } from "../core/CoreRootElement.js";
import type { DomElement } from "../dom/DomElement.js";
import { MockStdin } from "./MockStdin.js";
import { MockStdout } from "./MockStdout.js";

// In order for this to work, we need the following:
//
// 1) CoreRoot event emitter so that we can be notified when rendering has completed
//    and store the generated frame.  The CoreRoot event emitter will be needed
//    for other tasks as well, so it is necessary to build regardless
//
// 2) A smooth way to end the runtime so that we can then write the files that will
//    be compared for testing
//
// 3) A good API for sending keypresses, sending mouse button presses, sending
//    resize events, and handling the created frames.  The created frames should
//    have an easy option for writing to the expected or actual files.
//
// 4) I think the best way to go about this would be to have the CoreTestRootElement
//    be instantiated with a file path for which the write the .actual or .expected
//    files. But its possible that a functional wrapper to create this would be
//    helpful as well.  That said, I want to keep the Test logic simple and unabstracted.
//    The old implementatin was too heavily abstracted and was *more* confusing to
//    use.  I think the best way to go about this would probably be to utilize
//    some sort of promise based chaining that allowed you to run things.  For example,
//    something like:
//        root
//            .waitForExit()
//            .writeActual()
//            .replayInteractive();
//
//    Perhaps removing writeActual in place of having a constructor option for which
//    file to write to (.actual or .expected).  If we were writing to .actual, then
//    replayInteractive could be a noop.
//    We should also then have a constructor option for doing a live test run, meaning
//    not writing to any file, but just allowing for replay.

export class CoreTestRootElement extends CoreRootElement {
    constructor(
        shell: DomElement,
        setup: RuntimeSetup,
        stdoutDim: { rows: number; columns: number },
    ) {
        super(shell, {
            ...setup,
            stdin: new MockStdin(),
            stdout: new MockStdout(stdoutDim),
        });
    }
}
