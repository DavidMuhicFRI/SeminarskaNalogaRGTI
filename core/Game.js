import { Transform } from "./Transform.js";

export class Game {
  constructor(player1, player2, ball, camera, canvas){
    this.player1 = player1;
    this.player2 = player2;
    this.currentPlayer = player1;

    this.ball = ball;
    this.camera = camera;
    this.canvas = canvas;

    this.cameraShakeInterval = null;
    this.ballShakeInterval = null;

    this.turnTime = this.currentPlayer.turnTime;
    this.remainingTime = this.turnTime;
    this.timerInterval = null;
    this.turnStarted = false;
  }

  setUp(){
    document.getElementById('rightBarHeader').style.width = '102%';
    document.getElementById('leftBarHeader').style.width = '102%';
    document.getElementById('leftIconImg').src = this.player1.character.stats.iconImage;
    document.getElementById('rightIconImg').src = this.player2.character.stats.iconImage;
    this.currentPlayer.setCountdown();
    this.player1.setStats();
    this.player2.setStats();
    this.updatePlayerDivs();
    this.showText();
    this.startPulsingAnimations();
    this.addTurnStartEventListener();
    this.resetBall();
  }
  updatePlayerDivs(){
    this.player1.setEnergy();
    this.player2.setEnergy();
  }

