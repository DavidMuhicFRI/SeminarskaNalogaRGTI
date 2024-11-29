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
          offense: 9,
          defense: 9,
          playstyle: 'BULLY',
          plusPassive: 'Increased throw strength',
          minusPassive: 'Is bald',
          abilityText: '(K.O. BALL) Next ball deals extra damage and knocks enemy out if it hits them before touching the ground',
          funFact: 'Fun-fact: he thought he entered a bodybuilding competition',
          health: 100,
          strength: 1.2,
          energyGainTurn: 13,
          energyGainCup: 10,
          minCastEnergy: 100,
          scale: [0.85, 0.96, 0.85],
          reference: 'AtlasObject',
          iconImage: 'atlasIcon.png',
          abilityImage: 'atlasAbility.png',
          starImage: 'abilityStarImgYellow.png',
          starImageAnimation: 'rotate 5s linear infinite',
          lever: 'none'
        }
        break;
      case 'Curve':
        this.stats = {
          name: name.toUpperCase(),
          title: 'Legendary space general',
          difficulty: 8,
          offense: 8,
          defense: 3,
          playstyle: 'MANIPULATOR',
          plusPassive: 'Can set room\'s gravity',
          minusPassive: 'Can\'t throw straight',
          abilityText: '(THE FORCE) can curve his throw by pressing "SPACE" and dragging the mouse horizontally',
          funFact: 'Fun-fact: likes to cosplay as batman',
          health: 70,
          strength: 1.1,
          energyGainTurn: 10,
          energyGainCup: 8,
          minCastEnergy: 1,
          scale: [1.05, 1.05, 1.05],
          reference: 'CurveObject',
          iconImage: 'curveIcon.png',
          abilityImage: 'curveAbility.png',
          starImage: 'abilityStarImgRed.png',
          starImageAnimation: 'none',
          lever: 'flex'
        }
        break;
      case 'Nero':
        this.stats = {
          name: name.toUpperCase(),
          title: 'The demon girl',
          difficulty: 8,
          offense: 6,
          defense: 8,
          playstyle: 'CASTER',
          plusPassive: 'Can steal the enemy\'s energy by scoring cups and health by hitting them',
          minusPassive: 'Takes more damage from body hits',
          abilityText: '(TRANSFUSION) can transfer her energy to health to reduce dizziness',
          funFact: 'Fun-fact: has crippling social anxiety',
          health: 60,
          strength: 0.9,
          energyGainTurn: 10,
          energyGainCup: 12,
          minCastEnergy: 1,
          scale: [1.1, 1.1, 1.1],
          reference: 'NeroObject',
          iconImage: 'neroIcon.png',
          abilityImage: 'neroAbility.png',
          starImage: 'abilityStarImgRed.png',
          starImageAnimation: 'none',
          lever: 'flex'
        }
        break;
      case 'Spring':
        this.stats = {
          name: name.toUpperCase(),
          title: 'The pink princess',
          difficulty: 9,
          offense: 7,
          defense: 5,
          playstyle: 'MANIPULATOR',
          plusPassive: 'Can set the bounciness of the ball',
          minusPassive: 'Gets less energy per turn but additional energy and HP per bounce',
          abilityText: '(BULLET) Throws an extra bouncy ball that speeds up with each bounce',
          funFact: 'Fun-fact: can dunk on LeBron',
          health: 70,
          strength: 0.9,
          energyGainTurn: 10,
          energyGainCup: 10,
          minCastEnergy: 100,
          scale: [1.1, 1.1, 1.1],
          reference: 'SpringObject',
          iconImage: 'springIcon.png',
          abilityImage: 'springAbility.png',
          starImage: 'abilityStarImgYellow.png',
          starImageAnimation: 'rotate 5s linear infinite',
          lever: 'none'
        }
        break;
      case 'Tripp':
        this.stats = {
          name: name.toUpperCase(),
          title: 'The Eccentric',
          difficulty: 7,
          offense: 4,
          defense: 9,
          playstyle: 'STRATEGIST',
          plusPassive: 'Opponent loses HP when Tripp hits their cup and heals when the opponent hits his',
          minusPassive: 'Drinks are more effective on Tripp',
          abilityText: '(SOUL SWAP) Switches his dizziness with the enemy\'s',
          funFact: 'Fun-fact: smokes 3 packs a day',
          health: 75,
          strength: 0.9,
          energyGainTurn: 20,
          energyGainCup: 10,
          minCastEnergy: 100,
          scale: [1.1, 1.1, 1.1],
          reference: 'TrippObject',
          iconImage: 'trippIcon.png',
          abilityImage: 'trippAbility.png',
          starImage: 'abilityStarImgYellow.png',
          starImageAnimation: 'rotate 5s linear infinite',
          lever: 'none'
        }
        break;
    }
  }

  applyScale(){
    this.transform.scale = this.stats.scale;
  }
}
