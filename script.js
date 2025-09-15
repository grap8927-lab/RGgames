const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth * 0.95;
canvas.height = window.innerHeight * 0.7;

const fireBtn = document.getElementById("fireBtn");
const joystick = document.getElementById("joystick");
const gameOverDiv = document.getElementById("gameOver");
const gameOverText = document.getElementById("gameOverText");
const restartBtn = document.getElementById("restartBtn");

let player, enemies, bullets, safeZone, gameOver;

function initGame() {
  player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    r: 15,
    color: "lime",
    speed: 3,
    hp: 100,
    lastDir: {x: 1, y: 0}
  };
  bullets = [];
  enemies = [];
  for (let i = 0; i < 6; i++) {
    enemies.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 15,
      color: "red",
      hp: 30
    });
  }
  safeZone = {
    x: canvas.width/2,
    y: canvas.height/2,
    radius: Math.min(canvas.width, canvas.height) / 2
  };
  gameOver = false;
  gameOverDiv.classList.add("hidden");
}
initGame();

// Movement (keyboard)
let keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// Joystick movement
let joyActive = false, joyCenter = {x:0,y:0};
joystick.addEventListener("touchstart", e => {
  joyActive = true;
  const rect = joystick.getBoundingClientRect();
  joyCenter = {x: rect.left+rect.width/2, y: rect.top+rect.height/2};
});
joystick.addEventListener("touchend", () => joyActive = false);
joystick.addEventListener("touchmove", e => {
  if (!joyActive) return;
  const touch = e.touches[0];
  let dx = touch.clientX - joyCenter.x;
  let dy = touch.clientY - joyCenter.y;
  const dist = Math.hypot(dx,dy);
  if (dist>0) {
    player.x += (dx/dist) * player.speed;
    player.y += (dy/dist) * player.speed;
    player.lastDir = {x: dx/dist, y: dy/dist};
  }
});

// Fire button
fireBtn.addEventListener("click", () => {
  fireBullet();
});

// Shoot toward tap/click
canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const tx = e.clientX - rect.left;
  const ty = e.clientY - rect.top;
  shootToward(tx, ty);
});

canvas.addEventListener("touchstart", e => {
  if (e.target.id === "fireBtn" || e.target.id === "joystick") return;
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const tx = touch.clientX - rect.left;
  const ty = touch.clientY - rect.top;
  shootToward(tx, ty);
});

// Restart button
restartBtn.addEventListener("click", () => initGame());

// Shooting logic
function shootToward(tx, ty) {
  let dx = tx - player.x;
  let dy = ty - player.y;
  const dist = Math.hypot(dx, dy);
  bullets.push({
    x: player.x,
    y: player.y,
    dx: (dx/dist) * 6,
    dy: (dy/dist) * 6
  });
}
function fireBullet() {
  shootToward(player.x + player.lastDir.x*30, player.y + player.lastDir.y*30);
}

// Game loop
function update() {
  if (gameOver) return;

  // Keyboard movement
  if (keys["ArrowUp"] || keys["w"]) { player.y -= player.speed; player.lastDir={x:0,y:-1}; }
  if (keys["ArrowDown"] || keys["s"]) { player.y += player.speed; player.lastDir={x:0,y:1}; }
  if (keys["ArrowLeft"] || keys["a"]) { player.x -= player.speed; player.lastDir={x:-1,y:0}; }
  if (keys["ArrowRight"] || keys["d"]) { player.x += player.speed; player.lastDir={x:1,y:0}; }

  // Bullets
  bullets.forEach((b, i) => {
    b.x += b.dx; b.y += b.dy;
    if (b.x<0||b.y<0||b.x>canvas.width||b.y>canvas.height) bullets.splice(i,1);
  });

  // Enemy AI
  enemies.forEach(e => {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx,dy);
    if (dist<200) { e.x += dx/dist; e.y += dy/dist; }
    // Collision with player
    if (dist < player.r + e.r) {
      player.hp -= 0.5;
    }
  });

  // Bullet hits
  enemies.forEach((e, ei) => {
    bullets.forEach((b, bi) => {
      const dist = Math.hypot(b.x-e.x, b.y-e.y);
      if (dist < e.r) {
        e.hp -= 10;
        bullets.splice(bi,1);
      }
    });
    if (e.hp<=0) enemies.splice(ei,1);
  });

  // Safe zone shrink
  if (safeZone.radius>50) safeZone.radius -= 0.05;
  const distFromCenter = Math.hypot(player.x-safeZone.x, player.y-safeZone.y);
  if (distFromCenter > safeZone.radius) player.hp -= 0.2;

  // Check win/lose
  if (player.hp<=0) endGame("You Lost!");
  if (enemies.length===0) endGame("You Won!");
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Safe zone
  ctx.beginPath();
  ctx.arc(safeZone.x,safeZone.y,safeZone.radius,0,Math.PI*2);
  ctx.strokeStyle="blue";
  ctx.lineWidth=2;
  ctx.stroke();

  // Player
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
  ctx.fillStyle = player.color;
  ctx.fill();

  // Health bar
  ctx.fillStyle="red";
  ctx.fillRect(player.x-20, player.y-30, 40, 5);
  ctx.fillStyle="lime";
  ctx.fillRect(player.x-20, player.y-30, (player.hp/100)*40, 5);

  // Enemies
  enemies.forEach(e=>{
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI*2);
    ctx.fillStyle=e.color;
    ctx.fill();

    // enemy hp bar
    ctx.fillStyle="red";
    ctx.fillRect(e.x-15, e.y-25, 30, 4);
    ctx.fillStyle="lime";
    ctx.fillRect(e.x-15, e.y-25, (e.hp/30)*30, 4);
  });

  // Bullets
  bullets.forEach(b=>{
    ctx.beginPath();
    ctx.arc(b.x,b.y,4,0,Math.PI*2);
    ctx.fillStyle="yellow";
    ctx.fill();
  });
}

function endGame(msg) {
  gameOver = true;
  gameOverText.textContent = msg;
  gameOverDiv.classList.remove("hidden");
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();
