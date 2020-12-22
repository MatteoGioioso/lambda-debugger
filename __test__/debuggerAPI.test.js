const {DebuggerAPI} = require("../src/DebuggerAPI");

describe('DebuggerAPI', function () {
    process.env.PROJECT_ROOT = '/var/task';

    [
        {
            name: 'should track the file: lambda source code',
            args: {
                url: '/var/task/index.js'
            },
            want: true
        },
        {
            name: 'should track the file: lambda source code still',
            args: {
                url: '/var/task/lib/myFunctions.js'
            },
            want: true
        },
        {
            name: 'should not track the file: foreigner node_module',
            args: {
                url: '/var/task/node_modules/moment/index.js'
            },
            want: false
        },
        {
            name: 'should track the file: lambda-debugger entry point',
            args: {
                url: '/var/task/node_modules/lambda-debugger/src/index.js'
            },
            want: true
        },
        {
            name: 'should not track the file: not lambda-debugger entry point',
            args: {
                url: '/var/task/node_modules/lambda-debugger/src/RuntimeAPI.js'
            },
            want: false
        }
    ].forEach(test => {
        it(test.name, function () {
            const api = new DebuggerAPI({url: ''})

            const shouldBeTracked = api._shouldBeTracked(test.args.url);

            expect(shouldBeTracked).toBe(test.want)
        });

    });

    [
        {
            name: 'should filter scope',
            args: {
                callFrame: {
                    scopeChain: [
                        {
                            type: 'local'
                        },
                        {
                            type: 'global'
                        },
                        {
                            type: 'local'
                        },
                        {
                            type: 'closure'
                        }
                    ]
                }
            },
            want: {
                length: 3,
                result: [
                    {
                        type: 'local'
                    },
                    {
                        type: 'local'
                    },
                    {
                        type: 'closure'
                    }
                ]
            }
        },
        {
            name: 'should filter scope',
            args: {
                callFrame: {
                    scopeChain: [
                        {
                            type: 'global'
                        },
                        {
                            type: 'global'
                        }
                    ]
                }
            },
            want: {
                length: 0,
                result: []
            }
        }
    ].forEach(test => {
        it(test.name, function () {
            const api = new DebuggerAPI({url: ''})

            const filteredScope = api._filterLocalScopeChain(test.args.callFrame);

            expect(filteredScope).toEqual(test.want.result)
            expect(filteredScope).toHaveLength(test.want.length)
        });
    })

});
