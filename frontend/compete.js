const io = require("socket.io-client");
const socket = io("http://localhost:5000");

let page1 = document.getElementById("page1");
let page2 = document.getElementById("page2");
let startpage = document.getElementById("startpage");

//page1:
// initialize users and details
let newgame = document.getElementById("newgame");
let newusername = document.getElementById("newusername");
let joingame = document.getElementById("joingame");
let mygamecode = document.getElementById("mygamecode");
let username = document.getElementById("username");

//waitingroom
let waitingroom = document.getElementById("waitingroom");
let gamecodebox = document.getElementById("gamecode");
let playerlist = document.getElementById("playerlist");
let startgame = document.getElementById("startgame");

//page2:
// let content = document.querySelector(".content");
let mainbox = document.getElementsByClassName("main_box")[0];
let waitloader = document.getElementsByClassName("wait_loader")[0];
let loader = document.getElementsByClassName("loader")[0];
let boy = document.getElementById("boy");
let wordbox = document.querySelector(".wordbox");
let textbox = document.getElementById("box");
let time = document.getElementById("time");
let scoreboard = document.getElementsByClassName("lboard_wrap")[0];
let count = 0;
let charcount = 0;
let wrongcount = 0;

let seconds;
let noofplayers = 0;
let myroomcode;

//Code:

//page1


socket.on("showgamebutton", () => {
  startgame.style.display = "block";
})
startgame.addEventListener("click", () => {
  socket.emit("sendwords", "true");
});

socket.on("receivewords", (words) => {

  waitloader.setAttribute("class", "loader wait_loader");
  waitloader.style.display = "flex";
  setTimeout(() => {
    waitloader.classList.remove("loader");
    waitloader.style.display = "none";

     page1.style.display = "none";
     page2.style.display = "flex";
     getwords(wordbox, words);
     //timer starts
     seconds = 60;
     const timer = setInterval(() => {
       let zero = seconds < 10 ? "0" : "";
       if (seconds == 0) {
         time.innerHTML = "0:00";
         clearInterval(timer);
       } else time.innerHTML = `0:${zero + seconds--}`;
     }, 1000);

     //player data to server after every 500ms
     const sendreq_timer = setInterval(() => {
       socket.emit("correctwords", [count, seconds, charcount, myroomcode]);
       if (seconds == 0) {
         clearInterval(sendreq_timer);
       }
       console.log(seconds);
     }, 500);
  }, 3000);

});

let toleaderboard = (name, wpm, words, position) => {

  let txt = position == 1 ? "winner" : "";
  let board = document.createElement("div");
  board.setAttribute('class', 'lboard_mem');
  
   board.innerHTML=`
    <div class="name_bar ${txt}">
      <p>
        <span>${position}.</span> ${name}
      </p>
      <div class="bar_wrap">
        <div class="inner_bar" style="width: 95%"></div>
      </div>
    </div>
    <div class="points">${wpm} WPM</div>
    <div class="points">${words} Words</div>
  </div>
  `
  scoreboard.appendChild(board);
  
}

let initialize = (code) => {
  myroomcode = code;
  gamecodebox.innerHTML = `GAME CODE: ${code}`;
};

let playername = (data) => {
  
  let player = data.player;
  let speed = data.speed;
  let correctwords = data.correctwords;
  
  playerlist.innerHTML = "";
  noofplayers = player.length;

  for (i in player) {
    let li = document.createElement("li");
    li.innerHTML = player[i];
    playerlist.appendChild(li);
  }


  scoreboard.innerHTML = "";
  for (let i = 0; i < player.length; i++){
    toleaderboard(player[i], speed==undefined?0:speed[i], correctwords==undefined?0:correctwords[i], i + 1);
  }
};

socket.on("players", playername);
socket.on("init", initialize);

let init = () => {
  startpage.style.display = "none";
  waitingroom.style.display = "block";
};

newgame.addEventListener("click", () => {
  socket.emit("newgame", newusername.value);
  init();
});
joingame.addEventListener("click", () => {
  let user = username.value;
  let gcode = mygamecode.value;
  socket.emit("joingame", { name: user, code: gcode });
  
  socket.on("joinedroom", (check) => {
    if (check=="true") {
      init();
      initialize(gcode)
    }
    else {
      alert("No such room exist");
    }
  })
});

//page2

let getwords = (e, list) => {
  for (i in list) {
    //create span element containing word
    let spantext = document.createElement("span");
    spantext.innerHTML = `${list[i]}&nbsp`;
    e.appendChild(spantext);
  }
};

let correctOrNot = () => {
  
  let word = textbox.value.trim();
  let real_word = pointer.textContent.trim();
  if (word.length > real_word) return -1;
  for (let i = 0; i < word.length; i++) {
    if (word[i] !== real_word[i]) return -1;
  }
  return word.length == real_word.length ? 1 : 0;
};

let jumpnext = (event) => {

  if (event.key == " ") {
    textbox.setSelectionRange(0, 0);
    textbox.focus();
    if (textbox.value.trim().length !== 0) {
      pointer.style.color = correctOrNot() === 1 ? "green" : "red";
      if (correctOrNot() === 1) {
        count++;
      } else wrongcount++;
      pointer.removeAttribute("class");
      pointer.style.background = null;
      pointer = pointer.nextSibling;
      pointer.setAttribute("class", "pointer");
    }

    textbox.value = "";
  } else {
    if (correctOrNot() == -1) {
      pointer.style.background = "#fa0505c0";
    } else {
      pointer.style.background = "#b9bdc260";
      charcount++;
    }
  }
};

let remove_row = () => {
  let text = wordbox.firstElementChild;
  let next_text = text.nextElementSibling;
  let remove_list = [];
  while (
    text.getBoundingClientRect().y == next_text.getBoundingClientRect().y
  ) {
    remove_list.push(text);
    text = next_text;
    next_text = text.nextElementSibling;
  }
  remove_list.push(text);
  for (let e of remove_list) wordbox.removeChild(e);
};

getwords(wordbox, ["start"]);

let pointer = wordbox.firstElementChild;
pointer.setAttribute("class", "pointer");
textbox.addEventListener("keyup", (event) => {
  //remove row
  if (
    pointer.getBoundingClientRect().y !=
    pointer.nextElementSibling.getBoundingClientRect().y &&
    event.key == " "
  ) {
    jumpnext(event);
    remove_row();
  } else jumpnext(event);
});

socket.on("gameover", gameover);

function gameover() {
  console.log("hey");
  mainbox.style.display = 'none';
  loader.style.display = "flex";
  setTimeout(() => {
    loader.style.display = 'none';
    boy.style.display = 'block';
  }, 3000)
}
