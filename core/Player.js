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

  //sets the energy bar
  setEnergy(){
    const abilityBar = this.side === 1 ? document.getElementById('abilityBarLeft') : document.getElementById('abilityBarRight');
    const abilityIcon = this.side === 1 ? document.getElementById('leftAbilityIcon') : document.getElementById('rightAbilityIcon');
    const abilityStar = this.side === 1 ? document.getElementById('leftAbilityStar') : document.getElementById('rightAbilityStar');
    abilityBar.style.width = `${this.energy}%`;
    if(this.character.stats.name === "ATLAS" || this.character.stats.name === "SPRING" || this.character.stats.name === "TRIPP"){
      if(this.energy >= 100){
        abilityStar.style.visibility = 'visible';
      } else {
        abilityStar.style.visibility = 'hidden';
      }
      abilityIcon.style.filter = `grayScale(${100 - this.energy}%)`;
    } else {
      if(this.energy >= this.character.stats.minCastEnergy){
        abilityStar.style.visibility = 'visible';
        abilityIcon.style.filter = `grayScale(0%)`;
      } else {
        abilityStar.style.visibility = 'hidden';
        abilityIcon.style.filter = `grayScale(100%)`;
      }
    }
  }
  //increases energy
  gainEnergy(amount){
    this.energy += amount;
    if(this.energy > 100) this.energy = 100;
    this.setEnergy();
  }
  //decreases energy
  loseEnergy(amount){
    this.energy -= amount;
    if(this.energy < 0) this.energy = 0;
    this.setEnergy();
  }

  //sets an effect depending on character HP
  setEffect() {
    let effects = document.getElementsByClassName("hurtDiv");
    for (let effect of effects) {
      effect.style.opacity = `${1 - (this.currentHP / this.character.stats.health)}`;
    }
  }

  //sets the HP bar
  setHP(minusOrPlus) {
    const HPBar = this.side === 1 ? document.getElementById('leftBarHeader') : document.getElementById('rightBarHeader');
    const HPContainer = this.side === 1 ? document.getElementById('headerBarContainerLeft') : document.getElementById('headerBarContainerRight');
    HPBar.style.width = `${(this.currentHP / this.character.stats.health) * 100}%`;

    if(minusOrPlus === -1) {
      HPContainer.classList.add('loseHP');
      setTimeout(() => HPContainer.classList.remove('loseHP'), 500);
    } else if(minusOrPlus === 1) {
      HPContainer.classList.add('gainHP');
      setTimeout(() => HPContainer.classList.remove('gainHP'), 500);
    }
  }
  //increases current HP
  gainHP(amount){
    this.currentHP += amount
    if(this.currentHP > 100) this.currentHP = 100;
    this.setHP(1);
  }
  //decreases current HP
  loseHP(amount){
    this.currentHP -= amount
    if(this.currentHP < 0) this.currentHP = 0;
    this.setHP(-1);
  }

  //sets the character's stats in the beggining of the game
  setStats(){
    this.currentHP = this.character.stats.health;
    this.strength = this.character.stats.strength;
    this.turnTime = this.character.turnTime;
    this.setEnergy();
    this.setHP(0);
  }

  //sets the countdown timer
  setCountdown() {
    document.getElementById('countdown').innerText = this.character.turnTime;
  }
}

