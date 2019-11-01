
/*----------- WebGL compatibility check ----------*/
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

// custom global variables
var scene, camera, renderer, container, controls;
var android, jsonLoader, cube, raycaster, skybox, skyboxMat;
var windowWidth, windowHeight, frontLight, backLight;
var perspCamera, orthCamera;

var score = 0;
var timeCount = 60;
var numLights = 40;

var cameraView = false, avatarView = false, gameOver = false;
var delta; var prevPosition = null;

var lights = [];
var objects = [];
var collidableMeshList = [];
var coinMeshList = [];
var collidableFloorList = [];
var rotateCoins0 = [];
var rotateCoins1 = [];

var SEPARATION = 85, AMOUNTX = 2, AMOUNTY = 6;
var coinGroup0, coin0, coinGroup1, coin1, coinGroup2, coin2,
    count = 0, FrameNumber = 0;

var clock = new THREE.Clock();
var surfaceCurve = new THREE.Object3D();
var crates = new THREE.Object3D();
var allCoins = new THREE.Object3D();
var drawFloor = new THREE.Object3D();
var tube1 = new THREE.Object3D();
var tube2 = new THREE.Object3D();
var audio = document.getElementById("hit");

// camera views
var views = [
    {
        left: 0.0,
        top: 0.0,
        width: 1.0,
        height: 1.0,
        background: new THREE.Color( 0.5, 0.5, 0.7 ),
        eye: [  0, 100, 500 ],
        up: [ 0, 100, 0 ],
        fov: 75,
        updateCamera: function ( camera, scene ) {
            camera.lookAt(scene.position);
        }
    },
    {
        left: 0.8,
        top: 0.8,
        width: 0.2,
        height: 0.2,
        background: new THREE.Color( 0.7, 0.5, 0.5 ),
        eye: [ 0, 1000, 0 ],
        up: [ 0, 0, -20 ],
        fov: 65,
        updateCamera: function ( camera, scene ) {
            camera.lookAt( camera.position.clone().setY( 0 ) );
        }
    }
];

// animating blender model
var animOffset       = 0,   // starting frame of animation
    walking         = false,
    duration        = 1000, // milliseconds to complete animation
    keyframes       = 20,   // total number of animation frames
    interpolation   = duration / keyframes, // milliseconds per frame
    lastKeyframe    = 0,    // previous keyframe
    currentKeyframe = 0;

var textureURLs = [  // URLs of the six faces of the cube map
    'skybox/city/posx.jpg',   // Note:  The order in which
    "skybox/city/negx.jpg",   //   the images are listed is
    "skybox/city/posy.jpg",   //   important!
    "skybox/city/negy.jpg",
    "skybox/city/posz.jpg",
    "skybox/city/negz.jpg"
];

// check if browser supports point locker and activate it if supported
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

