var renderer = new THREE.WebGLRenderer({
  antialias: true,
  // preserveDrawingBuffer: true, // TODO, maybe this is sometimes required if you use ctx.readpixels but since we call it immediately after render, it isn't actually required
  alpha: false,
});

renderer.setSize(650, 650);

renderer.setClearColor('white');

renderer.setPixelRatio(window.devicePixelRatio);

var scene = new THREE.Scene();
// scene.fog = new THREE.Fog( 0x000000, 0.5 );

var webGLContainer = document.getElementById('webGLContainer');//$('#webGLContainer');
webGLContainer.appendChild(renderer.domElement);

var camera = (function (perspFov, viewHeight) {

  var realCamera = new THREE.PerspectiveCamera(
    perspFov, // Field of View (degrees)
    1, // Aspect ratio (set later) TODO why?
    0.001, // Inner clipping plane // TODO, at 0.1 you start to see white artifacts when scrolling quickly
    // TODO, small inner clipping causes depth buffer issue, lot to read about but really small inner plane destroys z precision
    10 // Far clipping plane
  );

  realCamera.position.set(0, 0, simpleViewHeight(perspFov, viewHeight) / perspFov);
  realCamera.up.set(0, 1, 0);
  realCamera.lookAt(new THREE.Vector3(0, 0, 0));

  function simpleViewHeight(fov, realHeight) {

    function deg2Rad(deg) {
      return deg / 180 * Math.PI;
    }

    var radius = realHeight / Math.sin(deg2Rad(fov)) * Math.sin(deg2Rad((180 - fov) / 2));

    return fov * radius;
  }


  return {
    realCamera: realCamera,
    perspFov: perspFov,
    _viewHeight: viewHeight,
    _fakeViewHeight: simpleViewHeight(perspFov, viewHeight),
    set viewHeight(vH) {
      this._viewHeight = vH;
      this._fakeViewHeight = simpleViewHeight(perspFov, vH);
      this.fov = this.fov; // hahaha
    },
    get viewHeight() {
      return this._viewHeight;
    },
    get fov() {
      return realCamera.fov;
    },
    set fov(fov) {
      realCamera.fov = fov;
      realCamera.position.z = this._fakeViewHeight / fov;
      realCamera.updateProjectionMatrix();
    }
  };
}(40, 2));

scene.add(camera.realCamera);

var pivot = new THREE.Object3D();//new THREE.Mesh( new THREE.BoxGeometry( 0.1, 0.1, 0.1 ), new THREE.MeshNormalMaterial());//
scene.add(pivot);


var axis = new THREE.AxisHelper( 2 );
// pivot.add(axis);


var container = new THREE.Object3D();

var grid = new THREE.Object3D();

container.add(grid);

container.position.set(-0.5, -0.5, -0.5);

var SIZE = DIMENSION - 1;

var SPACING = 1 / SIZE;

container.scale.set(SPACING, SPACING, SPACING);

pivot.add(container);


var particleGeo = new THREE.Geometry();
var maxParticleCount = 100000;

for (var i = maxParticleCount - 1; i >= 0; --i) {
  particleGeo.vertices.push(new THREE.Vector3(-1000, -1000, -1000));
}

var pMaterial = new THREE.PointsMaterial({
  color: 0x000000,
  size: 0.03,
  // transparent: true,// this doesn't seem to have an affect, maybe it is always on?
  // opacity: 0.5,
  sizeAttenuation: true,
  // map: sprite,
  // alphaTest: 0.7,
  // blending: THREE.AdditiveBlending,
  // depthTest: false,
  // depthWrite: false
});



var particles = new THREE.Points(particleGeo, pMaterial);
particles.frustumCulled = false;

container.add(particles);


for (var z = 1; z < DIMENSION - 1; z++) {
  for (var y = 1; y < DIMENSION - 1; y++) {

    var material = new THREE.LineBasicMaterial({
      color: 'red',
      opacity: 0.4,
      transparent: true,
    });

    var geometry = new THREE.Geometry();
    geometry.vertices.push(
      new THREE.Vector3( 0, y, z),
      new THREE.Vector3( SIZE, y, z)
    );

    var line = new THREE.Line( geometry, material );

    grid.add(line);
  }

  for (var x = 1; x < DIMENSION - 1; x++) {

    var material = new THREE.LineBasicMaterial({
      color: 'green',
      opacity: 0.4,
      transparent: true,
    });

    var geometry = new THREE.Geometry();
    geometry.vertices.push(
      new THREE.Vector3( x, 0, z ),
      new THREE.Vector3( x, SIZE,  z)
    );

    var line = new THREE.Line( geometry, material );

    grid.add(line);
  }
}

