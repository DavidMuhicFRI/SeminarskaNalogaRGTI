import { ResizeSystem } from './systems/ResizeSystem.js';
import { UpdateSystem } from './systems/UpdateSystem.js';
import { GLTFLoader } from './loaders/GLTFLoader.js';
import {Camera, Model, Transform, Node, Ball, Character, Player, Game} from './core.js';
import { calculateAxisAlignedBoundingBox, mergeAxisAlignedBoundingBoxes } from './core/MeshUtils.js';
import { Physics, Light } from './core.js';
import { Renderer } from "./renderers/Renderer.js";

/////////////////////////////////////////////////////////////////////////////INTRO/////////////////////////////////////////////////////////////

let pageStatus = "intro";

document.getElementById('intro').addEventListener("click", async() => {
  await initCharacterPage();
  pageStatus = "main";
  $("#intro").hide();
  document.getElementById("characterPage").style.visibility = "visible";
  document.getElementById("introCanvas").style.visibility = "visible";
});

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.getElementById("introLogo").style.opacity = '1';
    setTimeout(() => {
      document.getElementById("introText").style.visibility = "visible";
      document.getElementById("introText").style.opacity = '1';
    }, 2500);
  }, 0);
});

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
let game;
let player1 = new Player(1);
let player2 = new Player(2);
let characterObjects = []; //array of character objects for the character page
let characterNames = ["Atlas", "Curve", "Nero", "Spring", "Tripp"]; //names of the characters
let rotatingCharacter; //the constantly rotating character object
let constantRotation; //interval for the rotation
let characterGrabbed = false; //if we are "grabbing" the character
let pageOrientation = "left"; //set to left if canvas is in canvasContainerLeft, right if in canvasContainerRight
let characterSelected = [] //character selected by each player
let interacted = false; //if second player's character has been selected

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

//sounds for the character page
const introSound = new Audio("introBackground.mp3");
introSound.loop = true;
introSound.volume = 0.4;
const gameSound = new Audio('gameBackground.mp3');
gameSound.loop = true;
gameSound.volume = 0.1;
const buttonSound = new Audio('buttonSound.mp3');


//functions for the character page
function movePage() {
  if(!interacted){
    //if the second player has not interacted, assign the first free character to them
    for(let i = 0; i < characterObjects.length; i++){
      if(characterSelected[0] !== characterObjects[i]){
        characterSelected[1] = characterObjects[i];
        break;
      }
    }
    interacted = true;
  }
  let page;
  let left;
  let right;
  //move the page to the other side
  if(pageOrientation === "left"){
    page = leftPage;
    left = "-100vw";
    right = "0";
    pageOrientation = "right";
  }else{
    page = rightPage;
    left = "0";
    right = "100vw";
    pageOrientation = "left";
  }
  leftPage.style.left = left;
  rightPage.style.left = right;
  const checkPositionInterval = setInterval(() => {
    const pageRect = page.getBoundingClientRect();
    const pageMiddle = pageRect.left + pageRect.width / 2;
    if (pageMiddle < 0 || pageMiddle > window.innerWidth) {
      if(pageOrientation === "left"){
        canvasContainerLeft.appendChild(canvas);
        canvas.style.borderColor = "rgba(90, 90, 255, 1)";
        characterSelected[0].transform.rotation = rotatingCharacter.transform.rotation;
      } else {
        canvasContainerRight.appendChild(canvas);
        canvas.style.borderColor = "rgba(255, 90, 90, 1)";
        characterSelected[1].transform.rotation = rotatingCharacter.transform.rotation;
      }
      displayCharacters();
      changeStats('both');
      clearInterval(checkPositionInterval);
    }
  }, 10);
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
  if(pageStatus === "main" && !characterGrabbed){
    rotatePlayer(rotatingCharacter, 0.003);
  }
}
function rotatePlayer(rotatingCharacter, angle){
  let q1 = rotatingCharacter.transform.rotation;
  rotatingCharacter.transform.rotation = [
    q1[0] * Math.cos(angle / 2) - q1[2] * Math.sin(angle / 2), // X
    q1[3] * Math.sin(angle / 2) + q1[1] * Math.cos(angle / 2), // Y
    q1[0] * Math.sin(angle / 2) + q1[2] * Math.cos(angle / 2), // Z
    q1[3] * Math.cos(angle / 2) - q1[1] * Math.sin(angle / 2)  // W
  ];
}

