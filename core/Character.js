import { Transform } from "./Transform.js";

export class Character {
  constructor(node, name) {
    this.node = node;
    this.transform = node.getComponentOfType(Transform);
    this.transform.rotation = [0, 0.707, 0, -0.707]; //fixing rotation
    switch(name) {
      case 'Atlas':
        this.stats = {
          name: name,
          title: 'The titan',
          difficulty: 3,
          offense: 8,
          defense: 8,
          playstyle: 'BULLY',
          plusPassive: 'Increased throw strength, body hits apply bleeding vision',
          minusPassive: 'Is bald and too strong',
          abilityText: '(MEGA BALL) Next ball deals extra damage if it hits the enemy',
          funFact: 'Fun-fact: he thought he entered a bodybuilding competition',
          health: 10,
          strength: 1.5,
          scale: [0.8, 0.9, 0.8],
          reference: 'AtlasObject',
          abilityImage: 'atlasAbility.png'
        }
        break;
      case 'Chrono':
        this.stats = {
          name: name,
          title: 'The one who conquered time',
          difficulty: 4,
          offense: 5,
          defense: 6,
          playstyle: 'CASTER',
          plusPassive: 'Gains extra energy based on time left at round end',
          minusPassive: 'Turn time reduced by half',
          abilityText: '(REWIND) Can rewind time 10seconds back',
          funFact: 'Fun-fact: is still late to work',
          health: 7,
          strength: 1,
          scale: [1, 1, 1],
          reference: 'ChronoObject',
          abilityImage: 'chronoAbility.png'
        }
        break;
      case 'Curve':
        this.stats = {
          name: name,
          title: 'Legendary space general',
          difficulty: 7,
          offense: 7,
          defense: 5,
          playstyle: 'MANIPULATOR',
          plusPassive: 'Can set room\'s gravity',
          minusPassive: 'Gets energy based on how long the ball is in the air before touching anything',
          abilityText: '(THE FORCE) can curve his throw by pressing "space" and dragging the mouse, drains energy depending on usage time',
          funFact: 'Fun-fact: likes to cosplay as batman',
          health: 8,
          strength: 1.2,
          scale: [1.1, 1.1, 1.1],
          reference: 'CurveObject',
          abilityImage: ''
        }
        break;
      case 'Nero':
        this.stats = {
          name: name,
          title: 'The demon girl',
          difficulty: 8,
          offense: 7,
          defense: 4,
          playstyle: 'CASTER',
          plusPassive: 'Can steal the enemy\'s energy by scoring cups or health by hitting opponent',
          minusPassive: 'If she loses all HP she gains a random de-buff',
          abilityText: '(TRANSFUSION) can transfer her energy to health',
          funFact: 'Fun-fact: has crippling social anxiety',
          health: 5,
          strength: 1,
          scale: [1.2, 1.2, 1.2],
          reference: 'NeroObject',
          abilityImage: ''
        }
        break;
      case 'Spring':
        this.stats = {
          name: name,
          title: 'The pink princess',
          difficulty: 5,
          offense: 4,
          defense: 5,
          playstyle: 'MANIPULATOR',
          plusPassive: 'Can set the bounciness of the ball',
          minusPassive: 'Only gets energy with ball bounces',
          abilityText: '(BULLET) Throws an extra bouncy ball that speeds up with each bounce',
          funFact: 'Fun-fact: can dunk on LeBron',
          health: 6,
          strength: 0.8,
          scale: [1.2, 1.2, 1.2],
          reference: 'SpringObject',
          abilityImage: ''
        }
        break;
      case 'Tripp':
        this.stats = {
          name: name,
          title: 'The Eccentric',
          difficulty: 10,
          offense: 7,
          defense: 3,
          playstyle: 'STRATEGIST',
          plusPassive: 'Sees what potion is in every cup, can change cup position unlimited times',
          minusPassive: 'Potions effect him 1.5x more',
          abilityText: '(SOUL SWAP) Can switch his de-buffs and health with the enemy\'s',
          funFact: 'Fun-fact: can smell colors',
          health: 6,
          strength: 1,
          scale: [1.1, 1.1, 1.1],
          reference: 'TrippObject',
          abilityImage: ''
        }
        break;
    }
  }

  applyScale(){
    this.transform.scale = this.stats.scale;
  }
}
