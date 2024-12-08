import {
  Clock,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  SpotLight,
  Vector3,
  WebGLRenderer
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { DotScreenShader } from 'three/addons/shaders/DotScreenShader.js';
import { Wheel } from './wheel.js'
import { Rover } from './rover.js'
import { solveEuler, resetForces } from './entity.js'
import { generateLandscape } from './landscape.js'
import { input } from './input.js'
import { vec } from './vec.js'
import { quad } from './quadtree.js'

var cameraPos = vec.Vec(100,100,0);
var timestep = 2;

var settings = {
  showDebug: false,
  showOverview: false,
  isPaused: false,
  isTwoTone: true,
};

var unit = {
  '#scout': 0.25,
  '#ranger': 0.60,
  '#juggernaut': 1.5
}[location.hash] || 0.4

var clock = new Clock();

var viewer = null
var engine = null
var composer = null
var hostElement = null

export function start(host) {
  hostElement = host
  var w = host.offsetWidth;
  var h = host.offsetHeight;
  viewer = buildViewer(w, h, window.devicePixelRatio)
  engine = buildEngine(256, viewer);
  composer = buildPostProcessing(engine, viewer, w, h)

  input.init()
  init(host, viewer);
  animate();

  return settings;
}

export function dispose() {
  input.dispose()
  viewer.renderer.dispose()
  hostElement.innerHTML = ''
  viewer = null
  engine = null
  composer = null
}

function buildPostProcessing(engine, viewer, w, h) {
  var composer = new EffectComposer(viewer.renderer);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(engine.scene, viewer.camera));
  const effect = new ShaderPass(DotScreenShader);
  effect.uniforms['scale'].value = 2;
  composer.addPass(effect);
  return composer;
}

function buildViewer(viewW, viewH, pixelRatio) {
  var camera = new PerspectiveCamera(60, viewW / viewH, 1, 20000);
  camera.position.y = 16;
  camera.position.x = 50;
  var renderer = new WebGLRenderer();
  renderer.setClearColor(0x000000);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(viewW, viewH);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = PCFShadowMap;
  return {
    camera: camera,
    //controls: controls,
    renderer: renderer,
    render: renderer.render.bind(renderer, camera)
  };
}

function buildEngine(res) {
  var quadtree = generateLandscape(res, 8);

  var scene = new Scene();
  var geometry = new PlaneGeometry(res, res, res-1, res-1);
  geometry.rotateX(- Math.PI / 2);

  var vertices = geometry.attributes.position.array;
  for (var i = 0; i < res; i++) {
    for (var j = 0; j < res; j++) {
      vertices[(i+j*res)*3 + 1] = quad.at(quadtree, i, j).value;
    }
  }

  geometry.computeVertexNormals();
  var material = new MeshPhongMaterial({color: 0x888888});
  material.flatShading = true;
  var mesh = new Mesh(geometry, material);
	mesh.receiveShadow = true;

  var sun = new SpotLight(0xffffff, 1.25, 0, Math.PI / 2);
  sun.position.set(250, 140, 0);
  sun.target.position.set(0, 0, 0);

	sun.castShadow = true;
	sun.shadow.camera.near = 100;
	sun.shadow.camera.far = 1500;
	sun.shadow.camera.fov = 60;
	sun.shadow.bias = 0.0001;
	sun.shadow.mapSize.width = 2048;
	sun.shadow.mapSize.height = 2048;

  var y = quad.valueAt(quadtree, 0, 0);

  var wheelA = new Wheel( unit, y + 4,  unit, unit*0.6);
  var wheelB = new Wheel(-unit, y + 4,  unit, unit*0.6);
  var wheelC = new Wheel( unit, y + 4, -unit, unit*0.6);
  var wheelD = new Wheel(-unit, y + 4, -unit, unit*0.6);
  var rover = new Rover(wheelA, wheelB, wheelC, wheelD, 2*unit);

  scene.add(mesh);
  scene.add(sun);
  scene.add(rover.drawObject());
  scene.add(wheelA.drawObject());
  scene.add(wheelB.drawObject());
  scene.add(wheelC.drawObject());
  scene.add(wheelD.drawObject());

  rover.steer(0);

  var markerGeo = new SphereGeometry(0.2, 4, 4);
	var markerMaterial = new MeshBasicMaterial({color: 0xffff00});
  var marker = new Mesh(markerGeo, markerMaterial);
  scene.add(marker);
	var normalMarker = new Mesh(markerGeo.clone(), markerMaterial);
	scene.add(normalMarker);

  return {
    scene: scene,
    mesh: mesh,
    marker: marker,
    normalMarker: normalMarker,
    wheels: [wheelA, wheelB, wheelC, wheelD],
    rover: rover,
    quadtree: quadtree
  };
}

