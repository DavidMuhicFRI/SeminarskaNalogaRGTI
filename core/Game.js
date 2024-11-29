import { Transform } from "./Transform.js";

export class Game {
  constructor(player1, player2, ball, camera, canvas){
    this.player1 = player1;
    this.player2 = player2;
    this.currentPlayer = player1;

    this.ball = ball;
    this.camera = camera;
    this.canvas = canvas;
    this.gravity = 1;

    this.cameraShakeInterval = null;

    this.turnTime = this.currentPlayer.turnTime;
    this.remainingTime = this.turnTime;
    this.timerInterval = null;
    this.turnStarted = false;
    this.bounceSound = new Audio('ballBounceSound.mp3');
    this.cheerSound = new Audio('cupHitSound.mp3');
    this.cheerSound.volume = 0.5;
    this.cameraRotation = { roll: -180, pitch: 0, yaw: 15.035 };
  }

  setUp(){
    document.getElementById('rightBarHeader').style.width = '102%';
    document.getElementById('leftBarHeader').style.width = '102%';
    document.getElementById('leftIconImg').src = this.player1.character.stats.iconImage;
    document.getElementById('rightIconImg').src = this.player2.character.stats.iconImage;
    document.getElementById("sliderLeft").disabled = false;
    document.getElementById("sliderRight").disabled = true
    this.setSideDivs()
    this.currentPlayer.setCountdown();
    this.player1.setStats();
    this.player2.setStats();
    this.showText();
    this.startPulsingAnimations();
    this.addTurnStartEventListener();
    this.resetBall();
  }