//The init function is what we use to initialize the scene, camera, and renderer as well as any other objects
function init() {

    //---------- scene  ----------//
    scene = new THREE.Scene();

    //---------- sky box ----------//
    addSkybox();

    //---------- camera ----------//
    for (var i =  0; i < views.length; ++i ) {
        if(i===0){
            // world camera : perspective
            var view = views[i];
            perspCamera = new THREE.PerspectiveCamera( view.fov, window.innerWidth / window.innerHeight, 1, 20000 );
            perspCamera.position.fromArray( view.eye );
            perspCamera.up.fromArray( view.up );
            view.camera = perspCamera;
            controls = new THREE.PointerLockControls( perspCamera );
        }else{
            // map camera : orthographic
            var view = views[i];
            orthCamera = new THREE.OrthographicCamera( -1500, 1500, 1500, -1500, 1, 10000 );
            orthCamera.position.fromArray( view.eye );
            orthCamera.up.fromArray( view.up );
            view.camera = orthCamera;
        }
    }

    //---------- renderer ----------//
    renderer = new THREE.WebGLRenderer( {antialias:true} );
    renderer.setSize ( window.innerWidth, window.innerHeight );
    container = document.body.appendChild( renderer.domElement );
    renderer.shadowMap.enabled = true;

    //----------  lighting ---------- //
    scene.add( new THREE.AmbientLight( 0x666666 ) ); // ambient light

    backLight = new THREE.DirectionalLight(0xdfebff, 0.75); // directional light
    backLight.position.set(-50, -200, -100);
    backLight.castShadow = true;
    scene.add( backLight );

    frontLight = new THREE.DirectionalLight( 0xdfebff, 1 ); // directional light
    frontLight.position.set( 50, 200, 100 );
    frontLight.position.multiplyScalar( 1.3 );
    frontLight.castShadow = true;
    frontLight.shadow.mapSize.width = 4096;
    frontLight.shadow.mapSize.height = 4096;
    var d = 1500;
    frontLight.shadow.camera.left = - d;
    frontLight.shadow.camera.right = d;
    frontLight.shadow.camera.top = d;
    frontLight.shadow.camera.bottom = - d;
    frontLight.shadow.camera.far = 1500;
    scene.add( frontLight );

    //---------- add avatar: addModelToScene function is called back after model has loaded ----------//
    jsonLoader = new THREE.JSONLoader();
    jsonLoader.load( "js/android-animations.js", addModelToScene );

    // window resize
    window.addEventListener( 'resize', onWindowResize, false );

    // controls: point locker
    scene.add( controls.getObject() );
    addPointlocker();

    //---------- add plane/floor on which the avatar will move ---------//
    addFloor();

    //---------- coins ----------//
    coinsorder2();
    coinsorder1(0,75,-400);

    //---------- add crates to the scene ----------//
    arrangedCrates();

    //---------- surface and curve -----------//
    addSurfaceCurve();

}

// Draws the arranged crates in their respective positions
function arrangedCrates() {
    // at the centre
    var crates0 = drawCrate(4,3,2);
    crates0.position.z = -250;
    crates.add(crates0);
    collidableMeshList.push(crates0);

    // on the left
    var crates1 = drawCrate( 3, 2, 1 );
    crates1.position.set( 480, -100, 140 );
    crates1.rotation.set( 0, -1*Math.PI/2, 0 );
    crates.add(crates1);
    collidableMeshList.push(crates1);

    var crates2 = drawCrate( 6, 5, 0 );
    crates2.position.set( -215, 0, -1050 );
    crates.add(crates2.clone());
    crates2.position.set( -215+75, 0, -1050 );
    crates.add(crates2.clone());
    crates2.position.set( -215+150, 0, -1050 );
    crates.add(crates2.clone());
    crates2.position.set( -215+225, 0, -1050 );
    crates.add(crates2.clone());
    collidableMeshList.push(crates2);

    var crates3 = drawCrate(5,5,0);
    crates3.position.set( -490, -100, -975 );
    crates.add(crates3);
    collidableMeshList.push(crates3);

    scene.add(crates);

}

// arranges and draws all the standing coins in their positions
function coinsorder1(){
    for ( var i = 0; i < 4; i ++ ) {
        //
        var coin = addCoin();
        coin.position.set( 0 , ( i % 5 ) * 100 + 60 , Math.floor( i / 5 ) * 100 - 400 );
        rotateCoins0.push(coin);
        allCoins.add( coin );

        var coin1 = addCoin();
        coin1.position.set( 685 , ( i % 5 ) * 100 + 40 , Math.floor( i / 5 ) * 100 - 350 );
        rotateCoins0.push(coin1);
        allCoins.add( coin1 );

        var coin2 = addCoin();
        coin2.position.set( 685 , ( i % 5 ) * 100 + 40 , Math.floor( i / 5 ) * 100 - 800 );
        rotateCoins1.push(coin2);
        allCoins.add( coin2 );

        var coin3 = addCoin();
        coin3.position.set( -685 , ( i % 5 ) * 100 + 60 , Math.floor( i / 5 ) * 100 - 800 );
        rotateCoins1.push(coin3);
        allCoins.add( coin3 );

        scene.add(allCoins);
    }
}