//character select scene loading
async function iniCharacterPageScene(){
  characterObjects = [];
  characterNames.forEach((name, index) => {
    characterObjects[index] = new Character(findObject(name + "Object"), name);
    characterObjects[index].applyScale();
    rotatePlayer(characterObjects[index], Math.PI);
  });
  if(characterSelected.length === 0){
    //first time loading
    characterSelected = [characterObjects[0], null];
  }else{
    //returning from game
    characterSelected[0] = characterObjects.find(character => character.stats.name === characterSelected[0].stats.name);
    characterSelected[1] = characterObjects.find(character => character.stats.name === characterSelected[1].stats.name);
  }
  let floor = findObject("Floor");
  let transform2 = floor.getComponentOfType(Transform);
  transform2.translation = [0, 0.1, 0];
  transform2.scale = [10, 0.1, 10];

  let wall1 = findObject("Wall1");
  let transform3 = wall1.getComponentOfType(Transform);
  transform3.translation = [0, 0, -5];
  transform3.scale = [10, 20, 0.1];
  displayCharacters();
}

//displays the characters depending on pageOrientation
function displayCharacters(){
  let side = pageOrientation === "left" ? 0 : 1;
  for(let i = 0; i < characterObjects.length; i++){
    if(characterObjects[i].stats.name === characterSelected[side].stats.name){
      characterObjects[i].transform.translation = [0, 0, 0];
      rotatingCharacter = characterObjects[i];
    }else{
      characterObjects[i].transform.translation = [30, 0, 0];
    }
  }
}

//assigns next or previous character to the selected player
function assignCharacter(direction){
  let side = pageOrientation === "left" ? 0 : 1;
  let player = side === 0 ? player1 : player2;
  if(player.ready){
    return;
  }
  let otherSide = side === 0 ? 1 : 0;
  let index = characterObjects.indexOf(characterSelected[side]);
  let rotation = characterSelected[side].transform.rotation;
  if(direction === "next"){
    characterSelected[side] = index === characterObjects.length - 1 ? characterObjects[0] : characterObjects[index + 1];
    index = characterObjects.indexOf(characterSelected[side]);
    if(characterSelected[side] === characterSelected[otherSide]){
      characterSelected[side] = index === characterObjects.length - 1 ? characterObjects[0] : characterObjects[index + 1];
    }
  }else{
    characterSelected[side] = index === 0 ? characterObjects[characterObjects.length - 1] : characterObjects[index - 1];
    index = characterObjects.indexOf(characterSelected[side]);
    if(characterSelected[side] === characterSelected[otherSide]){
      characterSelected[side] = index === 0 ? characterObjects[characterObjects.length - 1] : characterObjects[index - 1];
    }
  }
  characterSelected[side].transform.rotation = rotation;
  displayCharacters();
}

