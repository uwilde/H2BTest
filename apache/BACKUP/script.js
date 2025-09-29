const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load Images
const horseImage = new Image();
const logImage = new Image();
const enemyImage = new Image();
const coinImage = new Image();
const platformImage = new Image();
const powerUpImage = new Image();
const bgLayer1 = new Image();
const bgLayer2 = new Image();
const bgLayer3 = new Image();

const leftButton = document.getElementById('leftButton');
const rightButton = document.getElementById('rightButton');
const pauseButton = document.getElementById('pauseButton');
const jumpButton = document.getElementById('jumpButton');
const stompButton = document.getElementById('stompButton');

let logSpawnTimer = 0;
let enemySpawnTimer = 0;
let coinSpawnTimer = 0;
let platformSpawnTimer = 0;
let powerUpSpawnTimer = 0;

let gameState = 'playing';

let imagesLoaded = 0;

function checkImagesLoaded() {
    imagesLoaded++;
    if (imagesLoaded === 9) {
        // Initialize lastTime and start the game loop
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
    }
}

horseImage.onload = checkImagesLoaded;
logImage.onload = checkImagesLoaded;
enemyImage.onload = checkImagesLoaded;
coinImage.onload = checkImagesLoaded;
platformImage.onload = checkImagesLoaded;
powerUpImage.onload = checkImagesLoaded;
bgLayer1.onload = checkImagesLoaded;
bgLayer2.onload = checkImagesLoaded;
bgLayer3.onload = checkImagesLoaded;

// Ensure all images are in your directory
horseImage.src = 'APACHE.png';
logImage.src = 'LOG.png';
enemyImage.src = 'ENEMY.png';
coinImage.src = 'COIN.png';
platformImage.src = 'PLATFORM.png';
powerUpImage.src = 'POWERUP.png';
bgLayer1.src = 'BG_LAYER1.png';
bgLayer2.src = 'BG_LAYER2.png';
bgLayer3.src = 'BG_LAYER3.png';

// Load Sounds (Ensure audio files are in your directory)
const jumpSound = new Audio('jump.mp3');
const stompSound = new Audio('stomp.mp3');
const collectSound = new Audio('collect.mp3');
const gameOverSound = new Audio('gameover.mp3');

const normalGravity = 980; 
const jumpGravity = 2; 

let horse = {
    x: 50,
    y: 300,
    width: 64,
    height: 64,
    stomping: false,
    stompCount: 0,
    score: 0,
    speed: 200,
    isJumping: false,
    velocityY: 0,
    gravity: 980,
    onGround: true,
    trampleAngle: 0,
    lives: 3,
    invincible: false,
    invincibleTimer: 0,
    jumpHoldTime: 0,
    maxJumpHoldTime: 0.3,
};

let logs = [];
let enemies = [];
let coins = [];
let platforms = [];
let powerUps = [];
let keys = {};

let gameSpeed = 200;
let frame = 0;
let level = 1;
let isPaused = false;
let animationId;

let bgLayer1X = 0;
let bgLayer2X = 0;
let bgLayer3X = 0;

document.addEventListener('keydown', function(e) {
    keys[e.code] = true;

    if (e.code === 'Space' && !horse.stomping) {
        horse.stomping = true;
        horse.stompCount = 0;
    }

    if (e.code === 'ControlLeft' && horse.onGround) {
        horse.isJumping = true;
        horse.velocityY = -350;  // Initial jump velocity
        horse.jumpHoldTime = 0;  // Reset jump hold time
        horse.onGround = false;
        jumpSound.play();
    }

    if (e.code === 'Escape') {
        isPaused = !isPaused;
        if (!isPaused) {
            // Reset lastTime and start the game loop
            lastTime = performance.now();
            animationId = requestAnimationFrame(gameLoop);
        } else {
            // Cancel the animation frame to stop the game loop
            cancelAnimationFrame(animationId);
            // Draw paused screen
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff';
            ctx.font = '50px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Paused', canvas.width / 2, canvas.height / 2);
        }
    }
});

