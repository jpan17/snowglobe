/*global THREE*/
/****************************** SCENE GLOBAL VARS ******************************/

var sceneWidth;
var sceneHeight;
var camera;
var scene;
var renderer;
var dom;
var clock;

// objects related to scene objects
var light;
var hemisphere;
var ambient;
var sceneSubject;
var starNum = 30000;
var particleNum = 5000;
const noise = new SimplexNoise();
const maxRange = 1000;
const minRange = maxRange / 2;
const textureSize = 64.0;

// colors
var darkBlue = 0x001029;
var blue = 0x0f67d4;
var lightBlue = 0x39c1e3;
var lightGreen = 0x26c9a3;
var green = 0x149174;
var darkGreen = 0x04362a;
var white = 0xffffff;

/****************************** FLAGS *****************************************/
var random = false;
var DEBUG = false;

/****************************** ROOM VARS *************************************/
var ground;
var backWall;
var leftWall;
var rightWall;
var frontWall; // front means facing player initially

var backDist = 200;
var leftDist = -200;
var rightDist = 200;
var frontDist = -200;

// obstacles in the game
var collidableObjects = []; // An array of collidable objects used later
var PLAYERCOLLISIONDIST = 5;

/****************************** CONTROL VARS **********************************/
var blocker = document.getElementById('blocker');
//var orbitControl;

// control global variables
var player;
var controls;
var controlsEnabled = false;
var gameStarted = false;
// Flags to determine which direction the player is moving
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;

var MOVESPEED = 30,
    LOOKSPEED = 0.075

getPointerLock();

const drawRadialGradation = (ctx, canvasRadius, canvasW, canvasH) => {
  ctx.save();
  const gradient = ctx.createRadialGradient(canvasRadius,canvasRadius,0,canvasRadius,canvasRadius,canvasRadius);
  gradient.addColorStop(0, 'rgba(255,255,255,1.0)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,canvasW,canvasH);
  ctx.restore();
}

const getTexture = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const diameter = textureSize;
  canvas.width = diameter;
  canvas.height = diameter;
  const canvasRadius = diameter / 2;

  /* gradation circle
  ------------------------ */
  drawRadialGradation(ctx, canvasRadius, canvas.width, canvas.height);
  
  /* snow crystal
  ------------------------ */
  // drawSnowCrystal(ctx, canvasRadius);

  const texture = new THREE.Texture(canvas);
  //texture.minFilter = THREE.NearestFilter;
  texture.type = THREE.FloatType;
  texture.needsUpdate = true;
  return texture;
}

init() 

function init() {
  //listenForPlayerMovement();

  clock = new THREE.Clock();
  clock.start();

	// set up the scene
  createScene();
  
	//call game loop
  getPointerLock();
  animate();
}

function createScene(){
	// 1. set up scene
  sceneWidth=window.innerWidth;
  sceneHeight=window.innerHeight;
  scene = new THREE.Scene();//the 3d scene

	// 2. camera
  camera = new THREE.PerspectiveCamera( 75, sceneWidth / sceneHeight, .4, 2000 );//perspective camera
  camera.position.y = 2;
  camera.position.z = 0;
  scene.add(camera);

	// 3. renderer
  renderer = new THREE.WebGLRenderer({alpha:true});//renderer with transparent backdrop
  renderer.setClearColor(0xffffff, 1); // enable fog (??)
  
  renderer.shadowMap.enabled = true;//enable shadow
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize( sceneWidth, sceneHeight );
  dom = document.getElementById('container');
	dom.appendChild(renderer.domElement);

  // setup player movement
  controls = new THREE.PlayerControls(camera, dom);
  controls.getObject().position.set(0, 0, 0);
  scene.add(controls.getObject());

  // 4. lights
  hemisphere = new THREE.HemisphereLight( white, white, 1);
  scene.add(hemisphere);

  ambient = new THREE.AmbientLight( white, 0.3 );
  scene.add(ambient);

  light = new THREE.DirectionalLight( 0xffffff, 0.03 );
  light.rotateOnAxis(new THREE.Vector3(0, 0, 0), -Math.PI);
  light.castShadow = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  light.shadow.mapSize.width = 1028;
  light.shadow.mapSize.height = 1028;
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 1000;
  light.shadow.camera.left = -100;
  light.shadow.camera.right = 100;
  light.shadow.camera.top = 100;
  light.shadow.camera.bottom = -100
  scene.add(light)

  // 6. Fog
  scene.fog = new THREE.FogExp2( lightGreen, 0.03 )

  // 7. Stars
  var starGeometry = new THREE.SphereGeometry(0.1, 20, 20)
  var starMaterial = new THREE.MeshBasicMaterial( {
    color: lightGreen,
    side: THREE.DoubleSide
  })

  // 7. Particles
   /* Snow Particles
    -------------------------------------------------------------*/
    const pointGeometry = new THREE.Geometry();
    for (let i = 0; i < particleNum; i++) {
        const x = Math.floor(Math.random() * maxRange - minRange);
        const y = Math.floor(Math.random() * maxRange - minRange);
        const z = Math.floor(Math.random() * maxRange - minRange);
        const particle = new THREE.Vector3(x, y, z);
        pointGeometry.vertices.push(particle);
        // const color = new THREE.Color(0xffffff);
        // pointGeometry.colors.push(color);
    }
    
    const pointMaterial = new THREE.PointsMaterial({
        size: 8,
        color: 0xffffff,
        vertexColors: false,
        map: getTexture(),
        // blending: THREE.AdditiveBlending,
        transparent: true,
        // opacity: 0.8,
        fog: true,
        depthWrite: false
    });

    const velocities = [];
    for (let i = 0; i < particleNum; i++) {
        const x = Math.floor(Math.random() * 6 - 3) * 0.1;
        const y = Math.floor(Math.random() * 10 + 3) * - 0.05;
        const z = Math.floor(Math.random() * 6 - 3) * 0.1;
        const particle = new THREE.Vector3(x, y, z);
        velocities.push(particle);
    }

    particles = new THREE.Points(pointGeometry, pointMaterial);
    particles.geometry.velocities = velocities;
    scene.add(particles);

  for (var i = 0; i < starNum; i++) {
    var star = new THREE.Mesh(starGeometry, starMaterial);
    var x = -500 + Math.random() * 1000;
    var y = -500 + Math.random() * 1000;
    var z = -500 + Math.random() * 1000;
    star.position.set(x, y, z);
    scene.add(star);
  }

  // create the background
  sceneSubject = [new Background(scene)];

	window.addEventListener('resize', onWindowResize, false);//resize callback
}


