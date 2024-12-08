import { Transform } from "./Transform.js";

export class Game {
  constructor(player1, player2, ball, camera, canvas, gameNumber){
    this.player1 = player1;
    this.player2 = player2;
    this.currentPlayer = player1;
    this.gameNumber = gameNumber;

    this.ball = ball;
    this.camera = camera;
    this.canvas = canvas;
    this.gravity = 1;
    this.bounciness = 0.85;

    this.cameraShakeInterval = null;

    this.turnTime = this.currentPlayer.turnTime;
    this.remainingTime = this.turnTime;
    this.timerInterval = null;
    this.turnStarted = false;
    this.gameSound = new Audio('gameBackground.mp3');
    this.gameSound.loop = true;
    this.gameSound.volume = 0.1;
    this.bounceSound = new Audio('ballBounceSound.mp3');
    this.cheerSound = new Audio('cupHitSound.mp3');
    this.cheerSound.volume = 0.5;
    this.buttonSound = new Audio('buttonSound.mp3');
    this.buttonSound.volume = 0.15;
    this.gameOverSound = new Audio('gameOverSound.mp3');
    this.cheerSound.volume = 0.5;

    this.cameraRotation = { roll: -180, pitch: 0, yaw: 15.035 };

    this.instructionsProgress = 0;
    this.wordInterval = null;
  }

  //initial setup
  setUp(){
    this.gameSound.currentTime = 0;
    this.gameSound.play().then();
    document.getElementById('rightBarHeader').style.width = '102%';
    document.getElementById('leftBarHeader').style.width = '102%';
    document.getElementById('leftIconImg').src = this.player1.character.stats.iconImage;
    document.getElementById('rightIconImg').src = this.player2.character.stats.iconImage;
    document.getElementById("sliderLeft").disabled = false;
    document.getElementById("sliderRight").disabled = true;
    this.setSideDivs()
    this.currentPlayer.setCountdown();
    this.player1.setStats();
    this.player2.setStats();
    this.showText();
    this.startPulsingAnimations();
    this.resetBall();
    if(this.gameNumber === 1) {
      setTimeout(() => {
        this.displayInstructionsDiv();
      }, 1500);
    } else {
      this.addTurnStartEventListener();
    }
  }

  //sets the ability images and sliders depending on picked characters
  setSideDivs() {
    const leftAbilityIcon = document.getElementById('leftAbilityIcon');
    const rightAbilityIcon = document.getElementById('rightAbilityIcon');
    const leftStar = document.getElementById('leftAbilityStar');
    const leftSlider = document.getElementById('sliderDivLeft');
    const rightStar = document.getElementById('rightAbilityStar');
    const rightSlider = document.getElementById('sliderDivRight');
    const leftSliderInput = document.getElementById('sliderLeft');
    const rightSliderInput = document.getElementById('sliderRight');
    leftSliderInput.value = 5;
    rightSliderInput.value = 5;
    const leftSliderValue = document.getElementById("sliderValueLeft");
    const rightSliderValue = document.getElementById("sliderValueRight");
    let gravityConstant = 1.20;
    let gravityModifier = 25;
    let springConstant = 0.5;
    let springModifier = 14;
    let originalGravity = 1;
    let originalBounciness = 0.85;

    if (this.player1.character.stats.name === 'CURVE' || this.player1.character.stats.name === 'SPRING') {
      if (this.player1.character.stats.name === 'SPRING') {
        leftSliderValue.innerText = `Bounce: ${(this.bounciness / originalBounciness).toFixed(2)}x`;
        leftSliderInput.addEventListener("input", () => {
          this.bounciness = springConstant + leftSliderInput.value / springModifier;
          this.ball.bounciness = this.bounciness;
          leftSliderValue.innerText = `Bounce: ${(this.bounciness / originalBounciness).toFixed(2)}x`;
        });
      } else {
        leftSliderValue.innerText = `Gravity: ${(originalGravity / this.gravity).toFixed(2)}x`;
        leftSliderInput.addEventListener("input", () => {
          this.gravity = gravityConstant - leftSliderInput.value / gravityModifier;
          leftSliderValue.innerText = `Gravity: ${(originalGravity / this.gravity).toFixed(2)}x`;
        });
      }
    }

    if (this.player2.character.stats.name === 'CURVE' || this.player2.character.stats.name === 'SPRING') {
      if (this.player2.character.stats.name === 'SPRING') {
        rightSliderValue.innerText = `Bounce: ${(this.bounciness / originalBounciness).toFixed(2)}x`;
        rightSliderInput.addEventListener("input", () => {
          this.bounciness = springConstant + rightSliderInput.value / springModifier;
          this.ball.bounciness = this.bounciness;
          rightSliderValue.innerText = `Bounce: ${(this.bounciness / originalBounciness).toFixed(2)}x`;
        });
      } else {
        rightSliderValue.innerText = `Gravity: ${(originalGravity / this.gravity).toFixed(2)}x`;
        rightSliderInput.addEventListener("input", () => {
          this.gravity = gravityConstant - rightSliderInput.value / gravityModifier;
          rightSliderValue.innerText = `Gravity: ${(originalGravity / this.gravity).toFixed(2)}x`;
        });
      }
    }
    leftAbilityIcon.src = this.player1.character.stats.abilityImage;
    rightAbilityIcon.src = this.player2.character.stats.abilityImage;
    leftStar.src = this.player1.character.stats.starImage;
    leftStar.style.animation = this.player1.character.stats.starImageAnimation;
    rightStar.src = this.player2.character.stats.starImage;
    rightStar.style.animation = this.player2.character.stats.starImageAnimation;

    leftSlider.style.display = this.player1.character.stats.lever;
    rightSlider.style.display = this.player2.character.stats.lever;
  }

