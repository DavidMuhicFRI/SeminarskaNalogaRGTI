import { vec3, mat4 } from './glm.js';
import { getGlobalModelMatrix } from './core/SceneUtils.js';
import { Transform, Ball } from './core.js';
import { FirstPersonController } from './controllers/FirstPersonController.js';

export class Physics {

    constructor(scene) {
        this.scene = scene;
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
        let bounce = 0.1;
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
            this.cupBounce(minDirection, ball);
            break;
          case "object":
            this.objectBounce(minDirection, ball);
            break;
          default:
            this.normalBounce(minDirection, ball);
            break;
        }
    }

    getNodeBName(node) {
      //return wall, cup, playerObject, table depending on keywork in node.name
      if (node.name.includes("Wall")) {
        return "wall";
      } else if (node.name.includes("cup")) {
        return "cup";
      } else if (node.name.includes("Object")) {
        return "object";
      } else if (node.name.includes("Table")) {
        return "table";
      }
    }

    cupBounce(minDirection, ball){

    }

    objectBounce(minDirection, ball){

    }

    normalBounce(minDirection, ball){
      if (minDirection[0] !== 0) {
        //console.log("from side")
        ball.velocity[0] = -ball.velocity[0] * ball.bounciness; // Reverse X direction if needed
      }
      if (minDirection[1] !== 0) {
        ball.velocity[1] = -ball.velocity[1] * ball.bounciness; // Reverse Y direction if needed
        //console.log("from upDown")
      }
      if (minDirection[2] !== 0) {
        ball.velocity[2] = -ball.velocity[2] * ball.bounciness; // Reverse Z direction if needed
        //console.log("from straight")
      }
      transform.translation = vec3.add(vec3.create(), transform.translation, minDirection);
    }
}