// used this to calculate coordinates
// http://fmwriters.com/Visionback/Issue14/wbputtingstars.htm
function calculateCartesianX(raHour, raMinute, raSecond, 
  declinationDegree, declinationMinute, declinationSecond) {

    var A = raHour * 15 + raMinute * 0.25 + raSecond * 0.004166;
    var sign = 1;
    if (declinationDegree <= 0) {
      sign = -1;
    }
    var B = (Math.abs(declinationDegree) + declinationMinute / 60 + declinationSecond / 3600) * sign * declinationDegree;
    var C = 160;

    return (C * Math.cos(B)) * Math.cos(A)

}

function calculateCartesianY(raHour, raMinute, raSecond, 
  declinationDegree, declinationMinute, declinationSecond) {

    var A = raHour * 15 + raMinute * 0.25 + raSecond * 0.004166;
    var sign = 1;
    if (declinationDegree <= 0) {
      sign = -1;
    }
    var B = (Math.abs(declinationDegree) + declinationMinute / 60 + declinationSecond / 3600) * sign * declinationDegree;
    var C = 160;

    return (C * Math.cos(B)) * Math.sin(A)

}

function animate() {
    var delta = clock.getDelta();

    controls.animatePlayer(delta);

    render();

    // keep requesting renderer
    requestAnimationFrame(animate);
    sceneSubject[0].update();

    const posArr = particles.geometry.vertices;
    const velArr = particles.geometry.velocities;

    posArr.forEach((vertex, i) => {
        const velocity = velArr[i];
        
        const velX = Math.sin(delta * 0.001 * velocity.x) * 0.1;
        const velZ = Math.cos(delta * 0.0015 * velocity.z) * 0.1;
        
        vertex.x += velX;
        vertex.y += velocity.y;
        vertex.z += velZ;

        if (vertex.y < -minRange ) {
            vertex.y = minRange;
        }

    })

    particles.geometry.verticesNeedUpdate = true;

    renderer.render(scene, camera);

    requestAnimationFrame(render);

}

function render(){
  renderer.render(scene, camera);//draw
}

function onWindowResize() {
	//resize & align
	sceneHeight = window.innerHeight;
	sceneWidth = window.innerWidth;
	renderer.setSize(sceneWidth, sceneHeight);
	camera.aspect = sceneWidth/sceneHeight;
	camera.updateProjectionMatrix();
}

function getPointerLock() {
  document.onclick = function () {
    dom.requestPointerLock();
  }
  if (!gameStarted) {
    document.addEventListener('pointerlockchange', lockChange, false);
    gameStarted = true;
    // console.log("ruh roh")
  } else {
    // console.log("uh oh")
  }
}

function lockChange() {
    // Turn on controls
    if (document.pointerLockElement === dom) {
        // Hide blocker and instructions
        controls.enabled = true;
        gameStarted = true;
    // Turn off the controls
    } else {
      // Display the blocker and instruction
        controls.enabled = false;
        gameStarted = true;
    }
}

function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}

function radiansToDegrees(radians) {
  return radians * 180 / Math.PI;
}

var fade_out = function() {
  instructions.innerHTML = ""; 
  doorFound = false;
}

/* This code was adapted from
https://docs.microsoft.com/en-us/windows/uwp/get-started/get-started-tutorial-game-js3d
*/

function rayIntersect(ray, distance, objects) {
  var close = [];
  //console.log(distance);
  if (Array.isArray(objects)) {
    var intersects = ray.intersectObjects(objects);
    for (var i = 0; i < intersects.length; i++) {
      // If there's a collision, push into close
      if (intersects[i].distance < distance) {
        //console.log(intersects[i].distance);
        close.push(intersects[i]);
      }
    }
  }
  else {
    var intersect = ray.intersectObject(objects);
      if (intersect.distance < distance) {
        close.push(intersect);
    }
  }
  return close;
}
