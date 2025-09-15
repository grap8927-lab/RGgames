const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Responsive canvas
function resizeCanvas() {
  canvas.width = window.innerWidth * 0.95;
  canvas.height = window.innerHeight * 0.65;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let player = { x: canvas.width/2, y: canvas.height/2, size: 25, color: "lime", speed: 5, health: 100 };
let keys = {};
let bullets = [];
let enemies = [];

// Spawn enemies
for (let i=0; i<5; i++) {
  enemies.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, size: 25, color: "red", speed: 1.3 });
}

let safeZone = { x: canvas.width/2, y: canvas.height/2, radius: Math.min(canvas.width,canvas.height)/2, shrinkRate: 0.05 };

document.addEventListener("keydown", e => { keys[e.key] = true; });
document.addEventListener("keyup", e => { keys[e.key] = false; });

// Shoot toward mouse
canvas.addEventListener("click", e => {
  let rect = canvas.getBoundingClientRect();
  let targetX = e.clientX - rect.left;
  let targetY = e.clientY - rect.top;
  shoot(targetX, targetY);
});

// Shoot toward tap (mobile)
canvas.addEventListener("touchstart", e => {
  let rect = canvas.getBoundingClientRect();
  let touch = e.touches[0];
  let targetX = touch.clientX - rect.left;
  let targetY = touch.clientY - rect.top;
  shoot(targetX, targetY);
});

function shoot(targetX, targetY) {
  let dx = targetX - player.x;
  let dy = targetY - player.y;
  let dist = Math.sqrt(dx*dx + dy*dy);
  let speed = 7;
  bullets.push({ x: player.x, y: player.y, size: 6, color: "yellow", dx: (dx/dist)*speed, dy: (dy/dist)*speed });
}

function update() {
  // Movement
  if (keys["ArrowUp"]||keys["w"]||keys["up"]) player.y -= player.speed;
  if (keys["ArrowDown"]||keys["s"]||keys["down"]) player.y += player.speed;
  if (keys["ArrowLeft"]||keys["a"]||keys["left"]) player.x -= player.speed;
  if (keys["ArrowRight"]||keys["d"]||keys["right"]) player.x += player.speed;

  // Boundaries
  if (player.x<0) player.x=0;
  if (player.y<0) player.y=0;
  if (player.x>canvas.width-player.size) player.x=canvas.width-player.size;
  if (player.y>canvas.height-player.size) player.y=canvas.height-player.size;

  // Safe zone shrink
  safeZone.radius = Math.max(50, safeZone.radius - safeZone.shrinkRate);
  let dx = player.x - safeZone.x;
  let dy = player.y - safeZone.y;
  let distance = Math.sqrt(dx*dx+dy*dy);
  if (distance > safeZone.radius) {
    player.health -= 0.2;
    if (player.health<0) player.health=0;
    document.getElementById("healthDisplay").textContent = "Health: " + Math.floor(player.health);
  }

  // Bullets
  bullets.forEach((b,i) => {
    b.x += b.dx;
    b.y += b.dy;
    if (b.x<0||b.y<0||b.x>canvas.width||b.y>canvas.height) bullets.splice(i,1);
  });

  // Bullet collision
  bullets.forEach((b,bi) => {
    enemies.forEach((en,ei) => {
      if (b.x<en.x+en.size && b.x+b.size>en.x && b.y<en.y+en.size && b.y+b.size>en.y) {
        enemies.splice(ei,1);
        bullets.splice(bi,1);
      }
    });
  });

  // Enemy AI
  enemies.forEach(en => {
    let dx = player.x-en.x;
    let dy = player.y-en.y;
    let dist = Math.sqrt(dx*dx+dy*dy);
    if (dist>0) {
      en.x += en.speed*(dx/dist);
      en.y += en.speed*(dy/dist);
    }
    if (player.x<en.x+en.size && player.x+player.size>en.x && player.y<en.y+en.size && player.y+player.size>en.y) {
      player.health -= 0.5;
      if (player.health<0) player.health=0;
      document.getElementById("healthDisplay").textContent = "Health: " + Math.floor(player.health);
    }
  });
}

function drawPlayer(p) {
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size/2, 0, Math.PI*2);
  ctx.fill();

  // Stick figure body
  ctx.beginPath();
  ctx.moveTo(p.x, p.y+p.size/2);
  ctx.lineTo(p.x, p.y+p.size);
  ctx.moveTo(p.x, p.y+p.size/2);
  ctx.lineTo(p.x-p.size/2, p.y+p.size/1.5);
  ctx.moveTo(p.x, p.y+p.size/2);
  ctx.lineTo(p.x+p.size/2, p.y+p.size/1.5);
  ctx.moveTo(p.x, p.y+p.size);
  ctx.lineTo(p.x-p.size/3, p.y+p.size*1.5);
  ctx.moveTo(p.x, p.y+p.size);
  ctx.lineTo(p.x+p.size/3, p.y+p.size*1.5);
  ctx.strokeStyle = p.color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawEnemy(e) {
  ctx.fillStyle = e.color;
  ctx.beginPath();
  ctx.arc(e.x, e.y, e.size/2, 0, Math.PI*2);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(e.x-5, e.y-5, 3, 0, Math.PI*2);
  ctx.arc(e.x+5, e.y-5, 3, 0, Math.PI*2);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Safe zone
  ctx.beginPath();
  ctx.arc(safeZone.x, safeZone.y, safeZone.radius, 0, Math.PI*2);
  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Player
  drawPlayer(player);

  // Bullets
  bullets.forEach(b => { ctx.fillStyle=b.color; ctx.fillRect(b.x,b.y,b.size,b.size); });

  // Enemies
  enemies.forEach(en => drawEnemy(en));
}

function gameLoop() {
  update();
  draw();
  if (player.health<=0) {
    ctx.fillStyle="red";
    ctx.font="40px Arial";
    ctx.fillText("Game Over", canvas.width/2-100, canvas.height/2);
  } else if (enemies.length===0) {
    ctx.fillStyle="lime";
    ctx.font="40px Arial";
    ctx.fillText("You Win!", canvas.width/2-80, canvas.height/2);
  } else {
    requestAnimationFrame(gameLoop);
  }
}

gameLoop();

// Mobile buttons
function bindBtn(id,key){
  const btn=document.getElementById(id);
  btn.addEventListener("touchstart",()=>{keys[key]=true});
  btn.addEventListener("touchend",()=>{keys[key]=false});
}
bindBtn("up","up");
bindBtn("down","down");
bindBtn("left","left");
bindBtn("right","right");
