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

const scene = loader.loadScene(loader.defaultScene); // Load the default scene

const camera = loader.loadNode('Camera'); // Load the camera node
camera.addComponent(new FirstPersonController(camera, canvas)); // Add a first person controller to the camera
const cameraTransform = camera.getComponentOfType(FirstPersonController).node.getComponentOfType(Transform); // Get the camera's transform
console.log(cameraTransform.translation); // Print the camera's initial position
cameraTransform.translation = [3, 4.5, 10]; // Set the initial camera position
scene.addChild(camera); // Add the camera to the scene
//set the camera attributes
camera.isDynamic = true;
camera.aabb = {
    min: [-0.5, -4, -0.6],
    max: [0.5, 0, 0.6],
};

const table = loader.loadNode('Table'); // Load the table node
table.isStatic = true;
table.name = "Table";
scene.addChild(table); // Add the table to the scene
table.addComponent(new Transform); // Add a transform component to the table
table.getComponentOfType(Transform).translation = [0, 0, 0]; // Set the initial table position

//check if everything is loaded
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
