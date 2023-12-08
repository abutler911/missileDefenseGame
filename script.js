const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const groundHeight = 30;
let gameStarted = false;
let enemyMissileExplosions = [];
let explosionSprites = [];
let playerExplosionSprites = [];
let citySprites = [];
let playerMissiles = [];
let isFiring = false;
let lastFired = 0;
let loadedImagesCount = 0;
let score = 0;
let shootingStars = [];
const scoreIncrement = 10;
const totalImages = 5 + 9 + 15;

class City {
  constructor(sprite, x, y, scale = 0.5) {
    this.sprite = sprite;
    this.x = x;
    this.y = y - sprite.height * scale;
    this.scale = scale;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);
    ctx.drawImage(this.sprite, 0, 0);
    ctx.restore();
  }
}
const fireRate = 100;
const reticle = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 10,
};

// Load City Images
for (let i = 1; i <= 5; i++) {
  let sprite = new Image();
  sprite.onload = imageLoaded;
  sprite.src = `cities/city0${i}.png`;
  citySprites.push(sprite);
}

// Load ExplosionB Images
for (let i = 1; i <= 9; i++) {
  let sprite = new Image();
  sprite.onload = imageLoaded;
  sprite.src = `ExplosionB/Explosion-B${i}.png`;
  explosionSprites.push(sprite);
}

// Load ExplosionA Images
for (let i = 1; i <= 11; i++) {
  let sprite = new Image();
  sprite.onload = imageLoaded;
  sprite.src = `ExplosionA/Explosion-A${i}.png`;
  playerExplosionSprites.push(sprite);
}

// Image Load Handler
function imageLoaded() {
  loadedImagesCount++;
  if (loadedImagesCount === totalImages) {
    startGame(); // Start the game after all images are loaded
  }
}

let starrySkyCanvas = document.createElement("canvas");
let starrySkyCtx = starrySkyCanvas.getContext("2d");

const enemyMissiles = [];

class ShootingStar {
  constructor(x, y, dx, dy, size) {
    this.x = x;
    this.y = y;
    this.dx = dx; // Horizontal velocity
    this.dy = dy; // Vertical velocity
    this.size = size; // Size of the star
    this.tail = [];
    this.maxTailLength = 120;
  }

  update() {
    this.x += this.dx;
    this.y += this.dy;

    // Add current position to the tail
    this.tail.push({ x: this.x, y: this.y });

    // Keep the tail at the maximum length
    if (this.tail.length > this.maxTailLength) {
      this.tail.shift();
    }
  }

  draw(ctx) {
    // Draw tail
    for (let i = this.tail.length - 1; i > 0; i--) {
      const opacity = i / this.tail.length; // Fade effect
      const radius = (this.size * opacity) / 2; // Taper effect

      // Sparkles (optional)
      if (Math.random() < 0.3) {
        ctx.beginPath();
        ctx.arc(
          this.tail[i].x,
          this.tail[i].y,
          radius * Math.random(),
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }

      // Tail segment
      ctx.beginPath();
      ctx.arc(this.tail[i].x, this.tail[i].y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.fill();
    }

    // Draw star
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  }
}

class PlayerMissile {
  constructor(x, y, targetX, targetY) {
    this.x = x;
    this.y = y;
    this.targetX = targetX;
    this.targetY = targetY;
    this.speed = 10;
    this.active = true;
    this.exploding = false;
    this.explosionIndex = 0;
    this.frameCount = 0;
    this.frameRate = 10;
    this.explosionRadius = 0;
  }

  update() {
    if (!this.exploding) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > this.speed) {
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
      } else {
        this.exploding = true;
      }
    } else {
      this.frameCount++;
      if (this.frameCount >= this.frameRate) {
        this.explosionIndex++;
        this.frameCount = 0;

        // Update explosion radius based on explosion sprite size or a fixed value
        this.explosionRadius = 40;

        if (this.explosionIndex >= playerExplosionSprites.length) {
          this.active = false;
        } else {
          checkCollisionWithEnemyMissiles(this);
        }
      }
    }
  }

