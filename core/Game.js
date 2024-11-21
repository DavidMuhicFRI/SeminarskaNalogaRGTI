export class Game {
  constructor(player1, player2, ball){
    this.player1 = player1;
    this.player2 = player2;
    this.ball = ball;

    this.currentPlayer = player1;
    this.turn = 1;
    this.ballAngle = 45;
    ball.direction = 0;

    this.turnTime = this.currentPlayer.turnTime;
    this.remainingTime = this.turnTime;
    this.timerInterval = null;
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
    this.startTurn();
  }

  updatePlayerDivs(){
    this.player1.generateCups(1);
    this.player2.generateCups(2);
    this.player1.setHearts(1);
    this.player2.setHearts(2);
    this.player1.setEnergy(1);
    this.player2.setEnergy(2);
    this.displayCups(this.player1.cups, this.player2.cups);
    this.startPulsingAnimations();
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

  changePlayerTun(){
    this.turn++;
    this.currentPlayer = this.currentPlayer === this.player1 ? this.player2 : this.player1;
    this.displayCups(this.player1.cups, this.player2.cups);
    // TODO turnCamera();
  }

  startTurn(){
    this.stopPulsingAnimations();
    this.startCountdown();
  }
  endTurn(){
    this.changePlayerTun();
  }

  turnCamera(){
    // TODO
    // kamera se zamenja in po tem ko se zamenja, se da pulsing animacije
    this.startPulsingAnimations();
  }

  startPulsingAnimations(){
    let side = this.currentPlayer === this.player1 ? 'left' : 'right';
    let text = this.currentPlayer === this.player1 ? 'PLAYER1' : 'PLAYER2';
    document.getElementById(`${side}BarHeader`).classList.add('pulseColor');
    let textDiv = document.getElementById('currentPlayerText');
    textDiv.innerText = `READY ${text}`;
    textDiv.style.visibility = 'visible';
  }
  stopPulsingAnimations(){
    let side = this.currentPlayer === this.player1 ? 'left' : 'right';
    document.getElementById(`${side}BarHeader`).classList.remove('pulseColor');
    document.getElementById('currentPlayerText').style.visibility = 'hidden';
  }

  startCountdown() {
    this.stopCountdown();
    document.getElementById('countdown').style.backgroundColor = 'yellow';
    this.remainingTime = this.currentPlayer.turnTime;
    let countdownDiv = document.getElementById('countdown');

    this.timerInterval = setInterval(() => {
      if (this.remainingTime > 0) {
        this.remainingTime--;
        countdownDiv.innerText = this.remainingTime;
        if(this.remainingTime <= 5){
          countdownDiv.style.backgroundColor = 'red';
        }
      } else {
        this.stopCountdown();
        // this.endTurn();
      }
    }, 1000);
  }

  stopCountdown() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
