// Global variables
let gameState = 'start';
let playerX;
let playerSpeed = 3;
let enemies = [];
let enemySpeed = 2;
let projectiles = [];
let projectileSpeed = 5;
let score = 0;
let lives = 3;
let starfield = [];
let shootOsc, explosionOsc, shootEnv, explosionEnv;
let shootCooldown = 0;
let enemySpawnInterval = 60;
let frameCountSinceStart = 0;
let audioInitialized = false;
let startButton;
let particleEffects = [];
let rotationAngle = 0;
let playerZ = 0;
let zSpeed = 0.1;

// Game colors
let gameColors = {
  background: [10, 5, 30],
  stars: [200, 200, 255],
  player: [0, 255, 255],
  enemy: [255, 50, 50],
  projectile: [255, 255, 0],
  text: [255, 255, 255]
};

function setup() {
  // Set up the canvas
  createCanvas(400, 600);
  playerX = width / 2;

  // Initialize starfield with additional properties for glimmering
  for (let i = 0; i < 100; i++) {
    starfield.push({
      x: random(width),
      y: random(height),
      size: random(2, 4),
      brightness: random(100, 255),  // Random initial brightness
      glimmerSpeed: random(0.02, 0.06)  // Different speeds for twinkling
    });
  }

  // Initialize sound oscillators and envelopes
  shootOsc = new p5.Oscillator('square');
  shootOsc.amp(0);
  shootOsc.freq(880);
  shootEnv = new p5.Envelope();
  shootEnv.setADSR(0.01, 0.1, 0, 0);

  explosionOsc = new p5.Oscillator('sawtooth');
  explosionOsc.amp(0);
  explosionOsc.freq(220);
  explosionEnv = new p5.Envelope();
  explosionEnv.setADSR(0.05, 0.2, 0, 0.1);

  // Create start button
  startButton = createButton('Click to Enable Audio & Start');
  startButton.position(width/2 - 75, height/2 + 50);
  startButton.mousePressed(startGame);
}

function draw() {
  background(gameColors.background);

  if (gameState === 'start') {
    drawStarfield();
    push();  // Save current drawing state
    textAlign(CENTER, CENTER);
    fill(gameColors.text[0], gameColors.text[1], gameColors.text[2]);
    textSize(48);
    text('SPACE SHOOTER', width/2, height/2 - 40);
    
    textSize(24);
    fill(200);
    text('Press any key to start', width/2, height/2 + 20);
    pop();  // Restore drawing state
  } else if (gameState === 'playing') {
    drawStarfield();
    movePlayer();
    drawPlayerShip(playerX, height - 30);

    // Spawn and draw enemies
    if (frameCount % enemySpawnInterval === 0) {
      enemies.push({ x: random(20, width - 20), y: 0 });
    }

    moveEnemies();
    for (let enemy of enemies) {
      drawEnemy(enemy.x, enemy.y);
    }

    moveProjectiles();
    for (let proj of projectiles) {
      drawProjectile(proj.x, proj.y);
    }

    updateParticles();
    checkCollisions();

    // Fix score display
    push();
    textAlign(LEFT, TOP);
    textSize(20);
    fill(gameColors.text[0], gameColors.text[1], gameColors.text[2]);
    text('Score: ' + score, 20, 30);
    pop();

    if (shootCooldown > 0) shootCooldown--;

    // Increase frame counter
    frameCountSinceStart++;

    // Increase difficulty as score rises
    if (score % 50 === 0 && score > 0) {
      enemySpawnInterval = max(10, enemySpawnInterval - 5);
    }
  } else if (gameState === 'gameOver') {
    drawStarfield();
    push();
    textAlign(CENTER, CENTER);
    textSize(48);
    fill(gameColors.text[0], gameColors.text[1], gameColors.text[2]);
    text('Game Over', width/2, height/2);
    textSize(24);
    text('Score: ' + score, width/2, height/2 + 40);
    text('Press any key to restart', width/2, height/2 + 80);
    pop();
  }
}

function drawPlayerShip(x, y) {
  push();
  translate(x, y);
  
  // Add 3D-like rotation effect
  let tiltAmount = (playerX - width/2) * 0.001;
  rotate(tiltAmount);
  
  // Add floating motion
  playerZ = sin(frameCount * 0.05) * 5;
  scale(1 + playerZ * 0.01);
  
  // Ship body with 3D effect
  fill(gameColors.player);
  noStroke();
  
  // Main body
  beginShape();
  vertex(-15, 10);
  vertex(15, 10);
  vertex(0, -20);
  endShape(CLOSE);
  
  // Side wings with perspective
  fill(0, 200, 255);
  beginShape();
  vertex(-15, 10);
  vertex(-25, 15);
  vertex(-20, 0);
  endShape(CLOSE);
  
  beginShape();
  vertex(15, 10);
  vertex(25, 15);
  vertex(20, 0);
  endShape(CLOSE);
  
  // Engine glow with pulsing effect
  let pulseSize = sin(frameCount * 0.2) * 2;
  fill(255, 150 + sin(frameCount * 0.2) * 50, 0);
  ellipse(-8, 15, 6 + pulseSize, 10);
  ellipse(8, 15, 6 + pulseSize, 10);
  
  pop();
}

