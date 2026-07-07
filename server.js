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

function scoreVal(t){

    if(!t)
        return 0;

    if(t.isJoker)
        return 0;

    return t.val;

}

function getLine(board,r,c,dr,dc){

    let sr=r,sc=c;

    while(
        sr-dr>=0 &&
        sr-dr<15 &&
        sc-dc>=0 &&
        sc-dc<15 &&
        board[sr-dr][sc-dc]!==null
    ){
        sr-=dr;
        sc-=dc;
    }

    const line=[];

    let cr=sr;
    let cc=sc;

    while(
        cr>=0 &&
        cr<15 &&
        cc>=0 &&
        cc<15 &&
        board[cr][cc]!==null
    ){
        line.push({
            r:cr,
            c:cc,
            tok:board[cr][cc]
        });

        cr+=dr;
        cc+=dc;
    }

    return line;
}

function affectedLines(game,move){

    const board =
        game.board.map(
            row => row.map(
                c => c ? {...c} : null
            )
        );

    move.forEach(m=>{

        board[m.r][m.c]={
            val:m.val,
            isJoker:m.isJoker,
            jokerVal:m.jokerVal
        };

    });

    const res=[];
    const seen=new Set();

    move.forEach(p=>{

        [
            ['H',0,1],
            ['V',1,0]
        ].forEach(([axis,dr,dc])=>{

            const k =
                axis +
                (dr===0 ? p.r : p.c);

            if(seen.has(k))
                return;

            seen.add(k);

            const l =
                getLine(
                    board,
                    p.r,
                    p.c,
                    dr,
                    dc
                );

            if(l.length>=2)
                res.push(l);

        });

    });

    return res;

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


let winnerIndex = 0;
let bestValue = -1;

joueurs.forEach((j,i)=>{

    const highest =
        Math.max(
            ...j.hand.map(
                t=>t.isJoker ? -1 : t.val
            )
        );

    if(highest > bestValue){

        bestValue = highest;

        winnerIndex = i;

    }
});

    return {

        joueurs,

        sac,

        cur:winnerIndex,
		
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
			
// ajout temporaire
const lines =
    affectedLines(
        game,
        data.move
    );

console.log(
    "LINES",
    JSON.stringify(lines)
);
//fin			
			

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

// ajout calcul points
/* calcul simple des points */

let pts = 0;

const valeurs = [];

data.move.forEach(m=>{

    pts += scoreVal(m);

    valeurs.push(
        m.isJoker
            ? 0
            : m.val
    );

});

/* règle du trio */

if(
    valeurs.length === 3
){
    const somme =
        valeurs.reduce(
            (a,b)=>a+b,
            0
        );

    if(
        somme === 15
    ){
        pts = 30;
    }

}

currentPlayer.score += pts;



// fin ajaout calcul points


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