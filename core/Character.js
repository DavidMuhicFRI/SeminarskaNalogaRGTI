export class Character {
  constructor(name) {
    this.object = {};
    switch(name){
      case 'Atlas':
        this.object = {
          name: 'Atlas',
          title: 'the titan',
          funFact: 'thought he was entering a bodybuilding competition',
          health: 10,
          offense: 1.5,
          physicalDefense: 1.5,
          potionResistance: 1.5,
        };
        break;
      case 'Chrono':
        this.object = {
          name: 'Chrono',
          title: 'the one who conquered time',
          funFact: 'has seen dinosaurs in person',
          health: 7,
          offense: 1,
          physicalDefense: 1,
          potionResistance: 1,
        };
        break;
      case 'Curve':
        this.object = {
          name: 'Curve',
          title: 'prodigal general',
          funFact: 'is well versed with "the force"',
          health: 8,
          offense: 1.5,
          physicalDefense: 1.5,
          potionResistance: 1,
        };
        break;
      case 'EVO':
        this.object = {
          name: 'EVO',
          title: 'mechanical evolution',
          funFact: 'has integrated battery of an old iPhone',
          health: 8,
          offense: 1,
          physicalDefense: 1.5,
          potionResistance: 1,
        };
        break;
      case 'Nero':
        this.object = {
          name: 'Nero',
          title: 'the demon girl',
          funFact: 'has crippling social anxiety',
          health: 5,
          offense: 1.5,
          physicalDefense: 1,
          potionResistance: 0.75,
        };
        break;
      case 'Spring':
        this.object = {
          name: 'Spring',
          title: 'the bouncy princess',
          funFact: 'ate the Spring-Spring fruit',
          health: 6,
          offense: 1.5,
          physicalDefense: 1,
          potionResistance: 0.75,
        };
        break;
      case 'Tripp':
        this.object = {
          name: 'Tripp',
          title: 'the mad alchemist',
          funFact: 'cosplays as captain-hook for halloween',
          health: 6,
          offense: 1.5,
          physicalDefense: 0.75,
          potionResistance: 0.75,
        };
        break;
    }
  }
}
