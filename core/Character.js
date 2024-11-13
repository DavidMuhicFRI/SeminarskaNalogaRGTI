import { Transform } from "./Transform.js";

export class Character {
  constructor(node) {
    this.node = node;
    this.transform = node.getComponentOfType(Transform);
    this.maxHP = 100;
    this.power = 10;
  }

}
