let scene, camera, renderer;
let ball, flippers = {}, bumpers = [];
let score = 0, balls = 3;
let leftPressed = false, rightPressed = false;

// Setup scene
scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Camera
camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 40);

// Renderer
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("gameContainer").appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x555555);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1.2, 100);
pointLight.position.set(0, 30, 20);
scene.add(pointLight);

// Table
const tableGeo = new THREE.PlaneGeometry(40, 60);
const tableMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
const table = new THREE.Mesh(tableGeo, tableMat);
table.rotation.x = -Math.PI / 2.2;
scene.add(table);

// Ball
const ballGeo = new THREE.SphereGeometry(1, 32, 32);
const ballMat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa, shininess: 200 });
ball = new THREE.Mesh(ballGeo, ballMat);
ball.position.set(0, 2, 20);
scene.add(ball);
ball.velocity = new THREE.Vector3(0.1, 0, -0.2);

// Flippers
function createFlipper(x, z, side) {
  const geo = new THREE.BoxGeometry(5, 1, 1);
  const mat = new THREE.MeshPhongMaterial({ color: 0xff3333 });
  const flipper = new THREE.Mesh(geo, mat);
  flipper.position.set(x, 1, z);
  flipper.side = side;
  scene.add(flipper);
  return flipper;
}
flippers.left = createFlipper(-10, 25, "left");
flippers.right = createFlipper(10, 25, "right");

// Bumpers
function createBumper(x, z, color) {
  const geo = new THREE.SphereGeometry(2, 32, 32);
  const mat = new THREE.MeshPhongMaterial({ color: color, emissive: color, emissiveIntensity: 0.6 });
  const bumper = new THREE.Mesh(geo, mat);
  bumper.position.set(x, 2, z);
  scene.add(bumper);
  bumpers.push(bumper);
}
createBumper(-10, 0, 0xff6600); // Jack
createBumper(10, -10, 0xff66cc); // Sally
createBumper(0, -20, 0xffffff);  // Ghost

// Score update
function updateHUD() {
  document.getElementById("score").textContent = "Score: " + score;
  document.getElementById("balls").textContent = "Balls: " + balls;
}

// Controls
document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") leftPressed = true;
  if (e.key === "ArrowRight") rightPressed = true;
});
document.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft") leftPressed = false;
  if (e.key === "ArrowRight") rightPressed = false;
});

document.getElementById("leftBtn").addEventListener("touchstart", () => leftPressed = true);
document.getElementById("leftBtn").addEventListener("touchend", () => leftPressed = false);
document.getElementById("rightBtn").addEventListener("touchstart", () => rightPressed = true);
document.getElementById("rightBtn").addEventListener("touchend", () => rightPressed = false);

// Ball physics (very simplified)
function updateBall() {
  ball.position.add(ball.velocity);

  // Walls
  if (Math.abs(ball.position.x) > 18) ball.velocity.x *= -1;
  if (ball.position.z < -28) ball.velocity.z *= -1;
  if (ball.position.z > 30) {
    balls--;
    updateHUD();
    if (balls <= 0) {
      alert("Game Over! Final Score: " + score);
      document.location.reload();
    } else {
      ball.position.set(0, 2, 20);
      ball.velocity.set(0.1, 0, -0.2);
    }
  }

  // Bumper collisions
  bumpers.forEach(bumper => {
    const dist = ball.position.distanceTo(bumper.position);
    if (dist < 3) {
      ball.velocity.z *= -1;
      score += 500;
      updateHUD();
    }
  });

  // Flippers "hit"
  if (leftPressed && ball.position.z > 23 && ball.position.x < -7) {
    ball.velocity.x = 0.4; ball.velocity.z = -0.5;
  }
  if (rightPressed && ball.position.z > 23 && ball.position.x > 7) {
    ball.velocity.x = -0.4; ball.velocity.z = -0.5;
  }
}

// Game loop
function animate() {
  requestAnimationFrame(animate);
  updateBall();
  renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

updateHUD();
