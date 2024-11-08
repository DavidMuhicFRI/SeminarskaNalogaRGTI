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
$("#game").hide();

let pageStatus = "intro";
const introLogo = document.getElementById('introLogo');
const charactersImg = document.getElementById('introCharacters');

document.addEventListener("click", () => {
  if(pageStatus === "intro"){
    pageStatus = "main";
    $("#intro").hide();
    $("#characterPage").show();
  }
});


document.getElementById('introCharacters').style.opacity = '1';
setTimeout(function(){
  document.getElementById("name1").style.opacity = '1';
  document.getElementById("name2").style.opacity = '1';
}, 700);
setTimeout(function(){
  document.getElementById("name1").style.opacity = '0';
  document.getElementById("name2").style.opacity = '0';
}, 1600);
setTimeout(function(){
  charactersImg.src = "animationTogether.png";
},2500);
setTimeout(function(){
  charactersImg.src = "animationNormal.png";
},3600);
setTimeout(function(){
  charactersImg.src = "animationUp.png";
}, 4000);
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
      }, 700);
      setTimeout(function(){
        $("#intro").hide();
        $("#characterPage").show();
        $("#canvas").show();
        pageStatus = "main";
      }, 3600);
    }else if(top > 10){
      $("#introCharacters").hide();
      $("#introAnd").hide();
      $("#name1").hide();
      $("#name2").hide();
    }
  }, 5);
},4450);

let player1Ready = false;
let player2Ready = false;
let leftPage = document.getElementById("CPLeft");
let rightPage = document.getElementById("CPRight");
let backToP1 = document.getElementById("backToP1");
let forwardToP2 = document.getElementById("forwardToP2");
let readyButton1 = document.getElementById("p1ReadyButton");
let readyButton2 = document.getElementById("p2ReadyButton");
let canvasContainerRight = document.getElementById("canvasContainerRight");
let canvasContainerLeft = document.getElementById("canvasContainerLeft");

function movePage(page, canvasContainer, left, right) {
  const checkPositionInterval = setInterval(() => {
    const pageRect = page.getBoundingClientRect();
    const pageMiddle = pageRect.left + pageRect.width / 2;

    if (pageMiddle < 0 || pageMiddle > window.innerWidth) {
      canvasContainer.appendChild(canvas);
      if(page === leftPage){
        canvas.style.borderColor = "rgba(255, 90, 90, 1)";
      } else {
        canvas.style.borderColor = "rgba(90, 90, 255, 1)";
      }
      clearInterval(checkPositionInterval);
    }
  }, 10);
  document.getElementById('CPLeft').style.left = left;
  document.getElementById('CPRight').style.left = right;
}

function startGame(){
  $("#characterPage").hide();
  canvas.id = "gameCanvas";
  document.getElementById("game").appendChild(canvas);
  $("#game").show();
  clearInterval(constantRotation);
  pageStatus = "game";
  rotate = false;
  document.style.cursor = "grab";
}

function turnButtonToCancel(button){
  button.innerText = "CANCEL";
  button.style.borderColor = "white";
  button.style.backgroundColor = "rgba(255, 90, 90, 1)";
}
function turnButtonToReady(button){
  button.innerText = "READY";
  button.style.borderColor = "black";
  if(button === readyButton1){
    button.style.backgroundColor = "rgba(90, 90, 255, 1)";
  }else{
    button.style.backgroundColor = "rgba(255, 90, 90, 1)";
  }
}

readyButton1.addEventListener('click', function() {
  if(player1Ready){
    turnButtonToReady(readyButton1);
    player1Ready = false;
  } else {
    if(player2Ready){
      startGame();
    }else{
      player1Ready = true;
      turnButtonToCancel(readyButton1, player1Ready);
      movePage(leftPage, canvasContainerRight, "-100vw", "0");
    }
  }
});
readyButton2.addEventListener('click', function() {
  if(player2Ready){
    turnButtonToReady(readyButton2);
    player2Ready = false;
  } else {
    if(player1Ready){
      startGame();
    }else{
      player2Ready = true;
      turnButtonToCancel(readyButton2, player2Ready);
      movePage(rightPage, canvasContainerLeft, "0", "100vw");
    }
  }
});
forwardToP2.addEventListener('click', function() {
  movePage(leftPage, canvasContainerRight, "-100vw", "0");
});

backToP1.addEventListener('click', function() {
  movePage(rightPage, canvasContainerLeft, "0", "100vw");
});


/////////////////////////////////////////////////////////////////////////////INIT/////////////////////////////////////////////////////////////

const canvas = document.querySelector('canvas');
let renderer;
let loader;
let scene;
let physics;
let resizeSystem;
let updateSystem;
let camera;
let light;

async function initializeTheRenderer(){
    renderer = new Renderer(canvas);
    await renderer.initialize();
}

function initializeTheLoader(){
  loader = new GLTFLoader();
}

async function initializeTheScene(){
  await loader.load('scene/test.gltf'); // Load the scene
  scene = await loader.loadScene(loader.defaultScene); // Load the default scene
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
    translation: [0, 2, 5],
    rotation: [-0.15, 0, 0, 1],
  }));
  camera.isDynamic = true;
  camera.aabb = {
    min: [-0.5, -0.5, -0.5],
    max: [0.5, 0.5, 0.5],
  };
  scene.addChild(camera);
}

async function initializeTheLight(canvas){
  light = new Node();
  light.addComponent(new Transform({
    translation: [0.2, 3, 0],
    rotation: [-0.3, 0.1, 0, 1],
  }));
  light.addComponent(new Light({
    color: [240, 240, 200],
    intensity: 5,
    attenuation: [0.001, 0.1, 0.3],
    ambientOff: 0.01,
    ambientOn: 0.04,
    fi: 0.6,
    fovy: Math.PI / 2,
    aspect: 1,
    near: 0.1,
    far: 100,
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
  renderer.render(scene, camera, light);
}

function resize({ displaySize: { width, height }}) {
  camera.getComponentOfType(Camera).aspect = width / height;
}

async function init(){
  await initializeTheRenderer(renderer, canvas);
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
let transform1 = player1.getComponentOfType(Transform);
transform1.translation = [0, 0.5, 0];
transform1.scale = [0.35, 0.7, 0.6];
let floor = loadObject("Floor", "static");
let transform2 = floor.getComponentOfType(Transform);
transform2.translation = [0, -2.3, 0];
transform2.scale = [10, 0.1, 10];
let wall1 = loadObject("Wall1", "static");
let transform3 = wall1.getComponentOfType(Transform);
transform3.translation = [0, 0, -5];
transform3.scale = [10, 10, 0.1];

canvas.addEventListener("mousedown", () => {
  if(pageStatus === "main") {
    document.body.requestPointerLock();
    rotate = true;
  }
});
canvas.addEventListener("mouseover", () => {
  if(pageStatus === "main"){
    canvas.style.cursor = "grab";
  }
});

document.addEventListener("mouseup", () => {
  if(pageStatus === "main"){
    rotate = false;
    document.exitPointerLock();
  }
});
canvas.addEventListener("mousemove", (event) => {
  if (rotate && pageStatus === "main") {
    rotatePlayer(player1, event.movementX * 0.01);
  }
});
let constantRotation = setInterval(function(){
  if(pageStatus === "main" && !rotate){
    rotatePlayer(player1, 0.003);
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


