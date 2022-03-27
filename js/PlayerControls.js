// initializes the player
THREE.PlayerControls = function(camera, domElement) {
	var scope = this;

    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();

    this.domElement = ( domElement !== undefined ) ? domElement : document;

    this.position.x = camera.position.x;
    this.position.y = camera.position.y;
	this.position.z = camera.position.z;

	this.block = new THREE.Object3D();
	this.block.add(camera);
	this.block.position = this.position;

    // The four arrow keys
	this.keys = { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40 };

	// Mouse buttons
    this.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT };

	var euler = new THREE.Euler( 0, 0, 0, 'YXZ' );

	var PI_2 = Math.PI / 2;

	function onMouseMove( event ) {
		if ( scope.isLocked === false ) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
		euler.setFromQuaternion( camera.quaternion );
		euler.y -= movementX * 0.002;
		euler.x -= movementY * 0.002;
		euler.x = Math.max( - PI_2, Math.min( PI_2, euler.x ) );
		camera.quaternion.setFromEuler( euler );
	}

	function onPointerlockChange() {
		if ( document.pointerLockElement === scope.domElement ) {
			//scope.dispatchEvent( { type: 'lock' } );
			//scope.isLocked = true;
		} else {
			//scope.dispatchEvent( { type: 'unlock' } );
			//scope.isLocked = false;
		}

	}

	function onPointerlockError() {
		console.error( 'THREE.PointerLockControls: Unable to use Pointer Lock API' );
	}

	this.connect = function () {
		document.addEventListener( 'mousemove', onMouseMove, false );
		document.addEventListener( 'pointerlockchange', onPointerlockChange, false );
		document.addEventListener( 'pointerlockerror', onPointerlockError, false );
	};

	this.disconnect = function () {
		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'pointerlockchange', onPointerlockChange, false );
		document.removeEventListener( 'pointerlockerror', onPointerlockError, false );
	};

	this.dispose = function () {
		this.disconnect();
	};

	this.getObject = function () {
		return this.block;
	};

	this.getPosition = function() {
		return this.block.position;
	}
	
	this.getDirection = function () {
		var direction = new THREE.Vector3( 0, 0, 0 );
		camera.getWorldDirection(direction);
		return direction;
	};

	this.lock = function () {
		this.domElement.requestPointerLock();
	};

	this.unlock = function () {
		document.exitPointerLock();
	};

	this.connect();

	this.enabled = false;

	this.moveForward = false;
	this.moveBackward = false;
	this.moveLeft = false;
	this.moveRight = false;

	this.onKeyDown = function ( event ) {
		switch ( event.keyCode ) {
			case scope.keys.UP: // up
			case 87: // w
				scope.moveForward = true;
				break;
			case scope.keys.LEFT: // left
			case 65: // a
				scope.moveLeft = true;
				break;
			case scope.keys.DOWN: // down
			case 83: // s
				scope.moveBackward = true;
				break;
			case scope.keys.RIGHT: // right
			case 68: // d
				scope.moveRight = true;
				break;
		}
	};

	this.onKeyUp = function ( event ) {
		switch( event.keyCode ) {
			case 38: // up
			case 87: // w
				scope.moveForward = false;
				break;
			case 37: // left
			case 65: // a
				scope.moveLeft = false;
				break;
			case 40: // down
			case 83: // s
				scope.moveBackward = false;
				break;
			case 39: // right
			case 68: // d
				scope.moveRight = false;
				break;
		}
	};

	document.addEventListener( 'keydown', this.onKeyDown, false );
	document.addEventListener( 'keyup', this.onKeyUp, false );

	this.playerCollision = function(deltaV) {
		// apply ray to new player camera
		var playerPos = this.block.position;
		var dir = deltaV.clone().normalize();
		var rayCaster = new THREE.Raycaster(playerPos, dir);

		// if our ray hit a collidable object return true
		var hits = rayIntersect(rayCaster, PLAYERCOLLISIONDIST, collidableObjects);
		
		if (hits.length >= 1) {
			//console.log(hits.length)
			return hits;
		}
		return undefined;
	}

	this.animatePlayer = function(delta) {
		// Gradual slowdown
		//console.log(this.getDirection());
		var speed = 200;
		var velocity = this.velocity;

		// slow down based on friction
		velocity.x -= velocity.x * 10 * delta;
		velocity.z -= velocity.z * 10 * delta;

		// get change in velocity based on 
		var dir = this.getDirection();
		dir.y = 0;
		dir.normalize();
		dir.multiplyScalar(speed * delta);
		var deltaV = new THREE.Vector3();
		if (this.moveForward) {
			deltaV.add(dir);
		}
		if (this.moveBackward) {
			deltaV.sub(dir);
		}
		if (this.moveLeft) {
			deltaV.x += dir.z;
			deltaV.z -= dir.x;
		}
		if (this.moveRight) {
			deltaV.x -= dir.z;
			deltaV.z += dir.x;
		}

		var hits = this.playerCollision(deltaV);
		if (hits != undefined) {
			var correction = new THREE.Vector3();
			for(let i = 0; i < hits.length; i++) {
				var norm = hits[i].face.normal.clone();
				var project = deltaV.clone().projectOnVector(norm);
				correction.add(deltaV.clone().add(project).normalize());
			}
			//velocity = correction.multiplyScalar(speed * delta);
			velocty = new THREE.Vector3();
		} else {
			velocity.add(deltaV);
		}
		this.block.translateX(velocity.x * delta);
		this.block.translateZ(velocity.z * delta);
	}

	var havePointerLock = 'pointerLockElement' in document ||
	 											'mozPointerLockElement' in document ||
	  										'webkitPointerLockElement' in document;

	if ( havePointerLock ) {
		var element = document.body;
		var pointerlockchange = function ( event ) {
			if ( document.pointerLockElement === element ||
						document.mozPointerLockElement === element ||
						document.webkitPointerLockElement === element ) {
				scope.controlsEnabled = true;
				document.addEventListener( 'mousemove', onMouseMove, false );
			} else {
				scope.controlsEnabled = false;
			}
		};
		var pointerlockerror = function ( event ) {
			//There was an error
		};
		// Hook pointer lock state change events
		document.addEventListener( 'pointerlockchange', pointerlockchange, false );
		document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
		document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
		document.addEventListener( 'pointerlockerror', pointerlockerror, false );
		document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
		document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

	} else {
		document.body.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
	}


	//var newDiv = document.createElement("div");
	//newDiv.innerHTML = "Click to play";
	//document.body.appendChild (newDiv);
	document.body.addEventListener("click", function() {
		var element = document.body;
		element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
		element.requestPointerLock();
	});
};