//changes the stats of the displayed character
function changeStats(side){
  if(side === 'left' || side === 'both'){
    document.getElementById("characterNameLeft").innerText = characterSelected[0].stats.name;
    document.getElementById("characterTitleLeft").innerText = characterSelected[0].stats.title;
    document.getElementById("difficultyBarLeft").style.width = characterSelected[0].stats.difficulty * 10 + "%";
    document.getElementById("offenseBarLeft").style.width = characterSelected[0].stats.offense * 10 + "%";
    document.getElementById("defenseBarLeft").style.width = characterSelected[0].stats.defense * 10 + "%";
    document.getElementById("playstyleLeft").innerText = characterSelected[0].stats.playstyle;
    document.getElementById("strengthLeft").innerText = characterSelected[0].stats.plusPassive;
    document.getElementById("weaknessLeft").innerText = characterSelected[0].stats.minusPassive;
    document.getElementById("abilityImgLeft").src = characterSelected[0].stats.abilityImage;
    document.getElementById("abilityLeft").src = characterSelected[0].stats.abilityImage;
    document.getElementById("abilityTextLeft").innerText = characterSelected[0].stats.abilityText;
    document.getElementById("funFactLeft").innerText = characterSelected[0].stats.funFact;
  }
  if(side === 'right' || side === 'both'){
    document.getElementById("characterNameRight").innerText = characterSelected[1].stats.name;
    document.getElementById("characterTitleRight").innerText = characterSelected[1].stats.title;
    document.getElementById("difficultyBarRight").style.width = characterSelected[1].stats.difficulty * 10 + "%";
    document.getElementById("offenseBarRight").style.width = characterSelected[1].stats.offense * 10 + "%";
    document.getElementById("defenseBarRight").style.width = characterSelected[1].stats.defense * 10 + "%";
    document.getElementById("playstyleRight").innerText = characterSelected[1].stats.playstyle;
    document.getElementById("strengthRight").innerText = characterSelected[1].stats.plusPassive;
    document.getElementById("weaknessRight").innerText = characterSelected[1].stats.minusPassive;
    document.getElementById("abilityImgRight").src = characterSelected[1].stats.abilityImage;
    document.getElementById("abilityRight").src = characterSelected[1].stats.abilityImage;
    document.getElementById("abilityTextRight").innerText = characterSelected[1].stats.abilityText;
    document.getElementById("funFactRight").innerText = characterSelected[1].stats.funFact;
  }
}


//starts the game
async function startGame(){
  loadingScreen();
  await initGame();
  $("#characterPage").hide();
  document.getElementById("game").style.visibility = "visible";
  $("#game").show(); //for 2nd and later showings
}
//exits the game
async function exitGame(){
  await initCharacterPage();
  $("#characterPage").show();
  $("#game").hide();
}


//button event listeners
gameBackButton.addEventListener('click', async function() {
  buttonSound.play().then();
  await exitGame();
});
readyButton1.addEventListener('click', function() {
  buttonSound.play().then();
  if(player1.ready){
    //button is cancel, set it to ready and unready the player
    turnButtonToReady(readyButton1);
    player1.ready = false;
  } else {
    if(player2.ready){
      //both players are ready, start the game
      startGame().then(() => {
      });
    }else{
      //set player to ready, set the button to cancel and move the page
      player1.ready = true;
      turnButtonToCancel(readyButton1, player1.ready);
      movePage();
    }
  }
});
readyButton2.addEventListener('click', function() {
  buttonSound.play().then();
  if(player2.ready){
    turnButtonToReady(readyButton2);
    player2.ready = false;
  } else {
    if(player1.ready){
      startGame().then(() => {});
    }else{
      player2.ready = true;
      turnButtonToCancel(readyButton2, player2.ready);
      movePage();
    }
  }
});
forwardToP2.addEventListener('click', function() {
  buttonSound.play().then();
  movePage();
});
backToP1.addEventListener('click', function() {
  buttonSound.play().then();
  movePage();
});
charNextButtonBlue.addEventListener('click', function() {
  buttonSound.play().then();
  assignCharacter("next");
  changeStats('left');
});
charPreviousButtonBlue.addEventListener('click', function() {
  buttonSound.play().then();
  assignCharacter("previous");
  changeStats('left');
});
charNextButtonRed.addEventListener('click', function() {
  buttonSound.play().then();
  assignCharacter("next");
  changeStats('right');
});
charPreviousButtonRed.addEventListener('click', function() {
  buttonSound.play().then();
  assignCharacter("previous");
  changeStats('right');
});


//init for the character page
async function initCharacterPage() {
  gameSound.pause();
  gameSound.currentTime = 0;
  introSound.currentTime = 0;
  await introSound.play();

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
  player1.ready = false;
  player2.ready = false;
  turnButtonToReady(readyButton1);
  turnButtonToReady(readyButton2);
  document.getElementById("gameBackButton").style.visibility = "hidden";

  await init(true);
  await initObjects(true);
  await iniCharacterPageScene();
  if(pageOrientation === "left"){
    changeStats('left');
  }else{
    changeStats('right');
  }
  constantRotation = setInterval(constantlyRotate, 5);
}


