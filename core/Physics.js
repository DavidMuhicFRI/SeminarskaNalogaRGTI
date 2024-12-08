import { vec3 } from '../glm.js';
import { getGlobalModelMatrix } from './SceneUtils.js';
import { Transform, Ball } from '../core.js';

export class Physics {

    constructor(scene) {
        this.scene = scene;
        this.game = null;
    }

    update() {
        this.scene.traverse(node => {
            if (node.isDynamic) {
                this.scene.traverse(other => {
                    if (node !== other && other.isStatic) {
                        this.resolveCollision(node, other);
                    }
                });
            }
        });
    }

    intervalIntersection(min1, max1, min2, max2) {
        return !(min1 > max2 || min2 > max1);
    }

    aabbIntersection(aabb1, aabb2) {
        return this.intervalIntersection(aabb1.min[0], aabb1.max[0], aabb2.min[0], aabb2.max[0])
            && this.intervalIntersection(aabb1.min[1], aabb1.max[1], aabb2.min[1], aabb2.max[1])
            && this.intervalIntersection(aabb1.min[2], aabb1.max[2], aabb2.min[2], aabb2.max[2]);
    }

    getTransformedAABB(node) {
        // Transform all vertices of the AABB from local to global space.
        const matrix = getGlobalModelMatrix(node);
        const { min, max } = node.aabb;
        const vertices = [
            [min[0], min[1], min[2]],
            [min[0], min[1], max[2]],
            [min[0], max[1], min[2]],
            [min[0], max[1], max[2]],
            [max[0], min[1], min[2]],
            [max[0], min[1], max[2]],
            [max[0], max[1], min[2]],
            [max[0], max[1], max[2]],
        ].map(v => vec3.transformMat4(v, v, matrix));

        // Find new min and max by component.
        const xs = vertices.map(v => v[0]);
        const ys = vertices.map(v => v[1]);
        const zs = vertices.map(v => v[2]);
        const newmin = [Math.min(...xs), Math.min(...ys), Math.min(...zs)];
        const newmax = [Math.max(...xs), Math.max(...ys), Math.max(...zs)];
        return { min: newmin, max: newmax };
    }


    resolveCollision(a, b) {
        // Get global space AABBs.
        const aBox = this.getTransformedAABB(a);
        const bBox = this.getTransformedAABB(b);

        // Check if there is collision.
        const isColliding = this.aabbIntersection(aBox, bBox);
        if (!isColliding) {
            return;
        }
        // Move node A minimally to avoid collision.
        const diffa = vec3.sub(vec3.create(), bBox.max, aBox.min);
        const diffb = vec3.sub(vec3.create(), aBox.max, bBox.min);

        let minDiff = Infinity;
        let minDirection = [0, 0, 0];
        if (diffa[0] >= 0 && diffa[0] < minDiff) {
            minDiff = diffa[0];
            minDirection = [minDiff, 0, 0];
        }
        if (diffa[1] >= 0 && diffa[1] < minDiff) {
            minDiff = diffa[1];
            minDirection = [0, minDiff, 0];
        }
        if (diffa[2] >= 0 && diffa[2] < minDiff) {
            minDiff = diffa[2];
            minDirection = [0, 0, minDiff];
        }
        if (diffb[0] >= 0 && diffb[0] < minDiff) {
            minDiff = diffb[0];
            minDirection = [-minDiff, 0, 0];
        }
        if (diffb[1] >= 0 && diffb[1] < minDiff) {
            minDiff = diffb[1];
            minDirection = [0, -minDiff, 0];
        }
        if (diffb[2] >= 0 && diffb[2] < minDiff) {
            minDiff = diffb[2];
            minDirection = [0, 0, -minDiff];
        }

        const transform = a.getComponentOfType(Transform);
        if (!transform) {
            return;
        }
        let ball = a.getComponentOfType(Ball);
        switch(this.getNodeBName(b)){
          case "cup":
            this.cupBounce(minDirection, ball, b, bBox, aBox);
            break;
          case "object":
            this.playerBounce(minDirection, ball);
            break;
          default:
            this.normalBounce(minDirection, ball);
            break;
        }
        ball.lastBounceNode = b;
        this.game.handleBounce();
    }

    //bounces the ball from the cup
    cupBounce(minDirection, ball, cup, cupBox, ballBox) {
      let ballTransform = ball.node.getComponentOfType(Transform).translation;
      let cupTransform = cup.getComponentOfType(Transform).translation;
      let distance = this.calculateRealDistance(cupBox, ballTransform, cupTransform);
      let cupWidth = (cupBox.max[0] - cupBox.min[0]) / 2;
      let wallWidth = 0.04;
      if (this.isBallInCup(cupWidth - wallWidth, distance, ball.radius)) {
        console.log("Ball in cup");
        ball.inCup = true;
        if(ballTransform[1] <= cupBox.min[1] + 2 * ball.radius){
          ball.velocity = [0, 0, 0];
          this.game.handleCupHit(cup);
          ball.inCup = false;
        }else{
          ballTransform[0] = cupTransform[0];
          ballTransform[2] = cupTransform[2];
          ball.velocity = [0, -0.5, 0];
        }
      }else{
        if(minDirection[1] !== 0){
          console.log("Edge bounce");
          this.edgeBounce(minDirection, ball, ballTransform, cupBox, cup, ballBox, cupWidth, distance);
        }else{
          console.log("Normal bounce from cup");
          this.normalBounce(minDirection, ball);
        }
      }
    }

