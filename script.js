const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.7;

let gameActive = true;
let player, enemies, bullets, safeZone, shrinkTimer, health;

function initGame() {
  player = { x: canvas.width/2, y: canvas.height/2, r: 15, speed: 3, health: 100 };
  enemies = [];
  bullets = [];
  safeZone = { x: canvas.width/2, y: canvas.height/2, r: Math.min(canvas.width,canvas.height)/2 };
  shrinkTimer = 30;
  health = 100;

  for (let i = 0; i < 5; i++) {
    enemies.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: 12, health: 30 });
  }

  document.getElementById("gameOver").classList.add("hidden");
  gameActive = true;
  loop();
}

// Controls
let keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

document.getElementById("fireBtn").addEventListener("click", () => {
  bullets.push({ x: player.x, y: player.y, dx: 5, dy: 0 });
});

// Restart
document.getElementById("restartBtn").addEventListener("click", initGame);

// Game Loop
function loop() {
  if (!gameActive) return;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Draw Safe Zone
  ctx.strokeStyle = "lime";
  ctx.beginPath();
  ctx.arc(safeZone.x, safeZone.y, safeZone.r, 0, Math.PI*2);
  ctx.stroke();

  // Move Player
  if (keys["ArrowUp"]) player.y -= player.speed;
  if (keys["ArrowDown"]) player.y += player.speed;
  if (keys["ArrowLeft"]) player.x -= player.speed;
  if (keys["ArrowRight"]) player.x += player.speed;

  // Draw Player
  ctx.fillStyle = "cyan";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
  ctx.fill();

  // Draw Bullets
  bullets.forEach((b, i) => {
    b.x += b.dx; b.y += b.dy;
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 5, 0, Math.PI*2);
    ctx.fill();
    // Remove offscreen
    if (b.x < 0 || b.y < 0 || b.x > canvas.width || b.y > canvas.height) bullets.splice(i,1);
  });

  // Enemies
  enemies.forEach((e, i) => {
    // Chase
    let dx = player.x - e.x;
    let dy = player.y - e.y;
    let dist = Math.hypot(dx, dy);
    if (dist < 200) {
      e.x += dx/dist;
      e.y += dy/dist;
    }

    // Draw
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI*2);
    ctx.fill();

    // Check bullet hit
    bullets.forEach((b, bi) => {
      if (Math.hypot(b.x-e.x,b.y-e.y) < e.r+5) {
        e.health -= 10;
        bullets.splice(bi,1);
        if (e.health <= 0) enemies.splice(i,1);
      }
    });

    // Enemy hits player
    if (Math.hypot(player.x-e.x,player.y-e.y) < e.r+player.r) {
      player.health -= 1;
    }
  });

  // Safe Zone Shrink
  shrinkTimer -= 0.02;
  if (shrinkTimer <= 0 && safeZone.r > 50) {
    safeZone.r -= 0.5;
    shrinkTimer = 30;
  }

  // Damage outside zone
  if (Math.hypot(player.x-safeZone.x,player.y-safeZone.y) > safeZone.r) {
    player.health -= 0.2;
  }

  // HUD
  document.getElementById("health").textContent = `Health: ${Math.floor(player.health)}`;
  document.getElementById("enemies").textContent = `Enemies Left: ${enemies.length}`;
  document.getElementById("zone").textContent = `Zone Shrinks In: ${Math.floor(shrinkTimer)}`;

  // Win/Lose
  if (player.health <= 0) endGame("You Lost!");
  if (enemies.length === 0) endGame("Victory!");

  requestAnimationFrame(loop);
}

function endGame(msg) {
  gameActive = false;
  document.getElementById("gameOverText").textContent = msg;
  document.getElementById("gameOver").classList.remove("hidden");
}

initGame();
