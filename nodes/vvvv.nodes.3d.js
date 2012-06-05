// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

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
  var xIn = this.addInputPin('X', [0], this);
  var yIn = this.addInputPin('Y', [0], this);
  var zIn = this.addInputPin('Z', [-1], this);

  // output pins
  var pitchOut = this.addOutputPin('Pitch', [0], this);
  var yawOut = this.addOutputPin('Yaw', [0], this);
  var lengthOut = this.addOutputPin('Length', [1], this);

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
  var pitchIn = this.addInputPin('Pitch', [0], this);
  var yawIn = this.addInputPin('Yaw', [0], this);
  var lengthIn = this.addInputPin('Length', [1], this);

  // output pins
  var xOut = this.addOutputPin('X', [0], this);
  var yOut = this.addOutputPin('Y', [0], this);
  var zOut = this.addOutputPin('Z', [1], this);

  
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
  var xIn = this.addInputPin('X', [1], this);
  var yIn = this.addInputPin('Y', [0], this);
  var zIn = this.addInputPin('Z', [0], this);

  // output pins
  var normalizedxOut = this.addOutputPin('NormalizedX', [1], this);
  var normalizedyOut = this.addOutputPin('NormalizedY', [0], this);
  var normalizedzOut = this.addOutputPin('NormalizedZ', [0], this);
  var inputlengthOut = this.addOutputPin('Input Length', [0], this);

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
 Author(s): 'Your Name'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Normalize3dVector = function(id, graph) {
  this.constructor(id, "Normalize (3d Vector)", graph);
  
  this.meta = {
    authors: ['Your Name'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  // input pins
  var xyzIn = this.addInputPin('XYZ', [], this);

  // output pins
  var normalizedxyzOut = this.addOutputPin('NormalizedXYZ', [], this);
  var inputlengthOut = this.addOutputPin('Input Length', [0], this);

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