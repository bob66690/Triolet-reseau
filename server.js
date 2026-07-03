const rooms = {};

const DISTRIB = {
  0:9,1:9,2:8,3:8,4:7,5:8,6:6,
  7:6,8:4,9:4,10:3,11:3,12:2,
  13:2,14:1,15:1
};
function shuffle(a){

    for(let i=a.length-1;i>0;i--){

        const j =
          Math.floor(
            Math.random()*(i+1)
          );

        [a[i],a[j]] =
        [a[j],a[i]];
    }
}
function createGame(players){

    const sac = [];

    Object.entries(DISTRIB)
    .forEach(([v,q])=>{

        for(let i=0;i<q;i++){

            sac.push({
                val:Number(v),
                isJoker:false
            });

        }
    });

    sac.push({
        val:null,
        isJoker:true
    });

    sac.push({
        val:null,
        isJoker:true
    });

    shuffle(sac);

    sac.splice(0,3);

const joueurs =
players.map(p=>({

    id:p.id,

    name:p.name,

    isAI:p.isAI,

    score:0,

    hand:sac.splice(-3,3)

}));

    return {

        joueurs,

        sac,

        cur:0,
		
board:Array(15)
        .fill(null)
        .map(()=>Array(15).fill(null)),

    usedSp:[],

    first:true,

    over:false,

    pend:[],

    rejouer:false


    };

}


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

        room.game =
            createGame(
                room.players
            );
			
			

        io.to(roomCode).emit(
            "gameStarted",
            room.game
        );

    }
);

socket.on(
    "playMove",
    data=>{

        const room =
            rooms[data.roomCode];

        if(!room)
            return;

        const game =
            room.game;

        const currentPlayer =
    game.joueurs[game.cur];

if(
    currentPlayer.id !== socket.id
){
    return;
}

data.move.forEach(m=>{

    game.board[m.r][m.c] = {

        val:m.val,

        isJoker:m.isJoker,

        jokerVal:m.jokerVal

    };

});

/* retirer les jetons joués */

const idxs =
    [...new Set(
        data.move.map(m=>m.hi)
    )]
    .sort((a,b)=>b-a);

idxs.forEach(i=>{

    currentPlayer.hand.splice(
        i,
        1
    );

});

/* repiocher */

idxs.forEach(()=>{

   if(game.sac.length){

        currentPlayer.hand.push(
            game.sac.pop()
        );

    }

});

/* joueur suivant */

game.cur =
(
    game.cur + 1
)
%
game.joueurs.length;

        io.to(data.roomCode).emit(
            "stateUpdate",
            game
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
    {
        roomCode,
        playerId: socket.id
    }
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
			
			socket.emit(
    "joinedRoom",
    {
        roomCode,
        playerId: socket.id
    }
);

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