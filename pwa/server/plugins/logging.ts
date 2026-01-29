export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook('request', (event) => {
        event.context._startTime = performance.now()
        console.log(`[REQ] ${event.method} ${event.path}`)
    })

    nitroApp.hooks.hook('beforeResponse', (event, { body }) => {
        const duration = Math.round(performance.now() - (event.context._startTime || 0))
        console.log(`[RES] ${event.method} ${event.path} - ${duration}ms`)
    })
})
