const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let spriteSheet = new Image();
spriteSheet.src = "sprites.png";

const towers = [];
let score = 0;
const reticle = { x: canvas.width / 2, y: canvas.height / 2 };
const missiles = [];
const explosions = [];
const enemyMissiles = [];
const laserGun = { width: 50, height: 50 };
const explosionFrames = [
  // ... your explosion frames ...
];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  laserGun.x = canvas.width / 2 - laserGun.width / 2;
  laserGun.y = canvas.height - laserGun.height - 10;
  reticle.x = canvas.width / 2;
  reticle.y = canvas.height / 2;

  // Update tower positions based on new canvas size
  positionTowers();
}

function positionTowers() {
  const numberOfTowers = 5;
  const towerWidth = 40;
  const towerHeight = 60;
  const spacing =
    (canvas.width - numberOfTowers * towerWidth) / (numberOfTowers + 1);
  const towerHitPoints = 100;

  towers.length = 0; // Clear existing towers
  for (let i = 0; i < numberOfTowers; i++) {
    let towerX = spacing + i * (towerWidth + spacing);
    if (
      towerX + towerWidth > laserGun.x &&
      towerX < laserGun.x + laserGun.width
    ) {
      continue;
    }
    towers.push({
      x: towerX,
      y: canvas.height - towerHeight - 10,
      width: towerWidth,
      height: towerHeight,
      hitPoints: towerHitPoints,
    });
  }
}

function addTowers(numberOfTowers) {
  const towerWidth = 40;
  const towerHeight = 60;
  const spacing =
    (canvas.width - numberOfTowers * towerWidth) / (numberOfTowers + 1);
  const laserGunCenter = canvas.width / 2;
  const towerHitPoints = 100;

  for (let i = 0; i < numberOfTowers; i++) {
    let towerX = spacing + i * (towerWidth + spacing);
    if (
      towerX + towerWidth > laserGunCenter - laserGun.width / 2 &&
      towerX < laserGunCenter + laserGun.width / 2
    ) {
      continue;
    }
    towers.push({
      x: towerX,
      y: canvas.height - towerHeight - 10,
      width: towerWidth,
      height: towerHeight,
      hitPoints: towerHitPoints,
    });
  }
}

function drawTowers() {
  ctx.fillStyle = "blue";
  towers.forEach((tower) => {
    if (tower.hitPoints > 0) {
      ctx.fillRect(tower.x, tower.y, tower.width, tower.height);
      ctx.fillStyle = "white";
      ctx.fillText(tower.hitPoints, tower.x + 10, tower.y + 30);
      ctx.fillStyle = "blue";
    }
  });
}

function drawLaserGun() {
  ctx.fillStyle = "green";
  ctx.fillRect(laserGun.x, laserGun.y, laserGun.width, laserGun.height);
}

function createExplosion(x, y) {
  explosions.push({ x, y, radius: 1 });
}

function drawExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const explosion = explosions[i];

    // Create a radial gradient (inner to outer color)
    const gradient = ctx.createRadialGradient(
      explosion.x,
      explosion.y,
      0,
      explosion.x,
      explosion.y,
      explosion.radius
    );
    gradient.addColorStop(0, "yellow");
    gradient.addColorStop(0.4, "orange");
    gradient.addColorStop(0.6, "red");
    gradient.addColorStop(1, "rgba(255, 165, 0, 0)"); // Transparent at the edges

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
    ctx.fill();

    // Increase the radius for the next draw
    explosion.radius += 2;

    // Check for collision with enemy missiles
    checkExplosionCollision(explosion);

    // Remove the explosion after it reaches a certain size
    if (explosion.radius > 100) {
      explosions.splice(i, 1);
    }
  }
}

function checkExplosionCollision(explosion) {
  for (let i = enemyMissiles.length - 1; i >= 0; i--) {
    const missile = enemyMissiles[i];
    const dx = explosion.x - missile.x;
    const dy = explosion.y - missile.y;
    if (Math.sqrt(dx * dx + dy * dy) < explosion.radius + 5) {
      enemyMissiles.splice(i, 1);
      score += 10;
    }
  }
}

function drawMissiles() {
  missiles.forEach((missile, index) => {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(missile.x, missile.y, 5, 0, Math.PI * 2);
    ctx.fill();
    const dx = missile.toX - missile.x;
    const dy = missile.toY - missile.y;
    missile.x += (dx / Math.sqrt(dx * dx + dy * dy)) * 5;
    missile.y += (dy / Math.sqrt(dx * dx + dy * dy)) * 5;
    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
      createExplosion(missile.toX, missile.toY);
      missiles.splice(index, 1);
    }
  });
}

function addEnemyMissile() {
  enemyMissiles.push({
    x: Math.random() * canvas.width,
    y: 0,
    speed: Math.random() * 1.5 + 1,
    sway: Math.random() * 2 - 1,
    trail: [],
  });
}

function drawEnemyMissiles() {
  enemyMissiles.forEach((missile, index) => {
    missile.x += missile.sway;
    missile.y += missile.speed;
    missile.trail.push({ x: missile.x, y: missile.y });
    if (missile.trail.length > 20) {
      missile.trail.shift();
    }

    ctx.beginPath();
    missile.trail.forEach((pos) => ctx.lineTo(pos.x, pos.y));
    ctx.strokeStyle = "white";
    ctx.stroke();

    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(missile.x, missile.y, 5, 0, Math.PI * 2);
    ctx.fill();

    checkMissileTowerCollision(missile, index);
  });
}

function checkMissileTowerCollision(missile, missileIndex) {
  for (const tower of towers) {
    if (
      missile.x > tower.x &&
      missile.x < tower.x + tower.width &&
      missile.y > tower.y &&
      missile.y < tower.y + tower.height &&
      tower.hitPoints > 0
    ) {
      tower.hitPoints -= 20;
      enemyMissiles.splice(missileIndex, 1);
      break;
    }
  }
}

function drawReticle() {
  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.arc(reticle.x, reticle.y, 10, 0, Math.PI * 2);
  ctx.stroke();
}

function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, canvas.width - 150, 30);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTowers();
  drawLaserGun();
  drawMissiles();
  drawExplosions();
  drawEnemyMissiles();
  drawReticle();
  drawScore();
}
function handleMouseMove(e) {
  reticle.x = e.clientX - canvas.offsetLeft;
  reticle.y = e.clientY - canvas.offsetTop;
}

function handleMouseDown() {
  missiles.push({
    x: laserGun.x + laserGun.width / 2,
    y: laserGun.y,
    toX: reticle.x,
    toY: reticle.y,
  });
}

canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("mousedown", handleMouseDown);

function gameLoop() {
  requestAnimationFrame(gameLoop);
  draw();
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas(); // Set initial canvas size and position elements

setInterval(addEnemyMissile, 2000);
gameLoop();
