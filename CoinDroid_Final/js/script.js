

var scene = new THREE.Scene();
//var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var android; // model
var collidableMeshList = []; // collision

// standard global variables
var container, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

// the following code is from
//    http://catchvar.com/threejs-animating-blender-models
var animOffset       = 0,   // starting frame of animation
	walking         = false,
	duration        = 1000, // milliseconds to complete animation
	keyframes       = 20,   // total number of animation frames
	interpolation   = duration / keyframes, // milliseconds per frame
	lastKeyframe    = 0,    // previous keyframe
	currentKeyframe = 0;

var renderer = new THREE.WebGLRenderer( );
renderer.setSize( window.innerWidth, window.innerHeight );
container = document.body.appendChild( renderer.domElement );

	// camera
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 110, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 1000;
	var camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene.add(camera);
	camera.position.set(0,10,-10);
	camera.lookAt(scene.position);

	// lighting
    var light0;  // A light shining from the direction of the camera; moves with the camera.
    light0 = new THREE.DirectionalLight();
    light0.position.set(0,0,1);
	scene.add(light0);

	var ambientLight = new THREE.AmbientLight( 0xFFFFFF, 0.3 );
	ambientLight.position.set(0,30,-20);
	scene.add( ambientLight );

	// hemisphere light
	var light1 = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
	light1.position.set( 0.5, 1, 0.75 );
	scene.add( light1 );

	// directional light
	var light = new THREE.DirectionalLight( 0xffffff, 2.25 );
	light.position.set( 200, 450, -50 );

	light.castShadow = true;

	light.shadow.mapSize.width = 1024;
	light.shadow.mapSize.height = 512;

	light.shadow.camera.near = 100;
	light.shadow.camera.far = 1200;

	light.shadow.camera.left = -1000;
	light.shadow.camera.right = 1000;
	light.shadow.camera.top = 350;
	light.shadow.camera.bottom = -350;

	// controls
	controls = new THREE.OrbitControls( camera, renderer.domElement );

// creates the shape
var geometry = new THREE.CubeGeometry( 1000, 1000, 1000 );
var cubeMaterials = [
    new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load( 'skybox/Daylight Box_Front.bmp' ), side: THREE.DoubleSide }), //front side
    new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load( 'skybox/Daylight Box_Back.bmp' ), side: THREE.DoubleSide }), //back side
    new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load( 'skybox/Daylight Box_Top.bmp' ), side: THREE.DoubleSide }), //up side
    new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load( 'skybox/Daylight Box_Bottom.bmp'), side: THREE.DoubleSide }), //down side
    new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load( 'skybox/Daylight Box_Left.bmp' ), side: THREE.DoubleSide }), //right side
    new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load( 'skybox/Daylight Box_Right.bmp' ), side: THREE.DoubleSide }) //left side
];

var cubeMaterial = new THREE.MeshFaceMaterial( cubeMaterials );
var cube = new THREE.Mesh( geometry, cubeMaterial );
scene.add( cube );

	// ground: grass
	var floorTexture = new THREE.ImageUtils.loadTexture( 'textures/grasslight-big.png' );
	floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
	floorTexture.repeat.set( 80, 80 );
	var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
	var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
	var floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.position.y = -0.5;
	floor.rotation.x = Math.PI / 2;
	scene.add(floor);

	// road
	var roadTexture = new THREE.ImageUtils.loadTexture('textures/road.jpg');
	roadTexture.wrapS = roadTexture.wrapT = THREE.RepeatWrapping;
	roadTexture.repeat.set( 1, 25 );
	roadTexture.anisotropy = 32;
	var roadMaterial = new THREE.MeshLambertMaterial( { map: roadTexture } );
	var mesh1 = new THREE.Mesh(new THREE.PlaneGeometry( 25, 1000 ), roadMaterial );
	mesh1.position.y = -0.45;
	mesh1.rotation.x = - Math.PI / 2;
	mesh1.receiveShadow = true;
	scene.add( mesh1 );

	// crate
	var boxTexture = new THREE.ImageUtils.loadTexture('textures/box.jpg');
	var boxMaterial = new THREE.MeshLambertMaterial( { map: boxTexture } );
	var crate = new THREE.Mesh( new THREE.BoxGeometry( 5, 5, 5 ), boxMaterial );
	crate.position.y = 2;
	crate.position.x = 50;
	crate.position.z = 50;
	scene.add(crate);
  collidableMeshList.push(crate);

//avatar
// instantiate a loader
var loader = new THREE.JSONLoader();

// load a resource
loader.load(
	// resource URL
	'js/android-animations.js',

	// onLoad callback
	function ( geometry, materials ) {

		// for preparing animation
		for (var i = 0; i < materials.length; i++)
		materials[i].morphTargets = true;

		var material = new THREE.MeshFaceMaterial( materials );
		android = new THREE.Mesh( geometry, material );
		android.scale.set(0.3,0.3,0.3);
		android.position.y=-0.4;
		scene.add( android );
	},

	// onProgress callback
	function ( xhr ) {
		console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
	},

	// onError callback
	function( err ) {
		console.log( 'An error happened' );
	}
);


