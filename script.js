const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1000;
canvas.height = 700;

const towers = [];
let score = 0;
const reticle = { x: canvas.width / 2, y: canvas.height / 2 };
const missiles = [];
const explosions = [];
const enemyMissiles = [];

const laserGun = {
  x: canvas.width / 2 - 25,
  y: canvas.height - 50,
  width: 50,
  height: 50,
};

function addTowers(numberOfTowers) {
  const towerWidth = 40;
  const towerHeight = 60;
  const spacing =
    (canvas.width - numberOfTowers * towerWidth) / (numberOfTowers + 1);
  const laserGunCenter = canvas.width / 2;

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
    });
  }
}

function drawTowers() {
  ctx.fillStyle = "blue";
  towers.forEach((tower) => {
    ctx.fillRect(tower.x, tower.y, tower.width, tower.height);
  });
}

function drawLaserGun() {
  ctx.fillStyle = "green";
  ctx.fillRect(laserGun.x, laserGun.y, laserGun.width, laserGun.height);
}

function drawMissiles() {
  missiles.forEach((missile, index) => {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(missile.x, missile.y, 5, 0, Math.PI * 2);
    ctx.fill();

    const dx = missile.toX - missile.x;
    const dy = missile.toY - missile.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const moveX = (dx / distance) * 5;
    const moveY = (dy / distance) * 5;

    missile.x += moveX;
    missile.y += moveY;

    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
      createExplosion(missile.toX, missile.toY);
      missiles.splice(index, 1);
    }
  });
}

function createExplosion(x, y) {
  explosions.push({ x, y, radius: 1 });
}

function addEnemyMissile() {
  const x = Math.random() * canvas.width;
  const y = 0;
  const speed = Math.random() * 2 + 2; // Random speed
  const sway = Math.random() * 2 - 1; // Random horizontal movement

  enemyMissiles.push({ x, y, speed, sway, trail: [] });
}

function drawEnemyMissiles() {
  enemyMissiles.forEach((missile, index) => {
    // Update missile position
    missile.x += missile.sway;
    missile.y += missile.speed;

    // Add current position to trail
    missile.trail.push({ x: missile.x, y: missile.y });

    // Keep the trail length limited
    if (missile.trail.length > 10) {
      missile.trail.shift();
    }

    // Draw missile trail
    ctx.beginPath();
    missile.trail.forEach((pos, index) => {
      ctx.lineTo(pos.x, pos.y);
    });
    ctx.strokeStyle = "white";
    ctx.stroke();

    // Draw missile
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(missile.x, missile.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Remove missile if it goes off screen
    if (missile.y > canvas.height) {
      enemyMissiles.splice(index, 1);
    }
  });
}
function drawExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const explosion = explosions[i];
    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
    ctx.fill();

    explosion.radius += 2;

    if (explosion.radius > 40) {
      explosions.splice(i, 1);
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

setInterval(addEnemyMissile, 2000); // Add a new enemy missile every 2 seconds

addTowers(5);
gameLoop();