  draw(ctx) {
    if (!this.active) return;

    if (!this.exploding) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "green";
      ctx.fill();
    } else if (this.explosionIndex < playerExplosionSprites.length) {
      let sprite = playerExplosionSprites[this.explosionIndex];
      ctx.drawImage(
        sprite,
        this.x - sprite.width / 2,
        this.y - sprite.height / 2
      );
    }
  }
}

function drawStartScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = '20px "Press Start 2P", cursive';
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText("Missile Defense", canvas.width / 2, canvas.height / 2 - 20);

  ctx.fillStyle = "green";
  ctx.fillRect(canvas.width / 2 - 50, canvas.height / 2, 100, 40);
  ctx.fillStyle = "white";
  ctx.fillText("Start", canvas.width / 2, canvas.height / 2 + 30);
}

function handleStartClick(e) {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  if (
    clickX >= canvas.width / 2 - 50 &&
    clickX <= canvas.width / 2 + 50 &&
    clickY >= canvas.height / 2 &&
    clickY <= canvas.height / 2 + 40
  ) {
    gameStarted = true;
    canvas.removeEventListener("click", handleStartClick);
    gameLoop();
  }
}
function drawGround() {
  ctx.fillStyle = "#654321";
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
function createCities() {
  cities = [];
  const citySpacing = canvas.width / citySprites.length;
  citySprites.forEach((sprite, index) => {
    let x = index * citySpacing + (citySpacing - sprite.width * 0.5) / 2;
    let y = canvas.height - groundHeight;
    cities.push(new City(sprite, x, y, 0.5));
  });
}

function drawCities() {
  cities.forEach((city) => city.draw(ctx));
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
    const trailLength = 100;
    if (missile.trail.length > trailLength) {
      missile.trail.shift();
    }

    const gradient = ctx.createLinearGradient(
      missile.x,
      missile.y,
      missile.x,
      missile.y - trailLength
    );
    gradient.addColorStop(0, "rgba(255, 0, 0, 1)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.beginPath();
    missile.trail.forEach((pos, idx) => {
      if (idx === 0) ctx.moveTo(pos.x, pos.y);
      else ctx.lineTo(pos.x, pos.y);
    });
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(missile.x, missile.y, 3, 0, Math.PI * 2);
    ctx.fill();

    if (missile.y >= canvas.height - groundHeight) {
      createEnemyMissileExplosion(missile.x, canvas.height - groundHeight);
      enemyMissiles.splice(index, 1);
    }
  });
}

function createEnemyMissileExplosion(x, y) {
  enemyMissileExplosions.push({
    x,
    y,
    spriteIndex: 0,
    frameCount: 0,
    frameRate: 10,
  });
  score -= scoreIncrement / 2;
}

function drawScore() {
  const padding = 50;
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, padding, 55);
}

function drawEnemyMissileExplosions() {
  for (let i = enemyMissileExplosions.length - 1; i >= 0; i--) {
    const explosion = enemyMissileExplosions[i];
    const sprite = explosionSprites[explosion.spriteIndex];

    const spriteYOffset = sprite.height / 2 + 70;

    ctx.drawImage(
      sprite,
      explosion.x - sprite.width / 2,
      explosion.y - spriteYOffset
    );

    explosion.frameCount++;
    if (explosion.frameCount >= explosion.frameRate) {
      explosion.spriteIndex++;
      explosion.frameCount = 0;

      if (explosion.spriteIndex >= explosionSprites.length) {
        enemyMissileExplosions.splice(i, 1);
      }
    }
  }
}

