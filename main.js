import { vec3 } from '../../../lib/glm.js';
import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';

import { GLTFLoader } from 'engine/loaders/GLTFLoader.js';
import { UnlitRenderer } from 'engine/renderers/UnlitRenderer.js';
import { FirstPersonController } from 'engine/controllers/FirstPersonController.js';

import { Camera, Model, Transform } from 'engine/core.js';

import {
    calculateAxisAlignedBoundingBox,
    mergeAxisAlignedBoundingBoxes,
} from 'engine/core/MeshUtils.js';

import { Physics } from './Physics.js';

const canvas = document.querySelector('canvas');
const renderer = new UnlitRenderer(canvas);
await renderer.initialize();

const loader = new GLTFLoader();
//await loader.load('scene/scene.gltf');
await loader.load('scene/table2.gltf');

const scene = loader.loadScene(loader.defaultScene);
const camera = loader.loadNode('Camera');
camera.addComponent(new FirstPersonController(camera, canvas));
camera.isDynamic = true;
camera.aabb = {
    min: [-0.2, -0.2, -0.2],
    max: [0.2, 0.2, 0.2],
};

const table = loader.loadNode('Table');
table.isStatic = true;
table.name = "Table";


console.log(scene);


const physics = new Physics(scene);
scene.traverse(node => {
    const model = node.getComponentOfType(Model);
    if (!model) {
        return;
    }
    const boxes = model.primitives.map(primitive => calculateAxisAlignedBoundingBox(primitive.mesh));
    node.aabb = mergeAxisAlignedBoundingBoxes(boxes);
});
//debugging the camera purposes
table.aabb.max = [0, 0, 0];
table.aabb.min = [0, 0, 0];

document.addEventListener('keydown', (event) => {
    if (event.key === 'u') {
        const closestBox = physics.raycastFromCamera(camera);// Perform raycasting
        if (closestBox) {
            console.log("nasli closest box" + closestBox);
            const transform = closestBox.getComponentOfType(Transform);
            if (transform) {
                transform.translation[1] += 1;// Move the box up by 1 unit
                transform.scale = transform.scale.map(s => s * 1.1);// Scale the box by 10%
                closestBox.aabb.max = [closestBox.aabb.max[0] * 1.1, closestBox.aabb.max[1] * 1.1, closestBox.aabb.max[2] * 1.1];
                closestBox.aabb.min = [closestBox.aabb.min[0] * 1.1, closestBox.aabb.min[1] * 1.1, closestBox.aabb.min[2] * 1.1];
            }
        }
    }
});


function update(time, dt) {
    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.(time, dt);
        }
    });

    physics.update(time, dt);
}

function render() {
    renderer.render(scene, camera);
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();
