export class Game {
  constructor(player1, player2, ball){
    this.player1 = player1;
    this.player2 = player2;
    this.ball = ball;

    this.currentPlayer = player1;
    this.turn = 1;
    this.ballAngle = 45;
    ball.direction = 0;
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
    this.displayCups(this.player1.cups, this.player2.cups);
  }

  updatePlayerDivs(){
    this.player1.generateCups(1);
    this.player2.generateCups(2);
    this.player1.setHearts(1);
    this.player2.setHearts(2);
    this.player1.setEnergy(1);
    this.player2.setEnergy(2);
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

  startTurn(player){

  }
  endTurn(player){

  }
}