// arranges draws the 5x2 grouped coins which are animated
function coinsorder2(){
    coinGroup0 = [];
    coinGroup1 = [];
    coinGroup2 = [];
    var i = 0;
    for ( var ix = 0; ix < AMOUNTX; ix ++ ) {
        for ( var iy = 0; iy < AMOUNTY; iy ++ ) {
            coin0 = coinGroup0[ i ++ ] = addCoin();
            coin1 = coinGroup1[ i ++ ] = addCoin();
            coin2 = coinGroup2[ i ++ ] = addCoin();

            // move 400 to the left, 50 up from the origin
            coin0.position.set( ix * SEPARATION - ( ( AMOUNTX * SEPARATION ) / 2 ) - 400,
                50, iy * SEPARATION - ( ( AMOUNTY * SEPARATION ) / 2 ) );
            allCoins.add(coin0);

            // move 450 to the right, 50 down from origin
            coin1.position.set( ix * SEPARATION - ( ( AMOUNTX * SEPARATION ) / 2 ) + 450,
                -50, iy * SEPARATION - ( ( AMOUNTY * SEPARATION ) / 2 ) );
            allCoins.add(coin1);

            // move  forward
            coin2.position.set( ix * (SEPARATION + 15) - ( ( AMOUNTX * (SEPARATION + 15) ) / 2 ) + 50,
                200, iy * (SEPARATION + 15) - ( ( AMOUNTY * (SEPARATION + 15) ) / 2 ) - 775 );
            allCoins.add(coin2);

            scene.add(allCoins);

        }
    }
}

// time the player to collect enough points in order to win, if points aren't enough then they lose
function timer(){
    var x = document.getElementsByClassName("centered");
    x[0].innerHTML = "Time: " + timeCount;
	timeCount--;

	if(gameOver && score > 24) window.location.href = "./winner.html";
    if(gameOver && score < 24) window.location.href = "./gameover.html";

	if (timeCount < 0 && score > 24) {
	    var v = localStorage.setItem("final_score",score); //
        window.location.href = "./winner.html"; // call winner html
        document.getElementById("scores").innerHTML = v;

	}else if (timeCount < 0){
        localStorage.setItem("curr_score",score);
        if(score < 25) window.location.href = "./gameover.html"; // call game over html
    }else {
		setTimeout(timer, 1000);
	}
}

// this function uses a mesh to draw a coin
function addCoin() {
    var geometry = new THREE.CylinderGeometry(40,40,10,64);
    var material = new THREE.MeshPhongMaterial( {
        color: 0xDAA520,
        ambient: 0xffffff,
        specular: 0x003344,
        shininess: 100,
        flatShading: false,
        side: THREE.DoubleSide // for drawing the inside of the tube
    } );
    var coin = new THREE.Mesh(geometry, material);
    coin.rotation.set(Math.PI/2,0,0);
    coin.castShadow = true;
	coinMeshList.push(coin); // add coins to the list for collision

    return coin;
}

/* This function checks if the vertices of the avatar intersects with that of any coin in the world. if there's a
   intersection(i.e collision) then the score is increased and the coin is removed from the scene
*/
function coinDetection() {
	for (var vertexIndex = 0; vertexIndex < android.geometry.vertices.length; vertexIndex++) {
	    var localVertex = android.geometry.vertices[vertexIndex].clone();
		var globalVertex = localVertex.applyMatrix4( android.matrix );
		var directionVector = globalVertex.sub( android.position );

		var ray = new THREE.Raycaster( android.position, directionVector.clone().normalize() );
		var collisionResults = ray.intersectObjects( coinMeshList );

		if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ){
            if(coinMeshList.includes(collisionResults[0].object)){
                audio.play();
                score++; // increment score
                allCoins.remove( collisionResults[0].object ); // make coin disappear
                var index = coinMeshList.indexOf(collisionResults[0].object);
                if (index > -1) {
                    coinMeshList.splice(index, 1); // remove object from list
                }
                var x = document.getElementsByClassName("center");
                x[0].innerHTML = "Score: " + score; // display current score
		    }
        }
    }
}