function init(container, viewer) {
  container.appendChild(viewer.renderer.domElement);
  input.onNumber(function(i) { timestep = Math.exp(i/4) / 2 });
  input.on('i', function() { settings.showDebug = !settings.showDebug });
  input.on(' ', function() { settings.showOverview = !settings.showOverview });
  input.on('p', function() { settings.isPaused = !settings.isPaused });
  input.on('x', function() { settings.isTwoTone = !settings.isTwoTone });
}

export function updateSize(host) {
  viewer.camera.aspect = host.offsetWidth / host.offsetHeight;
  viewer.camera.updateProjectionMatrix();
  viewer.renderer.setSize(host.offsetWidth, host.offsetHeight);
}
var even = true;
function animate() {
  requestAnimationFrame(animate);
  even = !even;
  if (even) update(composer);
}

function simulate(dt, iterations) {
  var gravity = vec.Vec(0, -300, 0);
  var objs = engine.wheels.map(e => e.obj);
  dt *= timestep / iterations;
  for (var i=iterations; i; i--){
    engine.rover.update(dt, gravity, engine.quadtree);
    solveEuler(dt/2, objs);
    solveEuler(dt/2, objs);
    resetForces(objs);
  }
}

function updateDebugInfo() {
  var x = engine.rover.obj.pos.x;
  var z = engine.rover.obj.pos.z;
  var y = quad.valueAt(engine.quadtree, x, z);
  var n = quad.normalAt(engine.quadtree, x, z);
  engine.marker.position.set(x, y, z);
  engine.normalMarker.position.set(x+2*n.x, y+2*n.y, z+2*n.z);
  if (!settings.showDebug) {
    engine.marker.position.set(0, -100, 0);
    engine.normalMarker.position.set(0, -100, 0);
  }
}

function updateChaseCam() {
  var chaseSpeed = 0.04
  var p = vec.clone(engine.rover.obj.pos);
  var dir = engine.rover.dir;
  var camDist = settings.showOverview ? 40 : 2;
  var pos = vec.add(p, vec.Vec(dir.x*-camDist, camDist, dir.z*-camDist));
  vec.multTo(cameraPos, 1-chaseSpeed);
  vec.addTo(cameraPos, pos, chaseSpeed);
  viewer.camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
  viewer.camera.lookAt(new Vector3(p.x, p.y, p.z));
}

function update(composer) {
  var dt = clock.getDelta();
  if (dt > 1) dt = 0.015; // pause simulation in background tabs

  if (!settings.isPaused){
    updateDebugInfo();
    updateChaseCam();

    simulate(dt, 4);

    engine.rover.apply();

    if (input.up) engine.rover.addSpeed(10);
    if (input.down) engine.rover.addSpeed(-10);
    if (input.left) engine.rover.steer(-0.025);
    if (input.right) engine.rover.steer(0.025);
    engine.rover.steerAhead(0.1);
  }

  if (settings.isTwoTone) composer.render();
  else viewer.renderer.render(engine.scene, viewer.camera);
}
