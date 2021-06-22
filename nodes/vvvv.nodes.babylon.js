// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }
define(function(require,exports) {

var $ = require('jquery');
var _ = require('underscore');
var Node = require('core/vvvv.core.node');
var VVVV = require('core/vvvv.core.defines');

//BABYLON SPECIFIC PINTYPES and Types
//Engine
 VVVV.Types.BabylonEngine = function(data, canvas) {
   this.engine = data;
   this.canvas = canvas;
 }
//
 var default_BabylonEngine = new VVVV.Types.BabylonEngine();
//
 VVVV.PinTypes.BabylonEngine = {
   typeName: "BabylonEngine",
   reset_on_disconnect: true,
   defaultValue: function() {
     return default_BabylonEngine
   }
 }
//Scene
 VVVV.Types.BabylonScene = function(data, engine) {
   this.data = data;
   this.engine = engine;
 }
//
 var default_BabylonScene = new VVVV.Types.BabylonScene();
//
 VVVV.PinTypes.BabylonScene = {
   typeName: "BabylonScene",
   reset_on_disconnect: true,
   defaultValue: function() {
     return default_BabylonScene
   }
 }
//Camera
 VVVV.Types.BabylonCamera = function(data) {
   this.data = data;
 }
//
 var default_BabylonCamera = new VVVV.Types.BabylonCamera();
//
 VVVV.PinTypes.BabylonCamera = {
   typeName: "BabylonCamera",
   reset_on_disconnect: true,
   defaultValue: function() {
     return default_BabylonCamera
   }
 }

//Light
  VVVV.Types.BabylonLight = function(data) {
    this.data = data;
  }
 //
  var default_BabylonLight = new VVVV.Types.BabylonLight();
 //
  VVVV.PinTypes.BabylonLight = {
    typeName: "BabylonLight",
    reset_on_disconnect: true,
    defaultValue: function() {
      return default_BabylonLight
    }
  }


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Engine (babylon)
 Author(s): 'Luna'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.BabylonEngine = function(id, graph) {
  this.constructor(id, "Engine (Babylon)", graph);

  this.meta = {
    authors: ['Luna'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;


  var EngineOut = this.addOutputPin('Engine', [], VVVV.PinTypes.BabylonEngine);

  this.evaluate = function() {

    console.log(BABYLON);


    const canvas = document.getElementById("renderCanvas"); // Get the canvas element

    const engine = new BABYLON.Engine(canvas, true);
    var babylonEngine = new VVVV.Types.BabylonEngine(engine, canvas);


    EngineOut.setValue(0, babylonEngine);


  }

}
VVVV.Nodes.BabylonEngine.prototype = new Node();



/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Scene (babylon)
 Author(s): 'Luna'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.BabylonScene = function(id, graph) {
  this.constructor(id, "Scene (Babylon)", graph);

  this.meta = {
    authors: ['Luna'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  var EngineIn = this.addInputPin('Engine', [], VVVV.PinTypes.BabylonEngine);



  var SceneOut = this.addOutputPin('Scene', [], VVVV.PinTypes.BabylonScene);



  // evaluate() will be called each frame
  // (if the input pins have changed, or the nodes is flagged as auto-evaluating)
  this.evaluate = function() {
    console.log(BABYLON);

    var engineIn = EngineIn.getValue(0);

    var scene = new BABYLON.Scene(engineIn.engine);
    var sceneOut = new VVVV.Types.BabylonScene(scene, engineIn);
    SceneOut.setValue(0,sceneOut);

  }

}
VVVV.Nodes.BabylonScene.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: CreateScene (babylon)
 Author(s): 'Luna'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.BabylonCreateScene = function(id, graph) {
  this.constructor(id, "CreateScene (Babylon)", graph);

  this.meta = {
    authors: ['Luna'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;


  var SceneIn = this.addInputPin('Scene', [], VVVV.PinTypes.BabylonScene);
  var PosIn = this.addInputPin('Camera Position', [0.0,0.0,-10], VVVV.PinTypes.Value);

  var CameraIn = this.addInputPin('Camera', [], VVVV.PinTypes.BabylonCamera);
  var SceneOut = this.addOutputPin('Scene', [], VVVV.PinTypes.BabylonScene);



  // evaluate() will be called each frame
  // (if the input pins have changed, or the nodes is flagged as auto-evaluating)
  this.evaluate = function() {

    sceneIn = SceneIn.getValue(0).data;
    canvasIn = SceneIn.getValue(0).engine.canvas;

    if(SceneIn.isConnected){

    //  var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), sceneIn);

      var camera = CameraIn.getValue(0).data;




    if(CameraIn.isConnected){
    //camera.attachControl(canvasIn, true);
    }
    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
      var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), sceneIn);

      // Default intensity is 1. Let's dim the light a small amount
      light.intensity = 0.7;

      // Our built-in 'sphere' shape.
      var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, sceneIn);

      // Move the sphere upward 1/2 its height
      sphere.position.y = 1;

      // Our built-in 'ground' shape.
      var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 6, height: 6}, sceneIn);


        SceneOut.setValue(0,SceneIn.getValue(0));

    }
  }

}
VVVV.Nodes.BabylonCreateScene.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Renderer (babylon)
 Author(s): 'Luna'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.BabylonRenderer = function(id, graph) {
  this.constructor(id, "Renderer (Babylon)", graph);

  this.meta = {
    authors: ['Luna'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = true;

  var SceneIn = this.addInputPin('Scene', [], VVVV.PinTypes.BabylonScene);
  var PosIn = this.addInputPin('Camera Position', [0.0,0.0,-10], VVVV.PinTypes.Value);


  // evaluate() will be called each frame
  // (if the input pins have changed, or the nodes is flagged as auto-evaluating)
  this.evaluate = function() {

    engine = SceneIn.getValue(0).engine.engine;
    scene = SceneIn.getValue(0).data;
    console.log(scene);
    if( SceneIn.isConnected){
      scene.render();
      scene.cameras[0].setPosition = new BABYLON.Vector3(PosIn.getValue(0), 10, PosIn.getValue(2));

      engine.runRenderLoop(function () {

              //camera.setPosition = new BABYLON.Vector3(PosIn.getValue(0), 10, PosIn.getValue(2));

      });

      // Watch for browser/canvas resize events
      window.addEventListener("resize", function () {
              engine.resize();

      });
    }
  }

}
VVVV.Nodes.BabylonRenderer.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Camera (babylon)
 Author(s): 'Luna'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.BabylonCamera = function(id, graph) {
  this.constructor(id, "Camera (Babylon)", graph);

  this.meta = {
    authors: ['Luna'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = true;

  var SceneIn = this.addInputPin('Scene', [], VVVV.PinTypes.BabylonScene);
  var PosIn = this.addInputPin('Camera Position', [0.0,0.0,-10], VVVV.PinTypes.Value);
  var InitIn = this.addInputPin('Init', [0], VVVV.PinTypes.Value);
  var CameraOut = this.addOutputPin('Camera', [], VVVV.PinTypes.BabylonCamera);


  this.evaluate = function() {

    sceneIn = SceneIn.getValue(0).data;
    canvasIn = SceneIn.getValue(0).engine.canvas;


    if(InitIn.getValue(0)){
      var camera = new BABYLON.ArcRotateCamera('camera1', 0, 10, -10, null, sceneIn);
    }
    if(camera != undefined){
      camera.setPosition(new BABYLON.Vector3(PosIn.getValue(0), 10, PosIn.getValue(2)));
      camera.setTarget(BABYLON.Vector3.Zero());
      camera.panningSensibility = 300;



      camera.attachControl(canvasIn, true);

        var babylonCamera = new VVVV.Types.BabylonCamera(camera);
        CameraOut.setValue(0,babylonCamera);
    }
  }

}
VVVV.Nodes.BabylonCamera.prototype = new Node();

});
