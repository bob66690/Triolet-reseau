const rooms = {};

const DISTRIB = {
  0:9,1:9,2:8,3:8,4:7,5:8,6:6,
  7:6,8:4,9:4,10:3,11:3,12:2,
  13:2,14:1,15:1
};

const SPECS = {};

function addSpec(list,type){

    list.forEach(s=>{

        const r =
            s.charCodeAt(0)-65;

        const c =
            parseInt(
                s.slice(1)
            ) - 1;

        SPECS[r+","+c] = type;

    });

}

addSpec(
    ['A8','B2','B14','H1','H15','N2','N14','O8'],
    'R'
);

addSpec(
    ['D8','E5','E11','H4','H12','K5','K11','L8'],
    'D'
);

addSpec(
    ['B5','B11','E2','E14','K2','K14','N5','N11'],
    'T'
);

addSpec(
    ['H8'],
    'C'
);







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

function specAt(game,r,c){

    const k =
        r + "," + c;

    if(
        game.usedSp &&
        game.usedSp.includes(k)
    ){
        return null;
    }

    return SPECS[k] || null;
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

// teste que les pions touchent d'autres pions posés
function hasAdjacentTile(game,r,c){

    const dirs = [
        [-1,0],
        [1,0],
        [0,-1],
        [0,1]
    ];

    for(const [dr,dc] of dirs){

        const nr = r + dr;
        const nc = c + dc;

        if(
            nr >= 0 &&
            nr < 15 &&
            nc >= 0 &&
            nc < 15 &&
            game.board[nr][nc] !== null
        ){
            return true;
        }

    }

    return false;

}

function isContinuous(game,move){

    const board =
        game.board.map(
            row=>row.map(
                c=>c ? {...c} : null
            )
        );

    move.forEach(m=>{

        board[m.r][m.c]={
            val:m.val,
            isJoker:m.isJoker,
            jokerVal:m.jokerVal
        };

    });

    const rows =
        [...new Set(
            move.map(m=>m.r)
        )];

    const cols =
        [...new Set(
            move.map(m=>m.c)
        )];

    if(rows.length === 1){

        const r = rows[0];

        let min =
            Math.min(
                ...move.map(m=>m.c)
            );

        let max =
            Math.max(
                ...move.map(m=>m.c)
            );

        for(let c=min;c<=max;c++){

            if(
                board[r][c] === null
            ){
                return false;
            }

        }

    }

    if(cols.length === 1){

        const c = cols[0];

        let min =
            Math.min(
                ...move.map(m=>m.r)
            );

        let max =
            Math.max(
                ...move.map(m=>m.r)
            );

        for(let r=min;r<=max;r++){

            if(
                board[r][c] === null
            ){
                return false;
            }

        }

    }

    return true;

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

    rejouer:false,
	logs:[]


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
			if(game.over){
    return;
}
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

let valid = true;

let errorMsg = "";
if(game.first){

    const center =
        data.move.some(
            m =>
                m.r === 7 &&
                m.c === 7
        );

    if(!center){

        valid = false;

        errorMsg =
            "❌ Le premier coup doit couvrir H8";

    }

}

// teste coup adjacent obligatoire
if(!game.first){

    const connected =
        data.move.some(
            m =>
                hasAdjacentTile(
                    game,
                    m.r,
                    m.c
                )
        );

    if(!connected){

        valid = false;

        errorMsg =
            "❌ Le coup doit toucher un jeton déjà présent";

    }

}




const rows =
    [...new Set(
        data.move.map(
            m => m.r
        )
    )];

const cols =
    [...new Set(
        data.move.map(
            m => m.c
        )
    )];

if(
    rows.length > 1 &&
    cols.length > 1
)
{

    valid = false;

    errorMsg =
        "❌ Les jetons doivent être sur la même ligne ou colonne";

}

if(
    !isContinuous(
        game,
        data.move
    )
){

    valid = false;

    errorMsg =
        "❌ Les jetons doivent former une ligne continue";

}




lines.forEach(line=>{

    if(line.length > 3){

        valid = false;

        errorMsg =
            "❌ Maximum 3 jetons côte à côte";

    }
	
	

    const sum =
        line
        .map(
            x =>
                x.tok.isJoker
                    ? x.tok.jokerVal
                    : x.tok.val
        )
        .reduce(
            (a,b)=>a+b,
            0
        );

    if(
        line.length === 2 &&
        sum > 15
    ){

        valid = false;

        errorMsg =
            `❌ Cette paire fait ${sum} (>15)`;

    }

    if(
        line.length === 3 &&
        sum !== 15
    ){

        valid = false;

        errorMsg =
            `❌ Ce trio fait ${sum} au lieu de 15`;

    }

});
if(!valid){

    console.log(
        "VALIDATION REFUSEE :",
        errorMsg
    );

}
    
if(!valid){

    socket.emit(
    "invalidMove",
    errorMsg
);

    return;

}


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
/* calcul compliqué des points */

let pts = 0;

if(
    lines.length > 0
){

    lines.forEach(line=>{

        const vals =
            line.map(
                x=>scoreVal(x.tok)
            );

        const sum =
            vals.reduce(
                (a,b)=>a+b,
                0
            );
// log temporaire
console.log(
    "LINE",
    line.map(
        x =>
            x.tok.isJoker
                ? `X(${x.tok.jokerVal})`
                : x.tok.val
    )
);
// fin log temporaire
        if(
    line.length === 2
){

    let pairPts = 0;

    line.forEach(item=>{

        let val =
            scoreVal(item.tok);

        const joueCeTour =
            data.move.find(
                m =>
                    m.r === item.r &&
                    m.c === item.c
            );

        if(joueCeTour){

            const sp =
                specAt(
                    game,
                    item.r,
                    item.c
                );

            if(
                sp === "C" ||
                sp === "D"
            ){
                val *= 2;
            }

            if(
                sp === "T"
            ){
                val *= 3;
            }

        }

        pairPts += val;

    });

    pts += pairPts;

}
        else 
			if(
    line.length === 3
){

    const evSum =
        line
        .map(
            x=>
                x.tok.isJoker
                ? x.tok.jokerVal
                : x.tok.val
        )
        .reduce(
            (a,b)=>a+b,
            0
        );
		
		console.log(
    "TRIO",
    line.map(
        x =>
            x.tok.isJoker
            ? x.tok.jokerVal
            : x.tok.val
    ),
    "SOMME",
    evSum
);


    if(
        evSum === 15
    ){

        let mult = 1;

        line.forEach(l=>{

            const joueCeTour =
                data.move.find(
                    m =>
                        m.r === l.r &&
                        m.c === l.c
                );

            if(!joueCeTour)
                return;

            const sp =
                specAt(
                    game,
                    l.r,
                    l.c
                );

            if(
                sp === "D" ||
                sp === "C"
            ){
                mult = Math.max(
                    mult,
                    2
                );
            }

            if(
                sp === "T"
            ){
                mult = Math.max(
                    mult,
                    3
                );
            }

        });
console.log(
    "TRIO VALIDE",
    "MULT",
    mult
);
        pts += 30 * mult;

        const allNew =
            line.every(
                l=>
                    data.move.some(
                        m=>
                            m.r===l.r &&
                            m.c===l.c
                    )
            );

        const hasJoker =
            line.some(
                l=>l.tok.isJoker
            );

        if(
            allNew &&
            !hasJoker
        ){
            pts += 50;
        }

    }

}

    });

}
else{

    data.move.forEach(m=>{

        let val =
            scoreVal(m);

        const sp =
            specAt(
                game,
                m.r,
                m.c
            );

        if(
            sp === "C" ||
            sp === "D"
        ){
            val *= 2;
        }

        if(
            sp === "T"
        ){
            val *= 3;
        }

        pts += val;

    });

}

currentPlayer.score += pts;

const detail =
    data.move.map(m=>
        m.isJoker
            ? `X(${m.jokerVal})`
            : m.val
    ).join("-");

let msg = "";

if(data.move.length === 3){

    if(pts >= 80){

        msg =
            `🎉 TRIOLET - ${currentPlayer.name} joue [${detail}] : +${pts} pts`;

    }else{

        msg =
            `🔺 TRIO - ${currentPlayer.name} joue [${detail}] : +${pts} pts`;

    }

}
else if(data.move.length === 2){

    msg =
        `⚡ PAIRE - ${currentPlayer.name} joue [${detail}] : +${pts} pts`;

}
else{

    msg =
        `🎯 ${currentPlayer.name} joue [${detail}] : +${pts} pts`;

}

game.logs.push(msg);

game.logs.push(
    `🏆 Total ${currentPlayer.name} : ${currentPlayer.score}`
);



game.logs.push(
    `${currentPlayer.name} : +${pts} pts`
);


if(
    game.sac.length === 0 &&
    currentPlayer.hand.length === 0
){

    let bonus = 0;

    game.joueurs.forEach(j=>{

        if(j === currentPlayer)
            return;

        j.hand.forEach(t=>{

            if(!t.isJoker){

                bonus += t.val;

            }

        });

    });

    currentPlayer.score += bonus;

    game.over = true;

}

game.first = false;

if(
    game.sac.length === 0 &&
    currentPlayer.hand.length === 0
){
    game.over = true;
}
console.log(
    "POINTS",
    pts,
    "TOTAL",
    currentPlayer.score
);

// fin ajout calcul points
// rejouer
let rejouer = false;

data.move.forEach(m=>{

    const sp =
        specAt(
            game,
            m.r,
            m.c
        );

    if(sp === "R"){

        rejouer = true;
game.logs.push(
    `🔁 ${currentPlayer.name} obtient un tour supplémentaire`
);

    }

});



//cases consommees
if(
    !game.usedSp
){
    game.usedSp = [];
}

data.move.forEach(m=>{

    const sp =
        SPECS[
            m.r + "," + m.c
        ];

    if(sp){

        const k =
            m.r + "," + m.c;

        if(
            !game.usedSp.includes(k)
        ){
            game.usedSp.push(k);
        }

    }

});






/* joueur suivant */

if(!rejouer){

    game.cur =
    (
        game.cur + 1
    )
    %
    game.joueurs.length;

}

game.rejouer = rejouer;
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
		io.emit(
			"roomsChanged"
		);
		
		
    });
	
	
	// ajout liste des salons disponibles
	socket.on(
    "getRooms",
    ()=>{

        const list =
            Object.entries(rooms)
            .filter(([code,room])=>
                !room.game
            )
            .map(([code,room])=>({

                code,

                host:
                    room.players[0]?.name,

                players:
                    room.players.length

            }));

        socket.emit(
            "roomsList",
            list
        );

    }
);
	
	
	
	// fin ajout salons disponbles
	
	

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
			io.emit(
				"roomsChanged"
				);
			
			
        }
    );