  changePlayerTurn(){
    this.stopPulsingAnimations();
    this.currentPlayer = this.currentPlayer === this.player1 ? this.player2 : this.player1;
    if(this.currentPlayer.rest){
      this.currentPlayer.rest = false;
      this.endTurn();
      return;
    }
    this.turnCamera();
    console.log(this.quaternionToEuler(this.camera.getComponentOfType(Transform).rotation))
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
      this.hideText();
      this.turnStarted = true;
    }
  }
  endTurn(){
    this.turnStarted = false;
    this.changePlayerTurn();
    this.stopCupEffects();
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
    let eRotation = this.quaternionToEuler(transform.rotation);
    if(this.currentPlayer === this.player2){
      let cameraInterval = setInterval(() => {
        if(eRotation.pitch < 180){
          transform.translation[2] += (12.6 * 2) / 200;
          eRotation.pitch += 0.9;
          this.eulerToRotation({ roll: eRotation.roll, pitch: eRotation.pitch, yaw: eRotation.yaw }, transform);
        }else{
          this.showText();
          this.addTurnStartEventListener();
          clearInterval(cameraInterval);
          transform.translation[2] = 12.6;
          eRotation.yaw = eRotation.yaw < 0 ? -164.965 : 15.035;
          eRotation.pitch = 180;
          this.eulerToRotation(eRotation, transform);
        }
      }, 10);
    }else{
      eRotation.pitch = 0;
      let cameraInterval = setInterval(() => {
        if(eRotation.pitch > -180){
          transform.translation[2] -= (12.6 * 2) / 200;
          eRotation.pitch -= 0.9;
          this.eulerToRotation({ roll: eRotation.roll, pitch: eRotation.pitch, yaw: eRotation.yaw }, transform);
        }else{
          this.showText();
          this.addTurnStartEventListener();
          clearInterval(cameraInterval);
          transform.translation[2] = -12.6;
          eRotation.yaw = eRotation.yaw < 0 ? -164.665 : 15.335
          eRotation.pitch = -180;
          this.eulerToRotation(eRotation, transform);
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
  }
  throwBall(){
    this.ball.startPosition = this.currentPlayer === this.player1 ? [0, 7.5, -7.1] : [0, 7.5, 7.1];
    this.ball.setStartVelocity();
    this.ball.moving = true;
    this.ball.isGrabbed = false;
  }
  grabBall(){
    this.ball.isGrabbed = true;
    this.ball.moving = false;
    this.ball.scale = [0.18, 0.18, 0.18];
    this.stopPulsingAnimations();
  }
  stopBall(){
    this.resetBall();
    this.endTurn();
  }

  otherPlayer(){
    return this.currentPlayer === this.player1 ? this.player2 : this.player1;
  }

  activateAbility(){
    if(this.currentPlayer.energy > 0){
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
    this.currentPlayer.energy = 0;
    this.currentPlayer.setEnergy();
    let currentHP = this.currentPlayer.currentHP;
    this.currentPlayer.currentHP = this.otherPlayer().currentHP;
    this.otherPlayer().currentHP = currentHP;
    let debuffs = this.currentPlayer.debuffs;
    this.currentPlayer.debuffs = this.otherPlayer().debuffs;
    this.otherPlayer().debuffs = debuffs;
  }
  activateAtlasAbility(){
    this.currentPlayer.energy = 0;
    this.currentPlayer.setEnergy();
    this.ball.effect = 'atlasEffect';
  }
  activateCurveAbility(event){
    if(!event){
      return;
    }
    this.currentPlayer.energy -= 1;
    this.currentPlayer.setEnergy();
    let dx = event.movementX;
    let direction = dx > 0 ? 1 : -1;
    let adjustment = Math.min(0.05, Math.abs(dx) * 0.01);
    console.log(adjustment);
    if(this.currentPlayer === this.player1){
      this.ball.velocity[0] -= adjustment * direction;
    }else{
      this.ball.velocity[0] += adjustment * direction;
    }
  }
  activateNeroAbility(){
    this.currentPlayer.energy -= 1;
    this.currentPlayer.setEnergy();
    this.currentPlayer.effectImpact *= 0.95;
    this.currentPlayer.currentHP += 1;
  }
  activateSpringAbility(){
    this.currentPlayer.energy = 0;
    this.currentPlayer.setEnergy();
    this.ball.effect = 'springEffect';
    this.ball.bounciness = 1.5;
  }

  handleCupHit(cup){
    cup.getComponentOfType(Transform).translation = [0, -10, 0];
    this.currentPlayer.score++;
    this.otherPlayer().effectImpact += 1;
    if(this.currentPlayer.character.stats.name === 'NERO'){
      this.currentPlayer.energy += 33;
    }
    if(this.currentPlayer.score === 6){
      console.log("Player won");
    }else{
      this.giveAnotherTurn();
    }
  }


  handleObjectHit(){
    let otherPlayer = this.otherPlayer();
    let damage = this.getBallSpeed() * this.currentPlayer.character.stats.strength;
    otherPlayer.currentHP -= damage;
    if(this.currentPlayer.character.stats.name === 'NERO'){
      this.currentPlayer.currentHP += damage / 2;
    }
    if(otherPlayer.currentHP <= 0){
      otherPlayer.currentHP = this.otherPlayer().character.stats.health / 2;
      otherPlayer.rest = true;
    }
    this.endTurn();
  }
  handleBounce(){
    this.ball.bounces++;
    //TODO: add bouncing sound and display bounce count, add spring energy (and others)
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
    let eRotation = this.quaternionToEuler(transform.rotation);
    let minus = Math.random() > 0.5 ? -1 : 1;
    let randomYawRotation = minus * Math.random() * 0.005 * this.currentPlayer.effectImpact;
    let randomPitchRotation = minus * Math.random() * 0.005 * this.currentPlayer.effectImpact;
    for (let i = 0; i < 100; i++) {
      setTimeout(() => {
        eRotation.yaw += randomYawRotation;
        eRotation.pitch += randomPitchRotation;
        this.eulerToRotation(eRotation, transform);
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
  quaternionToEuler(q) {
    let w = q[0];
    let x = q[1];
    let y = q[2];
    let z = q[3];
    // Compute Euler angles in radians
    const roll = Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y)); // X-axis rotation
    const pitch = Math.asin(2 * (w * y - z * x)); // Y-axis rotation
    const yaw = Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z)); // Z-axis rotation

    // Convert radians to degrees
    const radToDeg = 180 / Math.PI;
    return {
      roll: roll * radToDeg,
      pitch: pitch * radToDeg,
      yaw: yaw * radToDeg,
    };
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
  // TODO drunk effects
  // TODO HP, energy
  // TODO finish abilities
  // TODO end game
  // TODO instructions
  // TODO sounds
}
