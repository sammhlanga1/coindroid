
/*----------- WebGL compatibility check ----------*/
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

// custom global variables
// scene to render on, a camera to show us the scene, and a renderer to draw on the scene
var scene, renderer, container, controls;
var android, jsonLoader, cube, frontLight,backLight,numLights = 40;
var cameraView = false, avatarView = false, gameOver = false;
var windowWidth, windowHeight;
var tube1 = new THREE.Object3D();
var tube2 = new THREE.Object3D();

var SEPARATION = 85, AMOUNTX = 2, AMOUNTY = 6;
var particles, particle, coinGroup1, coin1
    count = 0, FrameNumber = 0;

var raycaster, cubeCamera;
var cubes = new THREE.Object3D();
var coins = new THREE.Object3D();
var ground = new THREE.Object3D();
var surfaceCurve = new THREE.Object3D();
var skybox;
var lights = new THREE.Object3D();

var rotateCoins0 = [];
var rotateCoins1 = [];

var audio = document.getElementById("music");
var audio1 = document.getElementById("celebrate");

var score = 0;
var timeCount = 60;
var objectMeshList = [];
var coinMeshList = [];
var dimeMeshList = [];
var lights = [];
var objects=[];
var s = document.getElementsByClassName("center");
var t = document.getElementsByClassName("centered");

var views = [
	{
		left: 0.0,
		top: 0.0,
		width: 1.0,
		height: 1.0,
		background: new THREE.Color( 0,0,0 ),
		eye: [ 0, 100, 500 ],
		up: [ 0, 100, 0 ],
		fov: 75,
		updateCamera: function ( camera, scene ) {
			camera.lookAt( scene.position );
		}
	},
	{
		left: 0.7,
		top: 0.7,
		width: 0.3,
		height: 0.3,
		background: new THREE.Color( 0.7, 0.5, 0.5 ),
		eye: [ 0, 1000, 0 ],
		up: [ 0, 0, -20 ],
		fov: 35,
		updateCamera: function ( camera, scene ) {
			camera.lookAt( camera.position.clone().setY( 0 ) );
		}
	}
];

var textureURLs = [  // URLs of the six faces of the cube map
    'skybox/Sorsele2/posx.jpg',   // Note:  The order in which
    "skybox/Sorsele2/negx.jpg",   //   the images are listed is
    "skybox/Sorsele2/posy.jpg",   //   important!
    "skybox/Sorsele2/negy.jpg",
    "skybox/Sorsele2/posz.jpg",
    "skybox/Sorsele2/negz.jpg"
];

// the following code is from
// animating-blender-model
var animOffset       = 0,   // starting frame of animation
    walking         = false,
    duration        = 1000, // milliseconds to complete animation
    keyframes       = 20,   // total number of animation frames
    interpolation   = duration / keyframes, // milliseconds per frame
    lastKeyframe    = 0,    // previous keyframe
    currentKeyframe = 0;

// checks if browser supports pointlocker and activates it if supported
var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
if ( havePointerLock ) {
    var element = document.body;
    var pointerlockchange = function ( event ) {
        if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
            controlsEnabled = true;
            controls.enabled = true;
            blocker.style.display = 'none';
        } else {
            controls.enabled = false;
            blocker.style.display = 'block';
            instructions.style.display = '';
        }
    };
    var pointerlockerror = function ( event ) {
        instructions.style.display = '';
    };
    // Hook pointer lock state change events
    document.addEventListener( 'pointerlockchange', pointerlockchange, false );
    document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
    document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
    document.addEventListener( 'pointerlockerror', pointerlockerror, false );
    document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
    document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );
    instructions.addEventListener( 'click', function ( event ) {
        instructions.style.display = 'none';
        // Ask the browser to lock the pointer
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
        element.requestPointerLock();
    }, false );
} else {
    instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
}

init();
animate();

var controlsEnabled = false;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var vertex = new THREE.Vector3();

