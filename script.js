const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1000;
canvas.height = 700;

const towers = [];
let score = 0;
const reticle = { x: canvas.width / 2, y: canvas.height / 2 };
const missiles = [];

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

    if (
      distance < 5 ||
      missile.y < 0 ||
      missile.x < 0 ||
      missile.x > canvas.width
    ) {
      missiles.splice(index, 1);
    }
  });
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

addTowers(5);
gameLoop();