  //manages the sliders depending on the current player
  manageSliders() {
    const leftSliderInput = document.getElementById('sliderLeft');
    const rightSliderInput = document.getElementById('sliderRight');
    if(this.currentPlayer === this.player1){
      rightSliderInput.disabled = true;
      leftSliderInput.disabled = false;
    } else {
      rightSliderInput.disabled = false;
      leftSliderInput.disabled = true;
    }
  }

  //clears the effects
  clearEffects(){
    let effects = document.getElementsByClassName("hurtDiv");
    for (let effect of effects) {
      effect.style.opacity = "0";
    }
  }

  changePlayerTurn(){
    this.stopPulsingAnimations();
    this.currentPlayer.gainEnergy(this.currentPlayer.character.stats.energyGainTurn);
    this.currentPlayer = this.currentPlayer === this.player1 ? this.player2 : this.player1;
    if(this.currentPlayer.rest){
      this.currentPlayer.rest = false;
      this.endTurn();
      return;
    }
    this.manageSliders();
    this.turnCamera();
    this.startPulsingAnimations();
    this.resetBall();
    setTimeout(() => {
      this.startTurn();
    }, 4000);
  }
  startTurn(){
    if(!this.turnStarted){
      this.startCountdown();
      this.activateCupEffects();
      this.currentPlayer.setEffect();
      this.hideText();
      this.turnStarted = true;
    }
  }
  endTurn(){
    console.log("Turn ended");
    this.turnStarted = false;
    this.changePlayerTurn();
    this.stopCupEffects();
    this.clearEffects();
    this.currentPlayer.effectImpact *= 0.9;
    this.resetCountdown();
  }
  giveAnotherTurn(){
    this.stopPulsingAnimations();
    this.resetBall();
    this.resetCountdown();
    this.turnStarted = false;
    this.startTurn();
  }

  turnCamera(){
    let transform = this.camera.getComponentOfType(Transform);
    if(this.currentPlayer === this.player2){
      this.eulerToRotation({ roll: -180, pitch: 0, yaw: 15 });
      let cameraInterval = setInterval(() => {
        if(this.cameraRotation.pitch < 180){
          transform.translation[2] += (12.6 * 2) / 200;
          this.cameraRotation.pitch += 0.9;
          this.eulerToRotation(this.cameraRotation);
        }else{
          this.showText();
          this.addTurnStartEventListener();
          clearInterval(cameraInterval);
          transform.translation[2] = 12.6;
        }
      }, 10);
    }else{
      this.eulerToRotation({ roll: -180, pitch: 180, yaw: 15 });
      let cameraInterval = setInterval(() => {
        if(this.cameraRotation.pitch > 0){
          transform.translation[2] -= (12.6 * 2) / 200;
          this.cameraRotation.pitch -= 0.9;
          this.eulerToRotation(this.cameraRotation);
        }else{
          this.showText();
          this.addTurnStartEventListener();
          clearInterval(cameraInterval);
          transform.translation[2] = -12.6;
        }
      }, 10);
    }
  }

