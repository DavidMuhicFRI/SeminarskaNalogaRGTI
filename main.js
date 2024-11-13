import { ResizeSystem } from './systems/ResizeSystem.js';
import { UpdateSystem } from './systems/UpdateSystem.js';
import { GLTFLoader } from './loaders/GLTFLoader.js';
import { Camera, Model, Transform, Node, Ball, Character } from './core.js';
import {
    calculateAxisAlignedBoundingBox,
    mergeAxisAlignedBoundingBoxes,
} from './core/MeshUtils.js';
import { Physics } from './Physics.js';
import { Renderer } from "./renderers/Renderer.js";
import { Light } from "./core/Light.js";
import {FirstPersonController} from "./controllers/FirstPersonController.js";

/////////////////////////////////////////////////////////////////////////////INTRO/////////////////////////////////////////////////////////////

let skipIntro = false;
let pageStatus = "intro";
const intro = document.getElementById('intro');
const introLogo = document.getElementById('introLogo');
const charactersImg = document.getElementById('introCharacters');

intro.addEventListener("click", async() => {
  await initCharacterPage();
  pageStatus = "main";
  $("#intro").hide();
  showElement("characterPage");
  showElement("introCanvas");
  skipIntro = true;
});

//sets the visibility of an element to hidden
function showElement(element){
  document.getElementById(element).style.visibility = "visible";
}
//sets the opacity of an element to 1
function elementAppear(element){
  document.getElementById(element).style.opacity = '1';
}
//sets the opacity of an element to 0
function elementDisappear(element){
  document.getElementById(element).style.opacity = '0';
}

//Intro animation
elementAppear("introCharacters");

//show names
setTimeout(function(){
  elementAppear("name1");
  elementAppear("name2");
}, 600);

//hide names
setTimeout(function(){
  elementDisappear("name1");
  elementDisappear("name2");
}, 1700);

//look at each other
setTimeout(function(){
  charactersImg.src = "animationTogether.png";
},2000);

//look at the camera
setTimeout(function(){
  charactersImg.src = "animationNormal.png";
},3000);

//look up
setTimeout(function(){
  charactersImg.src = "animationUp.png";
}, 3400);

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
      }, 400);
      setTimeout(async function(){
        if(!skipIntro) {
          await initCharacterPage();
          $("#intro").hide();
          showElement("characterPage");
          showElement("introCanvas")
          pageStatus = "main";
        }
      }, 3400);
    }else if(top > 10){
      $("#introCharacters").hide();
      $("#introAnd").hide();
      $("#name1").hide();
      $("#name2").hide();
    }
  }, 5);
},3450);

/////////////////////////////////////////////////////////////////////////////CHARACTER PAGE/////////////////////////////////////////////////////////////

const canvas = document.querySelector('canvas');

//system variables
let renderer;
let loader;
let scene;
let physics;
let resizeSystem;
let updateSystem;
let camera;
let light;

//variables for the character page
let rotatingCharacter; //the player object for character page purposes
let constantRotation; //interval for the rotation
let rotate = false; //if the model is rotating
let player1Ready = false;
let player2Ready = false;
let pageOrientation = "left"; //set to left if canvas is in canvasContainerLeft, right if in canvasContainerRight
let characterSelected = [0, 1]
let interacted = false;

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
let charNextButtonBlue = document.getElementById("CPLeftNextCharacter");
let charPreviousButtonBlue = document.getElementById("CPLeftPreviousCharacter");
let charNextButtonRed = document.getElementById("CPRightNextCharacter");
let charPreviousButtonRed = document.getElementById("CPRightPreviousCharacter");


