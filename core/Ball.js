import { Transform } from "./Transform.js";
import { vec3 } from "../glm.js";

export class Ball {
  constructor(node) {
    this.node = node;
    this.velocity = [0, 0, 0];
    this.acceleration = 10;
    this.maxSpeed = 50;
    this.deceleration = 0.995;
    this.bounces = 0;
    this.bounciness = 0.95;
    this.gravity = 9.81;
    this.radius = 0.18;
    this.startPosition = null;
    this.moving = false;
  }

  setStartVelocity(){
    this.velocity = [0, 0, 0];
    let diffX = this.node.getComponentOfType(Transform).translation[0] - this.startPosition[0];
    let diffY = this.node.getComponentOfType(Transform).translation[1] - this.startPosition[1];
    let diffZ = this.node.getComponentOfType(Transform).translation[2] - this.startPosition[2];
    this.velocity[0] = -diffX * this.acceleration;
    console.log(this.velocity[0]);
    this.velocity[1] = -diffY * this.acceleration;
    console.log(this.velocity[1]);
    this.velocity[2] = -diffZ * this.acceleration;
    console.log(this.velocity[2]);
  }

  reset(){
    this.velocity = [0, 0, 0];
    this.bounces = 0;
    this.moving = false;
  }

  resetPlayer1(){
    this.node.getComponentOfType(Transform).translation = [0, 7.5, -7.1];
    this.startPosition = [0, 7.5, -7.1];
  }

  resetPlayer2(){
    this.node.getComponentOfType(Transform).translation = [0, 7.5, 7.1];
    this.startPosition = [0, 7.5, 7.1];
  }

  update(t, dt) {
    if(!this.moving){
      return;
    }
    //add gravity to velocity vector
    this.velocity[1] -= this.gravity * dt;
    //decrease velocity by deceleration
    vec3.scale(this.velocity, this.velocity, this.deceleration);

    //clamp velocity to max speed
    if (vec3.length(this.velocity) > this.maxSpeed) {
      vec3.normalize(this.velocity, this.velocity);
      vec3.scale(this.velocity, this.velocity, this.maxSpeed);
    }

    this.node.getComponentOfType(Transform).translation[0] += this.velocity[0] * dt;
    this.node.getComponentOfType(Transform).translation[1] += this.velocity[1] * dt;
    this.node.getComponentOfType(Transform).translation[2] += this.velocity[2] * dt;
  }
}
