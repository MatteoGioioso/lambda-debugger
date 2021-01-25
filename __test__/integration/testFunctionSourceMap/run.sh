#!/usr/bin/env bash

function cleanUp() {
    rm -rf dist
}

function linkModule() {
  (cd ../../../ && npm link) &&
  npm link lambda-debugger
}

# Run inside this folder
SCRIPT_PATH="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
echo "$SCRIPT_PATH"
export LAMBDA_DEBUGGER_ENV=ci
export LAMBDA_DEBUGGER_OUTPUT=../$SCRIPT_PATH/tmp
export LAMBDA_DEBUGGER_DEBUG=ALL
export AWS_LAMBDA_FUNCTION_NAME=testFunctionSourceMap
export LAMBDA_TASK_ROOT=$SCRIPT_PATH


linkModule &&
#SLS_DEBUG=* sls package && unzip .serverless/exampleFunction.zip -d .serverless
node --preserve-symlinks pre-test.js