document.addEventListener('keyup', function(e) {
    keys[e.code] = false;

    if (e.code === 'Space') {
        horse.stomping = false;
        horse.trampleAngle = 0;
    }
});

function createLog() {
    logs.push({
        x: canvas.width,
        y: 300,
        width: 64,
        height: 64,
        stomped: 0,
        isBlocking: true
    });
}

function createEnemy() {

    const enemyY = 300 - Math.random() * 20; // y between 280 and 300

    enemies.push({
        x: canvas.width,
        y: enemyY,
        width: 64,
        height: 64,
        stomped: false,
        moveDirection: 1, 
        moveAmplitude: 50,
        moveSpeed: 2,
        baseX: canvas.width,
        isJumping: false,
        velocityY: 0,
        gravity: 980,
        jumpTimer: Math.random() * 2 + 1  // Random time between jumps (1 to 3 seconds)
    });
}


function createCoin() {
    coins.push({
        x: canvas.width,
        y: Math.random() * 200 + 100,
        width: 32,
        height: 32,
        collected: false
    });
}

function createPlatform() {
    platforms.push({
        x: canvas.width,
        y: Math.random() * 150 + 150,
        width: 128,
        height: 32
    });
}

function createPowerUp() {
    powerUps.push({
        x: canvas.width,
        y: Math.random() * 200 + 100,
        width: 32,
        height: 32,
        collected: false
    });
}

function updateHorse(deltaTime) {
    // Horizontal Movement
    if (keys['ArrowLeft']) {
        horse.x -= horse.speed * deltaTime;
    }
    if (keys['ArrowRight']) {
        horse.x += horse.speed * deltaTime;
    }
    // Prevent going off-screen
    if (horse.x < 0) horse.x = 0;
    if (horse.x + horse.width > canvas.width) horse.x = canvas.width - horse.width;

    // Apply gravity
    let currentGravity = horse.isJumping && keys['ControlLeft'] && horse.jumpHoldTime < horse.maxJumpHoldTime
        ? jumpGravity
        : normalGravity;

    if (horse.isJumping && keys['ControlLeft'] && horse.jumpHoldTime < horse.maxJumpHoldTime) {
        horse.jumpHoldTime += deltaTime;
    }

    horse.velocityY += currentGravity * deltaTime;
    horse.y += horse.velocityY * deltaTime;

    // Collision detection with platforms
    let isOnPlatform = false;
    platforms.forEach(platform => {
        if (collision(horse, platform)) {
            if (horse.velocityY > 0 && horse.y + horse.height - horse.velocityY * deltaTime <= platform.y) {
                horse.y = platform.y - horse.height;
                horse.velocityY = 0;
                horse.isJumping = false;
                horse.onGround = true;
                horse.jumpHoldTime = 0;
                isOnPlatform = true;
            }
        }
    });

    // Ground collision
    if (horse.y >= 300) {
        // Ground level
        horse.y = 300;
        horse.velocityY = 0;
        horse.isJumping = false;
        horse.onGround = true;
        horse.jumpHoldTime = 0;
    } else if (!isOnPlatform) {
        horse.isJumping = true;
        horse.onGround = false;
    }
    // Trample Action
    if (horse.stomping) {
        horse.trampleAngle = Math.sin(performance.now() / 50) * 30;
    }

    // Invincibility Timer
    if (horse.invincible) {
        horse.invincibleTimer--;
        if (horse.invincibleTimer <= 0) {
            horse.invincible = false;
        }
    }

    // Fall Off Screen
    if (horse.y > canvas.height) {
        horse.lives--;
        if (horse.lives <= 0) {
            gameOver();
        } else {
            resetHorsePosition();
        }
    }
}

function updateLogs(deltaTime) {
    logs.forEach((log, index) => {
        log.x -= gameSpeed * deltaTime;
        if (log.x + log.width < 0) {
            logs.splice(index, 1);
            return;
        }

        if (collision(horse, log)) {
            if (horse.isJumping) {
                log.isBlocking = false;
            } else if (horse.stomping && log.isBlocking) {
                log.stomped++;
                stompSound.play();
                if (log.stomped >= 5) {
                    logs.splice(index, 1);
                    horse.score += 10;
                }
            } else if (log.isBlocking) {
                blockHorseMovement(log);
            }
        }
    });
}