/* This function checks if the vertices of the avatar intersects with that of any object in the world. if there's a
   intersection(i.e collision) then the velocity of the Android is reversed
*/
function collisionDetection(delta) {
    for (var vertexIndex = 0; vertexIndex < android.geometry.vertices.length; vertexIndex++) {
        var localVertex = android.geometry.vertices[vertexIndex].clone();
        var globalVertex = localVertex.applyMatrix4( android.matrix );
        var directionVector = globalVertex.sub( android.position );

        var ray = new THREE.Raycaster( android.position, directionVector.clone().normalize() );
        var collisionResults = ray.intersectObjects( collidableMeshList );

        if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ){

            if(collidableMeshList.includes(collisionResults[0].object)){
                console.log("YES!!!");

                /*if ( moveForward || moveBackward ){
                    android.translateZ( -2*(velocity.z * delta) );
                    break;
                }
                if ( moveRight || moveLeft ){
                    android.translateX( -2*(velocity.x * delta) );
                    break;
                }*/

                break;

            }
            break;
        }
    }
}

// This function draws crates and adds them to the scene
function drawCrate( n1, n2, n3 ){
    var material = new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture('textures/box.jpg') });
    var geometry = new THREE.CubeGeometry(75, 75, 75);
    cube = new THREE.Mesh(geometry, material);
    cube.receiveShadow = true;
    cube.castShadow = true;
    var group = new THREE.Group();

    // first layer
    var tz = 0;
    for(var i = 0; i < n1; i++){
        cube.position.set( 100, 45, 15+tz );
        group.add( cube.clone() );
        tz += 75;
    }

    // second layer
    var tz = 0;
    for(var i = 0; i < n2; i++){
        cube.position.set( 100, 120, 15+tz );
        group.add( cube.clone() );
        tz += 75;
    }

    var tz = 0;
    for(var i = 0; i < n3; i++){
        cube.position.set( 100, 195, 15+tz );
        group.add( cube.clone() );
        tz += 75;
    }

    return group;
}

// this function draws the floor on which the objects of the world are added
function addFloor() {
    var geometry = new THREE.BoxGeometry( 300, 10, 600 );
    var bmap = new THREE.TextureLoader().load( "textures/bricks.jpg" );
    var smap = new THREE.TextureLoader().load( "textures/bricks.jpg" );
    var material = new THREE.MeshPhongMaterial( {
        specular: 0x222222,
        shininess: 25,
        bumpMap: bmap,
        map: smap,
        bumpScale: 12
    } );
    var cube = new THREE.Mesh( geometry, material );
    //cube.add(foregroundGroup);?
    cube.receiveShadow = true;
    cube.castShadow = true;

    // 1st row
    var cube0 = cube.clone();
    drawFloor.add(cube0);
    cube.position.set(-400, 0, 0);
    var cube1 = cube.clone();
    drawFloor.add(cube1);
    cube.position.set(400, -100, 0);
    var cube2 = cube.clone();
    drawFloor.add(cube2);

    // 2nd row
    cube.position.set(0, 0, -800);
    var cube3 = cube.clone();
    drawFloor.add(cube3);
    cube.position.set(400, 0, -800);
    var cube4 = cube.clone();
    drawFloor.add(cube4);
    cube.position.set(-400, -100, -800);
    var cube5 = cube.clone();
    drawFloor.add(cube5);

    // 3rd row
    cube.position.set(1000, 0, 0);
    var cube6 = cube.clone();
    drawFloor.add(cube6);
    cube.position.set(1000, 10, -800);
    var cube7 = cube.clone();
    drawFloor.add(cube7);
    cube.position.set(-1000, -100, -800);
    var cube8 = cube.clone();
    drawFloor.add(cube8);

    // on the sides
    cube.scale.set(0.3,0.3,0.15);
    cube.position.set(700, -10, -350);
    var cube9 = cube.clone();
    drawFloor.add(cube9);
    cube.position.set(700, -10, -800);
    var cube10 = cube.clone();
    drawFloor.add(cube10);
    cube.position.set(-700, 10, -800);
    var cube11 = cube.clone();
    drawFloor.add(cube11);
    cube.scale.z = 0.35;
    cube.position.set(0, 15, -400);
    var cube12 = cube.clone();
    drawFloor.add(cube12);

    scene.add(drawFloor);

}