/////////////////////////////////////////////////////////////////////////////GAME/////////////////////////////////////////////////////////////

let spacePressed = false; //if space is pressed
let ball; //the ball component
let dragStart = []; //for ball dragging purposes
let dragEnd = [];
let gameNumber = 1;


//event listeners for the game
document.addEventListener("pointerlockchange", () => {
  characterGrabbed = document.pointerLockElement === canvas;
});
document.addEventListener("keydown", function(event){
  if(pageStatus === "game"){
    if(event.key === " "){
      game.activateAbility();
      console.log(game.currentPlayer.energy)
      spacePressed = true;
    }
  }
});
document.addEventListener("keyup", function(event){
  if(pageStatus === "game"){
    if(event.key === " "){
      spacePressed = false;
    }
  }
});
canvas.addEventListener("mousedown", () => {
  if (pageStatus === "main") {
    canvas.requestPointerLock();
  }else if(pageStatus === "game" && !ball.moving && game.turnStarted){
    canvas.requestPointerLock();
    dragEnd = dragStart;
    game.grabBall();
  }
});
canvas.addEventListener("mousemove", (event) => {
  if (characterGrabbed && pageStatus === "main") {
    rotatePlayer(rotatingCharacter, event.movementX * 0.01); // Rotate player based on mouse movement
  }else if(pageStatus === "game" && ball.isGrabbed){
    dragEnd = [dragEnd[0] + event.movementX, dragEnd[1] + event.movementY];
    game.dragBall(dragEnd[1] - dragStart[1], event);
  }else if (pageStatus === "game" && spacePressed && game.currentPlayer.character.stats.name === "CURVE" && !ball.isGrabbed && ball.moving) {
    game.activateCurveAbility(event);
  }
});
canvas.addEventListener("mouseup", () => {
  if(pageStatus === "game" && !ball.moving && ball.isGrabbed){
    if(Math.sqrt(Math.pow(dragEnd[0] - dragStart[0], 2) + Math.pow(dragEnd[1] - dragStart[1], 2)) < 85 || dragEnd[1] - dragStart[1] < 0){
      game.resetBall();
    }else{
      game.throwBall();
    }
  }
  document.exitPointerLock();
});


//starts the game
async function initGame(){
  introSound.pause();
  introSound.currentTime = 0;
  gameSound.currentTime = 0;
  await gameSound.play();

  pageStatus = "game";
  characterGrabbed = false;
  canvas.id = "gameCanvas";
  document.getElementById("game").appendChild(canvas);
  clearInterval(constantRotation);
  document.body.style.cursor = "default";
  document.getElementById("gameBackButton").style.visibility = "visible";
  dragStart = [canvas.width / 2, canvas.height / 2.3];
  dragEnd = [canvas.width / 2, canvas.height / 2.3];
  await init(false);
  initObjects(false);
  setPlayerObjects();
  game = new Game(player1, player2, ball, camera, canvas, gameNumber);
  gameNumber++;
  physics.game = game;
  game.setUp();
  setAABBs();
}


//sets player characters and moves others
function setPlayerObjects(){
  for(let i = 0; i < characterObjects.length; i++){
    let object = findObject(characterObjects[i].stats.reference);
    object.getComponentOfType(Transform).translation = [30, 0, 0];
  }
  player1.character = characterSelected[0];
  player2.character = characterSelected[1];
  player1.character.transform.translation = [0, 0, -14.2];
  player1.character.transform.rotation = [0, 0.707, 0, -0.707];
  player2.character.transform.translation = [0, 0, 14.2];
}

