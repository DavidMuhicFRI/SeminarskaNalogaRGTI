//import { vec3 } from './glm.js';
import { ResizeSystem } from './systems/ResizeSystem.js';
import { UpdateSystem } from './systems/UpdateSystem.js';

import { GLTFLoader } from './loaders/GLTFLoader.js';
import { UnlitRenderer } from './renderers/UnlitRenderer.js';
import { BaseRenderer} from "./renderers/BaseRenderer.js";
import { FirstPersonController } from './controllers/FirstPersonController.js';

import { Camera, Model, Transform, Node } from './core.js';

import {
    calculateAxisAlignedBoundingBox,
    mergeAxisAlignedBoundingBoxes,
} from './core/MeshUtils.js';

import { Physics } from './Physics.js';
import { Player } from "./Player.js";

/////////////////////////////////////////////////////////////////////////////INIT/////////////////////////////////////////////////////////////

const canvas = document.querySelector('canvas');
const renderer = new UnlitRenderer(canvas);
await renderer.initialize();

////////////////////////////////////////////////////////////////////////////LOADING THE SCENE/////////////////////////////////////////////////

const loader = new GLTFLoader();
await loader.load('scene/test5.gltf');

const scene = loader.loadScene(loader.defaultScene); // Load the default scene

const camera = loader.loadNode('Camera'); // Load the camera node
camera.addComponent(new FirstPersonController(camera, canvas)); // Add a first person controller to the camera
const cameraTransform = camera.getComponentOfType(FirstPersonController).node.getComponentOfType(Transform); // Get the camera's transform
console.log(cameraTransform.translation); // Print the camera's initial position
cameraTransform.translation = [0, 8.2, 15]; // Set the initial camera position
//scene.addChild(camera); // Add the camera to the scene
//set the camera attributes
camera.isDynamic = true;
camera.aabb = {
    min: [-0.5, -8.2, -0.6],
    max: [0.5, 0, 0.6],
};
scene.addChild(camera);

const table = loader.loadNode('Table');
table.isStatic = true;
table.name = "Table";
scene.addChild(table);

//load all player limbs
const head = loader.loadNode('Head');
const torso = loader.loadNode('Torso');
const armL = loader.loadNode('armL');
const armR = loader.loadNode('armR');
const legL = loader.loadNode('legL');
const legR = loader.loadNode('legR');

const player1 = new Node();
player1.name = "Player1";
player1.addComponent(new Transform({
    translation: [0, 0, 0],
    rotation: [0, 0, 0, 1],
    scale: [1, 1, 1],
}));
player1.addComponent(new Player({
    head: head,
    torso: torso,
    armL: armL,
    armR: armR,
    legL: legL,
    legR: legR,
    node: player1
}));
scene.addChild(player1);


//load all player2 limbs
const head2 = loader.loadNode('Head2');
const torso2 = loader.loadNode('Torso2');
const armL2 = loader.loadNode('armL2');
const armR2 = loader.loadNode('armR2');
const legL2 = loader.loadNode('legL2');
const legR2 = loader.loadNode('legR2');


const player2 = new Node();
player2.name = "Player2";
player2.addComponent(new Transform({
  translation: [0, 0, 0],
  rotation: [0, 0, 0, 1],
  scale: [1, 1, 1],
}));
player2.addComponent(new Player({
  head: head2,
  torso: torso2,
  armL: armL2,
  armR: armR2,
  legL: legL2,
  legR: legR2,
  node: player2
}));
scene.addChild(player2);
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
