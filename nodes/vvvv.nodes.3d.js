// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

(function($) {

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Polar (3d)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Polar3d = function(id, graph) {
  this.constructor(id, "Polar (3d)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  // input pins
  var xIn = this.addInputPin('X', [0], VVVV.PinTypes.Value);
  var yIn = this.addInputPin('Y', [0], VVVV.PinTypes.Value);
  var zIn = this.addInputPin('Z', [-1], VVVV.PinTypes.Value);

  // output pins
  var pitchOut = this.addOutputPin('Pitch', [0], VVVV.PinTypes.Value);
  var yawOut = this.addOutputPin('Yaw', [0], VVVV.PinTypes.Value);
  var lengthOut = this.addOutputPin('Length', [1], VVVV.PinTypes.Value);

  this.evaluate = function() {
    // to implement; maybe start with something like this:

    var maxSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSize; i++) {
      var x = xIn.getValue(i);
      var y = yIn.getValue(i);
      var z = zIn.getValue(i);

      var len = Math.sqrt(x*x + y*y + z*z );

      yawOut.setValue(i, Math.atan2(-x, -z) / (2*Math.PI));
      pitchOut.setValue(i, len == 0 ? 0 : Math.acos(-y/len) / (2*Math.PI) - 0.25);
      lengthOut.setValue(i, len);
    }

    yawOut.setSliceCount(maxSize);
    pitchOut.setSliceCount(maxSize);
    lengthOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.Polar3d.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Cartesian (3d)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Cartesian3d = function(id, graph) {
  this.constructor(id, "Cartesian (3d)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  // input pins
  var pitchIn = this.addInputPin('Pitch', [0], VVVV.PinTypes.Value);
  var yawIn = this.addInputPin('Yaw', [0], VVVV.PinTypes.Value);
  var lengthIn = this.addInputPin('Length', [1], VVVV.PinTypes.Value);

  // output pins
  var xOut = this.addOutputPin('X', [0], VVVV.PinTypes.Value);
  var yOut = this.addOutputPin('Y', [0], VVVV.PinTypes.Value);
  var zOut = this.addOutputPin('Z', [1], VVVV.PinTypes.Value);


  this.evaluate = function() {
    // to implement; maybe start with something like this:

    var maxSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSize; i++) {
      var pitch = (pitchIn.getValue(i) + 0.25) * 2 * Math.PI;
      var yaw = yawIn.getValue(i) * 2 * Math.PI;
      var length = lengthIn.getValue(i);

      zOut.setValue(i, -length * Math.cos(yaw) * Math.sin(pitch));
      xOut.setValue(i, -length * Math.sin(yaw) * Math.sin(pitch));
      yOut.setValue(i, -length * Math.cos(pitch));
    }

    xOut.setSliceCount(maxSize);
    yOut.setSliceCount(maxSize);
    zOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.Cartesian3d.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Normalize (3d)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Normalize3d = function(id, graph) {
  this.constructor(id, "Normalize (3d)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  // input pins
  var xIn = this.addInputPin('X', [1], VVVV.PinTypes.Value);
  var yIn = this.addInputPin('Y', [0], VVVV.PinTypes.Value);
  var zIn = this.addInputPin('Z', [0], VVVV.PinTypes.Value);

  // output pins
  var normalizedxOut = this.addOutputPin('NormalizedX', [1], VVVV.PinTypes.Value);
  var normalizedyOut = this.addOutputPin('NormalizedY', [0], VVVV.PinTypes.Value);
  var normalizedzOut = this.addOutputPin('NormalizedZ', [0], VVVV.PinTypes.Value);
  var inputlengthOut = this.addOutputPin('Input Length', [0], VVVV.PinTypes.Value);

  this.evaluate = function() {

    var maxSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSize; i++) {
      var x = xIn.getValue(i);
      var y = yIn.getValue(i);
      var z = zIn.getValue(i);

      var len = Math.sqrt(x*x + y*y + z*z);

      normalizedxOut.setValue(i, len == 0 ? 0.0 : x / len);
      normalizedyOut.setValue(i, len == 0 ? 0.0 : y / len);
      normalizedzOut.setValue(i, len == 0 ? 0.0 : z / len);
      inputlengthOut.setValue(i, len);
    }

    normalizedxOut.setSliceCount(maxSize);
    normalizedyOut.setSliceCount(maxSize);
    normalizedzOut.setSliceCount(maxSize);
    inputlengthOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.Normalize3d.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Normalize (3d Vector)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Normalize3dVector = function(id, graph) {
  this.constructor(id, "Normalize (3d Vector)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  // input pins
  var xyzIn = this.addInputPin('XYZ', [], VVVV.PinTypes.Value);

  // output pins
  var normalizedxyzOut = this.addOutputPin('NormalizedXYZ', [], VVVV.PinTypes.Value);
  var inputlengthOut = this.addOutputPin('Input Length', [0], VVVV.PinTypes.Value);

  this.evaluate = function() {

    var maxSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSize/3; i++) {
      var xyz = xyzIn.getValue(i, 3);

      var len = Math.sqrt(xyz[0]*xyz[0] + xyz[1]*xyz[1] + xyz[2]*xyz[2]);

      normalizedxyzOut.setValue(i*3, len == 0 ? 0.0 : xyz[0]/len);
      normalizedxyzOut.setValue(i*3 + 1, len == 0 ? 0.0 : xyz[1]/len);
      normalizedxyzOut.setValue(i*3 + 2, len == 0 ? 0.0 : xyz[2]/len);
      inputlengthOut.setValue(i, len);
    }

    normalizedxyzOut.setSliceCount(Math.ceil(maxSize/3) * 3);
    inputlengthOut.setSliceCount(Math.ceil(maxSize/3));
  }

}
VVVV.Nodes.Normalize3dVector.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Multiply (3d Cross)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Multiply3dCross = function(id, graph) {
  this.constructor(id, "Multiply (3d Cross)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  // input pins
  var input1xyzIn = this.addInputPin('Input1 XYZ', [], VVVV.PinTypes.Value);
  var input2xyzIn = this.addInputPin('Input2 XYZ', [], VVVV.PinTypes.Value);

  // output pins
  var outputxyzOut = this.addOutputPin('Output XYZ', [], VVVV.PinTypes.Value);

  this.evaluate = function() {
    // to implement; maybe start with something like this:

    var maxSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSize/3; i++) {
      var input1xyz = input1xyzIn.getValue(i, 3);
      var input2xyz = input2xyzIn.getValue(i, 3);

      outputxyzOut.setValue(i*3 + 0, input1xyz[1]*input2xyz[2] - input1xyz[2]*input2xyz[1]);
      outputxyzOut.setValue(i*3 + 1, -(input1xyz[0]*input2xyz[2] - input1xyz[2]*input2xyz[0]));
      outputxyzOut.setValue(i*3 + 2, input1xyz[0]*input2xyz[1] - input1xyz[1]*input2xyz[0]);
    }

    // you also might want to do stuff like this:
    outputxyzOut.setSliceCount(Math.ceil(maxSize/3) * 3);
  }

}
VVVV.Nodes.Multiply3dCross.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Multiply (3d Dot)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Multiply3dDot = function(id, graph) {
  this.constructor(id, "Multiply (3d Dot)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  // input pins
  var input1xyzIn = this.addInputPin('Input1 XYZ', [], VVVV.PinTypes.Value);
  var input2xyzIn = this.addInputPin('Input2 XYZ', [], VVVV.PinTypes.Value);

  // output pins
  var outputOut = this.addOutputPin('Output', [0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSize/3; i++) {
      var input1xyz = input1xyzIn.getValue(i, 3);
      var input2xyz = input2xyzIn.getValue(i, 3);

      outputOut.setValue(i, input1xyz[0]*input2xyz[0] + input1xyz[1]*input2xyz[1] + input1xyz[2]*input2xyz[2]);
    }

    outputOut.setSliceCount(Math.ceil(maxSize/3));
  }

}
VVVV.Nodes.Multiply3dDot.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Multiply (3d Vector)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Multiply3dVector = function(id, graph) {
  this.constructor(id, "Multiply (3d Vector)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  // input pins
  var transformIn = this.addInputPin('Transform', [], VVVV.PinTypes.Transform);
  var xyzIn = this.addInputPin('XYZ UnTransformed', [0.0, 0.0, 0.0], VVVV.PinTypes.Value);

  // output pins
  var outputOut = this.addOutputPin('XYZ Transformed', [0.0, 0.0, 0.0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    var maxSize = Math.max(transformIn.getSliceCount(), xyzIn.getSliceCount()/3);

    for (var i=0; i<maxSize; i++) {
      var xyz = xyzIn.getValue(i, 3);
      var t = transformIn.getValue(i);
      mat4.multiplyVec3(t, xyz);
      outputOut.setValue(i*3 + 0, xyz[0]);
      outputOut.setValue(i*3 + 1, xyz[1]);
      outputOut.setValue(i*3 + 2, xyz[2]);
    }

    outputOut.setSliceCount(Math.ceil(maxSize*3));
  }

}
VVVV.Nodes.Multiply3dVector.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Multiply (4d Vector)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Multiply4dVector = function(id, graph) {
  this.constructor(id, "Multiply (4d Vector)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  // input pins
  var transformIn = this.addInputPin('Transform', [], VVVV.PinTypes.Transform);
  var xyzwIn = this.addInputPin('XYZW UnTransformed', [0.0, 0.0, 0.0, 1.0], VVVV.PinTypes.Value);

  // output pins
  var outputOut = this.addOutputPin('XYZW Transformed', [0.0, 0.0, 0.0, 1.0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    var maxSize = Math.max(transformIn.getSliceCount(), xyzwIn.getSliceCount()/4);

    for (var i=0; i<maxSize; i++) {
      var xyzw = xyzwIn.getValue(i, 4);
      var t = transformIn.getValue(i);
      mat4.multiplyVec4(t, xyzw);
      outputOut.setValue(i*4 + 0, xyzw[0]);
      outputOut.setValue(i*4 + 1, xyzw[1]);
      outputOut.setValue(i*4 + 2, xyzw[2]);
      outputOut.setValue(i*4 + 3, xyzw[3]);
    }

    outputOut.setSliceCount(Math.ceil(maxSize*4));
  }

}
VVVV.Nodes.Multiply4dVector.prototype = new VVVV.Core.Node();

}(vvvvjs_jquery));
