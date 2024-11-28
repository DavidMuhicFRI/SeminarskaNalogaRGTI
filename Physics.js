import { vec3, mat4 } from './glm.js';
import { getGlobalModelMatrix } from './core/SceneUtils.js';
import { Transform, Ball, Game } from './core.js';
import { FirstPersonController } from './controllers/FirstPersonController.js';

export class Physics {

    constructor(scene) {
        this.scene = scene;
        this.game = null;
    }

    //update primerja vse dinamične objekte z vsemi statičnimi objekti
    update(t, dt) {
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
        this.game.handleBounce();
    }

    cupBounce(minDirection, ball, cup, cupBox, ballBox) {
      let ballTransform = ball.node.getComponentOfType(Transform).translation;
      let cupTransform = cup.getComponentOfType(Transform).translation;
      let distance = this.calculateRealDistance(cupBox, ballTransform, cupTransform);
      let cupWidth = (cupBox.max[0] - cupBox.min[0]) / 2;
      let wallWidth = 0.033;
      if (this.isBallInCup(cupWidth - wallWidth, distance, ball.radius)) {
        if(ballTransform[1] <= cupBox.min[1] + 2 * ball.radius){
          ball.velocity = [0, 0, 0];
          this.game.handleCupHit(cup);
        }else{
          ballTransform[0] = cupTransform[0];
          ballTransform[2] = cupTransform[2];
          ball.velocity = [0, -0.5, 0];
        }
      }else{
        if(minDirection[1] !== 0){
          this.edgeBounce(minDirection, ball, ballTransform, cupBox, ballBox, cupWidth, distance);
        }else{
          this.normalBounce(minDirection, ball);
        }
      }
    }

    playerBounce(){
      this.game.handlePlayerHit();
    }

    normalBounce(minDirection, ball){
      let transform = ball.node.getComponentOfType(Transform);
      if (minDirection[0] !== 0) {
        //console.log("from side")
        ball.velocity[0] = -ball.velocity[0] * ball.bounciness; // Reverse X direction if needed
      }
      if (minDirection[1] !== 0) {
        ball.velocity[1] = -ball.velocity[1] * ball.bounciness;
        if(ball.effect !== "springEffect" && ball.velocity[1] < 0.2 && ball.transform.translation[1] < 4.6){
          this.game.stopBall();
        }// Reverse Y direction if needed
        //console.log("from upDown")
      }
      if (minDirection[2] !== 0) {
        ball.velocity[2] = -ball.velocity[2] * ball.bounciness; // Reverse Z direction if needed
        //console.log("from straight")
      }
      transform.translation = vec3.add(vec3.create(), transform.translation, minDirection);
    }

  getNodeBName(node) {
    //return wall, cup, playerObject, table depending on keywork in node.name
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

  isBallInCup(holeWidth, distance, ballWidth){
    return Math.abs(distance[0]) + ballWidth < holeWidth && Math.abs(distance[2]) + ballWidth < holeWidth;
  }

  getEdgeBounceCons(distance, ball, cupWidth, inside){
    let wallWidth = 0.1;
    let edge = distance[0] < distance[2] ? 0 : 2;
    if(inside){
      return ((cupWidth - wallWidth - (Math.abs(distance[edge]))) / ball.radius) * 0.5;
    }else{
      return ((Math.abs(distance[edge]) - cupWidth) / ball.radius) * 0.5;
    }
  }

  edgeBounce(minDirection, ball,  ballTransform, cupBox, ballBox, cupWidth, distance){
    let wallWidth = 0.05;
    let edge = distance[0] < distance[2] ? 0 : 2;
    let direction;
    let directionY = ball.velocity[1] > 0 ? 1 : -1;
    let inside;
    //if the ball is going up, it should bounce up
    if(Math.abs(distance[edge]) < cupWidth - wallWidth){
      //bouncing inside
      direction = distance[edge] < 0 ? 1 : -1;
      //if the ball is left of the centre, it should bounce right
      inside = true;
    }else if(Math.abs(distance[edge]) > cupWidth){
      direction = distance[edge] > 0 ? 1 : -1;
      //if the ball is right of the centre, it should bounce right
      ball.velocity[2] += 0.1;
      inside = false;
    }else{
      //bouncing on the edge
      this.normalBounce(minDirection, ball);
      return;
    }
    ball.velocity[edge] = (Math.abs(ball.velocity[edge]) * direction + this.getEdgeBounceCons(distance, ball, cupWidth, inside) * Math.abs(ball.velocity[1])) * ball.bounciness;
    ball.velocity[1] = directionY * ball.velocity[1] * ball.bounciness * (1 - this.getEdgeBounceCons(distance, ball, cupWidth, inside));
    ball.transform.translation = vec3.add(vec3.create(), ball.transform.translation, minDirection);
  }
}
