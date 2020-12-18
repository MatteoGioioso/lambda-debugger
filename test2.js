async function f() {
    const {handler} = require('./handler')
    await handler()
}

f().then(l => {
    console.log(l)
}).catch(e => {
    console.log(e.message)
})