let originalTransforms = [];
//loads all the objects and saves their original transforms for future use
function initObjects(intro){
  if(intro){
    ball = loadObject("Ball", "dynamic");
    ball.isStatic = false;
    ball.addComponent(new Ball(ball));
    ball = ball.getComponentOfType(Ball);
    loadObject("AtlasObject", "static");
    loadObject("CurveObject", "static");
    loadObject("NeroObject", "static");
    loadObject("SpringObject", "static");
    loadObject("TrippObject", "static");
    loadObject("CupR1", "static");
    loadObject("CupR2", "static");
    loadObject("CupR3", "static");
    loadObject("CupR4", "static");
    loadObject("CupR5", "static");
    loadObject("CupR6", "static");
    loadObject("CupB1", "static");
    loadObject("CupB2", "static");
    loadObject("CupB3", "static");
    loadObject("CupB4", "static");
    loadObject("CupB5", "static");
    loadObject("CupB6", "static");
    loadObject("Wall1", "static");
    loadObject("Wall2", "static");
    loadObject("Wall3", "static");
    loadObject("Wall4", "static");
    loadObject("Floor", "static");
    loadObject("Table", "static");
    for(let i = 0; i < scene.children.length; i++){
      originalTransforms[i] = new Node();
      originalTransforms[i].name = scene.children[i].name;
      originalTransforms[i].addComponent(new Transform());
      let transform = originalTransforms[i].getComponentOfType(Transform);
      transform.translation = scene.children[i].getComponentOfType(Transform).translation;
      transform.rotation = scene.children[i].getComponentOfType(Transform).rotation;
      transform.scale = scene.children[i].getComponentOfType(Transform).scale;
      if(scene.children[i].name !== "Camera" && scene.children[i].name !== "Light") {
        scene.children[i].getComponentOfType(Transform).translation = [30, 0, 0];
      }
    }
  }else{
    for(let i = 0; i < scene.children.length; i++){
      if(scene.children[i].name !== "Camera" && scene.children[i].name !== "Light") {
        scene.children[i].getComponentOfType(Transform).translation = originalTransforms[i].getComponentOfType(Transform).translation;
        scene.children[i].getComponentOfType(Transform).rotation = originalTransforms[i].getComponentOfType(Transform).rotation;
        scene.children[i].getComponentOfType(Transform).scale = originalTransforms[i].getComponentOfType(Transform).scale;
      }
    }
  }
}

//masks the game loading
function loadingScreen(){
  let loadingScreen = document.getElementById("loadingScreen");
  loadingScreen.style.display = "block";
  let loadingCover = document.getElementById("loadingScreenCover");
  let loadingBar = document.getElementById("loadingScreenBar");
  let loadingText = document.getElementById("loadingScreenText");
  let loadingBarWidth = 0;
  let loadingTextContent = "Loading...";
  let loadingInterval = setInterval(() => {
    loadingBarWidth += 1;
    loadingBar.style.width = loadingBarWidth + "%";
    loadingCover.style.height = 42 - loadingBarWidth * 0.35 + "%";
    if(loadingBarWidth === 100){
      loadingTextContent = "Loading complete!";
      clearInterval(loadingInterval);
      setTimeout(() => {
        loadingScreen.style.display = "none";
      }, 500);
    }
    loadingText.innerText = loadingTextContent;
  }, 10);
}

/////////////////////////////////////////////////////////////////////////////INIT/////////////////////////////////////////////////////////////

async function initializeTheRenderer(){
  if(!renderer){
    renderer = new Renderer(canvas);
    await renderer.initialize();
  }
}

function initializeTheLoader(){
  if(!loader){
    loader = new GLTFLoader();
  }
}

async function initializeTheScene(){
  await loader.load('scene/scene.gltf'); // Load the scene
  scene = new Node();
}

function initializeTheCamera(intro){
  if(intro){
    if(!camera){
      camera = new Node();
      camera.name = 'Camera';
      camera.addComponent(new Camera({
        aspect: canvas.width / canvas.height,
        fovy: Math.PI / 3,
        near: 0.1,
        far: 100,
      }));
      camera.addComponent(new Transform({
        translation: [0, 10, 10],
        rotation: [-0.2, 0, 0, 1],
      }));
      scene.addChild(camera);
    }else{
      let cameraTransform = camera.getComponentOfType(Transform);
      cameraTransform.translation = [0, 10, 10];
      cameraTransform.rotation = [-0.2, 0, 0, 1];
    }
  }else{
    let cameraTransform = camera.getComponentOfType(Transform);
    cameraTransform.translation = [0, 9, -12.6];
    cameraTransform.rotation = [0, -0.99, -0.131, 0];
    camera.isStatic = true;
    camera.aabb = {
      min: [-0.5, -0.5, -0.5],
      max: [0.5, 0.5, 0.5],
    };
  }
}

