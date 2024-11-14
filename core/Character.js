import { Transform } from "./Transform.js";

export class Character {
  constructor(node, name) {
    this.node = node;
    this.transform = node.getComponentOfType(Transform);
    this.displayed = false;
    switch(name) {
      case 'Atlas':
        this.stats = {
          name: name,
          title: 'The titan',
          funFact: 'thought he entered a bodybuilding competition',
          difficulty: 3,
          offense: 8,
          defense: 8,
          health: 10,
          strength: 1.5,
          playstyle: 'bully',
          scale: [0.8, 0.9, 0.8],
          reference: 'AtlasObject'
        }
        break;
      case 'Chrono':
        this.stats = {
          name: name,
          title: 'The one who conquered time',
          funFact: 'still late to work',
          difficulty: 4,
          offense: 5,
          defense: 6,
          health: 7,
          strength: 1,
          playstyle: 'caster',
          scale: [1, 1, 1],
          reference: 'ChronoObject'
        }
        break;
      case 'Curve':
        this.stats = {
          name: name,
          title: 'Legendary space general',
          funFact: 'likes to cosplay as batman',
          difficulty: 7,
          offense: 7,
          defense: 5,
          health: 8,
          strength: 1.2,
          playstyle: 'manipulator',
          scale: [1.1, 1.1, 1.1],
          reference: 'CurveObject'
        }
        break;
      case 'Nero':
        this.stats = {
          name: name,
          title: 'The demon girl',
          funFact: 'has crippling social anxiety',
          difficulty: 8,
          offense: 7,
          defense: 4,
          health: 5,
          strength: 1,
          playstyle: 'caster',
          scale: [1.2, 1.2, 1.2],
          reference: 'NeroObject'
        }
        break;
      case 'Spring':
        this.stats = {
          name: name,
          title: 'The pink princess',
          funFact: 'can dunk on LeBron',
          difficulty: 5,
          offense: 4,
          defense: 5,
          health: 6,
          strength: 0.8,
          playstyle: 'manipulator',
          scale: [1.2, 1.2, 1.2],
          reference: 'SpringObject'
        }
        break;
      case 'Tripp':
        this.stats = {
          name: name,
          title: 'The Eccentric',
          funFact: 'can smell colors',
          difficulty: 10,
          offense: 7,
          defense: 3,
          health: 6,
          strength: 1,
          playstyle: 'strategist',
          scale: [1.1, 1.1, 1.1],
          reference: 'TrippObject'
        }
        break;
    }
  }
}
