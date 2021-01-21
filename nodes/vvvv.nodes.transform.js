// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }

define(function(require,exports) {


var glMatrix = new require('glMatrix');
var VVVV = require('core/vvvv.core.defines');
var Node = require('core/vvvv.core.node');

/**
 * The Transform Pin Type
 * @mixin
 * @property {String} typeName "Transform"
 * @property {Boolean} reset_on_disconnect true
 * @property {Function} defaultValue Function returning an identity matrix
 */
VVVV.PinTypes.Transform = {
  typeName: "Transform",
  reset_on_disconnect: true,
  defaultValue: function() {
    return glMatrix.mat4.identity(glMatrix.mat4.create());
  }
}

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Rotate (Transform)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Rotate = function(id, graph) {
  this.constructor(id, "Rotate (Transform)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var transforms = [];

  this.trIn = this.addInputPin("Transform In", [], VVVV.PinTypes.Transform);
  this.xIn = this.addInputPin("X", [0.0], VVVV.PinTypes.Value);
  this.yIn = this.addInputPin("Y", [0.0], VVVV.PinTypes.Value);
  this.zIn = this.addInputPin("Z", [0.0], VVVV.PinTypes.Value);

  this.trOut = this.addOutputPin("Transform Out", [], VVVV.PinTypes.Transform);

  this.evaluate = function()
  {

	  var maxSize = this.trIn.isConnected() ? this.getMaxInputSliceCount() : Math.max(this.xIn.getSliceCount(),this.yIn.getSliceCount(),this.zIn.getSliceCount());

	  if (maxSize>transforms.length) {
	    var i=transforms.length;
	    while (i++<maxSize) {
	      transforms.push(glMatrix.mat4.create());
	    }
	  }
	  else if (maxSize<transforms.length) {
	    transforms.length = maxSize;
	  }

    for (var i=0; i<maxSize; i++) {

      var transformin = this.inputPins["Transform In"].getValue(i);
      var x = this.inputPins["X"].getValue(i);
      var y = this.inputPins["Y"].getValue(i);
      var z = this.inputPins["Z"].getValue(i);

      glMatrix.mat4.rotate(transformin, y*Math.PI*2, [0, 1, 0], transforms[i]);
      glMatrix.mat4.rotate(transforms[i], x*Math.PI*2, [1, 0, 0]);
      glMatrix.mat4.rotate(transforms[i], z*Math.PI*2, [0, 0, 1]);

      this.trOut.setValue(i, transforms[i]);
    }
    this.trOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.Rotate.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Translate (Transform)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Translate = function(id, graph) {
  this.constructor(id, "Translate (Transform)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var transforms = [];

  this.trIn = this.addInputPin("Transform In", [], VVVV.PinTypes.Transform);
  this.xIn = this.addInputPin("X", [0.0], VVVV.PinTypes.Value);
  this.yIn = this.addInputPin("Y", [0.0], VVVV.PinTypes.Value);
  this.zIn = this.addInputPin("Z", [0.0], VVVV.PinTypes.Value);

  this.trOut = this.addOutputPin("Transform Out", [], VVVV.PinTypes.Transform);

  this.evaluate = function() {

	  var maxSize = this.trIn.isConnected() ? this.getMaxInputSliceCount() : Math.max(this.xIn.getSliceCount(),this.yIn.getSliceCount(),this.zIn.getSliceCount());

	  if (maxSize>transforms.length) {
      var i=transforms.length;
      while (i++<maxSize) {
        transforms.push(glMatrix.mat4.create());
      }
    }
    else if (maxSize<transforms.length) {
      transforms.length = maxSize;
    }

	  for (var i=0; i<maxSize; i++) {

		  var x = this.xIn.getValue(i);
			var y = this.yIn.getValue(i);
			var z = this.zIn.getValue(i);

			glMatrix.mat4.translate(this.trIn.getValue(i), [x, y, z], transforms[i]);

			this.trOut.setValue(i, transforms[i]);
	  }
	  this.trOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.Translate.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Scale (Transform)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Scale = function(id, graph) {
  this.constructor(id, "Scale (Transform)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var transforms = [];

  this.trIn = this.addInputPin("Transform In", [], VVVV.PinTypes.Transform);
  this.xIn = this.addInputPin("X", [1.0], VVVV.PinTypes.Value);
  this.yIn = this.addInputPin("Y", [1.0], VVVV.PinTypes.Value);
  this.zIn = this.addInputPin("Z", [1.0], VVVV.PinTypes.Value);

  this.trOut = this.addOutputPin("Transform Out", [], VVVV.PinTypes.Transform);

  this.evaluate = function() {

		var maxSize = this.trIn.isConnected() ? this.getMaxInputSliceCount() : Math.max(this.xIn.getSliceCount(),this.yIn.getSliceCount(),this.zIn.getSliceCount());

		if (maxSize>transforms.length) {
      var i=transforms.length;
      while (i++<maxSize) {
        transforms.push(glMatrix.mat4.create());
      }
    }
    else if (maxSize<transforms.length) {
      transforms.length = maxSize;
    }

    for (var i=0; i<maxSize; i++) {
      var x = this.inputPins["X"].getValue(i);
      var y = this.inputPins["Y"].getValue(i);
      var z = this.inputPins["Z"].getValue(i);

      glMatrix.mat4.scale(this.trIn.getValue(i), [x, y, z], transforms[i]);

      this.trOut.setValue(i, transforms[i]);
    }
    this.trOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.Scale.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: UniformScale (Transform)
 Author(s): woei
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.UniformScale = function(id, graph) {
  this.constructor(id, "UniformScale (Transform)", graph);

  this.meta = {
    authors: ['woei'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var transforms = [];

  this.trIn = this.addInputPin("Transform In", [], VVVV.PinTypes.Transform);
  this.xyzIn = this.addInputPin("XYZ", [1.0], VVVV.PinTypes.Value);

  this.trOut = this.addOutputPin("Transform Out", [], VVVV.PinTypes.Transform);

  this.evaluate = function() {
		var maxSize = this.trIn.isConnected() ? this.getMaxInputSliceCount() : this.xyzIn.getSliceCount();

    if (maxSize>transforms.length) {
      var i=transforms.length;
      while (i++<maxSize) {
        transforms.push(glMatrix.mat4.create());
      }
    }
    else if (maxSize<transforms.length) {
      transforms.length = maxSize;
    }

    for (var i=0; i<maxSize; i++) {
      var u = this.inputPins["XYZ"].getValue(i);

      glMatrix.mat4.scale(this.trIn.getValue(i), [u,u,u], transforms[i]);

      this.trOut.setValue(i, transforms[i]);
    }
    this.trOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.UniformScale.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Trapeze (Transform)
 Author(s): woei
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Trapeze = function(id, graph) {
  this.constructor(id, "Trapeze (Transform)", graph);

  this.meta = {
    authors: ['woei'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var transforms = [];
  var mat = [ 1.0,0.0,0.0,0.0,
              0.0,1.0,0.0,0.0,
              0.0,0.0,1.0,0.0,
              0.0,0.0,0.0,1.0];

  this.trIn = this.addInputPin("Transform In", [], VVVV.PinTypes.Transform);
  this.xIn = this.addInputPin("X", [0.0], VVVV.PinTypes.Value);
  this.yIn = this.addInputPin("Y", [0.0], VVVV.PinTypes.Value);
  this.zIn = this.addInputPin("Z", [0.0], VVVV.PinTypes.Value);

  this.trOut = this.addOutputPin("Transform Out", [], VVVV.PinTypes.Transform);

  this.evaluate = function() {

    var maxSize = this.trIn.isConnected() ? this.getMaxInputSliceCount() : Math.max(this.xIn.getSliceCount(),this.yIn.getSliceCount(),this.zIn.getSliceCount());

    if (maxSize>transforms.length) {
      var i=transforms.length;
      while (i++<maxSize) {
        transforms.push(glMatrix.mat4.create());
      }
    }
    else if (maxSize<transforms.length) {
      transforms.length = maxSize;
    }

    for (var i=0; i<maxSize; i++) {
      var x = 2.0 * this.inputPins["X"].getValue(i);
      var y = 2.0 * this.inputPins["Y"].getValue(i);
      var z = 2.0 * this.inputPins["Z"].getValue(i);

      mat[3] = x;
      mat[7] = y;
      mat[11] = z;
      glMatrix.mat4.multiply(this.inputPins["Transform In"].getValue(i), mat, transforms[i]);

      this.trOut.setValue(i, transforms[i]);
    }
    this.trOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.Trapeze.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Transform (Transform 2d)
 Author(s): woei
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Transform2d = function(id, graph) {
  this.constructor(id, "Transform (Transform 2d)", graph);

  this.meta = {
    authors: ['woei'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var transforms = [];

  this.trIn = this.addInputPin("Transform In", [], VVVV.PinTypes.Transform);
  this.txIn = this.addInputPin("TranslateX", [0.0], VVVV.PinTypes.Value);
  this.tyIn = this.addInputPin("TranslateY", [0.0], VVVV.PinTypes.Value);
  this.sxIn = this.addInputPin("ScaleX", [1.0], VVVV.PinTypes.Value);
  this.syIn = this.addInputPin("ScaleY", [1.0], VVVV.PinTypes.Value);
  this.rIn  = this.addInputPin("Rotate", [0.0], VVVV.PinTypes.Value);
  this.cxIn = this.addInputPin("CenterX", [0.0], VVVV.PinTypes.Value);
  this.cyIn = this.addInputPin("CenterY", [0.0], VVVV.PinTypes.Value);


  this.trOut = this.addOutputPin("Transform Out", [], VVVV.PinTypes.Transform);

  this.evaluate = function() {

    var maxSize = this.getMaxInputSliceCount();

    if (maxSize>transforms.length) {
      var i=transforms.length;
      while (i++<maxSize) {
        transforms.push(glMatrix.mat4.create());
      }
    }
    else if (maxSize<transforms.length) {
      transforms.length = maxSize;
    }

    for (var i=0; i<maxSize; i++) {
      var tx = this.inputPins["TranslateX"].getValue(i);
      var ty = this.inputPins["TranslateY"].getValue(i);
      var sx = this.inputPins["ScaleX"].getValue(i);
      var sy = this.inputPins["ScaleY"].getValue(i);
      var r  = this.inputPins["Rotate"].getValue(i);
      var cx = this.inputPins["CenterX"].getValue(i);
      var cy = this.inputPins["CenterY"].getValue(i);

      glMatrix.mat4.translate(this.inputPins["Transform In"].getValue(i), [tx, ty, 0], transforms[i]);
      glMatrix.mat4.rotate(transforms[i], r*Math.PI*2, [0, 0, 1]);
      glMatrix.mat4.scale(transforms[i], [sx, sy, 1]);
      glMatrix.mat4.translate(transforms[i], [-cx, -cy, 0]);

      this.trOut.setValue(i, transforms[i]);
    }
    this.trOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.Transform2d.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: AspectRatio (Transform)
 Author(s): woei
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AspectRatio = function(id, graph) {
  this.constructor(id, "AspectRatio (Transform)", graph);

  this.meta = {
    authors: ['woei'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var transforms = [];

  this.trIn = this.addInputPin("Transform In", [], VVVV.PinTypes.Transform);
  this.wIn = this.addInputPin("Aspect Width", [1.0], VVVV.PinTypes.Value);
  this.hIn = this.addInputPin("Aspect Height", [1.0], VVVV.PinTypes.Value);
  this.sIn = this.addInputPin("Uniform Scale", [1.0], VVVV.PinTypes.Value);
  this.alignmentIn = this.addInputPin("Alignment", ["FitIn"], VVVV.PinTypes.Enum);
  this.alignmentIn.enumOptions = ['FitIn', 'FitWidth', 'FitHeight', 'FitOut'];

  this.trOut = this.addOutputPin("Transform Out", [], VVVV.PinTypes.Transform);

  this.evaluate = function() {

    var maxSize = this.trIn.isConnected() ? this.getMaxInputSliceCount() : Math.max(this.wIn.getSliceCount(),this.hIn.getSliceCount(),this.sIn.getSliceCount(),this.alignmentIn.getSliceCount());

    if (maxSize>transforms.length) {
      var i=transforms.length;
      while (i++<maxSize) {
        transforms.push(glMatrix.mat4.create());
      }
    }
    else if (maxSize<transforms.length) {
      transforms.length = maxSize;
    }

    for (var i=0; i<maxSize; i++) {
      var w = this.inputPins["Aspect Width"].getValue(i);
      var h = this.inputPins["Aspect Height"].getValue(i);
      var s = this.inputPins["Uniform Scale"].getValue(i);

      var x = s;
      var y = s;

      switch (this.alignmentIn.getValue(i)) {
        case 'FitIn':
          if (w>h)
            y *= h/w;
          else
            x *= w/h;
          break;
        case 'FitWidth':
          y *= h/w;
          x *= h/w;
          break;
        case 'FitHeight':
          x *= w/h;
          y *= w/h;
          break;
        case 'FitOut':
          if (w<h)
            y *= h/w;
          else
            x *= w/h;
      }

      glMatrix.mat4.scale(this.inputPins["Transform In"].getValue(i), [x, y, s], transforms[i]);

      this.trOut.setValue(i, transforms[i]);
    }
    this.trOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.AspectRatio.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Perspective (Transform)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Perspective = function(id, graph) {
  this.constructor(id, "Perspective (Transform)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Not spreadable']
  };

  var ident = glMatrix.mat4.identity(glMatrix.mat4.create());


  this.addInputPin("Transform In", [], VVVV.PinTypes.Transform);
  this.addInputPin("FOV", [0.25], VVVV.PinTypes.Value);
  this.addInputPin("Near Plane", [0.05], VVVV.PinTypes.Value);
  this.addInputPin("Far Plane", [100.0], VVVV.PinTypes.Value);

  this.addOutputPin("Transform Out", [], VVVV.PinTypes.Transform);

  this.evaluate = function() {

    var fov = this.inputPins["FOV"].getValue(0);
    var near = this.inputPins["Near Plane"].getValue(0);
    var far = this.inputPins["Far Plane"].getValue(0);

    var t = glMatrix.mat4.create();
    glMatrix.mat4.identity(t);
    glMatrix.mat4.perspective(fov*360, 1, near, far, t);

    if (this.inputPins["Transform In"].isConnected())
    {
     	var transformin = this.inputPins["Transform In"].getValue(0);
     	glMatrix.mat4.multiply(transformin, t, t);
    }

    this.outputPins["Transform Out"].setValue(0, t);
  }

}
VVVV.Nodes.Perspective.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Inverse (Transform)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.InverseTransform = function(id, graph) {
  this.constructor(id, "Inverse (Transform)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var transforms = [];

  var trIn = this.addInputPin("Transform In", [], VVVV.PinTypes.Transform);
  var sourceIn = this.addInputPin("Source", [], VVVV.PinTypes.Transform);

  var trOut = this.addOutputPin("Transform Out", [], VVVV.PinTypes.Transform);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();

    if (maxSize>transforms.length) {
      var i=transforms.length;
      while (i++<maxSize) {
        transforms.push(glMatrix.mat4.create());
      }
    }
    else if (maxSize<transforms.length) {
      transforms.length = maxSize;
    }

    for (var i=0; i<maxSize; i++) {
      glMatrix.mat4.set(sourceIn.getValue(i), transforms[i]);
      glMatrix.mat4.multiply(trIn.getValue(i), glMatrix.mat4.inverse(transforms[i], transforms[i]), transforms[i]);
      trOut.setValue(i, transforms[i]);
    }
    trOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.InverseTransform.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: LookAt (Transform Vector)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.LookAtTransformVector = function(id, graph) {
  this.constructor(id, "LookAt (Transform Vector)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  var transformIn = this.addInputPin('Transform In', [], VVVV.PinTypes.Transform);
  var positionxyzIn = this.addInputPin('Position XYZ', [0, 0, 0], VVVV.PinTypes.Value);
  var lookatxyzIn = this.addInputPin('LookAt XYZ', [0, 0, 1], VVVV.PinTypes.Value);
  var upvectorxyzIn = this.addInputPin('UpVector XYZ', [0, 1, 0], VVVV.PinTypes.Value);

  var transformoutOut = this.addOutputPin('Transform Out', [], VVVV.PinTypes.Transform);

  var mirror = glMatrix.mat4.create();
  glMatrix.mat4.identity(mirror);
  glMatrix.mat4.scale(mirror, [-1, 1, -1]);

  var transforms = [];

  this.evaluate = function() {
    var spreadCount = Math.max(transformIn.getSliceCount(), Math.max(positionxyzIn.getSliceCount()/3, Math.max(lookatxyzIn.getSliceCount()/3, upvectorxyzIn.getSliceCount()/3)));
    spreadCount = Math.ceil(spreadCount);

    if (spreadCount>transforms.length) {
      var i=transforms.length;
      while (i++<spreadCount) {
        transforms.push(glMatrix.mat4.create());
      }
    }
    else if (spreadCount<transforms.length) {
      transforms.length = spreadCount;
    }

    for (var i=0; i<spreadCount; i++) {
      var pos = positionxyzIn.getValue(i, 3);
      var lookat = lookatxyzIn.getValue(i, 3);
      var up = upvectorxyzIn.getValue(i, 3);

      glMatrix.mat4.lookAt(pos, lookat, up, transforms[i]);
      glMatrix.mat4.multiply(mirror, transforms[i], transforms[i]);

      if (transformIn.isConnected())
      {
        glMatrix.mat4.multiply(transformIn.getValue(i), transforms[i], transforms[i]);
      }

      transformoutOut.setValue(i, transforms[i]);
    }

    transformoutOut.setSliceCount(spreadCount);
  }

}
VVVV.Nodes.LookAtTransformVector.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: LookAt (Transform)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.LookAtTransform = function(id, graph) {
  this.constructor(id, "LookAt (Transform)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  // input pins
  var transformIn = this.addInputPin('Transform In', [], VVVV.PinTypes.Transform);
  var positionxIn = this.addInputPin('Position X', [0], VVVV.PinTypes.Value);
  var positionyIn = this.addInputPin('Position Y', [0], VVVV.PinTypes.Value);
  var positionzIn = this.addInputPin('Position Z', [0], VVVV.PinTypes.Value);
  var lookatxIn = this.addInputPin('LookAt X', [0], VVVV.PinTypes.Value);
  var lookatyIn = this.addInputPin('LookAt Y', [0], VVVV.PinTypes.Value);
  var lookatzIn = this.addInputPin('LookAt Z', [1], VVVV.PinTypes.Value);
  var upvectorxIn = this.addInputPin('UpVector X', [0], VVVV.PinTypes.Value);
  var upvectoryIn = this.addInputPin('UpVector Y', [1], VVVV.PinTypes.Value);
  var upvectorzIn = this.addInputPin('UpVector Z', [0], VVVV.PinTypes.Value);

  var transformoutOut = this.addOutputPin('Transform Out', [], VVVV.PinTypes.Transform);

  var mirror = glMatrix.mat4.create();
  glMatrix.mat4.identity(mirror);
  glMatrix.mat4.scale(mirror, [-1, 1, -1]);
  var transforms = [];
  var pos = glMatrix.vec3.create();
  var lookat = glMatrix.vec3.create();
  var up = glMatrix.vec3.create();

  this.evaluate = function() {
    var spreadCount = this.getMaxInputSliceCount();

    if (spreadCount>transforms.length) {
      var i=transforms.length;
      while (i++<spreadCount) {
        transforms.push(glMatrix.mat4.create());
      }
    }
    else if (spreadCount<transforms.length) {
      transforms.length = spreadCount;
    }

    for (var i=0; i<spreadCount; i++) {
      pos[0] = positionxIn.getValue(i);
      pos[1] = positionyIn.getValue(i);
      pos[2] = positionzIn.getValue(i);
      lookat[0] = lookatxIn.getValue(i);
      lookat[1] = lookatyIn.getValue(i);
      lookat[2] = lookatzIn.getValue(i);
      up[0] = upvectorxIn.getValue(i);
      up[1] = upvectoryIn.getValue(i);
      up[2] = upvectorzIn.getValue(i);
      glMatrix.mat4.lookAt(pos, lookat, up, transforms[i]);
      glMatrix.mat4.multiply(mirror, transforms[i], transforms[i]);

      if (transformIn.isConnected())
      {
        glMatrix.mat4.multiply(transformIn.getValue(i), transforms[i], transforms[i]);
      }

      transformoutOut.setValue(i, transforms[i]);
    }

    transformoutOut.setSliceCount(spreadCount);
  }

}
VVVV.Nodes.LookAtTransform.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: MultiplyTransform (Transform)
 Author(s): woei
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.MultiplyTransform = function(id, graph) {
  this.constructor(id, "Multiply (Transform)", graph);

  this.meta = {
    authors: ['woei'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var transforms = [];
  var inputCount = 2;

  this.trOut = this.addOutputPin("Transform Out", [], VVVV.PinTypes.Transform);

  // invisible pins
  var inputcountIn = this.addInvisiblePin('Transform In Count', [2], VVVV.PinTypes.Value);

  var inputPins = [];

  this.configure = function() {
   	inputCount = Math.max(2, inputcountIn.getValue(0));
    VVVV.Helpers.dynamicPins(this, inputPins, inputCount, function(i) {
      return this.addInputPin('Transform In '+(i+1), [], VVVV.PinTypes.Transform);
    })
  }

  this.evaluate = function() {
	  var maxSize = this.getMaxInputSliceCount();

	  if (maxSize>transforms.length) {
      var i=transforms.length;
      while (i++<maxSize) {
        transforms.push(glMatrix.mat4.create());
      }
    }
    else if (maxSize<transforms.length) {
      transforms.length = maxSize;
    }

    for (var i=0; i<maxSize; i++) {
    	glMatrix.mat4.identity(transforms[i]);
    	for (var p=inputCount-1; p>=0; p--) {
    		if (inputPins[p].isConnected()) {
    			var tm = inputPins[p].getValue(i);
    			glMatrix.mat4.multiply(transforms[i],tm,transforms[i]);
    		}
    	}
    	this.trOut.setValue(i, transforms[i]);
    }
    this.trOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.MultiplyTransform.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: ApplyTransform (Transform)
 Author(s): 'woei'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.ApplyTransform = function(id, graph) {
  this.constructor(id, "ApplyTransform (Transform)", graph);

  this.meta = {
    authors: ['woei'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  // input pins
  var transformIn = this.addInputPin('Transform', [], VVVV.PinTypes.Transform);
  var xIn = this.addInputPin('X UnTransformed', [0.0], VVVV.PinTypes.Value);
  var yIn = this.addInputPin('Y UnTransformed', [0.0], VVVV.PinTypes.Value);
  var zIn = this.addInputPin('Z UnTransformed', [0.0], VVVV.PinTypes.Value);

  // output pins
  var xOut = this.addOutputPin('X Transformed', [0.0], VVVV.PinTypes.Value);
  var yOut = this.addOutputPin('Y Transformed', [0.0], VVVV.PinTypes.Value);
  var zOut = this.addOutputPin('Z Transformed', [0.0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSize; i++) {
    	var t = transformIn.getValue(i);
     	var xyz = [];
	 	xyz[0] = xIn.getValue(i);
	 	xyz[1] = yIn.getValue(i);
	 	xyz[2] = zIn.getValue(i);

		glMatrix.mat4.multiplyVec3(t, xyz);
		xOut.setValue(i, xyz[0]);
		yOut.setValue(i, xyz[1]);
		zOut.setValue(i, xyz[2]);
    }
    xOut.setSliceCount(maxSize);
    yOut.setSliceCount(maxSize);
    zOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.ApplyTransform.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Ortho (Transform)
 Author(s): David Gann
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Ortho = function(id, graph) {
  this.constructor(id, "Ortho (Transform)", graph);

  this.meta = {
    authors: ['David Gann'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Not spreadable']
  };

  var ident = glMatrix.mat4.identity(glMatrix.mat4.create());


  this.addInputPin("Transform In", [], VVVV.PinTypes.Transform);
  this.addInputPin("ResolutionXY", [1024], VVVV.PinTypes.Value);
  this.addInputPin("Zoom", [16], VVVV.PinTypes.Value);
  this.addInputPin("Near Plane", [0.05], VVVV.PinTypes.Value);
  this.addInputPin("Far Plane", [100.0], VVVV.PinTypes.Value);

  this.addOutputPin("Transform Out", [], VVVV.PinTypes.Transform);

  this.evaluate = function() {

    var ResX = this.inputPins["ResolutionXY"].getValue(0);
    var ResY = this.inputPins["ResolutionXY"].getValue(1);
    var z = this.inputPins["Zoom"].getValue(0);
    var near = this.inputPins["Near Plane"].getValue(0);
    var far = this.inputPins["Far Plane"].getValue(0);

    var t = mat4.create();
    mat4.identity(t);
    mat4.ortho(-1*z,1*z,-1*z,1*z,near,far,t);
    if (this.inputPins["Transform In"].isConnected())
    {
     	var transformin = this.inputPins["Transform In"].getValue(0);
     	mat4.multiply(transformin, t, t);
    }

    this.outputPins["Transform Out"].setValue(0, t);
  }

}
VVVV.Nodes.Ortho.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: GetMatrix (Transform)
 Author(s): David Gann
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GetMatrix = function(id, graph) {
  this.constructor(id, "GetMatrix (Transform)", graph);

  this.meta = {
    authors: ['woei'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };



  var trIn = this.addInputPin("Transform In", [], VVVV.PinTypes.Transform);

  var matOut = this.addOutputPin("Matrix Out", [], VVVV.PinTypes.Value);
  var transforms = [];
  var matrix_array = [];
  this.evaluate = function() {

    var maxSize = this.getMaxInputSliceCount();

    if (maxSize>transforms.length) {
      var i=transforms.length;
      while (i++<maxSize) {
        transforms.push(mat4.create());
      }
    }
    else if (maxSize<transforms.length) {
      transforms.length = maxSize;
    }

    for (var i=0; i<maxSize; i++) {
      var matrix = trIn.getValue(i);
      for (var j=0; j<16; j++) {
         matOut.setValue(j+i*16, matrix[j]);
      }
    }
    var matrix_values = [].concat.apply([], matrix_array);

    matOut.setSliceCount(maxSize*16);
  }

}
VVVV.Nodes.GetMatrix.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Transpose (Transform)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.TransposeTransform = function(id, graph) {
  this.constructor(id, "Transpose (Transform)", graph);

  this.meta = {
    authors: ['David Gann'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var transforms = [];

  var trIn = this.addInputPin("Transform In", [], VVVV.PinTypes.Transform);

  var trOut = this.addOutputPin("Transform Out", [], VVVV.PinTypes.Transform);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();

    if (maxSize>transforms.length) {
      var i=transforms.length;
      while (i++<maxSize) {
        transforms.push(glMatrix.mat4.create());
      }
    }
    else if (maxSize<transforms.length) {
      transforms.length = maxSize;
    }

    for (var i=0; i<maxSize; i++) {
      //Where the code goes
      var matrix = trIn.getValue(i);
      var new_matrix = [matrix[0], matrix[4], matrix[8], matrix[12],
                        matrix[1], matrix[5], matrix[9], matrix[13],
                        matrix[2], matrix[6], matrix[10], matrix[14],
                        matrix[3], matrix[7], matrix[11], matrix[15]];
          
      
      trOut.setValue(i, new_matrix);
    }
    trOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.TransposeTransform.prototype = new Node();

});
