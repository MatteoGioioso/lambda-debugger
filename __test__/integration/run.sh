#!/usr/bin/env bash

function cleanUp() {
    npm unlink lambda-debugger
}

function linkModule() {
  (cd ../../ && npm link) &&
  (cd testFunction && npm link lambda-debugger)
}

# Run inside this folder
SCRIPT_PATH="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
echo "$SCRIPT_PATH"
export AWS_LAMBDA_FUNCTION_NAME=testFunction
export LAMBDA_DEBUGGER_ENV=ci
export LAMBDA_TASK_ROOT=$SCRIPT_PATH/testFunction
export LAMBDA_DEBUGGER_OUTPUT=../$SCRIPT_PATH/tmp
export LAMBDA_DEBUGGER_DEBUG=ALL

linkModule &&
node --preserve-symlinks "${SCRIPT_PATH}"/lambdaDebugger.test.js

#trap cleanUp EXIT