socket.on(
    "passTurn",
    data=>{

        const room =
            rooms[data.roomCode];

        if(!room) return;

        const game =
            room.game;
if(game.over){
    return;
}
        const currentPlayer =
            game.joueurs[game.cur];

        if(
            currentPlayer.id !== socket.id
        ){
            return;
        }

        game.cur =
        (
            game.cur + 1
        )
        %
        game.joueurs.length;
//journal
game.logs.push(
    `⏭️ ${currentPlayer.name} passe son tour`
);
//fin journal
        io.to(data.roomCode).emit(
            "stateUpdate",
            game
        );

    }
);

socket.on(
    "exchangeTiles",
    data=>{

        const room =
            rooms[data.roomCode];

        if(!room) return;

        const game =
            room.game;
if(game.over){
    return;
}
        const currentPlayer =
            game.joueurs[game.cur];

        if(
            currentPlayer.id !== socket.id
        ){
            return;
        }

        const sorted =
            [...data.tiles]
            .sort((a,b)=>b-a);

        const removed =
            sorted.map(
                i =>
                currentPlayer.hand.splice(i,1)[0]
            );

        game.sac.push(...removed);

        shuffle(game.sac);

        removed.forEach(()=>{

            if(game.sac.length){

                currentPlayer.hand.push(
                    game.sac.pop()
                );

            }

        });

        game.cur =
        (
            game.cur + 1
        )
        %
        game.joueurs.length;

//journal
game.logs.push(
    `🔄 ${currentPlayer.name} échange ${removed.length} jeton(s)`
);
//fin journal


        io.to(data.roomCode).emit(
            "stateUpdate",
            game
        );

    }
);

socket.on(
    "getRooms",
    ()=>{

        const list =
            Object.entries(rooms)
            .filter(
                ([code,room])=>
                    !room.game
            )
            .map(
                ([code,room])=>({

                    code,

                    host:
                        room.players[0]?.name,

                    players:
                        room.players.length

                })
            );

        socket.emit(
            "roomsList",
            list
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