  startPulsingAnimations(){
    let side = this.currentPlayer === this.player1 ? 'left' : 'right';
    document.getElementById(`${side}BarHeader`).classList.add('pulseColor');
    document.getElementById(`${side}IconImg`).classList.add('pulseScale');
  }
  stopPulsingAnimations(){
    let side = this.currentPlayer === this.player1 ? 'left' : 'right';
    document.getElementById(`${side}BarHeader`).classList.remove('pulseColor');
    document.getElementById(`${side}IconImg`).classList.remove('pulseScale');
  }

  showText(){
    let text = this.currentPlayer === this.player1 ? 'PLAYER1' : 'PLAYER2';
    let textDiv = document.getElementById('currentPlayerText');
    textDiv.innerText = `READY ${text}`;
    textDiv.style.visibility = 'visible';
  }
  hideText(){
    document.getElementById('currentPlayerText').style.visibility = 'hidden';
  }

  startCountdown() {
    this.resetCountdown();
    let countdownDiv = document.getElementById('countdown');

    this.timerInterval = setInterval(() => {
      if (this.remainingTime > 0) {
        this.remainingTime--;
        countdownDiv.innerText = this.remainingTime;
        if(this.remainingTime <= 5){
          if(!countdownDiv.classList.contains('pulseColorCountdown') && countdownDiv.style.backgroundColor !== 'rgba(160, 40, 40, 0.9)'){
            countdownDiv.style.backgroundColor = 'rgba(160, 40, 40, 0.9)';
            countdownDiv.classList.add('pulseColorCountdown');
          }
        }
      } else {
        this.endTurn();
      }
    }, 1000);
  }
  resetCountdown() {
    let countdownDiv = document.getElementById('countdown');

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if(countdownDiv.classList.contains('pulseColorCountdown')){
      countdownDiv.classList.remove('pulseColorCountdown');
    }
    this.remainingTime = this.currentPlayer.turnTime;
    countdownDiv.innerText = this.remainingTime;
    countdownDiv.style.backgroundColor = 'yellow';
  }

  resetBall(){
    this.ball.velocity = [0, 0, 0];
    this.ball.bounces = 0;
    this.ball.moving = false;
    this.ball.isGrabbed = false;
    this.ball.effect = null;
    this.ball.bounciness = this.bounciness;
    if(this.currentPlayer === this.player1) {
      this.ball.transform.translation = [0, 7.5, -7.1];
      this.ball.startPosition = [0, 7.5, -7.1];
    }else{
      this.ball.transform.translation = [0, 7.5, 7.1];
      this.ball.startPosition = [0, 7.5, 7.1];
    }
    this.ball.transform.scale = [0.18, 0.18, 0.18];
    this.ball.radius = 0.18;
    this.ball.setBlinkingInterval();
    document.getElementById("powerContainer").style.display = "none";
  }
  throwBall(){
    this.ball.startPosition = this.currentPlayer === this.player1 ? [0, 7.5, -7.1] : [0, 7.5, 7.1];
    this.ball.setStartVelocity(this.gravity);
    this.ball.moving = true;
    this.ball.isGrabbed = false;
    document.getElementById("powerContainer").style.display = "none";
    this.canvas.style.cursor = "default";
  }
  grabBall(){
    this.ball.isGrabbed = true;
    this.ball.moving = false;
    this.ball.thrower = this.currentPlayer;
    this.stopPulsingAnimations();
    document.getElementById("powerContainer").style.display = "block";
    if(this.ball.effect === null){
      this.ball.transform.scale = [0.18, 0.18, 0.18];
    }
  }
  stopBall(){
    this.resetBall();
    this.endTurn();
  }
  dragBall(dragDistance, event){
    let powerBar = document.getElementById("powerBar");
    powerBar.style.width = 100 - dragDistance / 30 + "%";
    let dragToughness = 0.7 / Math.pow(Math.abs(dragDistance + 1), 1.1);
    dragToughness = Math.min(dragToughness, 0.001);
    let ballTranslation = this.ball.transform.translation;
    if(dragDistance > 3000){
      if(this.currentPlayer === this.player1){
        ballTranslation[0] -= event.movementX * 0.01;
      }else{
        ballTranslation[0] += event.movementX * 0.01;
      }
    }else{
      if(this.currentPlayer === this.player1){
        ballTranslation[2] -= event.movementY * dragToughness;
        ballTranslation[0] -= event.movementX * 0.01;
      }else{
        ballTranslation[2] += event.movementY * dragToughness;
        ballTranslation[0] += event.movementX * 0.01;
      }
      ballTranslation[1] -= 1.5 * event.movementY * dragToughness;
    }
  }

