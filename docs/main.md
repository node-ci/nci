
# Main nci documentation

* [Build environment variables](#build-environment-variables)

## Build environment variables

During build inside steps following environment variable are available:

* NCI_BUILD_ID - global id (unique across all projects) of the current build
* NCI_BUILD_NUMBER - build number within project
* NCI_PROJECT_NAME - name of the project that is building
* NCI_NODE_NAME - name of the node that is building project
* NCI_ENV_NAME - name of the environment within which project is building

Custom environment variables could be specified on node (at server config)
and project levels using "envVars" object, e.g. for the project:

```json
    "envVars": {
        "SOME_VAR": "some environment variable"
    },
    "steps": [
        {
            "name": "echo",
            "cmd": "echo $SOME_VAR",
            "type": "shell"
        }
    ]
```
