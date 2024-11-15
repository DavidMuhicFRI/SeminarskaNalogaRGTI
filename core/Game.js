export class Game {
  constructor(player1, player2, ball){
    this.turnTime = 20;
    this.player1 = player1;
    this.player2 = player2;
    this.currentPlayer = player1;
    this.turn = 1;
    this.ball = ball;
    this.ballAngle = 45;
    ball.direction = 0;
  }

  setUp(){
    document.getElementById('headerNameLeft').innerText = this.player1.character.name;
    document.getElementById('p1Score').innerText = this.player1.score;
    document.getElementById('leftBarHeader').style.width = '50%';
    document.getElementById('headerNameRight').innerText = this.player2.character.name;
    document.getElementById('p2Score').innerText = this.player2.score;
    document.getElementById('rightBarHeader').style.width = '50%';
    this.currentPlayer.setCountdown();
    this.player1.setStats();
    this.player2.setStats();
    this.updatePlayerDivs();
  }

  updatePlayerDivs(){
    this.player1.setCups(1);
    this.player2.setCups(2);
    this.player1.setHearts(1);
    this.player2.setHearts(2);
    this.player1.setEnergy(1);
    this.player2.setEnergy(2);
  }

  startTurn(player){

  }
  endTurn(player){

  }
}