  otherPlayer(){
    return this.currentPlayer === this.player1 ? this.player2 : this.player1;
  }

  activateAbility(){
    if(this.currentPlayer.energy >= this.currentPlayer.character.stats.minCastEnergy){
      switch(this.currentPlayer.character.stats.name){
        case 'TRIPP':
          this.activateTrippAbility();
          break;
        case 'ATLAS':
          this.activateAtlasAbility();
          break;
        case 'CURVE':
          this.activateCurveAbility();
          break;
        case 'NERO':
          this.activateNeroAbility();
          break;
        case 'SPRING':
          this.activateSpringAbility();
      }
    }
  }
  activateTrippAbility(){
    if(this.ball.isGrabbed || this.ball.moving){
      return;
    }
    this.currentPlayer.loseEnergy(100);
    let effects = this.currentPlayer.effectImpact;
    this.currentPlayer.effectImpact = this.otherPlayer().effectImpact;
    this.otherPlayer().effectImpact = effects;
    this.stopCupEffects();
    this.activateCupEffects();
  }
  activateAtlasAbility(){
    if (this.ball.moving) {
      return;
    }
    this.currentPlayer.loseEnergy(100);
    this.ball.effect = 'atlasEffect';
    this.ball.scale = [0.25, 0.25, 0.25];
    this.ball.radius = 0.25;
  }
  activateCurveAbility(event){
    if(!event || this.currentPlayer.energy < 1){
      return;
    }
    this.currentPlayer.loseEnergy(0.66);
    let dx = event.movementX;
    let direction = dx > 0 ? 1 : -1;
    let adjustment = Math.min(0.04, Math.abs(dx) * 0.01);
    if(this.currentPlayer === this.player1){
      this.ball.velocity[0] -= adjustment * direction;
    }else{
      this.ball.velocity[0] += adjustment * direction;
    }
  }
  activateNeroAbility(){
    this.currentPlayer.loseEnergy(1);
    this.currentPlayer.effectImpact *= 0.98;
    this.currentPlayer.gainHP(1 / 4);
    this.stopCupEffects();
    this.activateCupEffects();
  }
  activateSpringAbility(){
    if(this.ball.moving){
      return;
    }
    this.currentPlayer.loseEnergy(100);
    this.ball.effect = 'springEffect';
    this.ball.bounciness = 2;
    this.ball.transform.scale = [0.14, 0.14, 0.14];
    this.ball.radius = 0.14;
  }

