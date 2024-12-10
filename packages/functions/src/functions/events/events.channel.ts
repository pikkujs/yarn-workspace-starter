import { addChannel } from '@vramework/core/channel'
import { onConnect, onMessage, onDisconnect, subscribe, unsubscribe, emitMessage, authenticate } from './events.functions.js'

addChannel({
    channel: '/event',
    // Called when a client connects to the channel
    onConnect,
    // Called when a client disconnects from the channel
    onDisconnect,
    // This is a global permission that applies to all message routes, 
    // unless overriden by the route
    auth: true,
    // The default message handler to use if no route is matched
    onMessage,
    onMessageRoute: {
        // We provide different examples of ways
        // to register functions
        action: {
            // This function will set the user session, which
            // means other functions will then work
            auth: {
                func: authenticate,
                auth: false,
            },
            // A route with an nested function. This is to allow permissions
            // to be applied to the route.
            subscribe: {
                func: subscribe,
                permissions: {},
            },
            // A shorthand method, this is a special case in typescript
            // so figured it would be useful to include
            unsubscribe,
            // A route that references a function
            emit: emitMessage
        }
    }
})