async function initializeTheLight(intro){
  if(intro){
    if(!light){
      light = new Node();
      light.name = 'Light';
      light.addComponent(new Transform({
        translation: [0.2, 13, 9],
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
      scene.addChild(light);
    }else{
      let lightTransform = light.getComponentOfType(Transform);
      lightTransform.translation = [0.2, 13, 9];
      lightTransform.rotation = [-0.5, 0.1, 0, 1];
      let lightComponent = light.getComponentOfType(Light);
      lightComponent.color = [250, 245, 220];
      lightComponent.intensity = 1;
      lightComponent.attenuation = [0, 0.1, 0.03];
      lightComponent.ambientOff = 0.01;
      lightComponent.ambientOn = 0.04;
      lightComponent.fi = 3;
      lightComponent.fovy = Math.PI / 1.2;
      lightComponent.aspect = 1;
      lightComponent.near = 1;
      lightComponent.far = 200;
    }
  }else{
    let lightTransform = light.getComponentOfType(Transform);
    lightTransform.translation = [0, 16.5, 0];
    lightTransform.rotation = [-0.71, 0, 0, 1];
    let lightComponent = light.getComponentOfType(Light);
    lightComponent.color = [250, 245, 220];
    lightComponent.intensity = 1.5;
    lightComponent.attenuation = [0, 0.1, 0.03];
    lightComponent.ambientOff = 0.01;
    lightComponent.ambientOn = 0.04;
    lightComponent.fi = 2.5;
    lightComponent.fovy = Math.PI / 1.1;
    lightComponent.aspect = 1;
    lightComponent.near = 1;
    lightComponent.far = 200;
  }
}

async function initPhysics(){
  if(!physics){
    physics = new Physics();
  }
  physics.scene = scene;
}

function initializeSystems(){
  if(!resizeSystem || !updateSystem){
    resizeSystem = new ResizeSystem({ canvas, resize });
    updateSystem = new UpdateSystem({ update, render });
    resizeSystem.start();
    updateSystem.start();
  }
}

let previousTime = 0;
let accumulatedDt = 0;
function update(time, dt) {
  accumulatedDt += dt;
  if(time - previousTime > 0.008) {
    dt = accumulatedDt * 2;
    //console.log("difference", time - previousTime, "and dt is ", dt);
    previousTime = time;
    scene.traverse(node => {
      for (const component of node.components) {
        component.update?.(time, dt);
      }
    });
    //console.log(camera.getComponentOfType(FirstPersonController).node.getComponentOfType(Transform).translation, camera.getComponentOfType(FirstPersonController).node.getComponentOfType(Transform).rotation);
    if(physics){
      physics.update(time, dt);
    }
    accumulatedDt = 0;
  }
}

function render() {
  renderer.render(scene, camera, light);
}

function resize({ displaySize: { width, height }}) {
  camera.getComponentOfType(Camera).aspect = width / height;
}

async function init(intro){
  if(intro){
    if(physics){
      physics = null;
    }
    await initializeTheRenderer();
    await initializeTheLoader();
    await initializeTheScene();
    await initializeTheCamera(intro);
    await initializeTheLight(intro);
    await initializeSystems();
  }else{
    await initializeTheCamera(intro);
    await initializeTheLight(intro);
    await initPhysics();
  }
}

/////////////////////////////////////////////////////////////////////////////LOADING THE OBJECTS/////////////////////////////////////////////////

function findObject(name){
  let object = null;
  scene.traverse(node => {
    if(node.name === name){
      object = node;
    }
  });
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