//---------- The init function is what we use to initialize the scene, camera, and renderer as well as any other objects ----------//
function init() {

    //---------- scene  ----------//
    scene = new THREE.Scene();
		/*scene = new Physijs.Scene;
		scene.setGravity(new THREE.Vector3( 0, -300, 0 ));*/

    //---------- camera ----------//
	  /*
		Field_of_view is how wide your vision is, aspect_ratio is the size of the viewing window, near_clip is how
		close you can get to an object before it stops rendering, and far_clip is how far away an object can be before
		it stops rendering
		*/

		for (var ii =  0; ii < views.length; ++ii ) {
				if(ii==0){
		      //world camera
		  		var view = views[ii];
		  		var camera = new THREE.PerspectiveCamera( view.fov, window.innerWidth / window.innerHeight, 1, 20000 );
		  		camera.position.fromArray( view.eye );
		  		camera.up.fromArray( view.up );
		  		view.camera = camera;
		  		controls = new THREE.PointerLockControls( camera );
				}else{
		      //map camera
		  		var view = views[ii];
		  		var camera = new THREE.OrthographicCamera( -500, 2000, 1000, -1000, 1, 10000 );
		  		camera.position.fromArray( view.eye );
		  		camera.up.fromArray( view.up );
		  		view.camera = camera;
				}
		}

    //---------- renderer ----------//
    renderer = new THREE.WebGLRenderer( {antialias:true} );
    renderer.setSize ( window.innerWidth, window.innerHeight );
    container = document.body.appendChild( renderer.domElement );

		renderer.shadowMap.enabled = true; //for lighting

    //----------  lighting ---------- //

    scene.add( new THREE.AmbientLight( 0x666666 ) ); // ambient light

    backLight	= new THREE.DirectionalLight(0xdfebff, 0.75)
    backLight.position.set(-50, -200, -100);
		backLight.castShadow = true;
    scene.add( backLight );

    frontLight = new THREE.DirectionalLight( 0xdfebff, 1 ); // directional light
    frontLight.position.set( 50, 200, 100 );
    frontLight.position.multiplyScalar( 1.3 );
    frontLight.castShadow = true;
    frontLight.shadow.mapSize.width = 4096;
    frontLight.shadow.mapSize.height = 4096;
    var d = 1000;
    frontLight.shadow.camera.left = - d;
    frontLight.shadow.camera.right = d;
    frontLight.shadow.camera.top = d;
    frontLight.shadow.camera.bottom = - d;
    frontLight.shadow.camera.far = 1000;
    scene.add( frontLight );

    //---------- add avatar: addModel function is called back after model has loaded ----------//
    jsonLoader = new THREE.JSONLoader();
    jsonLoader.load( "js/android-animations.js", addModel );

    // window resize
    window.addEventListener( 'resize', onWindowResize, false );

    // controls: point locker
    //controls = new THREE.PointerLockControls( camera );
    scene.add( controls.getObject() );
    addPointlocker();

    //---------- axes: help visualize the 3D space ---------- //
    var axes = new THREE.AxisHelper(100);
    scene.add(axes);

    //---------- sky box ----------//
    addSkybox();

    //---------- add plane on which the avatar will move ---------//
    drawBox();

	//---------- coins randomly distributed ----------//
	  coinsorder1();
	  coinsorder2();
	  ground.add(coins);

  	//score
    s[0].innerHTML = "Score: " + score;

  	//timer
    t[0].innerHTML = "Timer: " + timeCount;

    //---------- cubes ----------//
	  dimes();
    barrier();

    //---------- surface and curve -----------//
    addSurfaceCurve();

}

