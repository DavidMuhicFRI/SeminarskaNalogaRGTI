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

/////////////////////////////////////////////////////////////////////////////INTRO/////////////////////////////////////////////////////////////

let introPage = "intro1";
const intro1Logo = document.getElementById('intro1Logo');
const intro2Logo = document.getElementById('intro2Logo');
$("#intro2").hide();

document.addEventListener("click", () => {
  if(introPage === "intro1"){
    introPage = "intro2";
    $("#intro1").hide();
    $("#intro2").show();
    showImage(intro2Logo);
  } else if(introPage === "intro2"){
    introPage = "game";
    $("#intro2").hide();
    $("#game").show();
  }
});


showImage(intro1Logo);
setTimeout(() => {
  if(introPage === "intro1") {
    introPage = "intro2";
    $("#intro1").hide();
    $("#intro2").show();
    showImage(intro2Logo);
    setTimeout(() => {
      if(introPage === "intro2") {
        introPage = "game";
        $("#intro2").hide();
        $("#game").show();
        }
      }, 4100);
    } else {
      introPage = "game";
      $("#intro1").hide();
      $("#intro2").hide();
      $("#game").show();
    }
  }, 4100);


function showImage(element){
  setTimeout(() => {
    element.style.opacity = '1';
  }, 100);
  setTimeout(() => {
    element.style.opacity = '0';
  }, 2100);
}


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
    renderer = new UnlitRenderer(canvas);
    await renderer.initialize();
}

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

function initPhysics(){
  physics = new Physics();
}

function initializeSystems(){
  resizeSystem = new ResizeSystem({ canvas, resize });
  updateSystem = new UpdateSystem({ update, render });
}

function startSystems(){
  resizeSystem.start();
  updateSystem.start();
}

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

async function init(){
  await initializeTheRenderer();
  await initializeTheLoader();
  await initializeTheScene();
  await initializeTheCamera();
  await initPhysics();
  await initializeSystems();
  startSystems();
}

/////////////////////////////////////////////////////////////////////////////LOADING THE OBJECTS/////////////////////////////////////////////////

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


