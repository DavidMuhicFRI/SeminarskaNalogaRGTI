import { Transform } from "./Transform.js";

export class Game {
  constructor(player1, player2, ball, camera){
    this.player1 = player1;
    this.player2 = player2;
    this.ball = ball;
    this.camera = camera;

    this.currentPlayer = player1;
    this.turn = 1;
    this.ballAngle = 45;
    ball.direction = 0;

    this.turnTime = this.currentPlayer.turnTime;
    this.remainingTime = this.turnTime;
    this.timerInterval = null;
    this.turnStarted = false;
  }

  setUp(){
    document.getElementById('headerNameLeft').innerText = this.player1.character.stats.name;
    document.getElementById('p1Score').innerText = this.player1.score;
    document.getElementById('headerNameRight').innerText = this.player2.character.stats.name;
    document.getElementById('p2Score').innerText = this.player2.score;
    document.getElementById('rightBarHeader').style.width = '50%';
    document.getElementById('leftBarHeader').style.width = '50%';
    this.currentPlayer.setCountdown();
    this.player1.setStats();
    this.player2.setStats();
    this.updatePlayerDivs();
    this.showText();
    this.startPulsingAnimations();
    setTimeout(() => {
      this.startTurn();
    }, 5000);
  }

  updatePlayerDivs(){
    this.player1.generateCups(1);
    this.player2.generateCups(2);
    this.player1.setHearts(1);
    this.player2.setHearts(2);
    this.player1.setEnergy(1);
    this.player2.setEnergy(2);
    this.displayCups(this.player1.cups, this.player2.cups);
  }

  displayCups() {
    const colorValue = this.currentPlayer.character.stats.name === 'TRIPP' ? 1 : 0;
    [this.player1.cups, this.player2.cups].forEach((cupsArray) => {
      cupsArray.forEach((cup) => {
        cup.game = this;
        cup.colorCup(colorValue);
      });
    });
  }

  changePlayerTurn(){
    this.stopPulsingAnimations();
    this.turn++;
    this.currentPlayer = this.currentPlayer === this.player1 ? this.player2 : this.player1;
    this.displayCups(this.player1.cups, this.player2.cups);
    this.turnCamera();
    this.startPulsingAnimations();
    setTimeout(() => {
      this.startTurn();
    }, 4000);
  }

  startTurn(){
    this.startCountdown();
    this.hideText();
  }

  endTurn(){
    this.changePlayerTurn();
    this.resetCountdown();
  }

  turnCamera(){
    let transform = this.camera.getComponentOfType(Transform);
    let eRotation = this.quaternionToEuler(transform.rotation);
    if(this.currentPlayer === this.player2){
      let cameraInterval = setInterval(() => {
        if(transform.translation[2] < 12.6){
          transform.translation[2] += (12.6 * 2) / 200;
          eRotation.pitch += 0.9;
          this.eulerToRotation({ roll: eRotation.roll, pitch: eRotation.pitch, yaw: eRotation.yaw }, transform);
        }else{
          this.showText();
          clearInterval(cameraInterval);
          transform.translation[2] = 12.6;
          this.eulerToRotation({ roll: eRotation.roll, pitch: 180, yaw: eRotation.yaw }, transform);
        }
      }, 10);
    }else {
      let cameraInterval = setInterval(() => {
        if(transform.translation[2] > -12.6){
          transform.translation[2] -= (12.6 * 2) / 200;
          eRotation.pitch -= 0.9;
          this.eulerToRotation({ roll: eRotation.roll, pitch: eRotation.pitch, yaw: eRotation.yaw }, transform);
        }else{
          this.showText();
          clearInterval(cameraInterval);
          transform.translation[2] = -12.6;
          this.eulerToRotation({ roll: eRotation.roll, pitch: -180, yaw: eRotation.yaw }, transform);
        }
      }, 10);
    }
  }

  startPulsingAnimations(){
    let side = this.currentPlayer === this.player1 ? 'left' : 'right';
    let text = this.currentPlayer === this.player1 ? 'PLAYER1' : 'PLAYER2';
    document.getElementById(`${side}BarHeader`).classList.add('pulseColor');
  }
  stopPulsingAnimations(){
    let side = this.currentPlayer === this.player1 ? 'left' : 'right';
    document.getElementById(`${side}BarHeader`).classList.remove('pulseColor');
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

  giveAnotherTurn(){
    //reset the timer and give the ball to the same player
    this.stopCountdown();
    this.startTurn();
  }

  handleCupHit(cup){
    cup.getComponentOfType(Transform).translation = [0, -10, 0];
    console.log(cup.getComponentOfType(Transform).translation);
    this.currentPlayer.score++;
    if(this.currentPlayer.score === 6){
      console.log("Player won");
    }else{
      this.giveAnotherTurn();
    }
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
}
