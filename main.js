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
let renderer;
let loader;
let scene;
let physics;
let resizeSystem;
let updateSystem;
let camera;

async function initializeTheRenderer(){
    const renderer = new UnlitRenderer(canvas);
    await renderer.initialize();
    return renderer;
}

////////////////////////////////////////////////////////////////////////////LOADING THE SCENE/////////////////////////////////////////////////


function initializeTheLoader(){
    loader = new GLTFLoader();
}

async function initializeTheScene(){
    await loader.load('scene/test5.gltf'); // Load the scene
    scene = loader.loadScene(loader.defaultScene); // Load the default scene
}

function initializeTheCamera(){
    const camera = loader.loadNode('Camera'); // Load the camera node
    camera.addComponent(new FirstPersonController(camera, canvas)); // Add a first person controller to the camera
    camera.getComponentOfType(FirstPersonController).node.getComponentOfType(Transform).translation = [0, 8.2, 15]; // Set the initial camera position
    camera.isDynamic = true;
    camera.aabb = {
        min: [-0.5, -8.2, -0.6],
        max: [0.5, 0, 0.6],
    };
    scene.addChild(camera);
    return camera;
}

function loadObject(name, type){
    let object = loader.loadNode(name);
    object.name = name;
    if(type){
      if(type === "static"){
        object.isStatic = true;
      }else{
        object.isDynamic = true;
      }
    }
    scene.addChild(object);
    return object;
}

/////////////////////////////////////////////////////////////////////////////LOADING THE PLAYERS/////////////////////////////////////////////////

function loadPlayer(playerObject){
    let player = new Node();
    player.name = playerObject.name;
    player.addComponent(new Transform({
    translation: [0, 0, 0],
    rotation: [0, 0, 0, 1],
    scale: [1, 1, 1],
  }));
    player.addComponent(new Player({
        head: playerObject.head,
        torso: playerObject.torso,
        armL: playerObject.armL,
        armR: playerObject.armR,
        legL: playerObject.legL,
        legR: playerObject.legR,
        node: player
    }));
    scene.addChild(player);
    return player;
}

/////////////////////////////////////////////////////////////////////////////PHYSICS///////////////////////////////////////////////////////////

function initPhysics(){
    physics = new Physics();
}

function setAABBs(){
    scene.traverse(node => {
        const model = node.getComponentOfType(Model);
        if (!model) {
            return;
        }
        const boxes = model.primitives.map(primitive => calculateAxisAlignedBoundingBox(primitive.mesh));
        node.aabb = mergeAxisAlignedBoundingBoxes(boxes);
    });
}

/////////////////////////////////////////////////////////////////////////////UPDATE AND RENDER//////////////////////////////////////////////////////////////

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

function initializeSystems(){
    resizeSystem = new ResizeSystem({ canvas, resize });
    updateSystem = new UpdateSystem({ update, render });
}

function startSystems(){
    resizeSystem.start();
    updateSystem.start();
}
