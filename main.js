import { ResizeSystem } from './systems/ResizeSystem.js';
import { UpdateSystem } from './systems/UpdateSystem.js';
import { GLTFLoader } from './loaders/GLTFLoader.js';
import { Camera, Model, Transform, Node } from './core.js';
import {
    calculateAxisAlignedBoundingBox,
    mergeAxisAlignedBoundingBoxes,
} from './core/MeshUtils.js';
import { Physics } from './Physics.js';
import { Renderer } from "./renderers/Renderer.js";
import { Light } from "./core/Light.js";

/////////////////////////////////////////////////////////////////////////////INTRO/////////////////////////////////////////////////////////////

let pageStatus = "intro";
const intro = document.getElementById('intro');
const introLogo = document.getElementById('introLogo');
const charactersImg = document.getElementById('introCharacters');

intro.addEventListener("click", () => {
  pageStatus = "main";
  $("#intro").hide();
  showElement("characterPage");
  showElement("introCanvas");
});

function showElement(element){
  document.getElementById(element).style.visibility = "visible";
}
function elementAppear(element){
  document.getElementById(element).style.opacity = '1';
}
function elementDisappear(element){
  document.getElementById(element).style.opacity = '0';
}

//Intro animation

//show characters
elementAppear("introCharacters");

//show names
setTimeout(function(){
  elementAppear("name1");
  elementAppear("name2");
}, 700);

//hide names
setTimeout(function(){
  elementDisappear("name1");
  elementDisappear("name2");
}, 1600);

//look at each other
setTimeout(function(){
  charactersImg.src = "animationTogether.png";
},2500);

//look at the camera
setTimeout(function(){
  charactersImg.src = "animationNormal.png";
},3600);

//look up
setTimeout(function(){
  charactersImg.src = "animationUp.png";
}, 4000);

//logo drops and disappears
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
        elementDisappear("introLogo");
      }, 700);
      setTimeout(function(){
        $("#intro").hide();
        showElement("characterPage");
        showElement("introCanvas")
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

/////////////////////////////////////////////////////////////////////////////CHARACTER PAGE/////////////////////////////////////////////////////////////

const canvas = document.querySelector('canvas');

//init the variables
let renderer;
let loader;
let scene;
let physics;
let resizeSystem;
let updateSystem;
let camera;
let light;

//variables for the character page
let rotate = false; //if the model is rotating
let player1Ready = false;
let player2Ready = false;
let pageOrientation = "left"; //set to left if canvas is in canvasContainerLeft, right if in canvasContainerRight

//DOMs for the character page
let leftPage = document.getElementById("CPLeft");
let rightPage = document.getElementById("CPRight");
let canvasContainerRight = document.getElementById("canvasContainerRight");
let canvasContainerLeft = document.getElementById("canvasContainerLeft");

//buttons for the character page
let backToP1 = document.getElementById("backToP1");
let forwardToP2 = document.getElementById("forwardToP2");
let readyButton1 = document.getElementById("p1ReadyButton");
let readyButton2 = document.getElementById("p2ReadyButton");
let gameBackButton = document.getElementById("gameBackButton");

//functions for the character page
function movePage(page) {
  const checkPositionInterval = setInterval(() => {
    const pageRect = page.getBoundingClientRect();
    const pageMiddle = pageRect.left + pageRect.width / 2;
    if (pageMiddle < 0 || pageMiddle > window.innerWidth) {
      if(page === leftPage){
        canvasContainerRight.appendChild(canvas);
        canvas.style.borderColor = "rgba(255, 90, 90, 1)";
      } else {
        canvasContainerLeft.appendChild(canvas);
        canvas.style.borderColor = "rgba(90, 90, 255, 1)";
      }
      clearInterval(checkPositionInterval);
    }
  }, 10);
  let left;
  let right;
  if(page === leftPage){
    pageOrientation = "right";
    left = "-100vw";
    right = "0";
  }else{
    pageOrientation = "left";
    left = "0";
    right = "100vw";
  }
  document.getElementById('CPLeft').style.left = left;
  document.getElementById('CPRight').style.left = right;
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

//rotation functions
function constantlyRotate(){
  if(pageStatus === "main" && !rotate){
    rotatePlayer(player1, 0.003);
  }
}
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

//starting and exiting the game
function startGame(){
  $("#characterPage").hide();
  showElement("game");
  $("#game").show(); //for 2nd and later showings
  clearInterval(constantRotation);
  pageStatus = "game";
  rotate = false;
  canvas.id = "gameCanvas";
  document.getElementById("game").appendChild(canvas);
  document.body.style.cursor = "grab";
  document.body.requestFullscreen().catch(err => {
    console.log(err);
  });
  document.getElementById("gameBackButton").style.visibility = "visible";
}

function cancelGame(){
  $("#characterPage").show();
  $("#game").hide();
  pageStatus = "main";
  canvas.id = "introCanvas";
  let container;
  if(pageOrientation === "left"){
    container = canvasContainerLeft;
  }else{
    container = canvasContainerRight;
  }
  container.appendChild(canvas);
  document.body.style.cursor = "default";
  constantRotation = setInterval(constantlyRotate, 5);
  player1Ready = false;
  player2Ready = false;
  turnButtonToReady(readyButton1);
  turnButtonToReady(readyButton2);
  document.getElementById("gameBackButton").style.visibility = "hidden";
  document.exitFullscreen().catch(err => {
    console.log(err);
  });
}

//button event listeners
gameBackButton.addEventListener('click', function() {
  cancelGame();
});
readyButton1.addEventListener('click', function() {
  if(player1Ready){
    //button is cancel, set it to ready and unready the player
    turnButtonToReady(readyButton1);
    player1Ready = false;
  } else {
    if(player2Ready){
      //both players are ready, start the game
      startGame();
    }else{
      //set player to ready, set the button to cancel and move the page
      player1Ready = true;
      turnButtonToCancel(readyButton1, player1Ready);
      movePage(leftPage);
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
      movePage(rightPage);
    }
  }
});
forwardToP2.addEventListener('click', function() {
  movePage(leftPage);
});
backToP1.addEventListener('click', function() {
  movePage(rightPage);
});

//event listeners for model rotation on drag
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
canvas.addEventListener("mouseup", () => {
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

//init the systems
await init();

//load the objects for character page
let player1 = loadObject("playerObject", "static");
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

let constantRotation = setInterval(constantlyRotate, 5);

setAABBs();

/////////////////////////////////////////////////////////////////////////////GAME/////////////////////////////////////////////////////////////



/////////////////////////////////////////////////////////////////////////////INIT/////////////////////////////////////////////////////////////

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

async function initializeTheLight(){
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


