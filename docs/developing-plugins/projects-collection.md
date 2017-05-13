
## ProjectsCollection()

  Projects collection contains all currently loaded projects and provides
  operations for manipulating with them.
  All projects stored on disk in `baseDir` and `archiveDir` and loaded to
  memory so they can be received (by `get`, `getAll` and other methods) in a
  sync way.
  Note that id for the particular project is a `name` of that project.

## ProjectsCollection.validateConfig(config:Object, callback(err,config):Function)

  Validate and return given config.

## ProjectsCollection.load(params:Object, [callback(err)]:Function)

  Load project to collection.
  `projectLoaded` event with loaded config as argument will be emitted after
  load.
  - `params.name` - name of the project to load
  - `params.archived` - if true then try to load archived project

## ProjectsCollection.loadAll([callback(err)]:Function)

  Load all projects (from `this.baseDir`).
  Calls `load` for every project in a base dir.

## ProjectsCollection.unload(params:Object, [callback(err)]:Function)

  Unload project from collection
  `projectUnloaded` event with unloaded config as argument will be emitted
  after unload.
  - `params.name` - name of the project to unload

## ProjectsCollection.archive(params:Object, [callback(err)]:Function)

  Archive project.
  - `params.name` - name of the project to archive

## ProjectsCollection.unarchive(params:Object, [callback(err)]:Function)

  Unarchive project.
  - `params.name` - name of the project to unarchive

## ProjectsCollection.reload(params:Object, [callback(err)]:Function)

  Reload project.
  - `params.name` - name of the project to reload

## ProjectsCollection.get(name:String)

  Get project config by name.
  Returns config object or undefined if project is not found.

## ProjectsCollection.getAll()

  Get configs for all currently loaded projects.
  Returns array of config objects.

## ProjectsCollection.filter(predicate:Function)

  Get project configs which match to predicate.
  Returns array of config objects or empty array if there is no matched
  project.

## ProjectsCollection.remove(params:Object, [callback(err)]:Function)

  Remove project.
  Calls `unload`, removes project from disk and db.
  - `params.name` - name of the project to remove

## ProjectsCollection.rename(params:Object, [callback(err)]:Function)

  Rename project.
  Renames project on disk and db, also changes name for loaded project.
  - `params.name` - name of the project to rename
  - `params.newName` - new name of the project

## ProjectsCollection.create(params:Object, [callback(err)]:Function)

  Create project.
  - `params.name` - name of the project
  - `params.config` - project configuratjion object
  - `params.configFile` - project cconfig file object with `name` and
  `content` fields (it's alternative for `config` option when need to set file
  in specific format)
  - `params.load` - if true then project will be loaded

## ProjectsCollection.setConfig(params:Object, [callback(err)]:Function)

  Set config file for the project.
  - `params.projectName` - name of the project
  - `params.config` - project configuratjion object
  - `params.configFile` - project cconfig file object with `name` and
  `content` fields (it's alternative for `config` option when need to set file
  in specific format)
  - `params.load` - if true then project will be loaded
