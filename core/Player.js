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
    this.energy += amount;
    if(this.energy > 100) this.energy = 100;
    this.setEnergy();
  }
  loseEnergy(amount){
    this.energy -= amount;
    if(this.energy < 0) this.energy = 0;
    this.setEnergy();
  }

  setEffect() {
    let effects = document.getElementsByClassName("hurtDiv");
    for (let effect of effects) {
      effect.style.opacity = `${1 - (this.currentHP / this.character.stats.health)}`;
    }
  }

  setHP(minusOrPlus) {
    const HPBar = this.side === 1 ? document.getElementById('leftBarHeader') : document.getElementById('rightBarHeader');
    const HPContainer = this.side === 1 ? document.getElementById('headerBarContainerLeft') : document.getElementById('headerBarContainerRight');
    HPBar.style.width = `${(this.currentHP / this.character.stats.health) * 100}%`;

    if(minusOrPlus === -1) {
      HPContainer.classList.add('loseHP');
    } else {
      HPContainer.classList.add('gainHP');
    }
    setTimeout(() => HPContainer.classList.remove('loseHP', 'gainHP'), 500);
  }
  gainHP(amount){
    this.currentHP += amount
    if(this.currentHP > 100) this.currentHP = 100;
    this.setHP(1);
  }
  loseHP(amount){
    this.currentHP -= amount
    if(this.currentHP < 0) this.currentHP = 0;
    this.setHP(-1);
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