// point locker controls setup
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
                if ( canJump === true ) velocity.y += 450; // move up
                canJump = false;
                break;
            case 67: // c
                avatarView = false;
                cameraView = true;
                break;
            case 86: // v
                cameraView = false;
                avatarView = true;
                break;
        }

        if(android){
            //coinDetection();
            console.log("x "+android.position.x+" y "+android.position.y+" z "+android.position.z);
            collisionDetection(delta); // collision detection
        }

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

/* this function creates a parametric surface.  The function takes two numbers, u and v,
   as parameters and returns a THREE.Vector3,
   the function will be called for values of u and v ranging from 0.0 to 1.0.  The return
   value represents a point on the surface.
 */
function surfaceFunction(u, v) {
    var x,y,z;  // A point on the surface, calculated from u,v.
                // u  and v range from 0 to 1.
    x = 20 * (u - 0.5);  // x and z range from -10 to 10
    z = 20 * (v - 0.5);
    y = 2*(Math.sin(x/2) * Math.cos(z));
    return new THREE.Vector3( x, y, z );
}

/* This function draws a surface and curve
*/
function addSurfaceCurve() {
    var surfaceGeometry = new THREE.ParametricGeometry(surfaceFunction, 64, 64);
    var grassTexture = new THREE.ImageUtils.loadTexture( 'textures/grasslight-big.png' ); // fix: not asynchronous
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
    tube1.position.x = 10; // Move to the right, to separate the two tubes for viewing.
    tube1.scale.set(10,13,10);
    tube1.position.set(-700, -475, -710);
    tube1.castShadow = true;
    tube1.receiveShadow = true;
    surfaceCurve.add(tube1);

    var tubeGeometry2 = new THREE.TubeGeometry(helix,128,1,32);
    tube2 = new THREE.Mesh( tubeGeometry2, material );
    tube2.position.x = -10; // Move to the left, to separate the two tubes for viewing.
    tube2.scale.set(10,13,10);
    tube2.position.set(700, -475, -440);
    tube2.castShadow = true;
    tube2.receiveShadow =true;
    surfaceCurve.add(tube2);

    scene.add(surfaceCurve);
}


//This function draws the skybox and adds it to the scene
function addSkybox(){
    var texture = loadCubemapTexture(textureURLs, render);

    var shader = THREE.ShaderLib[ "cube" ]; // contains the required shaders
    shader.uniforms[ "tCube" ].value = texture; // data for the shaders
    skyboxMat = new THREE.ShaderMaterial( {
        // A ShaderMaterial uses custom vertex and fragment shaders.
        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: shader.uniforms,
        depthWrite: false,
        side: THREE.BackSide
    } );

    skybox = new THREE.Mesh( new THREE.BoxGeometry( 20000, 20000, 20000 ), skyboxMat );
    skybox.receiveShadow = true;
    scene.add(skybox);
}

//This function applies material and adds the avatar to the scene
function addModelToScene( geometry, materials )
{
    // for preparing animation
    for (var i = 0; i < materials.length; i++)
        materials[i].morphTargets = true;

    var material = new THREE.MeshFaceMaterial( materials );
    android = new THREE.Mesh( geometry, material );
    android.scale.set(10,10,10);
    //android.rotateY = -Math.PI;
    android.castShadow = true;
    scene.add( android );
}

