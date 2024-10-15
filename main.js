import { vec3 } from './glm.js';
import { ResizeSystem } from './systems/ResizeSystem.js';
import { UpdateSystem } from './systems/UpdateSystem.js';

import { GLTFLoader } from './loaders/GLTFLoader.js';
import { UnlitRenderer } from './renderers/UnlitRenderer.js';
import { FirstPersonController } from './controllers/FirstPersonController.js';

import { Camera, Model, Transform } from './core.js';

import {
    calculateAxisAlignedBoundingBox,
    mergeAxisAlignedBoundingBoxes,
} from './core/MeshUtils.js';

import { Physics } from './Physics.js';

/////////////////////////////////////////////////////////////////////////////INIT/////////////////////////////////////////////////////////////

const canvas = document.querySelector('canvas');
const renderer = new UnlitRenderer(canvas);
await renderer.initialize();

////////////////////////////////////////////////////////////////////////////LOADING THE SCENE/////////////////////////////////////////////////

const loader = new GLTFLoader();
await loader.load('scene/table2.gltf');

const scene = loader.loadScene(loader.defaultScene);
const camera = loader.loadNode('Camera');
camera.addComponent(new FirstPersonController(camera, canvas));
const cameraTransform = camera.getComponentOfType(FirstPersonController).node.getComponentOfType(Transform);
console.log(cameraTransform.translation);
cameraTransform.translation = [3, 4.5, 10]; // Set the initial camera position
scene.addChild(camera);
camera.isDynamic = true;
camera.aabb = {               // Set the camera's bounding "hit" box
    min: [-0.5, -4, -0.6],
    max: [0.5, 0, 0.6],
};

const table = loader.loadNode('Table');
table.isStatic = true;
table.name = "Table";
scene.addChild(table);
table.addComponent(new Transform);
table.getComponentOfType(Transform).translation = [0, 0, 0];
console.log(scene);

/////////////////////////////////////////////////////////////////////////////SET THE AABBS FOR MODELS///////////////////////////////////////////////////////////

const physics = new Physics(scene);
scene.traverse(node => {
    const model = node.getComponentOfType(Model);
    if (!model) {
        return;
    }
    const boxes = model.primitives.map(primitive => calculateAxisAlignedBoundingBox(primitive.mesh));
    node.aabb = mergeAxisAlignedBoundingBoxes(boxes);
});

/////////////////////////////////////////////////////////////////////////////UPDATE AND RENDER//////////////////////////////////////////////////////////////

function update(time, dt) {
    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.(time, dt);
        }
    });

    physics.update(time, dt);
    //console.log(camera.getComponentOfType(FirstPersonController).node.getComponentOfType(Transform).translation);
}

function render() {
    renderer.render(scene, camera);
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();
