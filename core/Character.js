import { Transform } from "./Transform.js";

export class Character {
  constructor(node) {
    this.node = node;
    this.transform = node.getComponentOfType(Transform);
    this.introHeight = 0;
    this.introScale = [];
    this.gameHeight = 0;
    this.gameScale = [];
    this.maxHP = 100;
    this.power = 10;
  }

  setParameters(intro){
    if(intro){
      this.transform.translation[2] = this.introHeight;
      this.transform.scale = this.introScale;
    }else{
      this.transform.translation[2] = this.gameHeight;
      this.transform.scale = this.gameScale;
    }
  }
}
