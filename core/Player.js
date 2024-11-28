export class Player {
  constructor(side) {
    this.ready = false;
    this.character = null;
    this.currentHP = 0;
    this.strength = 0;
    this.turnTime = 0;
    this.energy = 0;
    this.effectImpact = 0;
    this.score = 0;
    this.side = side;
    this.rest = false;
  }

  setEnergy(){
    const abilityBar = this.side === 1 ? document.getElementById('abilityBarLeft') : document.getElementById('abilityBarRight');
    abilityBar.style.width = `${this.energy}%`;
  }
  gainEnergy(amount){
    this.energy += this.character.stats.energyGain;
    if(this.energy > 100) this.energy = 100;
    this.setEnergy();
  }
  loseEnergy(amount){
    this.energy -= amount;
    if(this.energy < 0) this.energy = 0;
    this.setEnergy();
  }

  setHP() {
    const HPBar = this.side === 1 ? document.getElementById('leftBarHeader') : document.getElementById('rightBarHeader');
    HPBar.style.width = `${this.currentHP}%`;
  }
  gainHP(amount){
    this.currentHP += amount
    if(this.currentHP > 100) this.currentHP = 100;
    this.setHP();
  }
  loseHP(amount){
    this.currentHP -= amount
    if(this.currentHP < 0) this.currentHP = 0;
    this.setHP();
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

