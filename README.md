# nci

nci - Continuous integration server written in node.js

work in progress...


## Roadmap

* Responsive ui (persistent connection via socketio or something else +
data streams (from shell commands, etc))
* Console output should be very close to the terminal output
* Shell command is the main script
* Tasks relations can be set easily (runAfter, runBefore, prevents, prevented)
it also can be attached to the specific status or branch (auto deploy could a
separate task in this case)
* Build can be continued from the current failed step
* Failing of build step can be prevented if special condition for the build step
is defined and matched (e.g. ui tests timeout error or internet connection
problems detected by regexp) then step will be rerun without error
* Approximate remaining build time should be shown
* Named build steps
* Target branch can be changed easily from ui
* Embedded database (apparently level db)
* Lightweight (minimal dependencies)