function loadTextures(textureURLs, callback) {
    var loaded = 0;
    function loadedOne() {
        loaded++;
        if (callback && loaded == textureURLs.length) { // all tectures have been loaded
            for (var i = 0; i < textureURLs; i++)
                textures[i].needsUpdate = true;
            callback();
        }
    }
    /* A funtion that will be called if the attempt to load the texture fails. */
    function textureError() {
        document.getElementById("message").innerHTML = "Error: Failed to load texture.";
    }
    var textures = new Array( textureURLs.length );
    for (var i = 0; i < textureURLs.length; i++) {
       var tex = THREE.ImageUtils.loadTexture( textureURLs[i], undefined, loadedOne, textureError );
       textures[i] = tex;
    }
    return textures;
}

function loadCubemapTexture(textureURLs, callback) {
    /* A funtion that will be called if the attempt to load the texture fails. */
    function textureError() {
        document.getElementById("message").innerHTML = "Error: Failed to load texture.";
    }
    var tex = THREE.ImageUtils.loadTextureCube( textureURLs, undefined, callback, textureError );
    return tex;
}

// animation lights
function initLights() {
    var distance = 20;
    var c = new THREE.Vector3();
    var geometry = new THREE.SphereBufferGeometry( 1, 1, 1 );
    for ( var i = 0; i < numLights; i ++ ) {
        var light = new THREE.PointLight( 0xffffff, 5.0, distance );
        c.set( Math.random(), Math.random(), Math.random() ).normalize();
        light.color.setRGB( c.x, c.y, c.z );
        scene.add( light );
        lights.push( light );
        var material = new THREE.MeshBasicMaterial( { color: light.color } );
        var emitter = new THREE.Mesh( geometry, material );
        light.add( emitter );
    }
    var directionalLight = new THREE.DirectionalLight( 0x101010 );
    directionalLight.position.set( -1, 1, 1 ).normalize();
    scene.add( directionalLight );
    var spotLight = new THREE.SpotLight( 0x404040 );
    spotLight.position.set( 5, 75, 5 );
    scene.add( spotLight );
}

// time the player to collect enough points in order to win, if points aren't enough then they lost
function timer(){
  var x = document.getElementsByClassName("centered");
  x[0].innerHTML = "Time: " + timeCount;
	timeCount--;

  if(gameOver && score > 2)  window.location.href = "./winner.html";
  if(gameOver && score < 2)  window.location.href = "./gameoverLastLevel.html";

	if (timeCount < 0 && score > 2) {
	    // remove objects from scene except for android
      for(var i in scene.childNodes){
          if(!scene.getObjectByName(android)){
              scene.removeChild(at(i));
          }
      }
      scene.remove(frontLight);
      scene.remove(backLight);
      scene.remove(skybox);
      audio1.play();
      android.position.set(0, 0, 0);
      initLights();

	}else if (timeCount < 0){
        if(score < 25) window.location.href = "./gameoverLastLevel.html";
    }else {
		setTimeout(timer, 100);
	}
}

// draws cubes in the
function drawCube(a,b,c,d,e,f){
   var geometry = new THREE.CubeGeometry( 100,100,100 );

   var cubeTexture = new THREE.ImageUtils.loadTexture( 'textures/box.jpg' );
   var cubeMaterial = new THREE.MeshBasicMaterial( { map: cubeTexture } );

   var mesh = new THREE.Mesh( geometry, cubeMaterial );
   mesh.scale.set(d,e,f);
   mesh.position.set(a,b,c);
   mesh.castShadow = true;     // This object will cast shadows.
   mesh.receiveShadow = true;  // Shadows will show up on this object.
   cubes.add(mesh);
   objectMeshList.push(mesh);

}

function barrier(){

	drawCube(-200,55,-200,1,1,1);
	drawCube(-200,155,-200,1,1,1);

	for(var j=1;j<5;j++){
		for(var i=0;i<2;i++){
			drawCube(-200,55+i*100,-200+j*100,1,1,1);
			drawCube(-200+j*100,55+i*100,-200,1,1,1);
		}
	}

	ground.add(cubes);

	ground.add(drawCube(800,-200,0,2,2,2));

	scene.add(ground);
}

