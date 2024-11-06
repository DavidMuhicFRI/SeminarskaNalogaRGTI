import { vec3, quat } from './glm.js';
import { ResizeSystem } from './systems/ResizeSystem.js';
import { UpdateSystem } from './systems/UpdateSystem.js';

import { GLTFLoader } from './loaders/GLTFLoader.js';
import { UnlitRenderer } from './renderers/UnlitRenderer.js';
import { BaseRenderer} from "./renderers/BaseRenderer.js";
import { FirstPersonController } from './controllers/FirstPersonController.js';
import { OrbitController } from './controllers/OrbitController.js';
import { TouchController } from './controllers/TouchController.js';
import { TurntableController} from "./controllers/TurntableController.js";

import { Camera, Model, Transform, Node } from './core.js';

import {
    calculateAxisAlignedBoundingBox,
    mergeAxisAlignedBoundingBoxes,
} from './core/MeshUtils.js';

import { Physics } from './Physics.js';
import { Player } from "./Player.js";
import {Renderer} from "./renderers/Renderer.js";
import {Light} from "./core/Light.js";

/////////////////////////////////////////////////////////////////////////////INTRO/////////////////////////////////////////////////////////////
$("#characterPage").hide();
$("#canvas").hide();

let introPage = "intro";
const introLogo = document.getElementById('introLogo');
const charactersImg = document.getElementById('introCharacters');

document.addEventListener("click", () => {
    introPage = "main";
    $("#intro").hide();
  $("#characterPage").show();
});


document.getElementById('introCharacters').style.opacity = '1';
setTimeout(function(){
  document.getElementById("name1").style.opacity = '1';
  document.getElementById("name2").style.opacity = '1';
}, 1000);
setTimeout(function(){
  document.getElementById("name1").style.opacity = '0';
  document.getElementById("name2").style.opacity = '0';
}, 2000);
setTimeout(function(){
  charactersImg.src = "animationTogether.png";
},3000);
setTimeout(function(){
  charactersImg.src = "animationNormal.png";
},3700);
setTimeout(function(){
  charactersImg.src = "animationUp.png";
}, 4400);
let top = -100;
setTimeout(function(){
  $("#introLogo").show();
  let moveLogo = setInterval(function(){
    introLogo.style.top = top + "vh";
    top += 0.5 + Math.pow(top + 100, 2) / 4000;
    if(top > 22.6){
      introLogo.style.top = 22.6 + "vh";
      clearInterval(moveLogo);
      setTimeout(function(){
        introLogo.style.opacity = '0';
      }, 500);
      setTimeout(function(){
        $("#intro").hide();
        $("#characterPage").show();
        $("#canvas").show();
        introPage = "main";
      }, 3200);
    }else if(top > 10){
      $("#introCharacters").hide();
      $("#introAnd").hide();
      $("#name1").hide();
      $("#name2").hide();
    }
  }, 5);
},4450);


/////////////////////////////////////////////////////////////////////////////INIT/////////////////////////////////////////////////////////////

const canvas = document.getElementById('canvas1');
const canvas2 = document.getElementById('canvas2');
let renderers = [];
let renderer;
let renderer2;
let loader;
let scene;
let physics;
let resizeSystem;
let updateSystem;
let camera;
let light;

async function initializeTheRenderer(rendererObject, canvas){
    rendererObject = new Renderer(canvas);
    await rendererObject.initialize();
    renderers.push(rendererObject);
}

function initializeTheLoader(){
  loader = new GLTFLoader();
}

async function initializeTheScene(){
  await loader.load('scene/test.gltf'); // Load the scene
  //scene = await loader.loadScene(loader.defaultScene); // Load the default scene
  scene = new Node();
}

function initializeTheCamera(){
  camera = new Node();
  camera.name = 'Camera';
  camera.addComponent(new Camera({
    aspect: canvas.width / canvas.height,
    fovy: Math.PI / 3,
    near: 0.1,
    far: 100,
  }));
  camera.addComponent(new Transform({
    translation: [0, 8, 10],
    rotation: [0, 0, 0, 1],
  }));
  camera.isDynamic = true;
  camera.aabb = {
    min: [-0.5, -8.2, -0.6],
    max: [0.5, 0, 0.6],
  };
  scene.addChild(camera);
}

async function initializeTheLight(canvas){
  light = new Node();
  light.addComponent(new Transform({
    translation: [0.4,-0.9,0],
  }));
  light.addComponent(new Light({
    domElement: canvas,
    node: light,
  }));
  camera.addChild(light);
}

async function initPhysics(){
  physics = await new Physics();
  physics.scene = scene;
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
  for (const renderer of renderers) {
    //console.log(renderer);
    renderer.render(scene, camera, light);
  }
}

function resize({ displaySize: { width, height }}) {
  camera.getComponentOfType(Camera).aspect = width / height;
}

async function init(){
  await initializeTheRenderer(renderer, canvas);
  await initializeTheRenderer(renderer2, canvas2);
  await initializeTheLoader();
  await initializeTheScene();
  await initializeTheCamera();
  await initializeTheLight();
  await initPhysics();
  await initializeSystems();
  startSystems();
}


/////////////////////////////////////////////////////////////////////////////FIRST PAGE////////////////////////////////////////////////////////////

let rotate = false;

function createQuaternionFromAxisAngle(axis, angle) {
  const halfAngle = angle / 2;
  const sinHalfAngle = Math.sin(halfAngle);

  return [
    axis[0] * sinHalfAngle,  // X component
    axis[1] * sinHalfAngle,  // Y component
    axis[2] * sinHalfAngle,  // Z component
    Math.cos(halfAngle)      // W component
  ];
}
function multiplyQuaternions(q1, q2) {
  return [
    q1[3] * q2[0] + q1[0] * q2[3] + q1[1] * q2[2] - q1[2] * q2[1], // X component
    q1[3] * q2[1] - q1[0] * q2[2] + q1[1] * q2[3] + q1[2] * q2[0], // Y component
    q1[3] * q2[2] + q1[0] * q2[1] - q1[1] * q2[0] + q1[2] * q2[3], // Z component
    q1[3] * q2[3] - q1[0] * q2[0] - q1[1] * q2[1] - q1[2] * q2[2]  // W component
  ];
}
function rotatePlayer(player, angle){
  const rotationQuat = createQuaternionFromAxisAngle([0, 1, 0], angle);
  const transform = player.getComponentOfType(Transform);
  transform.rotation = multiplyQuaternions(transform.rotation, rotationQuat);
}

await init();
let player1 = loadObject("playerObject", "dynamic");
player1.getComponentOfType(Transform).translation = [-12, 8, -12];
let player2 = loadObject("playerObject2", "dynamic");
player2.getComponentOfType(Transform).translation = [12, 8, -12];
document.addEventListener("mousedown", () => {
  if(introPage === "main") {
    document.body.requestPointerLock();
    rotate = true;
  }
});

document.addEventListener("mouseup", () => {
  if(introPage === "main"){
    rotate = false;
    document.exitPointerLock();
  }
});
document.addEventListener("mousemove", (event) => {
  if (rotate) {
    rotatePlayer(player1, event.movementX * 0.01);
    rotatePlayer(player2, event.movementX * 0.01);
  }
});
let constantRotation = setInterval(function(){
  if(introPage === "main" && !rotate){
    rotatePlayer(player1, 0.003);
    rotatePlayer(player2, 0.003);
  }
}, 5);
setAABBs();

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


