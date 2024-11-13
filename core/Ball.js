import { Transform } from "./Transform.js";
import { vec3 } from "../glm.js";

export class Ball {
  constructor(node, doc) {
    this.node = node;
    this.transform = node.getComponentOfType(Transform);
    this.doc = doc;
    this.velocity = [0, 0, 0];
    this.acceleration = 0;
    this.maxSpeed = 1000;
    this.deceleration = 0.9995;
    this.bounces = 0;
    this.bounciness = 0.8;
    this.radius = 0.18;
    this.startPosition = [0, 6.5, -5];
    this.moving = false;
  }

  setStartVelocity(){
    let constant = 0.008;
    //console.log("transform", this.transform.translation);
    //console.log("start:", this.startPosition);
    let diffX = this.transform.translation[0] - this.startPosition[0];
    let diffY = this.transform.translation[1] - this.startPosition[1];
    let diffZ = this.transform.translation[2] - this.startPosition[2];
    this.velocity[0] = -diffX * constant * this.acceleration;
    console.log(this.velocity[0]);
    this.velocity[1] = -diffY * constant * this.acceleration;
    console.log(this.velocity[1]);
    this.velocity[2] = -diffZ * constant * this.acceleration;
    console.log(this.velocity[2]);
  }

  update(t, dt) {
    if(!this.moving){
      return;
    }
    //console.log(this.transform.translation);
    //add gravity to velocity vector
    this.velocity[1] -= 9.8 * dt;
    //decrease velocity by deceleration
    vec3.scale(this.velocity, this.velocity, this.deceleration);
    //limit speed to maxSpeed
    const speed = vec3.length(this.velocity);
    if (speed > this.maxSpeed) {
      vec3.scale(this.velocity, this.velocity, this.maxSpeed / speed);
    }
    //update position
    if (this.transform) {
      vec3.scaleAndAdd(this.transform.translation, this.transform.translation, this.velocity, dt);
    }
  }
}
