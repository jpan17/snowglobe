/*global THREE*/
/****************************** SCENE GLOBAL VARS ******************************/
var sceneWidth;
var sceneHeight;
var camera;
var scene;
var renderer;
var dom;
var clock;
var sound;

// objects related to scene objects
var light;
var hemisphere;
var ambient;
var sceneSubject;
var particleNum = 18000;
const maxRange = 1000;
const minRange = maxRange / 2;
const textureSize = 32.0;
var evergreens = [];
var cabin;

// colors
var darkBlue = 0x001029;
var lightBlue = 0x39c1e3;
var lightGreen = 0xbff5c8;
var white = 0xffffff;

/****************************** SCENE VARS *************************************/
var ground;

// obstacles in the game
var collidableObjects = []; // An array of collidable objects used later
var PLAYERCOLLISIONDIST = 5;
var TREECOUNT = 8;

/****************************** CONTROL VARS **********************************/
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

  drawRadialGradation(ctx, canvasRadius, canvas.width, canvas.height);

  const texture = new THREE.Texture(canvas);
  //texture.minFilter = THREE.NearestFilter;
  texture.type = THREE.FloatType;
  texture.needsUpdate = true;
  return texture;
}

init() 

function init() {
  clock = new THREE.Clock();
  clock.start();

	// set up the scene
  createScene();
  getPointerLock();
  animate();
}

function createScene(){
	// 1. set up scene
  sceneWidth=window.innerWidth;
  sceneHeight=window.innerHeight;
  scene = new THREE.Scene();//the 3d scene

	// 2. camera
  camera = new THREE.PerspectiveCamera(75, sceneWidth / sceneHeight, .4, 2000 );//perspective camera
  camera.position.y = 1;
  camera.position.z = 0;
  scene.add(camera);

	// 3. renderer
  renderer = new THREE.WebGLRenderer({antialias: true, alpha:true});//renderer with transparent backdrop
  renderer.setClearColor(0xffffff, 1); // enable fog (??)
  // renderer.setClearColor(new THREE.Color(0x000036));
  
  renderer.shadowMap.enabled = true;//enable shadow
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize( sceneWidth, sceneHeight );
  dom = document.getElementById('container');
	dom.appendChild(renderer.domElement);

  // setup player movement
  controls = new THREE.PlayerControls(camera, dom);
  controls.getObject().position.set(-2, 10, 50);
  scene.add(controls.getObject());

  // 4. lights
  hemisphere = new THREE.HemisphereLight( lightBlue, darkBlue, 0.6);
  scene.add(hemisphere);

  ambient = new THREE.AmbientLight( white, 0.3 );
  scene.add(ambient);

  light = new THREE.DirectionalLight( white, 0.9 );
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
  scene.fog = new THREE.FogExp2( lightGreen, 0.006)

  // 7. Snow
  const pointGeometry = new THREE.Geometry();
  for (let i = 0; i < particleNum; i++) {
      const x = Math.floor(Math.random() * maxRange - minRange);
      const y = Math.floor(Math.random() * maxRange + 20);
      const z = Math.floor(Math.random() * maxRange - minRange);
      const particle = new THREE.Vector3(x, y, z);
      pointGeometry.vertices.push(particle);
      const color = new THREE.Color(0xffffff);
      pointGeometry.colors.push(color);
  }
  
  const pointMaterial = new THREE.PointsMaterial({
      size: 4,
      color: 0xffffff,
      vertexColors: false,
      map: getTexture(),
      // blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8,
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

  // 8. Cabin
  cabin = new LogCabin(scene);

  // 9. Evergreens
  evergreenXs = [10, -30, 90, 59, 66, -82, -75, 14]
  evergreenZs = [-84, 21, 2, -17, 83, 45, -61, 78]
  for (var i = 0; i < 8; i++) {
    var randomScale = Math.random() * 0.5 + 0.3;
    evergreens.push(new Evergreen(scene, evergreenXs[i], evergreenZs[i], randomScale))
  }

  // 10. create the background
  sceneSubject = new Background(scene);

  // 11. sound
  // create an AudioListener and add it to the camera
  var listener = new THREE.AudioListener();
  camera.add( listener );

  // create a global audio source
  sound = new THREE.Audio( listener );

  // load a sound and set it as the Audio object's buffer
  var audioLoader = new THREE.AudioLoader();
  audioLoader.load( 'sounds/christmas.mp3', function( buffer ) {
    sound.setBuffer( buffer );
    sound.setLoop( true );
    sound.setVolume( 0.5 );
    sound.play();
  });

	window.addEventListener('resize', onWindowResize, false);//resize callback
}

function animate() {
    var delta = clock.getDelta();

    controls.animatePlayer(delta);
    // keep requesting renderer
    sceneSubject.update();

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
    requestAnimationFrame(animate);
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
}

/* This code was adapted from
https://docs.microsoft.com/en-us/windows/uwp/get-started/get-started-tutorial-game-js3d
*/
function rayIntersect(ray, distance, objects) {
  var close = [];
  if (Array.isArray(objects)) {
    var intersects = ray.intersectObjects(objects);
    for (var i = 0; i < intersects.length; i++) {
      // If there's a collision, push into close
      if (intersects[i].distance < distance) {
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