function updateEnemies(deltaTime) {
    enemies.forEach((enemy, index) => {
        // Horizontal movement (left-right oscillation)
        enemy.x -= (gameSpeed - enemy.moveDirection * enemy.moveSpeed) * deltaTime;

        // Left-right movement logic
        if (Math.abs(enemy.x - enemy.baseX) > enemy.moveAmplitude) {
            enemy.moveDirection *= -1;
        }

        // Vertical movement (jumping)
        enemy.jumpTimer -= deltaTime;
        if (enemy.jumpTimer <= 0 && !enemy.isJumping) {
            enemy.isJumping = true;
            enemy.velocityY = -200;  // Initial jump velocity (small jump)
            enemy.jumpTimer = Math.random() * 2 + 1;  // Reset jump timer
        }

        if (enemy.isJumping) {
            enemy.velocityY += enemy.gravity * deltaTime;  // Apply gravity
            enemy.y += enemy.velocityY * deltaTime;
            if (enemy.y >= 300) {  // Ground level
                enemy.y = 300;
                enemy.velocityY = 0;
                enemy.isJumping = false;
            }
        }

        if (enemy.x + enemy.width < 0) {
            enemies.splice(index, 1);
            return;
        }

        // Collision detection and handling
        if (collision(horse, enemy)) {
            if (horse.velocityY > 0 && horse.y + horse.height - horse.velocityY <= enemy.y) {
                if ((horse.stomping || horse.isJumping) && !enemy.stomped) {
                    enemy.stomped = true;
                    enemies.splice(index, 1);
                    horse.score += 20;
                    horse.velocityY = -5;
                    stompSound.play();
                }
            } else {
                if (!horse.invincible) {
                    horse.lives--;
                    horse.invincible = true;
                    horse.invincibleTimer = 120;

                    if (horse.lives <= 0) {
                        gameOver();
                    } else {
                        resetHorsePosition();
                    }
                }
            }
        }
    });
}

function updateCoins(deltaTime) {
    coins.forEach((coin, index) => {
        coin.x -= gameSpeed * deltaTime;

        if (coin.x + coin.width < 0) {
            coins.splice(index, 1);
            return;
        }

        if (collision(horse, coin) && !coin.collected) {
            coin.collected = true;
            coins.splice(index, 1);
            horse.score += 5;
            collectSound.play();
        }
    });
}
function updatePlatforms(deltaTime) {
    platforms.forEach((platform, index) => {
        platform.x -= gameSpeed * deltaTime;

        if (platform.x + platform.width < 0) {
            platforms.splice(index, 1);
            return;
        }
    });
}
function updatePowerUps(deltaTime) {
    powerUps.forEach((powerUp, index) => {
        powerUp.x -= gameSpeed * deltaTime;

        if (powerUp.x + powerUp.width < 0) {
            powerUps.splice(index, 1);
            return;
        }

        if (collision(horse, powerUp) && !powerUp.collected) {
            powerUp.collected = true;
            powerUps.splice(index, 1);
            horse.invincible = true;
            horse.invincibleTimer = 600;
            collectSound.play();
        }
    });
}
function blockHorseMovement(obstacle) {
    if (horse.x + horse.width > obstacle.x) {
        horse.x = obstacle.x - horse.width;
    }
}

function resetHorsePosition() {
    horse.x = 50;
    horse.y = 300;
    horse.velocityY = 0;
    horse.isJumping = false;
    horse.onGround = true;
}

