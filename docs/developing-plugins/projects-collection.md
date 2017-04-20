
## ProjectsCollection()

  Projects collection contains all currently loaded projects and provides
  operations for manipulating with them.
  All projects stored on disk in `baseDir` and loaded to memory so
  they can be received (by `get`, `getAll` and other methods) in a sync way.
  Note that id for the particular project is a `name` of that project.

## ProjectsCollection.validateConfig(config:Object, callback(err,config):Function)

  Validate and return given config.

## ProjectsCollection.load(name:String, [callback(err)]:Function)

  Load project to collection.
  `projectLoaded` event with loaded config as argument will be emitted after
  load.

## ProjectsCollection.loadAll([callback(err)]:Function)

  Load all projects (from `this.baseDir`).
  Calls `load` for every project in a base dir.

## ProjectsCollection.unload(name:String, [callback(err)]:Function)

  Unload project from collection
  `projectUnloaded` event with unloaded config as argument will be emitted
  after unload.

## ProjectsCollection.reload(name:String, [callback(err)]:Function)

  Reload project.

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

## ProjectsCollection.remove(name:String, [callback(err)]:Function)

  Remove project by name.
  Calls `unload`, removes project from disk and db.

## ProjectsCollection.rename(name:String, newName:String, [callback(err)]:Function)

  Rename project.
  Renames project on disk and db, also changes name for loaded project.

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
