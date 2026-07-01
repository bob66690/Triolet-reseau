const rooms = {};
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server,{
    cors:{
        origin:"*"
    }
});

app.use(express.static("."));

io.on("connection",(socket)=>{

    socket.on("createRoom",(playerName)=>{

        const roomCode =
            Math.random()
              .toString(36)
              .substring(2,8)
              .toUpperCase();

        rooms[roomCode] = {

            players:[{
                id:socket.id,
                name:playerName
            }]
        };

        socket.join(roomCode);

        socket.emit(
            "roomCreated",
            roomCode
        );

        io.to(roomCode).emit(
            "playersUpdate",
            rooms[roomCode].players
        );
    });

    socket.on(
        "joinRoom",
        ({roomCode,playerName})=>{

            roomCode =
                roomCode.toUpperCase();

            if(!rooms[roomCode]){

                socket.emit(
                    "joinError",
                    "Salon introuvable"
                );

                return;
            }

            rooms[roomCode].players.push({

                id:socket.id,
                name:playerName

            });

            socket.join(roomCode);

            io.to(roomCode).emit(
                "playersUpdate",
                rooms[roomCode].players
            );
        }
    );

});

const PORT =
    process.env.PORT || 3000;

server.listen(PORT,()=>{

    console.log(
        `Serveur démarré sur ${PORT}`
    );
});