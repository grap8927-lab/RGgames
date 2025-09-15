const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.7;

let score = 0;
let lives = 3;
let ball, flippers, bumpers, jackTarget, sallyTarget;
let gameOver = false;

// Ball object
class Ball {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = canvas.width / 2;
    this.y = canvas.height - 80;
    this.radius = 10;
    this.dx = (Math.random() - 0.5) * 6;
    this.dy = -6;
  }
  update() {
    this.x += this.dx;
    this.y += this.dy;

    // wall bounce
    if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
      this.dx *= -1;
    }
    if (this.y - this.radius < 0) {
      this.dy *= -1;
    }

    // bottom drain
    if (this.y - this.radius > canvas.height) {
      lives--;
      updateHUD();
      if (lives > 0) {
        this.reset();
      } else {
        endGame();
      }
    }
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  }
}

// Flipper
class Flipper {
  constructor(x, side) {
    this.x = x;
    this.y = canvas.height - 40;
    this.width = 80;
    this.height = 15;
    this.angle = 0;
    this.side = side;
    this.active = false;
  }
  update() {
    this.angle = this.active ? (this.side === "left" ? -0.5 : 0.5) : 0;
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = "#ff3300";
    ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
    ctx.restore();
  }
}

// Bumper
class Bumper {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 20;
  }
  hit(ball) {
    let dx = ball.x - this.x;
    let dy = ball.y - this.y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < this.radius + ball.radius) {
      ball.dx *= -1;
      ball.dy *= -1;
      score += 100;
      playSound("bumper");
      updateHUD();
    }
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
    ctx.fillStyle = "#6600ff";
    ctx.fill();
  }
}

// Jack target (multiplier)
class Jack {
  constructor() {
    this.x = canvas.width/3;
    this.y = 150;
    this.radius = 30;
  }
  hit(ball) {
    let dx = ball.x - this.x;
    let dy = ball.y - this.y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < this.radius + ball.radius) {
      score *= 2;
      playSound("jack");
      updateHUD();
    }
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.beginPath(); // eyes
    ctx.arc(this.x-10, this.y-10, 5, 0, Math.PI*2);
    ctx.arc(this.x+10, this.y-10, 5, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath(); // stitched mouth
    ctx.moveTo(this.x-15, this.y+10);
    ctx.lineTo(this.x+15, this.y+10);
    ctx.strokeStyle="black";
    ctx.stroke();
  }
}

// Sally target (extra ball)
class Sally {
  constructor() {
    this.x = 2*canvas.width/3;
    this.y = 150;
    this.radius = 25;
  }
  hit(ball) {
    let dx = ball.x - this.x;
    let dy = ball.y - this.y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < this.radius + ball.radius) {
      lives++;
      playSound("sally");
      updateHUD();
    }
  }
  draw() {
    ctx.beginPath();
    ctx.moveTo(this.x, this.y-20);
    ctx.bezierCurveTo(this.x-30,this.y-40,this.x-30,this.y+20,this.x,this.y+20);
    ctx.bezierCurveTo(this.x+30,this.y+20,this.x+30,this.y-40,this.x,this.y-20);
    ctx.fillStyle="#ff66cc";
    ctx.fill();
    ctx.strokeStyle="black";
    ctx.stroke();
  }
}

// Init game
function init() {
  ball = new Ball();
  flippers = [new Flipper(canvas.width/2-100, "left"), new Flipper(canvas.width/2+100, "right")];
  bumpers = [
    new Bumper(canvas.width/2, 250),
    new Bumper(canvas.width/2-80, 320),
    new Bumper(canvas.width/2+80, 320)
  ];
  jackTarget = new Jack();
  sallyTarget = new Sally();
  gameOver = false;
  score = 0;
  lives = 3;
  updateHUD();
  animate();
}

// Update scoreboard
function updateHUD() {
  document.getElementById("score").textContent = "SCORE: " + score;
  document.getElementById("lives").textContent = "BALLS: " + lives;
}

// Game Over
function endGame() {
  gameOver = true;
  document.getElementById("gameOver").classList.remove("hidden");
  playSound("gameover");
}

// Animation loop
function animate() {
  if (gameOver) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // draw playfield background
  ctx.strokeStyle="#333";
  for(let i=0;i<canvas.width;i+=40){
    ctx.beginPath();
    ctx.moveTo(i,0);
    ctx.lineTo(i,canvas.height);
    ctx.stroke();
  }

  ball.update();
  ball.draw();

  flippers.forEach(f=>{
    f.update();
    f.draw();
  });

  bumpers.forEach(b=>{
    b.hit(ball);
    b.draw();
  });

  jackTarget.hit(ball);
  jackTarget.draw();

  sallyTarget.hit(ball);
  sallyTarget.draw();

  requestAnimationFrame(animate);
}

// Controls
document.addEventListener("keydown", e=>{
  if(e.key==="ArrowLeft") flippers[0].active=true;
  if(e.key==="ArrowRight") flippers[1].active=true;
});
document.addEventListener("keyup", e=>{
  if(e.key==="ArrowLeft") flippers[0].active=false;
  if(e.key==="ArrowRight") flippers[1].active=false;
});

// Mobile buttons
document.getElementById("leftBtn").addEventListener("touchstart", ()=>flippers[0].active=true);
document.getElementById("leftBtn").addEventListener("touchend", ()=>flippers[0].active=false);
document.getElementById("rightBtn").addEventListener("touchstart", ()=>flippers[1].active=true);
document.getElementById("rightBtn").addEventListener("touchend", ()=>flippers[1].active=false);

// Restart
document.getElementById("restartBtn").addEventListener("click", ()=>{
  document.getElementById("gameOver").classList.add("hidden");
  init();
});

// Sounds
function playSound(type){
  const ctxAudio = new (window.AudioContext||window.webkitAudioContext)();
  const o = ctxAudio.createOscillator();
  const g = ctxAudio.createGain();
  o.connect(g);
  g.connect(ctxAudio.destination);
  if(type==="bumper"){o.frequency.value=400;}
  if(type==="jack"){o.frequency.value=700;}
  if(type==="sally"){o.frequency.value=250;}
  if(type==="gameover"){o.frequency.value=100;}
  o.type="square";
  o.start();
  g.gain.exponentialRampToValueAtTime(0.00001, ctxAudio.currentTime+0.5);
}

init();
