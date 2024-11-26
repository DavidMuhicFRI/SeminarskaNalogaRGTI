
export class Cup {

  static effectColors = {
    time: 'rgba(20, 20, 20, 0.9)', // YES (speeds up time x2)
    reverse: 'rgba(20, 60, 150, 1)', // YES (inverts X and Y on drag ball)
    rotate: 'rgba(20, 200, 100, 1)', // YES (rotates camera)
    energy: 'rgba(180, 180, 20, 0.9)', // YES (decreases energy)
    poison: 'rgba(120, 20, 150, 0.9)', // YES (decreases health periodically)
    weakness: 'rgba(150, 20, 20, 0.9)', // YES (less throw strength)
  };

  constructor(full, side, position, effect, effectiveness) {
    this.full = full;
    this.side = side;
    switch(this.side){
      case 1 :
        this.sideWord = 'left';
        break;
      case 2 :
        this.sideWord = 'right';
        break;
    }
    this.position = position;
    this.effect = effect;
    this.selected = false;
    this.effectiveness = effectiveness;
    this.game = null;
    this.div = document.getElementById(`${this.sideWord}Cup${this.position}`);
    this.color = Cup.effectColors[effect] || 'rgba(20, 20, 20, 0.1)';

    if (this.full) {
      this.div.classList.add('full');
    }

    this.div.addEventListener('click', () => {
      this.handleCupPress();
    });
  }

  colorCup(number) {
    this.div.style.backgroundColor = this.full && number === 1 ? this.color : 'rgba(0, 0, 0, 0)';
  }

  handleCupPress() {
    if (this.side !== this.game.currentPlayer.side) {
      this.div.classList.add('shake'); // Add shake effect to indicate invalid action
      setTimeout(() => {
        this.div.classList.remove('shake');
      }, 300);
      return;
    }
    const selectedCup = this.game.currentPlayer.cups.find(cup => cup.selected);

    if (selectedCup) {
      if (selectedCup !== this) {
        this.moveCup(selectedCup);
      }
      selectedCup.selected = false;
      this.resetCupBorderColors();
    } else {
      this.selected = true;
      this.div.style.borderColor = 'rgba(250, 200, 20, 0.9)'; // Highlight selected cup
      this.colorPossibleMoves();
    }
  }

  moveCup(otherCup) {
    if(!otherCup.full){
      [this.effect, otherCup.effect] = [otherCup.effect, this.effect];
      [this.color, otherCup.color] = [otherCup.color, this.color];
      this.game.displayCups();
    } else {
      this.div.classList.add('shake'); // Add the shake effect
      setTimeout(() => {
        this.div.classList.remove('shake'); // Remove it after animation ends
      }, 300);
    }
    this.resetCupBorderColors();
  }

  colorPossibleMoves() {
    this.game.currentPlayer.cups.forEach((cup) => {
      if (cup !== this) {
        cup.div.style.borderColor = cup.full
          ? 'rgba(200, 20, 20, 0.8)' // Mark occupied cups in red
          : 'rgba(20, 200, 20, 0.8)'; // Mark available cups in green
      }
    });
  }

  resetCupBorderColors() {
    this.game.currentPlayer.cups.forEach((cup) => {
      cup.div.style.borderColor = 'rgba(0, 0, 0, 1)';
    });
  }
}