    //bounces the ball from the player
    playerBounce(){
      console.log("Player hit");
      this.game.handlePlayerHit();
    }

    //bounces the ball from normal object
    normalBounce(minDirection, ball){
      let transform = ball.node.getComponentOfType(Transform);
      ball.lastBounceNode = null;
      ball.lastBounceType = null;
      if (minDirection[0] !== 0) {
        //console.log("from side")
        ball.velocity[0] = -ball.velocity[0] * ball.bounciness; // Reverse X direction if needed
      }
      if (minDirection[1] !== 0) {
        ball.velocity[1] = -ball.velocity[1] * ball.bounciness;
        if(ball.effect !== "springEffect" && ((ball.velocity[1] < 0.2 && ball.transform.translation[1] < 4.6) || (ball.velocity[1] < 8 && ball.transform.translation[1] < 0.4))){
          this.game.stopBall();
        }// Reverse Y direction if needed
        //console.log("from upDown")
      }
      if (minDirection[2] !== 0) {
        ball.velocity[2] = -ball.velocity[2] * ball.bounciness; // Reverse Z direction if needed
        //console.log("from straight")
      }
      transform.translation = vec3.add(vec3.create(), transform.translation, minDirection);
      if(ball.effect === "springEffect"){
        let rand = Math.random();
        let modification = rand < 0.5 ? 1 : -1;
        if(rand < 0.5){
          ball.velocity[0] += Math.random() * modification * ball.velocity[1] / 15;
        }else{
          ball.velocity[2] += Math.random() * modification * ball.velocity[1] / 15;
        }
      }
    }

    //returns the name of the node
    getNodeBName(node) {
    //return wall, cup, playerObject, table depending on keyword in node.name
    if (node.name.includes("Wall")) {
      return "wall";
    } else if (node.name.includes("Cup")) {
      return "cup";
    } else if (node.name.includes("Object")) {
      return "object";
    } else if (node.name.includes("Table")) {
      return "table";
    }
  }

    //returns the ball center distance from the center of the top of the cup
    calculateRealDistance(objectBox, ballTransform, objectTransform){
    let distance = [0, 0, 0];
    distance[1] = ballTransform[1] - objectBox.max[1];
    distance[0] = ballTransform[0] - objectTransform[0];
    distance[2] = ballTransform[2] - objectTransform[2];
    return distance;
  }

    //returns true if the ball is in the cup
    isBallInCup(holeWidth, distance, ballWidth){
    return Math.abs(distance[0]) + ballWidth < holeWidth && Math.abs(distance[2]) + ballWidth < holeWidth;
  }

    //returns the bounce constant for the edge bounce depending on the distance from the edge
    getEdgeBounceCons(distance, ball, cupWidth, inside){
    let wallWidth = 0.04;
    let edge = distance[0] < distance[2] ? 0 : 2;
    if(inside){
      return ((cupWidth - wallWidth - (Math.abs(distance[edge]))) / ball.radius) * 0.5;
    }else{
      return ((Math.abs(distance[edge]) - cupWidth) / ball.radius) * 0.5;
    }
  }

    //bounces the ball from the edge of the cup
    edgeBounce(minDirection, ball,  ballTransform, cupBox, cup, ballBox, cupWidth, distance){
      if(ball.lastBounceNode !== null){
        let color = ball.lastBounceNode.name.includes("R") ? "R" : "B";
        let otherCupName = ball.lastBounceNode.name.includes("Cup2") ? `Cup${color}3` : `Cup${color}2`;
        if(ball.lastBounce === "edge" && (ball.lastBounceNode === cup || ball.lastBounceNode.name === otherCupName)){
          ball.velocity[1] = -5;
          this.normalBounce(minDirection, ball);
        }else{
          ball.lastBounce = "edge";
        }
      }
    let wallWidth = 0.04;
    let edge = distance[0] < distance[2] ? 0 : 2;
    let direction;
    let inside;
    //if the ball is going up, it should bounce up
    if(Math.abs(distance[edge]) < cupWidth - wallWidth){
      //bouncing inside
      direction = distance[edge] < 0 ? 1 : -1;
      //if the ball is left of the centre, it should bounce right
      inside = true;
    }else if(Math.abs(distance[edge]) > cupWidth){
      //bouncing outside
      direction = distance[edge] > 0 ? 1 : -1;
      //if the ball is right of the centre, it should bounce right
      inside = false;
    }else{
      //bouncing on the edge
      this.normalBounce(minDirection, ball);
      return;
    }
    if(ball.lastBounceNode === cup){
      if(ball.lastBounceType === "edge"){
        this.normalBounce(minDirection, ball);
        return;
      }
    }
    ball.lastBounceNode = cup;
    ball.lastBounceType = "edge";
    let spreadFactor = this.getEdgeBounceCons(distance, ball, cupWidth, inside);
    spreadFactor = Math.min(spreadFactor, 1);
    let YFactor = Math.abs(ball.velocity[1]) * ball.bounciness;
    ball.velocity[edge] = Math.abs(ball.velocity[edge]) * direction + spreadFactor * YFactor;
    ball.velocity[1] = YFactor * (1 - spreadFactor * 0.5);
    //console.log(ball.velocity[1], "velocity and ", YFactor + (1 - spreadFactor));
    //ball.transform.translation = vec3.add(vec3.create(), ball.transform.translation, minDirection);
    //console.log(ball.velocity, "out");
  }
}
