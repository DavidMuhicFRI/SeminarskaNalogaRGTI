import {Cup} from "./Cup.js";

export class Player {
  constructor(side) {
    this.ready = false;
    this.character = null;
    this.currentHP = 0;
    this.strength = 0;
    this.turnTime = 0;
    this.energy = 0;
    this.debuffs = [];
    this.score = 0;
    this.cups = [];
    this.side = side;
  }

  setHearts(){
    const heartsDiv = this.side === 1
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

  generateCups(){
    let effects = ["darkness", "reverse", "rotate", "energy", "poison", "gravity", "none", "weakness"];
    for(let i = 0; i < 6; i++){
      let randomEffect = Math.floor(Math.random() * (effects.length));
      let randomEffectiveness = 1;
      this.cups[i] = new Cup(true, this.side, i + 1, effects[randomEffect], randomEffectiveness);
    }
  }

  setEnergy(){
    const abilityBar = this.side === 1
      ? document.getElementById('abilityBarLeft')
      : document.getElementById('abilityBarRight');

    abilityBar.style.width = `${this.energy}%`;
  }

  gainEnergy(){
    this.energy += this.character.stats.energyGain;
    if(this.energy > 100) this.energy = 100;
    this.setEnergy();
  }

  setStats(){
    this.currentHP = this.character.stats.health;
    this.strength = this.character.stats.strength;
    this.turnTime = this.character.turnTime;
  }

  setCountdown() {
    document.getElementById('countdown').innerText = this.character.turnTime;
  }
}