// This function checks if avatar is on the plane, if not avatar is pulled down by gravity
function applyGravity() {
    var arr1 = [290, 5, 160, -160, -290]; // x < val && x > val
    var arr2 = [290, 5, -550, -190, -290]; // x > val && x < val
    var arr3 = [290, -90, 215, 540, -290]; // x > val && x < val
    var arr4 = [290, 5, 870, 1130, -290]; // x > val && x < val
    var arr5 = [-510, 5, 160, -160, -1090];
    var arr6 = [-510, 5, 215, 540, -1090]; // x > val && x < val
    var arr7 = [-510, -90, -550, -190, -1090]; // x > val && x < val
    var arr8 = [ -510, 5, 870, 1130, -1090]; // x > val && x < val
    var arr9 = [-510, -90, -1150, -850, -1090]; // x > val && x < val
    var arr10 = [-270, 5, 30, -50, -500];
    var arr11 = [-300, 5, 750, 620, -380];
    var arr12 = [-750, -5, 770, 680, -850];
    var arr13 = [-750, 5, -650, -740, -850];

    var array = [arr1, arr2, arr3, arr4, arr5, arr6,
        arr7, arr8, arr9, arr10, arr11, arr12, arr13];

    for (var i = 0; i < 13; i++) {
        var curr_arr = array[i];
        if(i === 1 || i === 2 || i === 3 || i === 5 || i === 6 || i === 7 || i === 8) {
            if (android.position.z < curr_arr[0] && android.position.y < curr_arr[1] && android.position.x > curr_arr[2] &&
                android.position.x < curr_arr[3] && android.position.z > curr_arr[4]) { // x>val && x<val
                velocity.y = 0;
                android.position.y = curr_arr[1];
                canJump = true;

            } else { // fall to the ground
                    if (android.position.y < -350) {
                        velocity.y = 0;
                        android.position.y = -350;
                        canJump = true;

                        // check for intersection between curves and avatar
                        if( (android.position.y < -310) && ((android.position.x > -750 &&
                                android.position.x < -600) || (android.position.z > -720 && android.position.z < -650) )){
                            // set avatar position to be on the plane he fell from
                            android.position.set(-695, 5, -800); // bounce back
                            gameOver = false;
                            break;

                        }else if( (android.position.y < -310) && ((android.position.x > 705 &&
                                android.position.x < 730) || (android.position.z > -490 && android.position.z < -215) )){
                                // set avatar position to be on the plane he fell from
                                android.position.set(685, 5, -378); // bounce back
                                gameOver = false;
                                break;
                        }else {
                            gameOver = true;
                        }

                    }
            }
        }else{
            if (android.position.z < curr_arr[0] && android.position.y < curr_arr[1] && android.position.x < curr_arr[2] &&
                android.position.x > curr_arr[3] && android.position.z > curr_arr[4]) { // x<val && x>val
                velocity.y = 0;
                android.position.y = curr_arr[1];
                canJump = true;

            } else { // fall to the ground
                    if (android.position.y < -350) {
                        velocity.y = 0;
                        android.position.y = -350;
                        canJump = true;

                        // check for intersection between curves and avatar
                        // check for intersection between curves and avatar
                        if( (android.position.y < -310) && ((android.position.x > -750 &&
                                android.position.x < -600) || (android.position.z > -720 && android.position.z < -650) )){
                            // set avatar position to be on the plane he fell from
                            android.position.set(-695, 5, -800); // bounce back
                            gameOver = false;
                            break;

                        }else if( (android.position.y < -310) && ((android.position.x > 705 &&
                                android.position.x < 730) || (android.position.z > -490 && android.position.z < -215) )){
                            // set avatar position to be on the plane he fell from
                            android.position.set(685, 5, -378); // bounce back
                            gameOver = false;
                            break;
                        }else {
                            gameOver = true;
                        }
                    }
            }
        }
    }
}

function loadCubemapTexture(textureURLs, callback) {
    /* A funtion that will be called if the attempt to load the texture fails. */
    function textureError() {
        document.getElementById("message").innerHTML = "Error: Failed to load texture.";
    }
    var tex = THREE.ImageUtils.loadTextureCube( textureURLs, undefined, callback, textureError );
    return tex;
}