// instantiate a loader
/*var loader = new THREE.OBJLoader();

// load a resource
loader.load(
	// resource URL
	'models/boy.obj',
	// called when resource is loaded
	function ( object ) {
		object.setTexturePath = "textures/box.jpg";
		object.scale.set(0.1,0.1,0.1);
		object.position.y = 0;
		object.position.x = 20;
		object.position.z = 25;
		scene.add( object );

	},
	// called when loading is in progresses
	function ( xhr ) {

		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

	},
	// called when loading has errors
	function ( error ) {

		console.log( 'An error happened' );

	}
);*/


//game logic
function update() {
	// delta = change in time since last call (seconds)
	delta = clock.getDelta();
	var moveDistance = 15 * delta;
	walking = false;

	if (Gamepad.supported)
	{
		var pads = Gamepad.getStates();
        var pad = pads[0]; // assume only 1 player.
        if (pad)
		{

			// adjust for deadzone.
			if (Math.abs(pad.leftStickX + pad.rightStickX) > 0.3)
			{
				android.rotation.y -= delta * (pad.leftStickX + pad.rightStickX);
				walking = true;
			}
			if (Math.abs(pad.leftStickY + pad.rightStickY) > 0.2)
			{
				android.translateZ( -moveDistance * (pad.leftStickY + pad.rightStickY) );
				walking = true;
			}
			if ( pad.faceButton0 || pad.faceButton1 || pad.faceButton2 || pad.faceButton3 || pad.select || pad.start )
			{
			    android.position.set(0,0,0);
				android.rotation.set(0,0,0);
			}

        }
	}

	// move forwards / backwards
	if ( keyboard.pressed("down") )
		android.translateZ( -moveDistance );
	if ( keyboard.pressed("up") )
		android.translateZ(  moveDistance );
	// rotate left/right
	if ( keyboard.pressed("left") )
		android.rotation.y += delta;
	if ( keyboard.pressed("right") )
		android.rotation.y -= delta;


	var walkingKeys = ["up", "down", "left", "right"];
	for (var i = 0; i < walkingKeys.length; i++)
	{
		if ( keyboard.pressed(walkingKeys[i]) )
			walking = true;
	}

	// collision detection:
	//   determines if any of the rays from the cube's origin to each vertex
	//		intersects any face of a mesh in the array of target meshes
	//   for increased collision accuracy, add more vertices to the cube;
	//		for example, new THREE.CubeGeometry( 64, 64, 64, 8, 8, 8, wireMaterial )
	//   HOWEVER: when the origin of the ray is within the target mesh, collisions do not occur
	var originPoint = android.position.clone();

	for (var vertexIndex = 0; vertexIndex < android.geometry.vertices.length; vertexIndex++)
	{
		var localVertex = android.geometry.vertices[vertexIndex].clone();
		var globalVertex = localVertex.applyMatrix4( android.matrix );
		var directionVector = globalVertex.sub( android.position );

		var ray = new THREE.Raycaster( originPoint, directionVector.clone().normalize() );
		var collisionResults = ray.intersectObjects( collidableMeshList );
		if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() )
				if (confirm("Game Over! Restart Game?")) {
                    GameOver(); // reset global variables
					init();
				} else {
					txt = "You pressed Cancel!";
				}
	}

	controls.update();

	var relativeCameraOffset = new THREE.Vector3(0,8,-15);
	var cameraOffset = relativeCameraOffset.applyMatrix4( android.matrixWorld );

	camera.position.x = cameraOffset.x;
	camera.position.y = cameraOffset.y;
	camera.position.z = cameraOffset.z;
	camera.lookAt( android.position );

}

function ResetGlobalVariables(){
   //list of all the variables with original attributes here
	  animOffset       = 0,   // starting frame of animation
	 	walking         = false,
	 	duration        = 1000, // milliseconds to complete animation
	 	keyframes       = 20,   // total number of animation frames
	 	interpolation   = duration / keyframes, // milliseconds per frame
	 	lastKeyframe    = 0,    // previous keyframe
	 	currentKeyframe = 0;

		collidableMeshList = [];
}

function GameOver(){
    container.canvas.removeEventListener('mousemove', function(event){
        canvasMouseOver(event);
    });
    ResetGlobalVariables();
}

//render logic
function render() {
	if ( android && walking ) // exists / is loaded
	{
		// Alternate morph targets
		time = new Date().getTime() % duration;
		keyframe = Math.floor( time / interpolation ) + animOffset;
		if ( keyframe != currentKeyframe )
		{
			android.morphTargetInfluences[ lastKeyframe ] = 0;
			android.morphTargetInfluences[ currentKeyframe ] = 1;
			android.morphTargetInfluences[ keyframe ] = 0;
			lastKeyframe = currentKeyframe;
			currentKeyframe = keyframe;
		}
		android.morphTargetInfluences[ keyframe ] =
			( time % interpolation ) / interpolation;
		android.morphTargetInfluences[ lastKeyframe ] =
			1 - android.morphTargetInfluences[ keyframe ];
	}

    renderer.render( scene, camera );
}


//run game loop (update, render, repeat)
function GameLoop() {
    requestAnimationFrame( GameLoop);
    update();
    render();
};

GameLoop();