function drawBackground(deltaTime) {
    // Parallax Background
    bgLayer1X -= gameSpeed * 0.2 * deltaTime;
    bgLayer2X -= gameSpeed * 0.5 * deltaTime;
    bgLayer3X -= gameSpeed * 1 * deltaTime;

    if (bgLayer1X <= -canvas.width) bgLayer1X = 0;
    if (bgLayer2X <= -canvas.width) bgLayer2X = 0;
    if (bgLayer3X <= -canvas.width) bgLayer3X = 0;

    ctx.drawImage(bgLayer1, bgLayer1X, 0, canvas.width, canvas.height);
    ctx.drawImage(bgLayer1, bgLayer1X + canvas.width, 0, canvas.width, canvas.height);

    ctx.drawImage(bgLayer2, bgLayer2X, 0, canvas.width, canvas.height);
    ctx.drawImage(bgLayer2, bgLayer2X + canvas.width, 0, canvas.width, canvas.height);

    ctx.drawImage(bgLayer3, bgLayer3X, 0, canvas.width, canvas.height);
    ctx.drawImage(bgLayer3, bgLayer3X + canvas.width, 0, canvas.width, canvas.height);
}

function drawHorse() {
    ctx.save();
    ctx.translate(horse.x + horse.width / 2, horse.y + horse.height / 2);

    if (horse.stomping) {
        ctx.rotate((-horse.trampleAngle * Math.PI) / 180);
    }

    if (horse.invincible && Math.floor(Date.now() / 100) % 2) {
        ctx.globalAlpha = 0.5;
    }

    ctx.drawImage(
        horseImage,
        -horse.width / 2,
        -horse.height / 2,
        horse.width,
        horse.height
    );
    ctx.restore();
    ctx.globalAlpha = 1.0;
}

function drawLogs() {
    logs.forEach(log => {
        ctx.drawImage(logImage, log.x, log.y, log.width, log.height);

        if (log.stomped > 0) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(log.x, log.y, log.width, log.height * (log.stomped / 5));
        }
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

function drawCoins() {
    coins.forEach(coin => {
        ctx.drawImage(coinImage, coin.x, coin.y, coin.width, coin.height);
    });
}

function drawPlatforms() {
    platforms.forEach(platform => {
        ctx.drawImage(platformImage, platform.x, platform.y, platform.width, platform.height);
    });
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        ctx.drawImage(powerUpImage, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    });
}

function drawScore() {


    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    
    const margin = 10;
    let currentY = 20;
    const lineHeight = 20;
    ctx.fillText('Score: ' + horse.score, 10, 30);
    ctx.fillText('Lives: ' + horse.lives, 10, 60);
    ctx.fillText('Level: ' + level, 10, 90);
    ctx.fillText('High Score: ' + (localStorage.getItem('highScore') || 0), 10, 120);
}

function collision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y
    );
}

function gameOver() {
    gameState = 'gameover';
    gameOverSound.play();

    // Save high score if necessary
    if (localStorage.getItem('highScore') === null || horse.score > localStorage.getItem('highScore')) {
        localStorage.setItem('highScore', horse.score);
    }
}

canvas.addEventListener('click', function(event) {
    if (gameState === 'gameover') {
        const rect = canvas.getBoundingClientRect();

        // Calculate the scale between the canvas's internal dimensions and its actual display size
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        // Adjust the mouse coordinates to the canvas's coordinate system
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        // Debug: Log the click coordinates
        // console.log(`Click at (${x}, ${y})`);

        // Check if the click is within the Restart button's area
        if (x >= canvas.width / 2 - 75 && x <= canvas.width / 2 + 75 &&
            y >= canvas.height / 2 + 30 && y <= canvas.height / 2 + 80) {
            resetGame();
        }
    }
});