function drawEnemy(x, y) {
  push();
  translate(x, y);
  
  // Add wobble effect
  let wobble = sin(frameCount * 0.1 + x) * 0.1;
  rotate(wobble);
  
  // Scale based on y position for pseudo-3D effect
  let depth = map(y, 0, height, 0.8, 1.2);
  scale(depth);
  
  // Draw inverted triangle with 3D effect
  fill(gameColors.enemy);
  noStroke();
  
  // Main body
  beginShape();
  vertex(-10, -8);
  vertex(10, -8);
  vertex(0, 8);
  endShape(CLOSE);
  
  // Side details
  fill(255, 0, 0);
  beginShape();
  vertex(-10, -8);
  vertex(-15, -6);
  vertex(-12, 0);
  endShape(CLOSE);
  
  beginShape();
  vertex(10, -8);
  vertex(15, -6);
  vertex(12, 0);
  endShape(CLOSE);
  
  // Center detail
  fill(255);
  ellipse(0, 0, 4, 4);
  
  pop();
}

function drawProjectile(x, y) {
  push();
  translate(x, y);
  
  // Add rotation effect
  rotationAngle += 0.2;
  rotate(rotationAngle);
  
  // Draw projectile with 3D effect
  fill(gameColors.projectile);
  noStroke();
  
  // Main beam
  rect(-2, -8, 4, 16);
  
  // Side glow
  fill(255, 255, 100, 100);
  ellipse(0, 0, 8, 8);
  
  pop();
}

function keyPressed() {
  if (gameState === 'start') {
    gameState = 'playing';
    score = 0;
    enemies = [];
    projectiles = [];
    frameCountSinceStart = 0;
    enemySpawnInterval = 60;
  } else if (gameState === 'gameOver') {
    gameState = 'start';
  } else if (gameState === 'playing' && key === ' ') {
    if (shootCooldown === 0) {
      shootProjectile();
      shootCooldown = 10;
      playShootSound();
    }
  }
}

function movePlayer() {
  // Move spaceship left or right with more precise positioning
  if (keyIsDown(LEFT_ARROW)) {
    playerX = Math.round(playerX - playerSpeed);  // Round to prevent floating point imprecision
  }
  if (keyIsDown(RIGHT_ARROW)) {
    playerX = Math.round(playerX + playerSpeed);  // Round to prevent floating point imprecision
  }
  
  // Keep within screen bounds with tighter constraints
  playerX = constrain(playerX, 15, width - 15);  // Adjusted from 10 to 15 to match player ship size
}

function shootProjectile() {
  // Create a new projectile at player's exact position
  projectiles.push({ 
    x: Math.round(playerX),  // Round to ensure precise alignment
    y: height - 20 
  });
}

function moveProjectiles() {
  // Update and remove off-screen projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    projectiles[i].y -= projectileSpeed;
    if (projectiles[i].y < 0) {
      projectiles.splice(i, 1);
    }
  }
}

function moveEnemies() {
  // Update enemy positions and remove them when they go off screen
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].y += enemySpeed;
    // Simply remove enemies that reach the bottom without penalty
    if (enemies[i].y > height) {
      enemies.splice(i, 1);
    }
  }
}

function checkCollisions() {
  // Check projectile-enemy collisions with strict vertical alignment
  for (let i = projectiles.length - 1; i >= 0; i--) {
    for (let j = enemies.length - 1; j >= 0; j--) {
      if (projectiles[i].y <= enemies[j].y + 8 && projectiles[i].y >= enemies[j].y - 8) {
        let xDist = Math.abs(projectiles[i].x - enemies[j].x);
        if (xDist < 10) {  // Adjusted for triangle width
          projectiles.splice(i, 1);
          enemies.splice(j, 1);
          score += 10;
          playExplosionSound();
          break;
        }
      }
    }
  }

  // Check enemy-player collisions
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (Math.abs(enemies[i].x - playerX) < 10) {
      if (enemies[i].y >= height - 40 && enemies[i].y <= height - 20) {
        gameState = 'gameOver';
        playExplosionSound();
        break;
      }
    }
  }
}

function drawStarfield() {
  // Draw and move stars with 3D effect
  for (let star of starfield) {
    // Calculate 3D-like movement
    let z = (frameCount * star.size * 0.1) % height;
    let scale = map(z, 0, height, 2, 0.5);
    
    // Calculate glimmering effect
    star.brightness = 150 + sin(frameCount * star.glimmerSpeed) * 105;
    
    // Draw the star
    fill(star.brightness);
    noStroke();
    ellipse(star.x, star.y, star.size * scale);
    
    // Move star with parallax
    star.y += star.size * scale * 0.5;
    
    // Reset star
    if (star.y > height) {
      star.y = 0;
      star.x = random(width);
      star.size = random(2, 4);
      star.glimmerSpeed = random(0.02, 0.06);
    }
  }
}

function playShootSound() {
  // Play shooting sound
  shootOsc.start();
  shootEnv.play(shootOsc);
  setTimeout(() => shootOsc.stop(), 100);
}

function playExplosionSound() {
  // Play explosion sound
  explosionOsc.start();
  explosionEnv.play(explosionOsc);
  setTimeout(() => explosionOsc.stop(), 200);
}

function startGame() {
  userStartAudio().then(() => {
    audioInitialized = true;
    startButton.remove();
    gameState = 'playing';
  }).catch(err => {
    console.log('Audio initialization failed:', err);
  });
}

function drawGlowingText(txt, x, y, size, color) {
  push();
  textAlign(LEFT, TOP);
  textSize(size);
  fill(color[0], color[1], color[2]);
  text(txt, x, y);
  pop();
}

function updateParticles() {
  // Implementation of updateParticles function
}