for (var z = 1; z < DIMENSION - 1; z++) {
  for (var y = 1; y < DIMENSION - 1; y++) {
    for (var x = 1; x < DIMENSION - 1; x++) {
      var material = new THREE.LineBasicMaterial({
        color: 'blue',
        opacity: 0.2,
        transparent: true,
      });

      var geometry = new THREE.Geometry();
      geometry.vertices.push(
        new THREE.Vector3( x, y, 0 ),
        new THREE.Vector3( x, y, SIZE )
      );

      var line = new THREE.Line( geometry, material );

      grid.add(line);
    }
  }
}

var stateContainer = new THREE.Object3D();
container.add(stateContainer);





var controls = new THREE.RotateCubeControls(pivot, camera);
controls.rotateSpeed = 4.0;

var needsRender = true;


function handleChange () {
  needsRender = true;
}

controls.addEventListener('change', handleChange);






function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); ctx.fill(); ctx.stroke(); }


 function makeTextSprite( message, parameters )
    {
        if ( parameters === undefined ) parameters = {};
        var fontface = parameters.hasOwnProperty("fontface") ? parameters["fontface"] : "monospace";
        var fontsize = parameters.hasOwnProperty("fontsize") ? parameters["fontsize"] : 60;
        var textColor = parameters.hasOwnProperty("textColor") ?parameters["textColor"] : { r:0, g:0, b:0, a:1.0 };

        var canvas = document.createElement('canvas');
        canvas.width = '256';
        canvas.height = '256';
        var context = canvas.getContext('2d');
        context.font = fontsize + "px " + fontface;
        var metrics = context.measureText( message );
        var textWidth = metrics.width;

        context.textAlign = 'center';

        context.fillStyle = "rgba("+textColor.r+", "+textColor.g+", "+textColor.b+", 1.0)";
        context.fillText(message, 128, 128);

        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        var spriteMaterial = new THREE.SpriteMaterial( { map: texture, depthTest: false });//, useScreenCoordinates: false } );
        var sprite = new THREE.Sprite( spriteMaterial );
        sprite.scale.set(0.4, 0.4, 0.4);
        return sprite;  
    }









function updateState() {
  for (var i = stateContainer.children.length - 1; i >= 0; i--) {
    stateContainer.remove(stateContainer.children[i]);
  }

  for (var i = 0; i < state.length; i++) {
    if (state[i]) {
      var [x, y, z] = idxToXYZ(i);

      var test = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 1 ), new THREE.MeshNormalMaterial({
        transparent: true,
        opacity: 0.2
      }));

      test.renderOrder = 1000;

      test.position.set(x, y, z);

      stateContainer.add(test);
    }
  }

  var prevVertCount = 0;

  for (var i = vertices.length; i < prevVertCount; i++) {
    particleGeo.vertices[i].set(-1000, -1000, -1000); // push it off the screen
  }

  for (var i = 0; i < vertices.length; i++) {
    let vertex = vertices[i];
    particleGeo.vertices[i].set(vertex[0], vertex[1], vertex[2]);
  }

  prevVertCount = vertices.length;


  // for (var i = 0; i < state.length; i++) {
  //   if (state[i]) {
  //     var [x, y, z] = idxToXYZ(i);

  //     particleGeo.vertices[prevVertCount].set(x, y, z);
  //     prevVertCount++;
  //   }
  // }


  particleGeo.verticesNeedUpdate = true;


  for (var i = 0; i < counts.length; i++) {
    if (counts[i] > 0) {
      var [x, y, z] = idxToXYZ(i);

      var text = makeTextSprite(counts[i]);

      text.position.set(x + 0.5, y + 0.5, z + 0.5);
      stateContainer.add(text);
    }
  }

}


dual_march();
updateState();









function animate() {
  pollInput();
  // handleInput();

  // TWEEN.update();
  controls.update();

  if (needsRender) {
    needsRender = false;
    renderer.render(scene, camera.realCamera);
  }

  requestAnimationFrame(animate); // TODO where should this go in the function (beginning, end?)
}
requestAnimationFrame(animate);


function mousewheel( event ) {
  event.preventDefault();
  event.stopPropagation();

  // if (key('shift', HELD)) {
  //   tVec.set(0, 0, -event.deltaY / 200);
  //   tQuat.copy(pivot.quaternion);
  //   tQuat.inverse();
  //   tVec.applyQuaternion(tQuat);
  //   cube.position.add(tVec);
  // } else {
    if (event.deltaY > 0) {
      camera.viewHeight /= 19/20;
    } else {
      camera.viewHeight *= 19/20;
    }
  // }

  needsRender = true;

  // tileDelta(event.deltaY / 40);
}


document.addEventListener('wheel', mousewheel, false);
