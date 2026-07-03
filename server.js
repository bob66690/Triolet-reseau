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
socket.on(
    "addAI",
    roomCode=>{

        const room =
            rooms[roomCode];

        if(!room)
            return;

        if(room.host !== socket.id)
            return;

        const aiCount =
            room.players.filter(
                p=>p.isAI
            ).length + 1;

        room.players.push({

            id:"AI"+aiCount,
            name:"IA "+aiCount,
            isAI:true

        });

        io.to(roomCode).emit(
            "playersUpdate",
            room.players
        );

    }
);




socket.on(
    "startGame",
    roomCode=>{

        const room =
            rooms[roomCode];

        if(!room)
            return;

        if(room.host !== socket.id)
            return;

        io.to(roomCode).emit(
            "gameStarted"
        );

    }
);

    socket.on("createRoom",(playerName)=>{
console.log(
    "Création salon par",
    playerName
);
        const roomCode =
            Math.random()
              .toString(36)
              .substring(2,8)
              .toUpperCase();

        rooms[roomCode] = {

			host: socket.id,

			players:[{
			id:socket.id,
			name:playerName,
			 isAI:false
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
console.log(
    "Rejoint salon",
    roomCode,
    playerName
);
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
                name:playerName,
				isAI:false

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