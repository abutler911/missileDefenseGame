const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let starrySkyCanvas = document.createElement("canvas");
let starrySkyCtx = starrySkyCanvas.getContext("2d");
let spriteSheet = new Image();
spriteSheet.src = "sprites.png";

const towers = [];
let score = 0;
const reticle = { x: 0, y: 0 };
const missiles = [];
const explosions = [];
const enemyMissiles = [];
const laserGun = { width: 50, height: 50 };
const explosionFrames = [
  // ... explosion frames ...
];
const groundHeight = 30; // Height of the ground from the bottom of the canvas

function drawGround() {
  ctx.fillStyle = "#654321"; // Brown color for the ground
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
}

function createStarrySky() {
  starrySkyCanvas.width = canvas.width;
  starrySkyCanvas.height = canvas.height;
  const starCount = 100;
  starrySkyCtx.fillStyle = "white";
  for (let i = 0; i < starCount; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = Math.random() * 1.5;
    starrySkyCtx.beginPath();
    starrySkyCtx.arc(x, y, radius, 0, Math.PI * 2);
    starrySkyCtx.fill();
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  createStarrySky();
  positionTowers();
  laserGun.x = canvas.width / 2 - laserGun.width / 2;
  laserGun.y = canvas.height - laserGun.height - 10;
  reticle.x = canvas.width / 2;
  reticle.y = canvas.height / 2;
}

function positionTowers() {
  const numberOfTowers = 5;
  const towerWidth = 40;
  const towerHeight = 60;
  const spacing =
    (canvas.width - numberOfTowers * towerWidth) / (numberOfTowers + 1);
  const towerHitPoints = 100;
  towers.length = 0;
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

  towers.forEach((tower) => {
    tower.y = canvas.height - groundHeight - tower.height;
  });
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
  // Add an initial stage for the explosion
  explosions.push({
    x,
    y,
    radius: 1,
    stage: 0,
    maxRadius: 100, // Maximum radius of explosion
  });
}

function drawExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const explosion = explosions[i];
    const sprite = explosionSprites[explosion.spriteIndex];

    const yOffset = 70;

    ctx.drawImage(
      sprite,
      explosion.x - sprite.width / 2,
      explosion.y - sprite.height / 2 - yOffset
    );

    explosion.frameCount++;
    if (explosion.frameCount >= explosion.frameRate) {
      explosion.spriteIndex++;
      explosion.frameCount = 0;

      if (explosion.spriteIndex >= explosionSprites.length) {
        explosions.splice(i, 1);
      }
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
    // Update missile position
    missile.x += missile.sway;
    missile.y += missile.speed;

    // Add current position to the trail
    missile.trail.push({ x: missile.x, y: missile.y });

    // Keep the trail length consistent
    const trailLength = 50;
    if (missile.trail.length > trailLength) {
      missile.trail.shift();
    }

    // Draw the missile trail
    const gradient = ctx.createLinearGradient(
      missile.x,
      missile.y,
      missile.x,
      missile.trail[0].y
    );
    gradient.addColorStop(0, "rgba(255, 0, 0, 1)"); // Red at the missile
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)"); // Transparent at the start of the trail

    ctx.beginPath();
    ctx.moveTo(missile.x, missile.y);
    missile.trail.forEach((pos, idx) => {
      ctx.lineTo(pos.x, pos.y);
    });
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (missile.y >= canvas.height - groundHeight) {
      createGroundExplosion(missile.x, canvas.height - groundHeight);
      enemyMissiles.splice(index, 1); // Remove the missile
    }
    // Draw the missile head
    const missileHeadSize = 3;
    ctx.fillStyle = "red";
    ctx.shadowColor = "red";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(missile.x, missile.y, missileHeadSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Check for collisions with towers
    checkMissileTowerCollision(missile, index);
  });
}

let explosionSprites = [];
for (let i = 1; i < 10; i++) {
  let sprite = new Image();
  sprite.src = "ExplosionB/Explosion-B" + i + ".png";
  explosionSprites.push(sprite);
}

function checkMissileGroundCollision(missile, index) {
  // Check if missile hits the ground
  if (missile.y >= canvas.height - groundHeight) {
    createGroundExplosion(missile.x, canvas.height - groundHeight);
    enemyMissiles.splice(index, 1); // Remove missile
  }
}

function createGroundExplosion(x, y) {
  explosions.push({
    x,
    y,
    spriteIndex: 0, // Start with the first sprite
    frameCount: 0, // Counter for controlling sprite change rate
    frameRate: 5, // Number of game frames before changing the sprite
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

function handleMouseMove(e) {
  reticle.x = e.clientX - canvas.offsetLeft;
  reticle.y = e.clientY - canvas.offsetTop;
}

// Add Mouse Click Handler
function handleMouseClick(e) {
  missiles.push({
    x: laserGun.x + laserGun.width / 2,
    y: laserGun.y,
    toX: e.clientX - canvas.offsetLeft,
    toY: e.clientY - canvas.offsetTop,
  });
}

function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, canvas.width - 150, 30);
}

function createStarrySky() {
  starrySkyCanvas.width = canvas.width;
  starrySkyCanvas.height = canvas.height;
  drawStarrySky(starrySkyCtx);
}

function drawStarrySky(ctx) {
  const starCount = 100;
  ctx.fillStyle = "white";

  for (let i = 0; i < starCount; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = Math.random() * 1.5;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(starrySkyCanvas, 0, 0);
  drawTowers();
  drawLaserGun();
  drawMissiles();
  drawExplosions();
  drawEnemyMissiles();
  drawReticle();
  drawScore();
  drawGround();
}

function handleTouchMove(e) {
  const touch = e.touches[0];
  reticle.x = touch.clientX - canvas.offsetLeft;
  reticle.y = touch.clientY - canvas.offsetTop;
}

function handleTouchStart(e) {
  const touch = e.touches[0];
  missiles.push({
    x: laserGun.x + laserGun.width / 2,
    y: laserGun.y,
    toX: touch.clientX - canvas.offsetLeft,
    toY: touch.clientY - canvas.offsetTop,
  });
}

canvas.addEventListener("touchmove", handleTouchMove);
canvas.addEventListener("touchstart", handleTouchStart);
canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("click", handleMouseClick);
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function gameLoop() {
  requestAnimationFrame(gameLoop);
  draw();
}

setInterval(addEnemyMissile, 2000);
gameLoop();