// Adjust to window resize
function onWindowResize() {
    orthCamera.aspect = window.innerWidth / window.innerHeight;
    orthCamera.updateProjectionMatrix();
    perspCamera.aspect = window.innerWidth / window.innerHeight;
    perspCamera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function updateSize() {
    if ( windowWidth != window.innerWidth || windowHeight != window.innerHeight ) {
        windowWidth  = window.innerWidth;
        windowHeight = window.innerHeight;
        renderer.setSize ( windowWidth, windowHeight );
    }
}

//Animate handles the runtime loop and rendering
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

    //----------- Update camera ----------//

    updateSize(); // update screen size

    for ( var i = 0; i < views.length; ++i ) {

        var view = views[i];
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
        delta = ( time - prevTime ) / 1000;
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

        if(!cameraView) {
            prevPosition = android.position;

            android.translateX(velocity.x * delta);
            android.translateY(velocity.y * delta);
            android.translateZ(velocity.z * delta);

            applyGravity(); // apply gravity to avatar

            // avatar movement
            controls.getObject().position.set(android.position.x, android.position.y, android.position.z);
            android.rotation.set(controls.getObject().rotation.x, controls.getObject().rotation.y, controls.getObject().rotation.z);
        }

        // change view
        if(avatarView){ // avatar view
            cameraView = false;
            // add avatar to the scene
            // perspective camera
            views[0].eye = [0, 100, 500];
            views[0].up = [0,100,0];
            perspCamera.position.fromArray( views[0].eye );
            perspCamera.up.fromArray( views[0].up );
            views[0].camera = perspCamera;

            if(scene.getObjectByName(android) == null) scene.add(android);
        }
        if(cameraView){ // camera view of the scene
            avatarView = false;
            var px = this.android.position.x;
            var py = this.android.position.y;
            var pz = this.android.position.z;
            scene.remove(android); // remove avatar from scene

            // set camera position to the eyes of avatar
            //camera.position.set( x, y+140, z );
            camera = camera.view
            camera.eye = [px, py, pz];
            camera.up = [0,100,0];

            controls.getObject().translateX(velocity.x * delta);
            controls.getObject().translateY(velocity.y * delta);
            controls.getObject().translateZ(velocity.z * delta);

            if (controls.getObject().position.y < 10) {
                velocity.y = 0;
                controls.getObject().position.y = 10;
                canJump = true;
            }
        }

        prevTime = time;
    }

    if(android){
        coinDetection();
    }

    //---------- Animate coins ----------//
    var i = 0;
    for ( var ix = 0; ix < AMOUNTX; ix ++ ) {
        for ( var iy = 0; iy < AMOUNTY; iy ++ ) {

            coin0 = coinGroup0[ i++ ];
            coin0.position.y += Math.sin(count*FrameNumber);

            coin1 = coinGroup1[ i++ ];
            coin1.position.x += Math.sin(count*FrameNumber);

            coin2 = coinGroup2[ i++ ];
            coin2.rotation.z = FrameNumber*0.05;

           /* coin0.position.y = ( Math.sin( ( ix + count ) * 0.3 ) * 50 ) +
                ( Math.sin( ( iy + count ) * 0.5 ) * 50 );
            coin0.scale.x = coin0.scale.y = ( Math.sin( ( ix + count ) * 0.3 ) + 1 ) * 4 +
                ( Math.sin( ( iy + count ) * 0.5 ) + 1 ) * 4;*/
        }
    }


    // rotate standing coins
    for(var i = 0; i < rotateCoins0.length; i++){
        rotateCoins0[i].rotation.y = rotateCoins0[i].rotation.z = FrameNumber*0.05;
        rotateCoins1[i].rotation.x = rotateCoins1[i].rotation.y = FrameNumber*0.05;
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

    if(count > 0.5){ count = 0.0001; }
    else{ count += 0.0001; }

    //---------- animate curve and surface ----------//
    var c1 = surfaceCurve.getObjectById(1, true);
    var c2 = surfaceCurve.getObjectById(2, true);
    if(c1 != null && c2 != null) {
        c1.rotation.y = FrameNumber * 0.05;
        c2.rotation.y = FrameNumber * 0.05;
    }
    FrameNumber += 1;
}