// draws all the standing coins in their positions
function coinsorder1(){
    for ( var i = 0; i < 5; i ++ ) {

        var coin = addCoin();
        coin.position.set( 290 , ( i % 5 ) * 100 - 250 , Math.floor( i / 5 ) * 100 );
        coins.add(coin);
		    rotateCoins0.push(coin);

    }


    var coin1 = addCoin();
    coin1.position.set( 1325 ,-350 , 0);
    coins.add(coin1);
    rotateCoins0.push(coin1);
}

// draws the 5x2 grouped coins which are animated
function coinsorder2(){
    particles = new Array();
    coinGroup1 = new Array();
    var i = 0;
    for ( var ix = 0; ix < AMOUNTX; ix ++ ) {
        for ( var iy = 0; iy < AMOUNTY; iy ++ ) {
            particle = particles[ i ++ ] = addCoin();
            coin1 = coinGroup1[ i ++ ] = addCoin();

            // move 1000 to the right, 150 down from the origin
            particle.position.set( ix * SEPARATION - ( ( AMOUNTX * SEPARATION ) / 2 ) + 1100,
                -150, iy * SEPARATION - ( ( AMOUNTY * SEPARATION ) / 2 ) );
            coins.add(particle);

            // move 450 to the right, 200 down from origin
            coin1.position.set( ix * SEPARATION - ( ( AMOUNTX * SEPARATION ) / 2 ) + 450,
                -200, iy * SEPARATION - ( ( AMOUNTY * SEPARATION ) / 2 ) );
            coins.add(coin1);

            // move 1000 to the right, 150 down from the origin
            particle.position.set( ix * SEPARATION - ( ( AMOUNTX * SEPARATION ) / 2 ) + 1700,
                -350, iy * SEPARATION - ( ( AMOUNTY * SEPARATION ) / 2 ) );
            coins.add(particle);

        }
    }
	rotCoins();
}

function rotCoins(){
	for (var k=0;k<20;k++){
		var rcoin=addCoin();
		if(k<10){
	    rcoin.position.set( k * SEPARATION - ( ( AMOUNTX * SEPARATION ) / 2 ) + 500,
                -150, ( ( AMOUNTY * SEPARATION ) / 2 )+100 );
		}else{
			rcoin.position.set( k * SEPARATION - ( ( AMOUNTX * SEPARATION ) / 2 ) -350,
                -150, ( ( AMOUNTY * SEPARATION ) / 2 )-600 );
		}
            coins.add(rcoin);
			rotateCoins1.push(rcoin);
	}
}

// function draws coin
function addCoin()
{
    var geometry = new THREE.CylinderGeometry(40,40,10,64);
    var material = new THREE.MeshPhongMaterial( {
      color: 0xDAA520,
      ambient: 0xffffff,
      specular: 0x003344,
      shininess: 100,
      flatShading: false,
      side: THREE.DoubleSide // for drawing the inside of the tube
    } );

  	var coin  = new THREE.Mesh(geometry, material);
	  coin.castShadow = true;     // This object will cast shadows.
	  coin.receiveShadow = true;  // Shadows will show up on this object.
    coin.rotation.set(Math.PI/2,0,0);
  	coinMeshList.push(coin);

	return coin;

}

function coinDetection() {

		var originPoint = android.position.clone();

		for (var vertexIndex = 0; vertexIndex < android.geometry.vertices.length; vertexIndex++)
		{
			var localVertex = android.geometry.vertices[vertexIndex].clone();
			var globalVertex = localVertex.applyMatrix4( android.matrix );
			var directionVector = globalVertex.sub( android.position );

			var ray = new THREE.Raycaster( originPoint, directionVector.clone().normalize() );
			var collisionResults = ray.intersectObjects( coinMeshList );

			if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ){
				if(coinMeshList.includes(collisionResults[0].object) ){

          audio.play();
          score++;
					s[0].innerHTML = "Score: " + score;

					coins.remove( collisionResults[0].object ); //removes coin from scene
          //audio.pause();
					var index = coinMeshList.indexOf(collisionResults[0].object);
					if (index > -1) {
						coinMeshList.splice(index, 1); //removes coin from mesh list
					}
				}
			}

		}
}

