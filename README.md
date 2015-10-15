# nci

nci - Continuous integration server written in node.js

work in progress...

## TODO for release 0.9

* ~~Dashboard (builds list, projects autocomlete)~~
* ~~Build page (build info(dates, changes, etc), console)~~
* ~~Awesome build output (very close to terminal)~~
* ~~Url for trigger build run~~
* ~~YAML project and server(executors count, etc) configs~~
* ~~Persistent build and console output information~~
* ~~Project relations (blocks, triggers, etc)~~
* ~~Writes to stderr must not break the build~~
* Mail and jabber notifications (with commits, current step and error)
* ~~Rename notification strategies according to statuses~~
* ~~Work with git~~
* ~~Build every commit, commit with tag, etc~~
* ~~Safe id and build numbers generation~~
* ~~Scheduler~~
* ~~Better tests coverage~~
* ~~Compile client for production~~
* Semantic versioning and plugins
* ~~Complete uncompleted builds on server start~~

Ui fixes

* speed up console output
* ~~projects autocomplete~~
* ~~add time ago to build list~~
* ~~show scm changes on build page~~
* react says many many times to console:
	Warning: setState(...): Can only update a mounted or mounting component.
	This usually means you called setState() on an unmounted component.
	This is a no-op.
* show duration details (steps duration) on build page
* speed up build points animation at ff
* current successfully streak icons at project page
* ~~don't appear build from other project on project page~~
* ~~update project info changes (avg duration, etc) on the fly - project page~~
* ~~long commit comment breakes build card makeup~~
* ~~comment start/duration should be on same place during all steps~~

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
* Ability to change build parameters from ui (at least target branch)
* Embedded database (apparently level db)
* Lightweight (minimal dependencies)
* Cancel build
