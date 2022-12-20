const words = require('random-words');
const {createServer} = require("http");
const { Server } = require("socket.io");
const {makeid} = require("./utils.js")

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

let admins={}

io.on("connection", (client) => {
  
 //Initializes a newgame
  let newgame = (clientname) => {
    client.username = clientname;
    client.speed = 0;
    client.correctness = 0;
    let roomid = makeid(5);
    client.join(roomid);
    admins[roomid] = client;

    playerjoined(roomid);
    client.emit("init", roomid);
  };
  
  // Joins a game if valid code
  let joingame = (obj) => {
    client.username = obj.name;
    client.speed = 0;
    client.correctness = 0;
    if (!io.sockets.adapter.rooms.has(obj.code)) {
      client.emit("joinedroom", "false");
    }
    else {
      client.emit("joinedroom", "true")
      client.join(obj.code);
      playerjoined(obj.code);
    }
  };

  //Receiving Client Calls
  client.on("newgame", newgame);
  client.on("joingame", joingame);
  client.on("sendwords", () => {
    io.to(Array.from(client.rooms)[1]).emit("receivewords", words({ exactly: 100, maxLength: 5}));
  })
  client.on("correctwords", async (e) => {
    let correctwords= e[0]
    let seconds = e[1];
    let charcount = e[2];
    let roomcode = e[3];

    let clientsInRoom = await io.in(roomcode).fetchSockets();
    sort(clientsInRoom);
    client.speed = seconds==60?0:Math.floor((charcount/5*60)/(60-seconds));
    client.correctness = correctwords;
    let list = [];
    let speedlist = [];
    let correctlist = [];
    for (i in clientsInRoom) {
      list.push(clientsInRoom[i].username);
      speedlist.push(clientsInRoom[i].speed);
      correctlist.push(clientsInRoom[i].correctness);
    }

    io.to(roomcode).emit("players", { player: list, speed: speedlist, correctwords: correctlist });
    
    if (seconds == 0) io.to(roomcode).emit("gameover");
  })

});

httpServer.listen(process.env.PORT || 5000);


async function playerjoined(roomName) {
  const clientsInRoom = await io.in(roomName).fetchSockets();

  if (clientsInRoom.length == 2) {
    admins[roomName].emit("showgamebutton");
  }

  let list = [];
  for (i in clientsInRoom) {
    list.push(clientsInRoom[i].username);
  }
  io.to(roomName).emit("players", { player: list });
}
function sort(arr) {
  for (var i = 0; i < arr.length; i++) {
    // Last i elements are already in place
    for (var j = 0; j < arr.length - i - 1; j++) {
      if (arr[j].correctness < arr[j + 1].correctness) {
        // If the condition is true then swap them
        var temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
}
