import createDebugger from 'debug';
import {
    WebSocketServer
} from 'ws';
import {
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
        console.log('New WebSocket user connected');

        console.log(`User 1 connected`);

        users.push({
            "id": '635014f38b00417356140522',
            "socket": ws
        });

        // Listen for messages sent by users.
        ws.on('message', (message) => {
            // Make sure the message is valid JSON.
            let parsedMessage;
            try {
                parsedMessage = JSON.parse(message);
            } catch (err) {
                // Send an error message to the user with "ws" if you want...
                return console.log('Invalid JSON message received from user');
            }

            // Handle the message.
            onMessageReceived(ws, parsedMessage);
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
    const user = users.find(user => user.id == userID);

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
    ws.send("Message : " + message.message);
}