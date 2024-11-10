import { vec3, mat4 } from './glm.js';
import { getGlobalModelMatrix } from './core/SceneUtils.js';
import { Transform } from './core.js';
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

    //raycastFromCamera metoda vrne (naj bi ;-) (vcasih malo buggy)) objeckt, ki ga kamera gleda (je na sredini zaslona)
    raycastFromCamera(camera) {
        // Get the camera direction in world space
        const forwardDirection = vec3.create();

        const cameraMatrix = getGlobalModelMatrix(camera);
        forwardDirection[0] = -cameraMatrix[8];  // Extract forward X
        forwardDirection[1] = -cameraMatrix[9];  // Extract forward Y
        forwardDirection[2] = -cameraMatrix[10]; // Extract forward Z
        vec3.normalize(forwardDirection, forwardDirection); // Normalize direction
        console.log("Forward Direction:", forwardDirection);


        //vec3.transformMat4(forwardDirection, forwardDirection, cameraMatrix); // Transform direction to world space

        // Create a ray from the camera's position and direction
        const FPC = camera.getComponentOfType(FirstPersonController);
        const rayOrigin = vec3.clone(FPC.node.getComponentOfType(Transform).translation);
        console.log("Ray Origin:", rayOrigin);

        let closestBox = null;
        let closestDistance = Infinity;

        // Traverse the scene to find the closest intersecting box
        this.scene.traverse(node => {
            if (node.isStatic && node.name && node.name.startsWith('Box')) {// Check if it's a box
                const aabb = this.getTransformedAABB(node);// Get the AABB of the box
                console.log("box" + node.name +  "coords: ");
                console.log(node.getComponentOfType(Transform).translation);
                const hitInfo = this.rayIntersectAABB(rayOrigin, forwardDirection, aabb);
                if (hitInfo && hitInfo.distance < closestDistance) {
                    closestDistance = hitInfo.distance;
                    closestBox = node;
                }
            }
        });
        console.log("Closest Box coords:");
        console.log(closestBox.getComponentOfType(Transform).translation);
        return closestBox;
    }

    // Ray-AABB intersection method
    rayIntersectAABB(rayOrigin, rayDirection, aabb) {
        let distance = (aabb.min[0] - rayOrigin[0]);
        let txmin = distance / rayDirection[0];
        console.log("distance:", distance);
        console.log("txmin:", txmin);
        distance = (aabb.max[0] - rayOrigin[0]);
        let txmax = distance / rayDirection[0];
        console.log("distance:", distance);
        console.log("txmax:", txmax);

        if (txmin > txmax) [txmin, txmax] = [txmax, txmin];
        console.log("current min: " + txmin);
        distance = (aabb.min[1] - rayOrigin[1]);
        let tymin = distance / rayDirection[1];
        console.log("distance:", distance);
        console.log("tymin:", tymin);
        distance = (aabb.max[1] - rayOrigin[1]);
        let tymax = distance / rayDirection[1];
        console.log("distance:", distance);
        console.log("tymax:", tymax);

        if ((txmin > tymax) || (tymin > txmax)) return null;

        txmin = Math.max(txmin, tymin);
        txmax = Math.min(txmax, tymax);

        distance = (aabb.min[2] - rayOrigin[2]);
        let tzmin = distance / rayDirection[2];
        console.log("distance:", distance);
        console.log("tzmin:", tzmin);
        distance = (aabb.max[2] - rayOrigin[2]);
        let tzmax = distance / rayDirection[2];
        console.log("distance:", distance);
        console.log("tzmax:", tzmax);

        if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];

        if ((txmin > tzmax) || (tzmin > txmax)) return null;
        console.log("ray hit! final caluclated distance:", txmin);
        return { distance: txmin }; // Return the distance to the intersection
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
        console.log("Collision detected!");
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
        vec3.add(transform.translation, transform.translation, minDirection);
    }
}
