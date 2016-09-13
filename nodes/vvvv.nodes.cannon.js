// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

(function($) {
  
VVVV.PinTypes.CannonWorld = {
  typeName: "CannonWorld",
  reset_on_disconnect: true,
  defaultValue: function() {
    return "NO WORLD"
  }
}

VVVV.PinTypes.CannonBody = {
  typeName: "CannonBody",
  reset_on_disconnect: true,
  defaultValue: function() {
    return "EMPTY BODY";
  }
}

VVVV.PinTypes.CannonShape = {
  typeName: "CannonShape",
  reset_on_disconnect: true,
  defaultValue: function() {
    return "EMPTY SHAPE";
  }
}


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: World (Cannon Physics)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.WorldCannon = function(id, graph) {
  this.constructor(id, "World (Cannon Physics)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: ['https://github.com/schteppe/cannon.js'],
    compatibility_issues: []
  };
  
  this.auto_evaluate = true;

  var gravityIn = this.addInputPin("Gravity XYZ", [0, -9.82, 0], VVVV.PinTypes.Value);
  var enabledIn = this.addInputPin("Enabled", [0], VVVV.PinTypes.Value);
  
  var worldOut = this.addOutputPin("World Out", [], VVVV.PinTypes.CannonWorld);
  
  var world = undefined;

  this.evaluate = function() {
    if (!world) {
      world = new CANNON.World();
      world.gravity.set(0, -9.82, 0);
      world.broadphase = new CANNON.NaiveBroadphase();
      world.solver.iterations = 30;
      //world.solver.tolerance = 0.0001;
      worldOut.setValue(0, world);
      VVVV.World = world;
    }
    
    if (gravityIn.pinIsChanged()) {
      var gravity = gravityIn.getValue(0, 3);
      world.gravity.set(gravity[0], gravity[1], gravity[2]);
    }
    
    if (enabledIn.getValue(0)>=0.5)
      world.step(this.parentPatch.mainloop.deltaT/1000.0);
    
  }
}
VVVV.Nodes.WorldCannon.prototype = new VVVV.Core.Node();
VVVV.Nodes.WorldCannon.requirements = ["cannon.js"];


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Sphere (Cannon Physics)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

var shape_defs = [
  {name: "Sphere", attributes: [{name: "radius", pinname: "Radius", value: 0.5}]},
  {name: "Box", attributes: [{name: "halfExtents", pinname: ["Width", "Height", "Depth"], factor: 0.5, value: 0.5}]},
  {name: "Plane", attributes: []},
]

shape_defs.forEach(function(shape_def) {

  VVVV.Nodes[shape_def.name+"Cannon"] = function(id, graph) {
    this.constructor(id, shape_def.name+" (Cannon Physics Body)", graph);

    this.meta = {
      authors: ['Matthias Zauner'],
      original_authors: [],
      credits: ['https://github.com/schteppe/cannon.js'],
      compatibility_issues: []
    };

    var worldIn = this.addInputPin("World", [], VVVV.PinTypes.CannonWorld);
    var massIn = this.addInputPin("Mass", [5], VVVV.PinTypes.Value);
    for (var i=0; i<shape_def.attributes.length; i++) {
      if (shape_def.attributes[i].pinname.length) {
        for (var j=0; j<shape_def.attributes[i].pinname.length; j++) {
          this.addInputPin(shape_def.attributes[i].pinname[j], [shape_def.attributes[i].value], VVVV.PinTypes.Value);
        }
      }
      else
        this.addInputPin(shape_def.attributes[i].pinname, [shape_def.attributes[i].value], VVVV.PinTypes.Value);
    }
    var positionIn = this.addInputPin("Initial Position XYZ", [0, 0, 0], VVVV.PinTypes.Value);
    var rotationIn = this.addInputPin("Initial Rotation XYZ", [0, 0, 0], VVVV.PinTypes.Value);
    //var resetPositionIn = this.addInputPin("Reset Position", [0], VVVV.PinTypes.Value);
    
    var bodyOut = this.addOutputPin("Body Out", [], VVVV.PinTypes.CannonBody);
    
    var bodies = [];
    var world;

    this.evaluate = function() {
      var sliceCount = this.getMaxInputSliceCount();
      if (positionIn.getSliceCount()>massIn.getSliceCount())
        sliceCount = Math.floor(sliceCount/3);
      else if (rotationIn.getSliceCount()>massIn.getSliceCount())
        sliceCount = Math.floor(sliceCount/3);
      
      if (!worldIn.isConnected()) {
        for (var i=0; i<bodies.length; i++) {
          world.remove(bodies[i]);
        }
        bodies.length = 0;
        bodyOut.setValue(0, "EMPTY BODY");
        world = undefined;
        return;
      }
      
      world = worldIn.getValue(0);
      
      for (var i=0; i<sliceCount; i++) {
        var reset_pos = false; //resetPositionIn.getValue(0)>=0.5;
        if (!bodies[i]) {
          var shape;
          switch (shape_def.name) {
            case "Sphere": shape = new CANNON.Sphere(0.5); break;
            case "Box": shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)); break;
            case "Plane": shape = new CANNON.Plane();
          }
          bodies[i] = new CANNON.Body({mass: massIn.getValue(i)});
          bodies[i].addShape(shape);
          worldIn.getValue(0).add(bodies[i]);
          reset_pos = true;
        }
        if (massIn.pinIsChanged()) {
          bodies[i].mass = massIn.getValue(i);
          bodies[i].updateMassProperties();
          bodies[i].updateSolveMassProperties();
        }
        if (reset_pos || positionIn.pinIsChanged()) {
          var pos = positionIn.getValue(i, 3);
          bodies[i].position.set(pos[0], pos[1], pos[2]);
        }
        if (reset_pos || rotationIn.pinIsChanged()) {
          var rot = rotationIn.getValue(i, 3);
          bodies[i].quaternion.setFromEuler(rot[0]*2*Math.PI, rot[1]*2*Math.PI, rot[2]*2*Math.PI);
        }
        if (reset_pos) {
          bodies[i].velocity.set(0,0,0);
          bodies[i].angularVelocity.set(0,0,0);
        }
        for (var j=0; j<shape_def.attributes.length; j++) {
          var do_update = false;
          if (shape_def.attributes[j].pinname.length) {
            var k = shape_def.attributes[j].pinname.length;
            var changed = false;
            while (k--) { changed = changed || this.inputPins[shape_def.attributes[j].pinname[k]].pinIsChanged(); }
            if (reset_pos || changed) {
              bodies[i].shapes[0][shape_def.attributes[j].name].set(this.inputPins[shape_def.attributes[j].pinname[0]].getValue(i) * shape_def.attributes[j].factor, this.inputPins[shape_def.attributes[j].pinname[1]].getValue(i) * shape_def.attributes[j].factor, this.inputPins[shape_def.attributes[j].pinname[2]].getValue(i) * shape_def.attributes[j].factor);
              do_update = true;
            }
          }
          else if (reset_pos || this.inputPins[shape_def.attributes[j].pinname].pinIsChanged()) {
            bodies[i].shapes[0][shape_def.attributes[j].name] = this.inputPins[shape_def.attributes[j].pinname].getValue(i);
            do_update = true;
          }
          if (do_update) {
            bodies[i].updateBoundingRadius();
            if (bodies[i].shapes[0].updateConvexPolyhedronRepresentation)
              bodies[i].shapes[0].updateConvexPolyhedronRepresentation();
          }
        }
        
        bodyOut.setValue(i, bodies[i]);
      }
      
      for (var i=sliceCount; i<bodies.length; i++) {
        worldIn.getValue(0).remove(bodies[i]);
      }
      bodies.length = sliceCount;
      if (bodies.length==0) {
        bodyOut.setSliceCount(1);
        bodyOut.setValue(0, "EMPTY BODY");
      }
      else
        bodyOut.setSliceCount(sliceCount);
    }
    
    this.destroy = function() {
      if (!worldIn.isConnected())
        return;
      for (var i=0; i<bodies.length; i++) {
        worldIn.getValue(0).remove(bodies[i]);
      }
    }
  }
  VVVV.Nodes[shape_def.name+"Cannon"].prototype = new VVVV.Core.Node();
  VVVV.Nodes[shape_def.name+"Cannon"].requirements = ["cannon.js"];

});
  
  
/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: GetTransform (Cannon Physics)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GetTransformCannon = function(id, graph) {
  this.constructor(id, "GetTransform (Cannon Physics)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: ['https://github.com/schteppe/cannon.js'],
    compatibility_issues: []
  };
  
  this.auto_evaluate = true;

  var bodyIn = this.addInputPin("Body", [], VVVV.PinTypes.CannonBody);
  
  var xyzOut = this.addOutputPin("Position XYZ", [0, 0, 0], VVVV.PinTypes.Value);
  var rotOut = this.addOutputPin("Rotation YXZ", [0, 0, 0], VVVV.PinTypes.Value);
  var transformOut = this.addOutputPin("Transform", [], VVVV.PinTypes.Transform);
  
  var transforms = [];

  this.evaluate = function() {
    var sliceCount = this.getMaxInputSliceCount();
    
    if (bodyIn.getValue(0)=="EMPTY BODY") {
      xyzOut.setSliceCount(3);
      xyzOut.setValue(0, 0);
      xyzOut.setValue(1, 0);
      xyzOut.setValue(2, 0);
      return;
    }
    
    var body;
    var rot = new CANNON.Vec3();;
    for (var i=0; i<sliceCount; i++) {
      body = bodyIn.getValue(i);
      xyzOut.setValue(i*3+0, body.position.x);
      xyzOut.setValue(i*3+1, body.position.y);
      xyzOut.setValue(i*3+2, body.position.z);
      
      body.quaternion.toEuler(rot);
      rotOut.setValue(i*3+0, rot.x/(2*Math.PI));
      rotOut.setValue(i*3+1, rot.y/(2*Math.PI));
      rotOut.setValue(i*3+2, rot.z/(2*Math.PI));
    }
    
    xyzOut.setSliceCount(sliceCount*3);
    rotOut.setSliceCount(sliceCount*3);
  }
}
VVVV.Nodes.GetTransformCannon.prototype = new VVVV.Core.Node();
VVVV.Nodes.GetTransformCannon.requirements = ["cannon.js"];


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: GetCollision (Cannon Physics)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GetCollisionsCannon = function(id, graph) {
  this.constructor(id, "GetCollisions (Cannon Physics)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: ['https://github.com/schteppe/cannon.js'],
    compatibility_issues: []
  };
  
  this.auto_evaluate = true;

  var body1In = this.addInputPin("Body 1", [], VVVV.PinTypes.CannonBody);
  var body2In = this.addInputPin("Body 2", [], VVVV.PinTypes.CannonBody);
  
  var collidingOut = this.addOutputPin("Is Colliding", [0], VVVV.PinTypes.Value);
  
  var transforms = [];

  this.evaluate = function() {
    var sliceCount = body1In.getSliceCount() * body2In.getSliceCount();
    
    if (body1In.getValue(0)=="EMPTY BODY" || body2In.getValue(0)=="EMPTY BODY") {
      collidingOut.setValue(0);
      collidingOut.setSliceCount(1);
      return;
    }
    
    var body1, body2;
    var outIdx = 0;
    var body1count = body1In.getSliceCount();
    var body2count = body2In.getSliceCount();
    for (var i=0; i<body1count; i++) {
      body = body1In.getValue(i);
      for (var j=0; j<body2count; j++) {
        if (body.index==body2In.getValue(j).index) {
          collidingOut.setValue(outIdx++, 0);
          continue;
        }
        if (body.world.collisionMatrix.get(body, body2In.getValue(j))>0) {
          collidingOut.setValue(outIdx++, 1);
        }
        else {
          collidingOut.setValue(outIdx++, 0);
        }
        
      }
    }
    
    collidingOut.setSliceCount(sliceCount);
  }
}
VVVV.Nodes.GetCollisionsCannon.prototype = new VVVV.Core.Node();
VVVV.Nodes.GetCollisionsCannon.requirements = ["cannon.js"];
  
  
  
}(vvvvjs_jquery));
