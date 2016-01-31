
# Developing plugins

General recommendations:

* log plugin activity by creating and using `app.lib.logger`
* set nci minor version with which plugin was tested as peer dependency,
e.g. 0.9.x
* minimize dependencies, try to use dependencies used by core for similar
kind of job (twostep for async flow control, underscore as functional
programming helpers, conform.js for validation)
* write unit-tests for plugin (currently not all plugins listed as examples
below have tests, sorry, that could happen)

Plugin depending on functionality could belongs to types following below.

## Config reader

Adds ability to load server and project configs of other (then json) formats.
To implement such plugin you need to make subclass of `BaseReaderLoader`.
See [yaml reader plugin](https://github.com/node-ci/nci-yaml-reader)
for example.


## Notifier transport plugin

Extends nci with different transports (e.g. mail, xmpp, etc) for notification
system on build `error`, status `change`, or successful completion (`done`).
To implement such plugin you need to make subclass of `BaseNotifierTransport`.
See [mail notification plugin](https://github.com/node-ci/nci-mail-notification)
for example.


## Custom plugin

Can use following public api:


### app.httpServer

Could be used to append custom http request listener.

Examples:
[static server plugin](https://github.com/node-ci/nci-static-server),
[rest api server plugin](https://github.com/node-ci/nci-rest-api-server)


### app.projects

Could be used for manipulating with projects.

Only methods described in [projects collection](./projects-collection.md)
should be used.

Examples:
[scheduler plugin](https://github.com/node-ci/nci-scheduler),
[projects reloader plugin](https://github.com/node-ci/nci-projects-reloader),
[classic ui plugin](https://github.com/node-ci/nci-classic-ui)


### app.builds

Could be used for manipulating with project builds.

Only methods described in [builds collection](./builds-collection.md)
should be used.

Examples:
[rest api server plugin](https://github.com/node-ci/nci-rest-api-server),
[classic ui plugin](https://github.com/node-ci/nci-classic-ui)
