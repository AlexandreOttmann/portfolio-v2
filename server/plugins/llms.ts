export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook('llms:generate:full', (event, options) => {
        console.log('PLUGIn', event, options)
        return event
    })
})