function resetGame() {
    gameState = 'playing';

    horse = {
        x: 50,
        y: 300,
        width: 64,
        height: 64,
        stomping: false,
        stompCount: 0,
        score: 0,
        speed: 200,
        isJumping: false,
        velocityY: 0,
        gravity: 980,
        onGround: true,
        trampleAngle: 0,
        lives: 3,
        invincible: false,
        invincibleTimer: 0,
        jumpHoldTime: 0,
        maxJumpHoldTime: 0.3,
    };

    logs = [];
    enemies = [];
    coins = [];
    platforms = [];
    powerUps = [];
    keys = {};

    gameSpeed = 200;
    frame = 0;
    level = 1;
    isPaused = false;

    bgLayer1X = 0;
    bgLayer2X = 0;
    bgLayer3X = 0;

    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

let lastTime = 0;

function gameLoop(timestamp) {
    const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'playing') {
        // Update spawn timers
        logSpawnTimer += deltaTime;
        enemySpawnTimer += deltaTime;
        coinSpawnTimer += deltaTime;
        platformSpawnTimer += deltaTime;
        powerUpSpawnTimer += deltaTime;

        // Spawn objects based on time intervals
        if (logSpawnTimer >= 2.5) {
            createLog();
            logSpawnTimer = 0;
        }
	if (enemySpawnTimer >= 3.1) {
					createEnemy();
					enemySpawnTimer = 0;
	}
	if (coinSpawnTimer >= 1.5) {
					createCoin();
					coinSpawnTimer = 0;
	}
	if (platformSpawnTimer >= 3.3) {
					createPlatform();
					platformSpawnTimer = 0;
	}
	if (powerUpSpawnTimer >= 8.3) {
					createPowerUp();
					powerUpSpawnTimer = 0;
	}

	// **Add the update functions**
	updateHorse(deltaTime);
	updateLogs(deltaTime);
	updateEnemies(deltaTime);
	updateCoins(deltaTime);
	updatePlatforms(deltaTime);
	updatePowerUps(deltaTime);

	// **Add the draw functions**
	drawBackground(deltaTime);
	drawPlatforms();
	drawCoins();
	drawPowerUps();
	drawLogs();
	drawEnemies();
	drawHorse();
	drawScore();

        if (horse.score >= level * 100) {
            level++;
            gameSpeed += 0.5;
        }
    } else if (gameState === 'gameover') {
        // Draw the game over screen
        drawBackground(deltaTime); // Optionally, draw the background
        drawGameOverScreen();
    }

    animationId = requestAnimationFrame(gameLoop);
}

function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 50);
    ctx.font = '30px Arial';
    ctx.fillText('Final Score: ' + horse.score, canvas.width / 2, canvas.height / 2);

    // Draw Restart Button
    ctx.fillStyle = '#000';
    ctx.fillRect(canvas.width / 2 - 75, canvas.height / 2 + 30, 150, 50);
    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.fillText('Restart', canvas.width / 2, canvas.height / 2 + 65);
}


leftButton.addEventListener('pointerdown', function(e) {
    e.preventDefault();
    keys['ArrowLeft'] = true;
});

leftButton.addEventListener('pointerup', function(e) {
    e.preventDefault();
    keys['ArrowLeft'] = false;
});

// Right Button Events
rightButton.addEventListener('pointerdown', function(e) {
    e.preventDefault();
    keys['ArrowRight'] = true;
});

rightButton.addEventListener('pointerup', function(e) {
    e.preventDefault();
    keys['ArrowRight'] = false;
});

// Pause Button Event
pauseButton.addEventListener('pointerup', function(e) {
    e.preventDefault();
    isPaused = !isPaused;
    if (!isPaused) {
        // Reset lastTime and start the game loop
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
    } else {
        // Cancel the animation frame to stop the game loop
        cancelAnimationFrame(animationId);
        // Draw paused screen
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Paused', canvas.width / 2, canvas.height / 2);
    }
});


// Jump Button Event
jumpButton.addEventListener('pointerdown', function(e) {
    e.preventDefault();
    if (horse.onGround) {
        horse.isJumping = true;
        horse.velocityY = -350;  
        horse.jumpHoldTime = 0;  
        horse.onGround = false;
        jumpSound.play();
    }
    keys['ControlLeft'] = true; // Simulate holding down the jump key
});

jumpButton.addEventListener('pointerup', function(e) {
    e.preventDefault();
    keys['ControlLeft'] = false; // Simulate releasing the jump key
});

// Stomp Button Events
stompButton.addEventListener('pointerdown', function(e) {
    e.preventDefault();
    if (!horse.stomping) {
        horse.stomping = true;
        horse.stompCount = 0;
    }
});

stompButton.addEventListener('pointerup', function(e) {
    e.preventDefault();
    horse.stomping = false;
    horse.trampleAngle = 0;
});
