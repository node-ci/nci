# nci

nci - Continuous integration server written in node.js

work in progress...

[![Build Status](https://travis-ci.org/node-ci/nci.svg?branch=master)](https://travis-ci.org/node-ci/nci)

## TODO for release 0.9

* ~~Dashboard (builds list, projects autocomlete)~~
* ~~Build page (build info(dates, changes, etc), console)~~
* ~~Awesome build output (very close to terminal)~~
* ~~Url for trigger build run~~
* ~~YAML project and server(executors count, etc) configs~~
* ~~Persistent build and console output information~~
* ~~Project relations (blocks, triggers, etc)~~
* ~~Writes to stderr must not break the build~~
* ~~Mail and jabber notifications~~
* ~~Rename notification strategies according to statuses~~
* ~~Work with git~~
* ~~Build every commit, commit with tag, etc~~
* ~~Safe id and build numbers generation~~
* ~~Scheduler~~
* ~~Better tests coverage~~
* ~~Compile client for production~~
* Semantic versioning and plugins
* ~~Complete uncompleted builds on server start~~
* ~~Throw away workspace changes on repository update~~


## Bugs/upcoming fixes

* ~~git checkout before reset~~
* slow move out from build page (with lot of output) to main page - several sec
* ~~when long line appear console output row numbers not on the same line with
content~~
* some "undefined" comments in scm changes
* projects list scroll
* ~~Error during send: TypeError: Cannot read property 'changes' of undefined~~
* ~~Builds loss~~
* ~~error on git after change branch: fatal: ambiguous argument '18a8ea4..branch':
unknown revision or path not in the working tree.~~


## Feature requests

* ~~should write at the end of build console out that build is done (or error)~~
* ~~share workspace files at static~~
* "clear workspace" button
* show more builds button (or infinity scroll) on start page
* ~~hide console output by default (when go on completed build page you scroll
down to the output which could be very long)~~
* speed up build points animation at ff (maybe borrow something from animate.css?)
* current successfully streak icons at project page


## Roadmap

* ~~Responsive ui (persistent connection via socketio or something else +
data streams (from shell commands, etc))~~
* Console output should be very close to the terminal output
* ~~Shell command is the main script~~
* ~~Tasks relations can be set easily (runAfter, runBefore, prevents, prevented)
it also can be attached to the specific branch or commit (e.g. release commits
can trigger auto deploy tasks)~~
* ~~Ability to build every or specified commits (even if they pushed in a bunch)~~
* ~~Simple API for triggering build on scm hook~~
* Project dependencies (all projects specified at dependencies should be built
before build current project) and optional start for all projects after ci
restart
* Build can be continued from the current failed step
* Failing of build step can be prevented if special condition for the build step
is defined and matched (e.g. ui tests timeout error or internet connection
problems detected by regexp) then step will be rerun without error
* ~~Approximate remaining build time should be shown~~
* ~~Named build steps~~
* Ability to change build parameters from ui (at least target branch)
* ~~Embedded database (apparently level db)~~
* ~~Lightweight (minimal dependencies)~~
* ~~Cancel build~~
