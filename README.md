# nci

nci - Continuous integration server written in node.js

work in progress...

## TODO for release 1.0

* Dashboard (builds list, projects autocomlete)
* Build page (build info, console)
* Url for trigger build run
* YAML project and server(executors count, etc) configs
* Persistent build and console output information
* Project relations (blocks, triggers, etc)
* Mail and jabber notifications (with commits, current step and error)
* Work with git and mercurial (build every commit, commit with tag, etc)
* Awesome build output (very close to terminal)
* Ability to change build parameters from ui (at least target branch)
* Semantic versioning and plugins
* Safe id and build numbers generation
* Better tests coverage

## Roadmap

* Responsive ui (persistent connection via socketio or something else +
data streams (from shell commands, etc))
* Console output should be very close to the terminal output
* Shell command is the main script
* Tasks relations can be set easily (runAfter, runBefore, prevents, prevented)
it also can be attached to the specific branch or commit (e.g. release commits
can trigger auto deploy tasks)
* Ability to build every or specified commits (even if they pushed in a bunch)
* Simple API for triggering build on scm hook
* Project dependencies (all projects specified at dependencies should be built
before build current project) and optional start for all projects after ci
restart
* Build can be continued from the current failed step
* Failing of build step can be prevented if special condition for the build step
is defined and matched (e.g. ui tests timeout error or internet connection
problems detected by regexp) then step will be rerun without error
* Approximate remaining build time should be shown
* Named build steps
* Target branch can be changed easily from ui
* Embedded database (apparently level db)
* Lightweight (minimal dependencies)
