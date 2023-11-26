const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1000;
canvas.height = 700;

let x = 0;
const towers = [];
let laserY = canvas.height;
let score = 0;

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

  for (let i = 0; i < numberOfTowers; i++) {
    towers.push({
      x: spacing + i * (towerWidth + spacing),
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

function drawLaserBeam() {
  if (laserY < canvas.height) {
    ctx.strokeStyle = "yellow";
    ctx.beginPath();
    ctx.moveTo(laserGun.x + laserGun.width / 2, laserGun.y);
    ctx.lineTo(laserGun.x + laserGun.width / 2, laserY);
    ctx.stroke();
    laserY -= 5;

    if (laserY <= 0) {
      laserY = canvas.height;
    }
  }
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
  drawLaserBeam();
  drawScore();
}

function handleKeydown(e) {
  if (e.key === "ArrowLeft" && laserGun.x > 0) {
    laserGun.x -= 10;
  } else if (
    e.key === "ArrowRight" &&
    laserGun.x < canvas.width - laserGun.width
  ) {
    laserGun.x += 10;
  }
}

document.addEventListener("keydown", handleKeydown);

function gameLoop() {
  requestAnimationFrame(gameLoop);
  draw();
}

addTowers(5);
gameLoop();