function dimeDetection() {

		var originPoint = android.position.clone();

		for (var vertexIndex = 0; vertexIndex < android.geometry.vertices.length; vertexIndex++)
		{
			var localVertex = android.geometry.vertices[vertexIndex].clone();
			var globalVertex = localVertex.applyMatrix4( android.matrix );
			var directionVector = globalVertex.sub( android.position );

			var ray = new THREE.Raycaster( originPoint, directionVector.clone().normalize() );
			var collisionResults = ray.intersectObjects( dimeMeshList );

			if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ){
				if(dimeMeshList.includes(collisionResults[0].object) ){

          //audio.play();
          //score++;
		      timeCount=timeCount+10;
          t[0].innerHTML = "Timer: " + timeCount;
					ground.remove( collisionResults[0].object ); //removes coin from scene
          //audio.pause();
					var index = dimeMeshList.indexOf(collisionResults[0].object);
					if (index > -1) {
						dimeMeshList.splice(index, 1); //removes coin from mesh list
					}
				}
			}

		}
}

function objectDetection() {

  	var originPoint = android.position.clone();

  	for (var vertexIndex = 0; vertexIndex < android.geometry.vertices.length; vertexIndex++)
  	{
      var x, z;
      if (controls.getObject().moveLeft) z = 1;
      if (controls.getObject().moveRight) z = -1;
      if (controls.getObject().moveBackward) x = 1;
      if (controls.getObject().moveForward) x = -1;

  		var localVertex = android.geometry.vertices[vertexIndex].clone();
  		var globalVertex = localVertex.applyMatrix4( android.matrix );
  		var directionVector = globalVertex.sub( android.position );


  		var ray = new THREE.Raycaster( originPoint, directionVector.clone().normalize() );
  		var collisionResults = ray.intersectObjects( objectMeshList );
  		if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ){


          if (z ==  1) controls.getObject().moveLeft = false;
          if (z == -1) controls.getObject().moveRight = false;
          if (x ==  1) controls.getObject().moveBackward = false;
          if (x == -1) controls.getObject().moveForward = false;

		}
  	}
}

// draws the plane on which the avatar moves
function drawBox() {

    var geometry = new THREE.BoxGeometry( 500, 10, 500 );
    var texture = THREE.ImageUtils.loadTexture('textures/wood.jpg');
    texture.anisotropy = 15;
    var material = new THREE.MeshPhongMaterial({ map: texture });
    var cube = new THREE.Mesh( geometry, material );
	  cube.castShadow = true;     // This object will cast shadows.
	  cube.receiveShadow = true;  // Shadows will show up on this object.

    // ground
    ground.add(cube.clone());
    objects.push(cube.clone());

    cube.position.set(1550, -400, 0);
    ground.add(cube.clone());
    objects.push(cube.clone());

	  cube.scale.set(2,1,2);
    cube.position.set(760, -300, 0);
    ground.add(cube.clone());
    objects.push(cube.clone());

}

function surfaceFunction( u, v ) {
    var x,y,z;  // A point on the surface, calculated from u,v.
                // u  and v range from 0 to 1.
    x = 20 * (u - 0.5);  // x and z range from -10 to 10
    z = 20 * (v - 0.5);
    y = 2*(Math.sin(x/2) * Math.cos(z));
    return new THREE.Vector3( x, y, z );
}

