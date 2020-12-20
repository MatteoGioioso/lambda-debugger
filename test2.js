async function f() {
    const {handler} = require('./handler')
    handler()
}

f().then()