  handleCupHit(cup){
    this.currentPlayer.gainEnergy(this.currentPlayer.character.stats.energyGainCup);
    this.cheerSound.play().then();
    if(this.currentPlayer.character.stats.name === 'NERO'){
      this.otherPlayer().loseEnergy(6);
    }else if(this.otherPlayer().character.stats.name === 'TRIPP'){
      this.otherPlayer().gainHP(6);
      this.otherPlayer().effectImpact += 0.5;
    }else if(this.currentPlayer.character.stats.name === 'TRIPP') {
      this.otherPlayer().loseHP(8);
    }
    this.otherPlayer().effectImpact += 1;
    cup.getComponentOfType(Transform).translation = [0, -10, 0];
    this.currentPlayer.score++;
    if(this.currentPlayer.score === 6){
      console.log("Player won");
      this.gameOver();
    }else{
      this.giveAnotherTurn();
    }
  }
  handlePlayerHit(){
    let damage = this.getBallSpeed() * this.currentPlayer.character.stats.strength;
    if(this.ball.effect === 'atlasEffect'){
      damage *= 1.5;
      this.otherPlayer().rest = true;
    }else if(this.ball.effect === 'springEffect'){
      damage *= 1.3;
    }
    console.log(this.otherPlayer().character.stats.name);
    this.otherPlayer().character.stats.hurtSound.play().then();
    if(this.otherPlayer().character.stats.name === 'NERO'){
      damage *= 1.5;
    }else if(this.currentPlayer.character.stats.name === 'NERO'){
      this.currentPlayer.gainHP(damage / 2);
    }
    this.otherPlayer().loseHP(damage);
    if(this.otherPlayer().currentHP <= 0){
      this.gameOver();
    }
    this.endTurn();
  }
  handleBounce(){
    this.ball.bounces++;
    this.bounceSound.play().then();
    if(this.currentPlayer.character.stats.name === 'SPRING' && !this.ball.inCup && this.ball.effect !== 'springEffect' && this.ball.velocity[1] > 0.8){
      this.currentPlayer.gainEnergy(0.66);
      this.currentPlayer.gainHP(0.1);
    }
    if(this.ball.effect === 'atlasEffect'){
      this.ball.effect = null;
    }
  }

  activateCupEffects(){
    this.canvas.style.filter = `blur(${this.currentPlayer.effectImpact / 10}vh)`;
    this.clearCameraShakeInterval();
    this.setCameraShakeInterval();
  }
  setCameraShakeInterval(){
    this.cameraShakeInterval = setInterval(() => {
      this.shakeCamera();
    }, 200);
  }
  stopCupEffects(){
    this.canvas.style.filter = 'blur(0px)';
    this.clearCameraShakeInterval();
  }

  shakeCamera(){
    let pitchStart = this.currentPlayer === this.player1 ? 0 : 180;
    let pitchThreshold = 45;
    let pitchDiff = this.cameraRotation.pitch - pitchStart;
    let pitchDirection;
    if(pitchDiff > pitchThreshold){
      pitchDirection = pitchDiff < 0 ? 1 : -1;
    }else{
      let decider = (pitchDiff / pitchThreshold) / 2;
      pitchDirection = Math.random() > 0.5 + decider ? 1 : -1;
    }
    let yawStart = 15;
    let yawThreshold = 30;
    let yawDiff = this.cameraRotation.yaw - yawStart;
    let yawDirection;
    if(yawDiff > yawThreshold){
      yawDirection = yawDiff < 0 ? 1 : -1;
    }else{
      let decider = (yawDiff / yawThreshold) / 2;
      yawDirection = Math.random() > 0.5 + decider ? 1 : -1;
    }
    let randomYawRotation = yawDirection * Math.random() * 0.003 * this.currentPlayer.effectImpact;
    let randomPitchRotation = pitchDirection * Math.random() * 0.003 * this.currentPlayer.effectImpact;
    for (let i = 0; i < 100; i++) {
      setTimeout(() => {
        this.cameraRotation.yaw += randomYawRotation;
        this.cameraRotation.pitch += randomPitchRotation;
        this.eulerToRotation(this.cameraRotation);
      }, i * 2);
    }

  }

  clearCameraShakeInterval() {
    clearInterval(this.cameraShakeInterval);
    this.cameraShakeInterval = null;
  }

  getBallSpeed(){
    return Math.sqrt(this.ball.velocity[0] ** 2 + this.ball.velocity[1] ** 2 + this.ball.velocity[2] ** 2) / 2;
  }
  eulerToRotation(euler) {
    const cy = Math.cos(euler.yaw * (Math.PI / 180) * 0.5); // Cosine of half yaw
    const sy = Math.sin(euler.yaw * (Math.PI / 180) * 0.5); // Sine of half yaw
    const cp = Math.cos(euler.pitch * (Math.PI / 180) * 0.5); // Cosine of half pitch
    const sp = Math.sin(euler.pitch * (Math.PI / 180) * 0.5); // Sine of half pitch
    const cr = Math.cos(euler.roll * (Math.PI / 180) * 0.5); // Cosine of half roll
    const sr = Math.sin(euler.roll * (Math.PI / 180) * 0.5); // Sine of half roll

    let w = cr * cp * cy + sr * sp * sy;
    let x = sr * cp * cy - cr * sp * sy;
    let y = cr * sp * cy + sr * cp * sy;
    let z = cr * cp * sy - sr * sp * cy;
    this.camera.getComponentOfType(Transform).rotation = [w, x, y, z];
  }