function addSurfaceCurve() {
    /* Create the geometry the 2nd and 3rd parameters are the number of subdivisions in
 * the u and v directions, respectively.
 */
    var surfaceGeometry = new THREE.ParametricGeometry(surfaceFunction, 64, 64);

    var loader = new THREE.TextureLoader();
    var grassTexture = loader.load( 'textures/grasslight-big.png' );
    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set( 25, 25 );
    grassTexture.anisotropy = 16;

    var grassMaterial = new THREE.MeshLambertMaterial( {
        map: grassTexture,
        specular: 0x080808,
        side: THREE.DoubleSide
    } );

    var surface = new THREE.Mesh( surfaceGeometry, grassMaterial );
    surface.position.y = -1000;
    surface.scale.set(300,300,300);
    surface.receiveShadow = true;
    surface.castShadow = true;
    surfaceCurve.add(surface);

    var material = new THREE.MeshPhongMaterial({
        color: "white",
        specular: 0x080808,
        side: THREE.DoubleSide
    });

    /* Create a curve object.  A THREE.Curve needs a "getPoint" function to
     * define the curve.  The parameter to getPoint() is a number that ranges
     * from 0.0 to 1.0.  The return value is a vector.  It can return THREE.Vector2
     * for a curve in the xy-plane, or THREE.Vector3 for a 3D curve. In this
     * case, the function defines a helix that wraps around the y-axis.
     */
    var helix = new THREE.Curve();
    helix.getPoint = function(t) {
        var s = (t - 0.5) * 12*Math.PI;
        // As t ranges from 0 to 1, s ranges from -6*PI to 6*PI, for 6 turns of the helix.
        return new THREE.Vector3(
            5*Math.cos(s),
            s,
            5*Math.sin(s)
        );
    }

    /* The parameters are:  (1) a THREE.Curve to define the curve; the geometry is a
     * tube with the curve running along the center of the tube; (2) the number of
     * segments of the tube along the length of the curve; (3) the radius of the
     * tube; (3) the number of segments around the cirumference of the tube.
     * The two tubes have radius 2.5 and 1 respectively.
     */
    var tubeGeometry1 = new THREE.TubeGeometry(helix,128,2.5,32);
     tube1 = new THREE.Mesh( tubeGeometry1, material );
     // Move to the right, to separate the two tubes for viewing.
    /*tube1.scale.set(10,13,10);
    tube1.position.set(-700, -475, -710);
    tube1.castShadow = true;
    tube1.receiveShadow = true;
    tube1.position.set(0,-10,0);
    surfaceCurve.add(tube1);*/

    var tubeGeometry2 = new THREE.TubeGeometry(helix,128,1,32);
     tube2 = new THREE.Mesh( tubeGeometry2, material );
   // tube2.position.x = -10; // Move to the left, to separate the two tubes for viewing.
    tube2.scale.set(10,13,10);
    //tube2.position.set(700, -475, -440);
    tube2.castShadow = true;
    tube2.receiveShadow =true;
    tube2.position.set(800,-550,150);
    surfaceCurve.add(tube2.clone());
    tube2.position.set(0, -270, 0);
    surfaceCurve.add(tube2.clone());
    scene.add(surfaceCurve);
}


// point locker controls centre
function addPointlocker(){

    var onKeyDown = function ( event ) {
        switch ( event.keyCode ) {
            case 38: // up
            case 87: // w
                moveForward = true;
                break;
            case 37: // left
            case 65: // a
                moveLeft = true; break;
            case 40: // down
            case 83: // s
                moveBackward = true;
                break;
            case 39: // right
            case 68: // d
                moveRight = true;
                break;
            case 32: // space
                if ( canJump === true ) velocity.y += 500; //jump height
                canJump = false;
                break;
            case 67: //c
                avatarView = false;
                cameraView=true;
                break;
            case 86: //v
                cameraView = false;
                avatarView=true;
                break;
        }
        console.log("x "+android.position.x+" z "+android.position.z);
    };
    var onKeyUp = function ( event ) {
        switch( event.keyCode ) {
            case 38: // up
            case 87: // w
                moveForward = false;
                break;
            case 37: // left
            case 65: // a
                moveLeft = false;
                break;
            case 40: // down
            case 83: // s
                moveBackward = false;
                break;
            case 39: // right
            case 68: // d
                moveRight = false;
                break;
        }
    };
    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );
    raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );


}