  setSideDivs() {
    const leftStar = document.getElementById('leftAbilityStar');
    const leftSlider = document.getElementById('sliderDivLeft');
    const rightStar = document.getElementById('rightAbilityStar');
    const rightSlider = document.getElementById('sliderDivRight');
    const leftSliderInput = document.getElementById('sliderLeft');
    const rightSliderInput = document.getElementById('sliderRight');

    if (this.player1.character.stats.name === 'CURVE' || this.player1.character.stats.name === 'SPRING' || this.player1.character.stats.name === 'NERO') {
      if (this.player1.character.stats.name === 'NERO') {
        leftStar.style.display = 'none';
      } else if (this.player1.character.stats.name === 'SPRING') {
        leftSliderInput.addEventListener("input", () => {
          this.ball.bounciness = 0.35 + leftSliderInput.value / 10;
        });
      } else {
        leftStar.style.display = 'none';
        leftSliderInput.addEventListener("input", () => {
          this.gravity = 1 - (rightSliderInput.value - 5) / 20;
        });
      }
    }
    if (this.player2.character.stats.name === 'CURVE' || this.player2.character.stats.name === 'SPRING' || this.player2.character.stats.name === 'NERO') {
      if (this.player2.character.stats.name === 'NERO') {
        rightStar.style.display = 'none';
      } else if (this.player2.character.stats.name === 'SPRING') {
        rightSliderInput.addEventListener("input", () => {
          this.ball.bounciness = 0.35 + rightSliderInput.value / 10;
        });
      } else {
        rightStar.style.display = 'none';
        rightSliderInput.addEventListener("input", () => {
          this.gravity = 1 - (rightSliderInput.value - 5) / 20;
        });
      }
    }
    leftStar.src = this.player1.character.stats.starImage;
    leftStar.style.animation = this.player1.character.stats.starImageAnimation;
    rightStar.src = this.player2.character.stats.starImage;
    rightStar.style.animation = this.player2.character.stats.starImageAnimation;

    leftSlider.style.display = this.player1.character.stats.lever;
    rightSlider.style.display = this.player2.character.stats.lever;
  }


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
      this.eulerToRotation({ roll: -180, pitch: 0, yaw: 15 }, transform);
      let cameraInterval = setInterval(() => {
        if(this.cameraRotation.pitch < 180){
          transform.translation[2] += (12.6 * 2) / 200;
          this.cameraRotation.pitch += 0.9;
          this.eulerToRotation(this.cameraRotation, transform);
        }else{
          this.showText();
          this.addTurnStartEventListener();
          clearInterval(cameraInterval);
          transform.translation[2] = 12.6;
        }
      }, 10);
    }else{
      this.eulerToRotation({ roll: -180, pitch: 180, yaw: 15 }, transform);
      let cameraInterval = setInterval(() => {
        if(this.cameraRotation.pitch > 0){
          transform.translation[2] -= (12.6 * 2) / 200;
          this.cameraRotation.pitch -= 0.9;
          this.eulerToRotation(this.cameraRotation, transform);
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
    if(this.currentPlayer === this.player1) {
      this.ball.transform.translation = [0, 7.5, -7.1];
      this.ball.startPosition = [0, 7.5, -7.1];
    }else{
      this.ball.transform.translation = [0, 7.5, 7.1];
      this.ball.startPosition = [0, 7.5, 7.1];
    }
    this.ball.transform.scale = [0.18, 0.18, 0.18];
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
    this.ball.transform.scale = [0.18, 0.18, 0.18];
    this.stopPulsingAnimations();
    document.getElementById("powerContainer").style.display = "block";
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
  }
  activateCurveAbility(event){
    if(!event){
      return;
    }
    this.currentPlayer.loseEnergy(1);
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
    let bars = document.getElementsByClassName("abilityBar");
    let amount = 1;
    this.currentPlayer.loseEnergy(amount);
    this.currentPlayer.effectImpact *= 0.98;
    this.currentPlayer.gainHP(amount / 4);
    for(let bar of bars){
    }
  }
  activateSpringAbility(){
    if(this.ball.isGrabbed || this.ball.moving){
      return;
    }
    this.currentPlayer.loseEnergy(100);
    this.ball.effect = 'springEffect';
    this.ball.bounciness = 1.5;
  }

  handleCupHit(cup){
    this.currentPlayer.gainEnergy(this.currentPlayer.character.stats.energyGainCup);
    this.cheerSound.play().then(r => console.log(r));
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
    let otherPlayer = this.otherPlayer();
    let damage = this.getBallSpeed() * this.currentPlayer.character.stats.strength;
    if(this.ball.effect === 'atlasEffect'){
      damage *= 1.5;
      this.otherPlayer().rest = true;
    }else if(this.ball.effect === 'springEffect'){
      damage *= 1.2;
    }
    otherPlayer.loseHP(damage);
    if(this.currentPlayer.character.stats.name === 'NERO'){
      this.currentPlayer.gainHP(damage / 2);
    }else if(this.otherPlayer().character.stats.name === 'NERO'){
      this.otherPlayer().loseHP(damage * 1.5);
    }
    if(otherPlayer.currentHP <= 0){
      this.gameOver();
    }
    this.endTurn();
  }
  handleBounce(){
    this.ball.bounces++;
    this.bounceSound.play().then(function(){});
    if(this.currentPlayer.character.stats.name === 'SPRING'){
      this.currentPlayer.gainEnergy(3);
      this.currentPlayer.gainHP(1);
    }
    if(this.ball.effect === 'atlasEffect'){
      this.ball.effect = null;
    }
    //TODO display bounce count, add spring energy (and others)
  }

  activateCupEffects(){
    this.canvas.style.filter = `blur(${this.currentPlayer.effectImpact / 2}px)`;
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
    let transform = this.camera.getComponentOfType(Transform);
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
        this.eulerToRotation(this.cameraRotation, transform);
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
  eulerToQuaternion(euler) {
    const { roll, pitch, yaw } = euler;

    // Convert degrees to radians
    const degToRad = Math.PI / 180;
    const r = roll * degToRad;
    const p = pitch * degToRad;
    const y = yaw * degToRad;

    // Compute quaternion components
    const cy = Math.cos(y * 0.5); // Cosine of half yaw
    const sy = Math.sin(y * 0.5); // Sine of half yaw
    const cp = Math.cos(p * 0.5); // Cosine of half pitch
    const sp = Math.sin(p * 0.5); // Sine of half pitch
    const cr = Math.cos(r * 0.5); // Cosine of half roll
    const sr = Math.sin(r * 0.5); // Sine of half roll

    return {
      w: cr * cp * cy + sr * sp * sy,
      x: sr * cp * cy - cr * sp * sy,
      y: cr * sp * cy + sr * cp * sy,
      z: cr * cp * sy - sr * sp * cy,
    };
  }
  eulerToRotation(euler, transform) {
    const { roll, pitch, yaw } = euler;
    const rotation = this.eulerToQuaternion({ roll, pitch, yaw });
    transform.rotation = [rotation.w, rotation.x, rotation.y, rotation.z];
  }

  addTurnStartEventListener() {
    this.removeTurnStartEventListener();
    document.body.addEventListener('mousemove', this.startTurn.bind(this), { once: true });
  }
  removeTurnStartEventListener() {
    document.body.removeEventListener('mousemove', this.startTurn.bind(this));
  }

  gameOver(){
    console.log("Game over");
  }
  // TODO finish abilities
  // TODO end game
  // TODO instructions
  // TODO sounds
}
