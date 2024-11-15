
export class Player {
  constructor() {
    this.ready = false;
    this.character = null;
    this.currentHP = 0;
    this.strength = 0;
    this.energy = 0;
    this.debuffs = [];
    this.score = 0;
    this.cups = [];
  }
  setCups(number){
    switch(number){
      case 1:
        break;
      case 2:
        break;
    }
  }
  setHearts(number){
    const heartsDiv = number === 1
      ? document.getElementById('heartsLeft')
      : document.getElementById('heartsRight');
    heartsDiv.innerHTML = '';

    for (let i = 0; i < this.currentHP; i++) {
      const heart = document.createElement('img');
      heart.src = 'heartImg.png';
      heart.className = 'heartsItem';
      heartsDiv.appendChild(heart);
    }
  }

  setEnergy(number){
    const abilityBar = number === 1
      ? document.getElementById('abilityBarLeft')
      : document.getElementById('abilityBarRight');

    abilityBar.style.width = `${this.energy}%`;
  }

  setHeaderBar(number){

  }

  setStats(){
    this.currentHP = this.character.health;
    this.strength = this.character.strength;
  }

  setCountdown() {
    document.getElementById('countdown').innerText = this.character.turnTime;
  }
}