//---------- This function draws the skybox and adds to the scene ----------//
function addSkybox(){
    var texture = loadCubemapTexture(textureURLs, render);

    var shader = THREE.ShaderLib[ "cube" ]; // contains the required shaders
    shader.uniforms[ "tCube" ].value = texture; // data for the shaders
    var material = new THREE.ShaderMaterial( {
            // A ShaderMaterial uses custom vertex and fragment shaders.
        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: shader.uniforms,
        depthWrite: false,
        side: THREE.BackSide
    } );

    skybox = new THREE.Mesh( new THREE.BoxGeometry( 20000, 20000, 20000 ), material );
    scene.add(skybox);
}

// dimes for extra time
function dime(a,b,c){

  var texture = new THREE.CubeTextureLoader().load( skybox );
  var geometry = new THREE.BoxGeometry( 30,30,30 );
	var material = new THREE.MeshBasicMaterial( {
      color: "white",  // Color will be multiplied by the environment map.
      envMap: texture  // Cubemap texture to be used as an environment map.
  } );
  var dime = new THREE.Mesh( geometry, material );

	dime.rotation.x=dime.rotation.y=Math.PI/4;
  dime.position.set(a,b,c);
	dimeMeshList.push(dime);

	return dime;
}

function dimes(){

	ground.add(dime(1000,-150,0));
	ground.add(dime(1500,-350,0));

}


//---------- This function applies material and adds the avatar to the scene ----------//
function addModel( geometry, materials ){

    // for preparing animation
    for (var i = 0; i < materials.length; i++)
        materials[i].morphTargets = true;

    var material = new THREE.MeshFaceMaterial( materials );
    android = new THREE.Mesh( geometry, material );
    android.scale.set(10,10,10);
	//android.position.set(5,5,5);
    android.castShadow = true;
    scene.add( android );
}

// adjust to window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function updateSize() {
	if ( windowWidth != window.innerWidth || windowHeight != window.innerHeight ) {
		windowWidth  = window.innerWidth;
		windowHeight = window.innerHeight;
		renderer.setSize ( windowWidth, windowHeight );
	}
}

//---------- Animate handles the runtime loop and rendering ----------//
function animate() {
    requestAnimationFrame( animate );
    update();
    render();
}

//---------- draws everything ----------//
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

		updateSize();

		for ( var ii = 0; ii < views.length; ++ii ) {
				var view = views[ii];
				var camera = view.camera;

				view.updateCamera( camera, scene );

				var left   = Math.floor( windowWidth  * view.left );
				var top    = Math.floor( windowHeight * view.top );
				var width  = Math.floor( windowWidth  * view.width );
				var height = Math.floor( windowHeight * view.height );

				renderer.setViewport( left, top, width, height );
				renderer.setScissor( left, top, width, height );
				renderer.setScissorTest( true );
				renderer.setClearColor( view.background );

				camera.aspect = width / height;
				camera.updateProjectionMatrix();

				renderer.render( scene, camera );
		}

}

