import { Transform } from "./Transform.js";

export class Character {
  constructor(node, name) {
    this.node = node;
    this.transform = node.getComponentOfType(Transform);
    this.turnTime = 20;
    switch(name) {
      case 'Atlas':
        this.stats = {
          name: name.toUpperCase(),
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
          energyGain: 35,
          scale: [0.85, 0.96, 0.85],
          reference: 'AtlasObject',
          iconImage: 'atlasIcon.png',
          abilityImage: 'atlasAbility.png'
        }
        break;
      case 'Curve':
        this.stats = {
          name: name.toUpperCase(),
          title: 'Legendary space general',
          difficulty: 8,
          offense: 8,
          defense: 4,
          playstyle: 'MANIPULATOR',
          plusPassive: 'Can set room\'s gravity',
          minusPassive: 'Gets energy based on how long the ball is in the air before touching anything',
          abilityText: '(THE FORCE) can curve his throw by pressing "space" and dragging the mouse, drains energy depending on usage time',
          funFact: 'Fun-fact: likes to cosplay as batman',
          health: 8,
          strength: 1.2,
          energyGain: 40,
          scale: [1.05, 1.05, 1.05],
          reference: 'CurveObject',
          iconImage: 'curveIcon.png',
          abilityImage: 'curveAbility.png'
        }
        break;
      case 'Nero':
        this.stats = {
          name: name.toUpperCase(),
          title: 'The demon girl',
          difficulty: 8,
          offense: 7,
          defense: 4,
          playstyle: 'CASTER',
          plusPassive: 'Can steal the enemy\'s energy by scoring cups or health by hitting opponent',
          minusPassive: 'If she loses all HP she gains a random de-buff',
          abilityText: '(TRANSFUSION) can transfer her energy to health and reduce de-buff effects',
          funFact: 'Fun-fact: has crippling social anxiety',
          health: 5,
          strength: 1,
          energyGain: 35,
          scale: [1.1, 1.1, 1.1],
          reference: 'NeroObject',
          iconImage: 'neroIcon.png',
          abilityImage: 'neroAbility.png'
        }
        break;
      case 'Spring':
        this.stats = {
          name: name.toUpperCase(),
          title: 'The pink princess',
          difficulty: 6,
          offense: 4,
          defense: 5,
          playstyle: 'MANIPULATOR',
          plusPassive: 'Can set the bounciness of the ball',
          minusPassive: 'Only gets energy with ball bounces',
          abilityText: '(BULLET) Throws an extra bouncy ball that speeds up with each bounce',
          funFact: 'Fun-fact: can dunk on LeBron',
          health: 6,
          strength: 0.8,
          energyGain: 0,
          scale: [1.1, 1.1, 1.1],
          reference: 'SpringObject',
          iconImage: 'springIcon.png',
          abilityImage: 'springAbility.png'
        }
        break;
      case 'Tripp':
        this.stats = {
          name: name.toUpperCase(),
          title: 'The Eccentric',
          difficulty: 9,
          offense: 7,
          defense: 3,
          playstyle: 'STRATEGIST',
          plusPassive: 'Sees what potion is in every cup, can change cup position unlimited times',
          minusPassive: 'Potions effect him 1.5x more',
          abilityText: '(SOUL SWAP) Can switch his de-buffs and health with the enemy\'s',
          funFact: 'Fun-fact: can smell colors',
          health: 6,
          strength: 1,
          energyGain: 35,
          scale: [1.1, 1.1, 1.1],
          reference: 'TrippObject',
          iconImage: 'trippIcon.png',
          abilityImage: 'trippAbility.png'
        }
        break;
    }
  }

  applyScale(){
    this.transform.scale = this.stats.scale;
  }
}