  addTurnStartEventListener() {
    this.removeTurnStartEventListener();
    document.body.addEventListener('mousemove', this.startTurn.bind(this), { once: true });
  }
  removeTurnStartEventListener() {
    document.body.removeEventListener('mousemove', this.startTurn.bind(this));
  }

  gameOver(){
    this.gameSound.pause();
    this.gameSound.currentTime = 0;
    this.gameOverSound.play().then();
    this.setGameOverPage();
    let gameOverDiv = document.getElementById("gameOverDiv");
    gameOverDiv.style.display = 'block';
    document.getElementById("gameOverExitButton").addEventListener("click", async () => {
      this.buttonSound.play().then();
      this.gameOverSound.pause();
      this.gameOverSound.currentTime = 0;
      gameOverDiv.style.display = 'none';
      await window.exitGame();
    }, {once : true});
  }

  setGameOverPage(){
    const winner = this.currentPlayer === this.player1 ? 'Left' : 'Right';
    const loser = winner === 'Left' ? 'Right' : 'Left';
    document.getElementById("gameOverWinnerPlaceholder" + winner).src = `winnerText.png`;
    document.getElementById("gameOverWinnerPlaceholder" + loser).src = `loserText.png`;
    document.getElementById(`gameOverCrown${winner}`).style.visibility = 'visible';
    document.getElementById(`gameOverCrown${loser}`).style.visibility = 'hidden';
    document.getElementById("gameOverCharacterImgLeft").src = this.player1.character.stats.iconImage;
    document.getElementById("gameOverCharacterImgRight").src = this.player2.character.stats.iconImage;
  }

  displayInstructionsDiv() {
    let instructionsDiv = document.getElementById('instructions');
    instructionsDiv.style.display = 'block';
    this.updateInstructions();
    document.getElementById('instructionsBackButton').addEventListener('click', () => {
      this.updateInstructions(-1);
      this.buttonSound.play().then();
    });
    document.getElementById('instructionsNextButton').addEventListener('click', () => {
      this.updateInstructions(1);
      this.buttonSound.play().then();
    });
    document.getElementById('instructionsSkipButton').addEventListener('click', () => {
      instructionsDiv.style.display = 'none';
      this.buttonSound.play().then();
      this.addTurnStartEventListener();
    }, { once: true });
  }

  updateInstructions(direction){
    if(direction === 1) {
      if(this.instructionsProgress < Game.instructions.length - 1) {
        this.instructionsProgress++;
      }
    } else {
      if(this.instructionsProgress > 0) {
        this.instructionsProgress--;
      }
    }
    if(this.instructionsProgress === Game.instructions.length - 1) {
      document.getElementById('instructionsSkipButton').style.animation = 'pulseScale 0.75s infinite';
    } else {
      document.getElementById('instructionsSkipButton').style.animation = 'none';
    }
    this.displayInstructionsBorder();
    this.displayInstructionsText();
  }

  displayInstructionsBorder() {
    let borderDiv = document.getElementById("instructionsBorderDiv");
    let instructions = Game.instructions[this.instructionsProgress];
    borderDiv.style.width  = instructions.borderWidth;
    borderDiv.style.height = instructions.borderHeight;
    borderDiv.style.left = instructions.borderLeft;
    borderDiv.style.top = instructions.borderTop;
    borderDiv.style.borderRadius = instructions.borderRadius;
    borderDiv.style.display = instructions.borderDisplay;
  }