function update(){
  walking = false; // avatar animation paused

  if ( controlsEnabled === true ) {
      raycaster.ray.origin.copy( controls.getObject().position );
      raycaster.ray.origin.y -= 10;
      var intersections = raycaster.intersectObjects( objects );
      var onObject = intersections.length > 0;
      var time = performance.now();
      var delta = ( time - prevTime ) / 1000;
      velocity.x -= velocity.x * 10.0 * delta;
      velocity.z -= velocity.z * 10.0 * delta;
      velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
      direction.z = Number( moveForward ) - Number( moveBackward );
      direction.x = Number( moveLeft ) - Number( moveRight );
      direction.normalize(); // this ensures consistent movements in all directions

      if ( moveForward || moveBackward ){
          velocity.z -= direction.z * 2500.0 * delta;
          walking = true;
      }
      if ( moveLeft || moveRight ){
          velocity.x -= direction.x * 2500.0 * delta;
          walking = true;
      }
      if ( onObject === true ) {
          velocity.y = Math.max( 0, velocity.y );
          canJump = true;
          walking = true;
      }

      //if(!cameraView) {
          // avatar movement update around the world
          android.translateX(velocity.x * delta);
          android.translateY(velocity.y * delta);
          android.translateZ(velocity.z * delta);

          if ( android.position.y < 5 && android.position.x<255 && android.position.x>-245
            && android.position.z<255 && android.position.z>-245 ) {
              velocity.y = 0;
              android.position.y = 5;
              canJump = true;
          }else if( android.position.y < -295 && android.position.x < 1245 && android.position.x > 248
            && android.position.z < 515 && android.position.z > -465  ){
              velocity.y = 0;
              android.position.y = -295;
              canJump = true;

          }else{
            //android.position.y -= 1;
            if(android.position.y < -500){
              velocity.y = 0;
              android.position.y = -500;
              canJump = true;
              gameOver = true;
            }

		  }

          // avatar movement
          controls.getObject().position.set(android.position.x, android.position.y, android.position.z);
          android.rotation.set(controls.getObject().rotation.x, controls.getObject().rotation.y, controls.getObject().rotation.z);
      //}

      var view = views[0];

      // change view
      if(avatarView){ // avatar view

          var camera = view.camera;

          cameraView = false;
          // add avatar to the scene
          camera.position.set(0, 100, 500);
          if(scene.getObjectByName(android) == null) scene.add(android);
      }

      if(cameraView){ // camera view of the scene

          var camera = view.camera;

          avatarView = false;
          var x = android.position.x;
          var y = android.position.y;
          var z = android.position.z;
          //scene.remove(android); // remove avatar from scene

          // set camera position to the eyes of avatar
          camera.position.set( x, y+140, z );

          controls.getObject().translateX(velocity.x * delta);
          controls.getObject().translateY(velocity.y * delta);
          controls.getObject().translateZ(velocity.z * delta);

          if (controls.getObject().position.y < 5) {
              velocity.y = 0;
              controls.getObject().position.y = 5;
              canJump = true;
          }
      }

      prevTime = time;
  }


	if(android) {
		coinDetection();
		//objectDetection();
    dimeDetection();
	}

      //---------- Animate coins ----------//
    var i = 0;
    for ( var ix = 0; ix < AMOUNTX; ix ++ ) {
        for ( var iy = 0; iy < AMOUNTY; iy ++ ) {

            particle = particles[ i++ ];
            particle.position.y += Math.sin(count*FrameNumber);

            coin1 = coinGroup1[ i++ ];
            coin1.position.x += Math.sin(count*FrameNumber);
        }
    }

    //---------- animated lights ----------//
    var time = Date.now() * 0.0005;
    for ( var i = 0, il = lights.length; i < il; i ++ ) {
        var light = lights[ i ];
        var x = Math.sin( time + i * 7.0 ) * 75;
        var y = Math.cos( time + i * 5.0 ) * 100+50;
        var z = Math.cos( time + i * 3.0 ) * 75;
        light.position.set( x, y, z );
    }


    if(count > 0.8){ count = 0.00001; }
    else{ count += 0.00001; }
    FrameNumber += 1;

    // rotate standing coins
    for(var i = 0; i < rotateCoins0.length; i++){
        rotateCoins0[i].rotation.y = rotateCoins0[i].rotation.z = FrameNumber*0.05;
      //  rotateCoins1[i].rotation.x = rotateCoins1[i].rotation.y = FrameNumber*0.05;
    }
    for(var i = 0; i < rotateCoins1.length; i++){
      //  rotateCoins0[i].rotation.y = rotateCoins0[i].rotation.z = FrameNumber*0.05;
      if(i%2==0){
        rotateCoins1[i].rotation.x = rotateCoins1[i].rotation.y = FrameNumber*0.05;
      }else{
        rotateCoins1[i].rotation.y = rotateCoins1[i].rotation.z = FrameNumber*0.05;
      }
    }
}
