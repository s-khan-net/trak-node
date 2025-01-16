const express = require("express");
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, { cors: { origin: '*' } });
const cors = require("cors");
const fs = require('fs');

const port = 3000;

// Enable CORS for all requests
app.use(cors());

// Define a route handler for the root path
app.get("/", (req, res) => {
    res.sendFile(`${__dirname}/views/index.html`)
});
app.use(express.static(`${__dirname}/views`));
io.on("connection", (socket) => {
    console.log("New client connected", socket.id, socket.handshake.time, socket.handshake.headers.host);
    userConnected(socket);
    socket.on("disconnect", (e) => {
        console.log("Client disconnected", socket.id, socket.handshake.time, socket.handshake.headers.host);
        let connectedUsers = getConnectedUsers()
        const u = connectedUsers.filter(u => {
            return socket.id == u.socketId;
        })[0]
        if (u) {
            io.emit('remove', u)
            connectedUsers.splice(connectedUsers.findIndex(m => { return socket.id == m.socketId }), 1)
        }
        setConnectedUsers(connectedUsers)
    });
    socket.on('updateLocation', (data) => {
        let connectedUsers = getConnectedUsers()
        if (connectedUsers.filter(u => {
            return socket.id == u.socketId;
        }).length == 0) {
            connectedUsers.push({ "socketId": socket.id, "conectedAt": socket.handshake.time, "connectedFrom": socket.handshake.headers.host, "startPosition": data.position, user: data.user })
            setConnectedUsers(connectedUsers)
        }
        let broadcastObj = {
            position: data.position,
            user: data.user,
        }
        io.emit('updated', broadcastObj)
    })
});

function userConnected(socket) {
    let connectedUsers = getConnectedUsers()
    console.log('sending connected users')
    socket.emit('joined', connectedUsers)
}

function getConnectedUsers(params) {
    let data = fs.readFileSync('connectedusers.json', { encoding: 'utf-8', flag: 'r' })

    return data ? JSON.parse(data) : [];
}
function setConnectedUsers(connectedUsers) {
    fs.writeFileSync('connectedusers.json', JSON.stringify(connectedUsers));
}
//The 404 Route (ALWAYS Keep this as the last route)
app.get('*', function (req, res) {
    res.status(404).sendFile('404.html', { root: `${__dirname}/views/` });
});
// Start the server
server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});