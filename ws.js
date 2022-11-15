import createDebugger from 'debug';
import {
    WebSocketServer
} from 'ws';
import {
    authenticate,
    tokenToUser
} from "./routes/auth.js";

const debug = createDebugger('express-api:messaging');

const users = [];

export function createWebSocketServer(httpServer) {
    console.log('Creating WebSocket server');
    const wss = new WebSocketServer({
        server: httpServer,
    });

    // Handle new user connections.
    wss.on('connection', async function (ws, req) {
        console.log('New WebSocket client connected');

        const user = await tokenToUser(req);
        if (!user) {
            console.log('User not authenticated');
            ws.send('User not authenticated');
            ws.close();
            return;
        }

        console.log(`User authenticated: ${user.email}`);

        // Keep track of clients.
        users.push({
            "id": user._id,
            "socket": ws
        });
        // Listen for messages sent by users.
        ws.on('message', (message) => {
            const rawMessage = String(message);
            onMessageReceived(ws, rawMessage);
        });

        // Clean up disconnected users.
        ws.on('close', () => {
            users.splice(users.indexOf(ws), 1);
            console.log('WebSocket user disconnected');
        });
    });
}

export function sendMessageToSpecificUser(message, userID, code) {

    // Find the user with the given ID.
    const user = users.find(user => user.id.toString() == userID.toString());

    if (user) {
        // Send the message to the user.
        console.log(`Sending message to user ${userID}: ${JSON.stringify(message)}`);
        user.socket.send(JSON.stringify({
            message: message,
            code: code

        }));
    }
}

function onMessageReceived(ws, message) {
    console.log(`Received WebSocket message: ${JSON.stringify(message)}`);
    // Do something with message...
    ws.send("Message : " + message);
}