//functions for the character page
function movePage(page) {
  if(!interacted){
    interacted = true;
  }
  const checkPositionInterval = setInterval(() => {
    const pageRect = page.getBoundingClientRect();
    const pageMiddle = pageRect.left + pageRect.width / 2;
    if (pageMiddle < 0 || pageMiddle > window.innerWidth) {
      const char1 = characterObjects[characterSelected[0]].getComponentOfType(Transform);
      const char2 = characterObjects[characterSelected[1]].getComponentOfType(Transform);
      if(page === leftPage){
        canvasContainerRight.appendChild(canvas);
        canvas.style.borderColor = "rgba(255, 90, 90, 1)";
        char2.translation = [0, 0, 0];
        rotatingCharacter = characterObjects[characterSelected[1]];
        char1.translation = [-20, 0, 0];
      } else {
        canvasContainerLeft.appendChild(canvas);
        canvas.style.borderColor = "rgba(90, 90, 255, 1)";
        char1.translation = [0, 0, 0];
        rotatingCharacter = characterObjects[characterSelected[0]];
        char2.translation = [20, 0, 0];
      }
      if(characterSelected[0] === characterSelected[1]){
        nextCharacter();
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
    rotatePlayer(rotatingCharacter, 0.002);
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

//character loading and character functions
let characterObjects = [];
async function loadCharacters(){
  characterObjects = [];
  let objects = ["AtlasObject", "ChronoObject", "NeroObject", "CurveObject", "TrippObject", "SpringObject", "EVOObject"];
  let charIntroScales = [[0.8, 0.9, 0.8], [1, 1, 1], [1.2, 1.2, 1.2], [1.1, 1.1, 1.1], [1.1, 1.1, 1.1], [1.2, 1.2, 1.2], [1.2, 1.2, 1.2]];
  for(let i = 0; i < objects.length; i++){
    let name = objects[i];
    let object = await loadObject(name, "static");
    object.addComponent(new Character(object));
    let char = object.getComponentOfType(Character);
    char.transform.scale = charIntroScales[i];
    if(pageOrientation ==="left"){
      if(i === characterSelected[0]){
        char.transform.translation = [0, 0, 0];
      }else{
        char.transform.translation = [-20, 0, 0];
      }
    }else{
      if(i === characterSelected[1]){
        char.transform.translation = [0, 0, 0];
      }else{
        char.transform.translation = [20, 0, 0];
      }
    }
    characterObjects.push(object);
  }
}
function nextCharacter(){
  if(pageOrientation === "left"){
    let previousTransform = characterObjects[characterSelected[0]].getComponentOfType(Transform);
    characterObjects[characterSelected[0]].getComponentOfType(Transform).translation = [20, 0, 0];
    characterSelected[0]++;
    characterSelected[0] %= characterObjects.length;
    if(!interacted || (characterSelected[0] === characterSelected[1] && interacted)){
      characterSelected[0]++;
      characterSelected[0] %= characterObjects.length;
    }
    let transform = characterObjects[characterSelected[0]].getComponentOfType(Transform);
    transform.translation = [0, 0, 0];
    transform.rotation = previousTransform.rotation;
    rotatingCharacter = characterObjects[characterSelected[0]];
  }else{
    let previousTransform = characterObjects[characterSelected[1]].getComponentOfType(Transform);
    characterObjects[characterSelected[1]].getComponentOfType(Transform).translation = [-20, 0, 0];
    characterSelected[1]++;
    characterSelected[1] %= characterObjects.length;
    if(characterSelected[1] === characterSelected[0]){
      characterSelected[1]++;
      characterSelected[1] %= characterObjects.length;
    }
    let transform = characterObjects[characterSelected[1]].getComponentOfType(Transform);
    transform.translation = [0, 0, 0];
    transform.rotation = previousTransform.rotation;
    rotatingCharacter = characterObjects[characterSelected[1]];
  }
}
function previousCharacter(){
  if(pageOrientation === "left"){
    let previousTransform = characterObjects[characterSelected[0]].getComponentOfType(Transform);
    characterObjects[characterSelected[0]].getComponentOfType(Transform).translation = [20, 0, 0];
    characterSelected[0]--;
    if(characterSelected[0] < 0){
      characterSelected[0] = characterObjects.length - 1;
    }
    if(interacted && characterSelected[0] === characterSelected[1]){
      characterSelected[0]--;
      if(characterSelected[0] < 0){
        characterSelected[0] = characterObjects.length - 1;
      }
    }
    let transform = characterObjects[characterSelected[0]].getComponentOfType(Transform);
    transform.translation = [0, 0, 0];
    transform.rotation = previousTransform.rotation;
    rotatingCharacter = characterObjects[characterSelected[0]];
  } else {
    let previousTransform = characterObjects[characterSelected[1]].getComponentOfType(Transform);
    characterObjects[characterSelected[1]].getComponentOfType(Transform).translation = [-20, 0, 0];
    characterSelected[1]--;
    if(characterSelected[1] < 0){
      characterSelected[1] = characterObjects.length - 1;
    }
    if(characterSelected[1] === characterSelected[0]){
      characterSelected[1]--;
      if(characterSelected[1] < 0){
        characterSelected[1] = characterObjects.length - 1;
      }
    }
    let transform = characterObjects[characterSelected[1]].getComponentOfType(Transform);
    transform.translation = [0, 0, 0];
    transform.rotation = previousTransform.rotation;
    rotatingCharacter = characterObjects[characterSelected[1]];
  }
}

//starting and exiting the game
async function startGame(){
  await initGame();
  console.log("scene:", scene);
  $("#characterPage").hide();
  showElement("game");
  $("#game").show(); //for 2nd and later showings
}
//exit game
async function cancelGame(){
  await initCharacterPage();
  $("#characterPage").show();
  $("#game").hide();
}

//button event listeners
gameBackButton.addEventListener('click', function() {
  cancelGame().then(() => {
    console.log("Game cancelled");
  });
});
readyButton1.addEventListener('click', function() {
  if(player1Ready){
    //button is cancel, set it to ready and unready the player
    turnButtonToReady(readyButton1);
    player1Ready = false;
  } else {
    if(player2Ready){
      //both players are ready, start the game
      startGame().then(() => {
        console.log("Game started");
      });
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
      startGame().then(() => {
        console.log("Game started");
      });
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
charNextButtonBlue.addEventListener('click', function() {
  nextCharacter();
});
charPreviousButtonBlue.addEventListener('click', function() {
  previousCharacter();
});
charNextButtonRed.addEventListener('click', function() {
  nextCharacter();
});
charPreviousButtonRed.addEventListener('click', function() {
  previousCharacter();
});

//event listeners for model rotation on drag
document.addEventListener("pointerlockchange", () => {
  rotate = document.pointerLockElement === canvas;
});
canvas.addEventListener("mousedown", () => {
  if (pageStatus === "main") {
    canvas.requestPointerLock();
  }
});
canvas.addEventListener("mousemove", (event) => {
  if (rotate && pageStatus === "main") {
    rotatePlayer(rotatingCharacter, event.movementX * 0.01); // Rotate player based on mouse movement
  }else if(pageStatus === "game" && ballGrabbed){
    dragEnd = [dragEnd[0] + event.movementX, dragEnd[1] + event.movementY];
    ballDrag(event);
  }
});
canvas.addEventListener("mouseover", () => {
  if (pageStatus === "main") {
    canvas.style.cursor = "grab";
  }
});

//init the systems
async function initCharacterPage() {
  //correct the page variables and buttons
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
  player1Ready = false;
  player2Ready = false;
  turnButtonToReady(readyButton1);
  turnButtonToReady(readyButton2);
  document.getElementById("gameBackButton").style.visibility = "hidden";

  //initialize the intro systems
  await init(true);

//load the objects for character page
  await loadCharacters();
  let floor = loadObject("Floor", "static");
  let transform2 = floor.getComponentOfType(Transform);
  transform2.translation = [0, 0.1, 0];
  transform2.scale = [10, 0.1, 10];

  let wall1 = loadObject("WallBlue", "static");
  let transform3 = wall1.getComponentOfType(Transform);
  transform3.translation = [0, 0, -5];
  transform3.scale = [10, 20, 0.1];
  if(pageOrientation === "left"){
    rotatingCharacter = characterObjects[characterSelected[0]];
  }else{
    rotatingCharacter = characterObjects[characterSelected[1]];
  }
  //rotate the player
  constantRotation = setInterval(constantlyRotate, 5);
}

/////////////////////////////////////////////////////////////////////////////GAME/////////////////////////////////////////////////////////////

let playerTurn = 1;
let player1Object;
let player2Object;
let ball;
let ballBlink = 0; //0 for increasing, 1 for decreasing
let ballSelectInterval; //interval for blinking the ball
let ballGrabbed = false;
let dragStart = [0, 0];
let dragEnd = [0, 0];


//event listeners for the game
document.getElementById("ballDiv").addEventListener("mousedown", function(event){
  ballGrabbed = true;

  dragStart = [event.clientX, event.clientY];
  dragEnd = [event.clientX, event.clientY];

  clearInterval(ballSelectInterval);
  //cursor lock
  canvas.requestPointerLock();
  let transform = ball.getComponentOfType(Transform);
  transform.scale = [0.18, 0.18, 0.18];
});
canvas.addEventListener("mouseup", () => {
  if(pageStatus === "game"){
    ballGrabbed = false;
    if(calculateDragDistance() < 85 || calculateDragForce() < 0){
      setBall();
    }else{
      ball.getComponentOfType(Ball).startPosition = [0, 6.5, -5];
      throwBall();
    }
  }
  document.exitPointerLock();
});

//game functions
function ballDrag(event){
  let transform = ball.getComponentOfType(Transform);
  let force = calculateDragForce();
  let dragToughness = 0.01 / Math.pow(Math.abs(force + 1), 1/2.5);
  dragToughness = Math.min(dragToughness, 0.01);
  transform.translation[0] -= event.movementX * 0.01;
  transform.translation[1] -= 1.5 * event.movementY * dragToughness;
  if(playerTurn === 1) {
    transform.translation[2] -= event.movementY * dragToughness;
  }else{
    transform.translation[2] += event.movementY * dragToughness;
  }
}

async function initGame(){
  pageStatus = "game";
  rotate = false;
  canvas.id = "gameCanvas";
  document.getElementById("game").appendChild(canvas);
  await init(false);
  clearInterval(constantRotation);
  document.body.style.cursor = "default";
  document.getElementById("gameBackButton").style.visibility = "visible";
  initGameObjects();
  setAABBs();
}

function calculateDragDistance(){
  return Math.sqrt(Math.pow(dragEnd[0] - dragStart[0], 2) + Math.pow(dragEnd[1] - dragStart[1], 2));
}
function calculateDragForce(){
  return dragEnd[1] - dragStart[1];
}

function throwBall(){
  const ballObject = ball.getComponentOfType(Ball);
  ballObject.acceleration = calculateDragForce();
  ballObject.moving = true;
  ballObject.setStartVelocity();
  clearInterval(ballSelectInterval);
}

function blinkBall(){
  let ballTransform = ball.getComponentOfType(Transform);
  if(!ballGrabbed){
    if(ballTransform.scale[0] < 0.22 && ballBlink === 0){
      ballTransform.scale = ballTransform.scale.map(x => x + 0.002);
    }else if(ballTransform.scale[0] > 0.15 && ballBlink === 1){
      ballTransform.scale = ballTransform.scale.map(x => x - 0.002);
    }else if(ballTransform.scale[0] >= 0.22){
      ballBlink = 1;
    }else{
      ballBlink = 0;
    }
  }
}

function setPlayerObjects(){
  //camera.addComponent(new FirstPersonController(camera, canvas));
  characterObjects = [];
  let objectNames = ["AtlasObject", "ChronoObject", "NeroObject", "CurveObject", "TrippObject", "SpringObject", "EVOObject"];
  for(let i = 0; i < objectNames.length; i++) {
    let object = getObject(objectNames[i], "static");
    object.addComponent(new Character(object));
    characterObjects.push(object);
  }
  for(let i = 0; i < characterObjects.length; i++){
    let object = characterObjects[i];
    if(i === characterSelected[1]){
      player1Object = object;
      player1Object.getComponentOfType(Transform).translation = [0, 0, -16];
      player1Object.getComponentOfType(Transform).rotation = [0, 0.707, 0, -0.707];
    }else if(i === characterSelected[0]){
      player2Object = object;
      player2Object.getComponentOfType(Transform).translation = [0, 0, 16];
    }else{
      object.getComponentOfType(Transform).translation = [30, 0, 0];
    }
  }
  console.log("player1:", player1Object, "player2:", player2Object);
}


function setBall(){
  let transform = ball.getComponentOfType(Transform);
  if(playerTurn === 1){
    transform.translation = [0, 7.5, -7.1];
  }else{
    transform.translation = [0, 7.5, 7.1];
  }
  ball.getComponentOfType(Ball).startPosition = transform.translation;
  if(!ballSelectInterval){
    ballSelectInterval = setInterval(blinkBall, 20);
  }
}

function initGameObjects(){
  ball = getObject("Ball", "dynamic");
  ball.isStatic = false;
  ball.addComponent(new Ball(ball, canvas));
  setBall();
  setPlayerObjects();
}

/////////////////////////////////////////////////////////////////////////////INIT/////////////////////////////////////////////////////////////

async function initializeTheRenderer(){
    renderer = new Renderer(canvas);
    await renderer.initialize();
}

function initializeTheLoader(){
  loader = new GLTFLoader();
}

async function initializeTheScene(intro){
  await loader.load('scene/scene.gltf'); // Load the scene
  if(intro){
    scene = new Node();
  }else{
    scene = await loader.loadScene(loader.defaultScene); // Load the default scene
  }
}

function initializeTheCamera(intro){
  camera = new Node();
  camera.name = 'Camera';
  camera.addComponent(new Camera({
    aspect: canvas.width / canvas.height,
    fovy: Math.PI / 3,
    near: 0.1,
    far: 100,
  }));
  if(intro){
    camera.addComponent(new Transform({
      translation: [0, 10, 10],
      rotation: [-0.2, 0, 0, 1],
    }));
  }else{
    //camera.addComponent(new FirstPersonController(camera, canvas));
    camera.addComponent(new Transform({
      translation: [0, 9, -12.6],
      rotation: [0, 1, 0.13, 0],
    }));
  }
  camera.isStatic = true;
  camera.aabb = {
    min: [-0.5, -0.5, -0.5],
    max: [0.5, 0.5, 0.5],
  };
  scene.addChild(camera);
}

async function initializeTheLight(intro){
  light = new Node();
  light.name = 'Light';
  if(intro){
    light.addComponent(new Transform({
      translation: [0.2, 11, 7],
      rotation: [-0.5, 0.1, 0, 1],
    }));
    light.addComponent(new Light({
      color: [250, 245, 220],
      intensity: 1,
      attenuation: [0, 0.1, 0.03],
      ambientOff: 0.01,
      ambientOn: 0.04,
      fi: 3,
      fovy: Math.PI / 1.2,
      aspect: 1,
      near: 1,
      far: 200,
    }));
  }else{
    light.addComponent(new Transform({
      translation: [0, 16, 0],
      rotation: [-0.71, 0, 0, 1],
  }));
    light.addComponent(new Light({
      color: [250, 245, 220],
      intensity: 1,
      attenuation: [0, 0.1, 0.03],
      ambientOff: 0.01,
      ambientOn: 0.04,
      fi: 3,
      fovy: Math.PI / 1.1,
      aspect: 1,
      near: 1,
      far: 200,
    }));
  }
  scene.addChild(light);
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
  //console.log(camera.getComponentOfType(FirstPersonController).node.getComponentOfType(Transform).translation, camera.getComponentOfType(FirstPersonController).node.getComponentOfType(Transform).rotation);
  physics.update(time, dt);
}

function render() {
  renderer.render(scene, camera, light);
}

function resize({ displaySize: { width, height }}) {
  camera.getComponentOfType(Camera).aspect = width / height;
}

async function init(intro){
  await initializeTheRenderer(renderer, canvas);
  await initializeTheLoader();
  await initializeTheScene(intro);
  await initializeTheCamera(intro);
  await initializeTheLight(intro);
  await initPhysics();
  await initializeSystems();
  startSystems();
}

/////////////////////////////////////////////////////////////////////////////LOADING THE OBJECTS/////////////////////////////////////////////////

function getObject(name, type){
  let object = scene.find(node => node.name === name);
  if(!object){
    object = loadObject(name, type);
  }
  if(type){
    if(type === "static"){
      object.isStatic = true;
    }else{
      object.isDynamic = true;
    }
  }
  return object;
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


