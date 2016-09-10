
## BuildsCollection()

  Facade entity which accumulates operations with currently running and
  db saved builds.

## BuildsCollection.create(params:Object, [callback(err)]:Function)

  Create build by running given project.
  - `params.projectName` - project to build
  - `params.withScmChangesOnly` - if true then build will be started only if
  there is scm changes for project
  - `params.queueQueued` - if true then currently queued project can be queued
  again
  - `params.initiator` - contains information about initiator of the build,
  must contain `type` property e.g. when one build triggers another:
  initiator: {type: 'build', id: 123, number: 10, project: {name: 'project1'}
  - `params.buildParams` - params for current build (override project config)
  - `params.buildParams.scmRev` - target revision for the build
  - `params.env` - target environment for the build

## BuildsCollection.cancel(id:Number, [callback(err)]:Function)

  Cancel build by id.
  Note that only queued build can be canceled currently.

## BuildsCollection.get(id:Number, callback(err,build):Function)

  Get build by id.

## BuildsCollection.getLogLines(params:Object, callback(err,logLinesData):Function)

  Get log lines for the given build.
  - `params.buildId` - target build
  - `params.from` - if set then lines from that number will be returned
  - `params.to` - if set then lines to that number will be returned

## BuildsCollection.getAvgBuildDuration(builds:Array.<Object>)

  Calculate average build duration for the given builds.

## BuildsCollection.getRecent(params:Object, callback(err,builds):Function)

  Get builds sorted by date in descending order.
  - `params.projectName` - optional project filter
  - `params.status` - optional status filter, can be used only when
  `params.projectName` is set. When used builds in the result will contain
  only following fields: id, number, startDate, endDate
  - `params.limit` - maximum builds count to get

## BuildsCollection.getDoneStreak(params:Object, callback(err,doneStreak):Function)

  Get info about current done builds streak.
  - `params.projectName` - optional project filter