  displayInstructionsText() {
    const div = document.getElementById("instructionsTextContent");
    const text = Game.instructions[this.instructionsProgress].text;
    div.innerText = "";
    const words = text.split(" ");
    let index = 0;

    if (this.wordInterval) clearInterval(this.wordInterval);
    this.wordInterval = setInterval(() => {
      if (index < words.length) {
        div.innerText += (index === 0 ? "" : " ") + words[index];
        index++;
      } else {
        clearInterval(this.wordInterval);
        this.wordInterval = null;
      }
    }, 65);
  }

  static instructions = [
    {
      text: "WELCOME! If you are not here for the first time, you can skip this tutorial by clicking the skip button on the side. Otherwise, " +
        "make sure you pay good attention to the instructions. You can navigate through the tutorial by clicking the next and back buttons.",
      borderWidth: '0',
      borderHeight: '0',
      borderLeft: '0',
      borderTop: '0',
      borderRadius: '0',
      borderDisplay: 'none',
    },
    {
      text: "The first player to throw is always PLAYER1. The info for both players in located on separate sides, BLUE = PLAYER1, RED = PLAYER2. " +
        "Every player has a character with unique stats and abilities, be careful as the character's throw strength varies.",
      borderWidth: '0',
      borderHeight: '0',
      borderLeft: '0',
      borderTop: '0',
      borderRadius: '0',
      borderDisplay: 'none',
    },
    {
      text: "This is the game timer. It shows the time you have remaining before your turn ends. " +
        "The turn ends when the timer hits 0, including if the ball is still in play.",
      borderWidth: '6%',
      borderHeight: '8%',
      borderLeft: '46.5%',
      borderTop: '5%',
      borderRadius: '10px',
      borderDisplay: 'block',
    },
    {
      text: "This is the HP bar. It shows the current health of the player. If you lose all of your HP, you automatically lose the game. " +
      "You can reduce your opponent's HP by hitting them with the ball. Some characters have abilities or passives that can affect HP.",
      borderWidth: '28.5%',
      borderHeight: '4.5%',
      borderLeft: '21%',
      borderTop: '3.5%',
      borderRadius: '10px',
      borderDisplay: 'block',
    },
    {
      text: "This is the energy bar. It shows the current energy of the player. Energy is used to activate character's abilities. " +
        "You gain energy each turn and by scoring cups. Some characters have abilities or passives that can affect energy.",
      borderWidth: '26.5%',
      borderHeight: '3%',
      borderLeft: '21%',
      borderTop: '8%',
      borderRadius: '10px',
      borderDisplay: 'block',
    },
    {
      text: "This is the ability indicator. When the ability is ready to use, a star appears behind it. If the star is yellow, " +
        "the ability will use up 100% of your energy and if the star is red, the ability will drain energy periodically with usage. " +
        "Each character has a unique ability that can be activated by pressing SPACE.",
      borderWidth: '8%',
      borderHeight: '14%',
      borderLeft: '16%',
      borderTop: '13%',
      borderRadius: '10px',
      borderDisplay: 'block',
    },
    {
      text: "This is the lever. When it's your turn, you can manually set the lever on your side by dragging it up or down. " +
        "Some characters have passives that make them able to manipulate the lever and game variables with it, some don't.",
      borderWidth: '8%',
      borderHeight: '30%',
      borderLeft: '75%',
      borderTop: '28%',
      borderRadius: '10px',
      borderDisplay: 'block',
    },
    {
      text: "This is the ball. When it's your turn, you can click anywhere on the screen and drag backwards to generate power and sideways to change direction. " +
        "Your goal is to either score a cup or to hit opponent with the ball. If you score a cup, you get another turn and if you hit the opponent, they lose HP. " +
        "The ball doesn't bounce back from the opponent, but it does bounce from the cups.",
      borderWidth: '5%',
      borderHeight: '10%',
      borderLeft: '47%',
      borderTop: '30%',
      borderRadius: '50%',
      borderDisplay: 'block',
    },
    {
      text: "The more opponent's cups you hit and the lower their HP gets, the harder it will be for them to play. " +
        "This is it for the introduction :). We hope you have fun and good luck scoring cups!!",
      borderWidth: '0',
      borderHeight: '0',
      borderLeft: '0',
      borderTop: '0',
      borderRadius: '0',
      borderDisplay: 'none',
    }
  ];

}
