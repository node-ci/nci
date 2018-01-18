
# nci standalone server with web ui tutorial

In this tutorial we will setting up continuous integration server powered
by leveldb (`leveldown` package) with web interface
([classic ui plugin](https://github.com/node-ci/nci-classic-ui))
which will serve all required static files by it self
([static server plugin](https://github.com/node-ci/nci-static-server)). We will
use yaml ([yaml reader plugin](https://github.com/node-ci/nci-yaml-reader))
for configure server and projects. Running app will be controlled by `forever`
to get restarted in case of unexpected failure.

We will also use following plugins:

* [mail notification plugin](https://github.com/node-ci/nci-mail-notification)
to get notifications about failed builds via email
* [projects reloader plugin](https://github.com/node-ci/nci-projects-reloader)
to auto reload projects config when it changes on disk
* [rest api server plugin](https://github.com/node-ci/nci-rest-api-server)
to expose rest api for having ability to trigger build by simple `curl` call
* [scheduler plugin](https://github.com/node-ci/nci-scheduler) to trigger
project building by schedule


## Installation

Please check [system requirements](/README.md#system-requirements) section at
main nci readme first.

All actions below should be executed from a single user. Root privileges is not
required. You better to create separate user when using it on production.

When use local executor all commands running during any project build will be
running from this user. This user must have access (and have them in `PATH`) to
`node`, `npm`, `git` and `hg` commands and also to all commands which used in
project build steps.

Create and go to into nci root dir (you can choose any other dir):

```sh

mkdir ~/nci && cd ~/nci

```

install all required packages from npm: 

```sh

npm install nci nci-classic-ui nci-mail-notification nci-projects-reloader nci-rest-api-server nci-scheduler nci-static-server nci-yaml-reader leveldown forever

```

create data and projects dirs:

```sh

mkdir data data/projects

```


## Configure server

create `data/preload.json` (to apply yaml reader for server config):

```json
{
    "plugins": ["nci-yaml-reader"]
}
```

create server config `data/config.yaml`:

```yaml

plugins:
    - nci-projects-reloader
    - nci-static-server
    - nci-rest-api-server
    - nci-mail-notification
    - nci-scheduler
    #ui better be last plugin
    - nci-classic-ui

nodes:
    - type: local
      #allow maximum 3 parallel builds
      maxExecutorsCount: 3

http:
    host: 127.0.0.1
    port: 3000
    url: http://127.0.0.1:3000

    static:
        #this settings will be consumed by static server plugin 
        locations:
            #serve static for ui plugin
            - url: /favicon.ico
              root: node_modules/nci-classic-ui/static/
            - url: !!js/regexp ^/(js|css|fonts|images)/
              root: node_modules/nci-classic-ui/static/
            #serve project workspaces via http, remove lines
            #below if don`t need/want that
            - url: !!js/regexp ^/projects/(\w|-)+/workspace/
              root: data/

storage:
    #use leveldown as db backend
    backend: leveldown


notify:
    #configure account for sending notifications
    #this settings will be consumed by mail notification plugin
    mail:
        host: smtp.gmail.com
        port: 587
        auth:
            user: your_sender_login@gmail.com
            pass: your_sender_password

```

## Configure projects

Now we can add some projects for building them.

Let's add nci itself as project.

Create project dir first:

```sh

mkdir data/projects/nci

```

then create project config `data/projects/nci/config.yaml`:

```yaml

scm:
    type: git
    repository: https://github.com/node-ci/nci
    rev: master

buildEvery:
    #build project every 5 minutes
    time: "0 */5 * * * *"
    #but only if there is scm changes
    withScmChangesOnly: true

#notify when build fails or build status changes (according to previous status)
notify:
    on:
        - error
        - change
    to:
        mail:
            - your_mail@example.com

steps:
    - name: sync deps
      cmd: npm install && npm prune

    - name: test
      cmd: npm test


```

## Usage

Start the server:

```sh

node_modules/.bin/forever start -l `pwd`/app.log -a node_modules/.bin/nci

```

see `app.log` it should end with something similar to:

```

[Sun, 31 Jan 2016 19:54:22 GMT] [app] Load plugin "nci-mail-notification"
[Sun, 31 Jan 2016 19:54:22 GMT] [app] Load plugin "nci-scheduler"
[Sun, 31 Jan 2016 19:54:22 GMT] [app] Load plugin "nci-classic-ui"
[Sun, 31 Jan 2016 19:54:23 GMT] [app] Loaded projects:  [ 'nci' ]
[Sun, 31 Jan 2016 19:54:23 GMT] [app] Start http server on 127.0.0.1:3000

```

Setup completed, now you can use all functions, e.g.:

* explore web interface by navigate to `http://127.0.0.1:3000` in browser
* trigger project build via `curl`, e.g. 
`curl http://127.0.0.1:3000/api/0.1/builds -d '{"project": "nci"}'`
* edit/add projects configs in your favourite editor - they should
be reloaded automatically

Notes:
* only projects configs loaded/reloaded automatically, not server. So you
should manually restart server to apply serve config changes.
* do not remove, rename projects on disk. Currently you can do that via rest
api, see [rest api server plugin](https://github.com/node-ci/nci-rest-api-server)
* if something went wrong please check `app.log` first
