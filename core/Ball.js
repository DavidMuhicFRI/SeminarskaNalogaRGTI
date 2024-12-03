import { Transform } from "./Transform.js";
import { vec3 } from "../glm.js";

export class Ball {
  constructor(node) {
    this.node = node;
    this.transform = node.getComponentOfType(Transform);
    this.velocity = [0, 0, 0];
    this.acceleration = 10;
    this.maxSpeed = 100;
    this.deceleration = 0.995;
    this.bounces = 0;
    this.bounciness = 0.85;
    this.gravity = 9.81;
    this.radius = 0.18;
    this.startPosition = null;
    this.moving = false;
    this.isGrabbed = false;
    this.effect = null;
    this.blinking = false;
    this.shrinking = false;
    this.thrower = null;
    this.lastBounceNode = null;
    this.lastBounceType = null;
  }

  blink(){
    if(!this.isGrabbed && !this.moving){
      if(this.transform.scale[0] < 0.22 && !this.shrinking){
        this.transform.scale = this.transform.scale.map(x => x + 0.002);
      }else if(this.transform.scale[0] > 0.15 && this.shrinking){
        this.transform.scale = this.transform.scale.map(x => x - 0.002);
      }else this.shrinking = this.transform.scale[0] >= 0.22;
    }
  }

  setBlinkingInterval(){
    if(this.blinking){
      clearInterval(this.blinking);
    }
    this.blinking = setInterval(() => this.blink(), 20);
  }

  setStartVelocity(g){
    let direction = 0;
    let deformation = 0;
    if(this.thrower.character.stats.name === "CURVE"){
      direction = Math.random() > 0.5 ? 1 : -1;
      deformation = Math.random() * direction * 0.6;
    }
    this.velocity = [0, 0, 0];
    let diffX = this.transform.translation[0] - this.startPosition[0];
    let diffY = this.transform.translation[1] - this.startPosition[1];
    let diffZ = this.transform.translation[2] - this.startPosition[2];
    this.velocity[0] = -diffX * this.acceleration * 0.33 + deformation;
    this.velocity[1] = -diffY * this.acceleration;
    this.velocity[2] = -diffZ * this.acceleration;
    vec3.scale(this.velocity, this.velocity, this.thrower.character.stats.strength);
    vec3.scale(this.velocity, this.velocity, g);
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
    this.transform.translation[0] += this.velocity[0] * dt;
    this.transform.translation[1] += this.velocity[1] * dt;
    this.transform.translation[2] += this.velocity[2] * dt;
  }
}
