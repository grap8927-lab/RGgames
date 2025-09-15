const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.6;

let gameActive = true;
let player, enemies, bullets, safeZone;

// --- Initialize Game ---
function initGame() {
  player = { x: canvas.width/2, y: canvas.height/2, r: 15, speed: 3, health: 100, lastDir: {x:1,y:0} };
  enemies = [];
  bullets = [];
  safeZone = { x: canvas.width/2, y: canvas.height/2, r: Math.min(canvas.width,canvas.height)/2 };

  for (let i = 0; i < 6; i++) {
    enemies.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: 15, health: 40 });
  }

  document.getElementById("healthDisplay").textContent = "Health: 100";
  document.getElementById("gameOver").classList.add("hidden");
  gameActive = true;
  requestAnimationFrame(loop);
}

// --- Controls ---
let keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// Fire button (mobile)
document.getElementById("fireBtn").addEventListener("click", () => {
  fireBullet();
});

// Restart
document.getElementById("restartBtn").addEventListener("click", initGame);

// Fire bullet
function fireBullet() {
  bullets.push({
    x: player.x,
    y: player.y,
    dx: player.lastDir.x * 6,
    dy: player.lastDir.y * 6
  });
}

// --- Joystick (mobile movement) ---
const joystick = document.getElementById("joystick");
let joyActive = false, joyCenter = {x:0,y:0};

joystick.addEventListener("touchstart", e => {
  e.preventDefault();
  joyActive = true;
  const rect = joystick.getBoundingClientRect();
  joyCenter = {x: rect.left+rect.width/2, y: rect.top+rect.height/2};
});

joystick.addEventListener("touchmove", e => {
  if (!joyActive) return;
  const touch = e.touches[0];
  const dx = touch.clientX - joyCenter.x;
  const dy = touch.clientY - joyCenter.y;
  const dist = Math.min(Math.hypot(dx,dy), 40);
  const angle = Math.atan2(dy,dx);

  player.x += Math.cos(angle) * player.speed;
  player.y += Math.sin(angle) * player.speed;
  player.lastDir = {x:Math.cos(angle), y:Math.sin(angle)};
});

joystick.addEventListener("touchend", e => { joyActive = false; });

// --- Game Loop ---
function loop() {
  if (!gameActive) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Shrinking safe zone
  if (safeZone.r > 50) safeZone.r -= 0.05;
  ctx.strokeStyle = "lime";
  ctx.beginPath();
  ctx.arc(safeZone.x, safeZone.y, safeZone.r, 0, Math.PI*2);
  ctx.stroke();

  // Keyboard movement
  if (keys["ArrowUp"]||keys["w"]) { player.y -= player.speed; player.lastDir={x:0,y:-1}; }
  if (keys["ArrowDown"]||keys["s"]) { player.y += player.speed; player.lastDir={x:0,y:1}; }
  if (keys["ArrowLeft"]||keys["a"]) { player.x -= player.speed; player.lastDir={x:-1,y:0}; }
  if (keys["ArrowRight"]||keys["d"]) { player.x += player.speed; player.lastDir={x:1,y:0}; }

  // Damage outside safe zone
  let dx = player.x - safeZone.x;
  let dy = player.y - safeZone.y;
  if (Math.hypot(dx,dy) > safeZone.r) player.health -= 0.1;

  // Draw player
  ctx.fillStyle = "cyan";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
  ctx.fill();

  // Bullets
  bullets.forEach((b,i) => {
    b.x += b.dx; b.y += b.dy;
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 5, 0, Math.PI*2);
    ctx.fill();
    if (b.x<0||b.y<0||b.x>canvas.width||b.y>canvas.height) bullets.splice(i,1);
  });

  // Enemies
  enemies.forEach((e, ei) => {
    let dx = player.x - e.x;
    let dy = player.y - e.y;
    let dist = Math.hypot(dx,dy);
    if (dist < 200) { e.x += dx/dist; e.y += dy/dist; }
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI*2);
    ctx.fill();

    // Bullet hits
    bullets.forEach((b, bi) => {
      if (Math.hypot(b.x-e.x,b.y-e.y) < e.r) {
        e.health -= 20;
        bullets.splice(bi,1);
        if (e.health <= 0) enemies.splice(ei,1);
      }
    });

    // Enemy touch damage
    if (Math.hypot(player.x-e.x,player.y-e.y) < player.r+e.r) player.health -= 0.3;
  });

  // Update health
  document.getElementById("healthDisplay").textContent = "Health: " + Math.floor(player.health);

  // Game Over
  if (player.health <= 0) endGame("You Lost!");
  else if (enemies.length === 0) endGame("You Won!");
  else requestAnimationFrame(loop);
}

function endGame(msg) {
  gameActive = false;
  const over = document.getElementById("gameOver");
  document.getElementById("gameOverText").textContent = msg;
  over.classList.remove("hidden");
}

initGame();