function drawMissileLauncher() {
  const launcherWidth = 40;
  const launcherHeight = 60;
  const launcherX = 10;
  const launcherY = canvas.height - groundHeight - launcherHeight;

  ctx.fillStyle = "darkgrey";
  ctx.fillRect(launcherX, launcherY, launcherWidth, launcherHeight);

  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(
    launcherX + launcherWidth / 2,
    launcherY,
    launcherWidth / 4,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.fillStyle = "silver";
  ctx.fillRect(launcherX + 10, launcherY + 10, launcherWidth - 20, 10);
  ctx.fillRect(launcherX + 10, launcherY + 30, launcherWidth - 20, 10);
}

function drawReticle() {
  ctx.beginPath();
  ctx.arc(reticle.x, reticle.y, reticle.size, 0, Math.PI * 2);
  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const crosshairLength = 40;

  ctx.beginPath();
  ctx.moveTo(reticle.x - crosshairLength / 2, reticle.y);
  ctx.lineTo(reticle.x + crosshairLength / 2, reticle.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(reticle.x, reticle.y - crosshairLength / 2);
  ctx.lineTo(reticle.x, reticle.y + crosshairLength / 2);
  ctx.stroke();
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  createStarrySky();
  createCities();
}

function fireMissile() {
  const missileLauncherX = 50;
  const missileLauncherY = canvas.height - groundHeight - 50;
  playerMissiles.push(
    new PlayerMissile(missileLauncherX, missileLauncherY, reticle.x, reticle.y)
  );
}

function checkCollisionWithEnemyMissiles(playerMissile) {
  for (let i = enemyMissiles.length - 1; i >= 0; i--) {
    const enemyMissile = enemyMissiles[i];
    const dx = playerMissile.x - enemyMissile.x;
    const dy = playerMissile.y - enemyMissile.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < playerMissile.explosionRadius) {
      enemyMissiles.splice(i, 1); // Remove the enemy missile
      score += scoreIncrement;
    }
  }
}

canvas.addEventListener("click", handleStartClick);
canvas.addEventListener("mousedown", (e) => {
  isFiring = true;
  fireMissile();
});

canvas.addEventListener("mouseup", (e) => {
  isFiring = false;
});
canvas.addEventListener("mousemove", function (e) {
  reticle.x = e.clientX - canvas.getBoundingClientRect().left;
  reticle.y = e.clientY - canvas.getBoundingClientRect().top;
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function gameLoop(timestamp) {
  requestAnimationFrame(gameLoop);

  // Clear the canvas first
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.drawImage(starrySkyCanvas, 0, 0);

  // Firing logic...
  if (isFiring && timestamp - lastFired > fireRate) {
    fireMissile();
    lastFired = timestamp;
  }

  // Shooting star logic
  if (Math.random() < 0.001) {
    // Random start position
    let startX = Math.random() * canvas.width;
    let startY = Math.random() * canvas.height;

    // Random velocity components
    let speed = Math.random() * 3 + 2; // Speed between 2 and 5
    let angle = Math.random() * Math.PI * 2; // Random angle in radians
    let dx = Math.cos(angle) * speed;
    let dy = Math.sin(angle) * speed;

    // Create and add the new shooting star
    shootingStars.push(
      new ShootingStar(startX, startY, dx, dy, Math.random() * 2 + 1)
    ); // Adjust size if needed
  }

  for (let i = shootingStars.length - 1; i >= 0; i--) {
    let star = shootingStars[i];
    shootingStars[i].update();
    shootingStars[i].draw(ctx);
    // Check if the shooting star is off the screen (you can adjust the condition based on the star's trajectory)
    if (
      star.x < -star.size ||
      star.x > canvas.width + star.size ||
      star.y < -star.size ||
      star.y > canvas.height + star.size
    ) {
      shootingStars.splice(i, 1);
    }
  }

  playerMissiles.forEach((missile, index) => {
    missile.update();
    missile.draw(ctx);
    if (!missile.active) {
      playerMissiles.splice(index, 1);
    }
  });
  // ctx.clearRect(0, 0, canvas.width, canvas.height);
  // ctx.drawImage(starrySkyCanvas, 0, 0);
  drawEnemyMissiles();
  drawMissileLauncher();
  drawGround();
  drawCities();
  drawEnemyMissileExplosions();
  drawReticle();
  drawScore();

  playerMissiles.forEach((missile, index) => {
    missile.update();
    missile.draw(ctx);
    if (!missile.active) {
      playerMissiles.splice(index, 1);
    }
  });
}

setInterval(addEnemyMissile, 2000);

// Start Game Function
function startGame() {
  if (!gameStarted) {
    drawStartScreen();
  }
}

// Initialize the game
startGame();
