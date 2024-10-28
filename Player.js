import { Transform } from "./core/Transform.js";
import { vec3 } from "./glm.js";

export class Player {
  constructor({
                head = null,
                torso = null,
                armL = null,
                armR = null,
                legL = null,
                legR = null,
                velocity = [0, 0, 0],
                acceleration = 40,
                maxSpeed = 8,
                decay = 0.99999,
                doc = document.querySelector('canvas'),
                yaw = 0,
                node = null,
              } = {}) {
    this.head = head;
    this.torso = torso;
    this.armL = armL;
    this.armR = armR;
    this.legL = legL;
    this.legR = legR;
    this.keys = {};
    this.velocity = velocity;
    this.acceleration = acceleration;
    this.maxSpeed = maxSpeed;
    this.decay = decay;
    this.yaw = yaw;
    this.node = node;

    this.mouseSensitivity = 0.002; // Adjust for mouse sensitivity
    this.lastMouseX = null;

    this.doc = doc;
    this.bodyParts = [this.head, this.torso, this.armL, this.armR, this.legL, this.legR];
    this.initHandlers();
  }

  initHandlers() {
    this.keydownHandler = this.keydownHandler.bind(this);
    this.keyupHandler = this.keyupHandler.bind(this);
    this.mousemoveHandler = this.mousemoveHandler.bind(this);
    const element = this.doc;
    const dom = element.ownerDocument;
    dom.addEventListener('keydown', this.keydownHandler);
    dom.addEventListener('keyup', this.keyupHandler);
    dom.addEventListener('mousemove', this.mousemoveHandler);
  }

  update(t, dt) {
    // Calculate forward and right vectors based on yaw (facing direction).
    const cosYaw = Math.cos(this.yaw);
    const sinYaw = Math.sin(this.yaw);

    // Forward vector (facing direction)
    const forward = [-sinYaw, 0, -cosYaw];
    // Right vector (perpendicular to forward, for strafing)
    const right = [cosYaw, 0, -sinYaw];

    // Map user input to the acceleration vector.
    const acc = vec3.create();

    // Check input keys for movement
    if (this.keys['KeyW']) { // Move forward
      vec3.add(acc, acc, forward);
    }
    if (this.keys['KeyS']) { // Move backward
      vec3.sub(acc, acc, forward);
    }
    if (this.keys['KeyD']) { // Move right
      vec3.add(acc, acc, right);
    }
    if (this.keys['KeyA']) { // Move left
      vec3.sub(acc, acc, right);
    }

    // Update velocity based on acceleration
    vec3.scaleAndAdd(this.velocity, this.velocity, acc, dt * this.acceleration);

    // Apply decay if no movement input is given
    if (!this.keys['KeyW'] && !this.keys['KeyS'] && !this.keys['KeyD'] && !this.keys['KeyA']) {
      const decay = Math.exp(dt * Math.log(1 - this.decay));
      vec3.scale(this.velocity, this.velocity, decay);
    }

    // Limit speed to prevent exceeding max speed
    const speed = vec3.length(this.velocity);
    if (speed > this.maxSpeed) {
      vec3.scale(this.velocity, this.velocity, this.maxSpeed / speed);
    }

    // Update body parts' positions based on velocity and yaw rotation
    const transform = this.node.getComponentOfType(Transform);
    if (transform) {
      console.log(transform.translation);
      // Move the body part in the direction of the velocity
      vec3.scaleAndAdd(transform.translation, transform.translation, this.velocity, dt);

      // Apply yaw rotation to the body part
      transform.rotation[1] = this.yaw; // Rotate around Y-axis
      }
  }

  mousemoveHandler(e) {
    if (this.lastMouseX === null) {
      this.lastMouseX = e.clientX;
      return;
    }

    // Calculate the change in X position since the last frame
    const deltaX = e.clientX - this.lastMouseX;

    // Update yaw based on mouse movement and sensitivity
    this.yaw += deltaX * this.mouseSensitivity;

    // Update lastMouseX for the next frame
    this.lastMouseX = e.clientX;
  }

  keydownHandler(e) {
    this.keys[e.code] = true;
  }

  keyupHandler(e) {
    this.keys[e.code] = false;
  }
}
