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

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: CollisionBoxPoint (3d)
 Author(s): 'David Gann'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.CollisionBoxPoint3d = function(id, graph) {
  this.constructor(id, "CollisionBoxPoint (3d)", graph);
  
  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = true;
  this.auto_nil = true;
  
  // input pins
   var PointPosition = this.addInputPin("PointPosition", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var BoxPosition = this.addInputPin("BoxPosition", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var BoxScale = this.addInputPin("BoxScale", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   

  // output pins
  var PointColide = this.addOutputPin('PointColide', [0], VVVV.PinTypes.Value);
  var PointIndex = this.addOutputPin('PointIndex', [0], VVVV.PinTypes.Value);
  var BoxColide = this.addOutputPin('BoxColide', [0], VVVV.PinTypes.Value);
  var BoxIndex = this.addOutputPin('BoxIndex', [0], VVVV.PinTypes.Value);
  

  // evaluate() will be called each frame
  // (if the input pins have changed, or the nodes is flagged as auto-evaluating)
  this.evaluate = function() {
    var maxsizePoint =  PointPosition.getSliceCount()/3;  
    var maxsizeBox =  BoxPosition.getSliceCount()/3;
    var iidx = 0;
    var idx = 0;
    var BoxAccumulate = Array.apply(null, Array(maxsizeBox)).map(Number.prototype.valueOf,0);
    var PointIndexArray = [];
    var piix = 0;
    var BoxIndexArray = [];
    var biix = 0;
    for (var i=0; i<maxsizePoint; i++) {
        var pointX = PointPosition.getValue(iidx);
        var pointY = PointPosition.getValue(iidx+1);
        var pointZ = PointPosition.getValue(iidx+2);
        
        var PointAccumulate = 0;
        
        
      for (var j=0; j<maxsizeBox; j++) {
        var minX = BoxPosition.getValue(idx) - BoxScale.getValue(idx) /2 ;
        var minY = BoxPosition.getValue(1+idx) - BoxScale.getValue(1+idx) /2 ;
        var minZ = BoxPosition.getValue(2+idx) - BoxScale.getValue(3+idx) /2 ;
        var maxX = BoxPosition.getValue(idx) + BoxScale.getValue(idx) /2 ;
        var maxY = BoxPosition.getValue(1+idx) + BoxScale.getValue(1+idx) /2 ;
        var maxZ = BoxPosition.getValue(2+idx) + BoxScale.getValue(3+idx) /2 ;
        
        if((pointX >= minX && pointX <= maxX) &&
           (pointY >= minY && pointY <= maxY) &&
           (pointZ >= minZ && pointZ <= maxZ)) {
           PointAccumulate++;
           BoxAccumulate[j] = BoxAccumulate[j]+1;
           PointIndexArray.push(i);
           BoxIndexArray.push(j);
           BoxIndex.setValue(biix, BoxIndexArray[biix]);
           PointIndex.setValue(piix, PointIndexArray[piix]);
           
           
           biix++;
           piix++;
           
        }
        
        BoxColide.setValue(j, BoxAccumulate[j]);
        idx=idx+3;
      }
      PointColide.setValue(i, PointAccumulate);
      
      iidx=iidx+3;
      
    }
    

    
    PointColide.setSliceCount(maxsizePoint);
    BoxColide.setSliceCount(maxsizeBox);
    BoxIndex.setSliceCount(BoxIndexArray.length);
    PointIndex.setSliceCount(PointIndexArray.length);
  }

}
VVVV.Nodes.CollisionBoxPoint3d.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: CollisionBoxBox (3d)
 Author(s): 'David Gann'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.CollisionBoxBox3d = function(id, graph) {
  this.constructor(id, "CollisionBoxBox (3d)", graph);
  
  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = true;
  this.auto_nil = true;
  
  // input pins
   var Box1Position = this.addInputPin("Box1Position", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var Box1Scale = this.addInputPin("Box1Scale", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var Box2Position = this.addInputPin("Box2Position", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var Box2Scale = this.addInputPin("Box2Scale", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   

  // output pins
  var Box1Colide = this.addOutputPin('Box1Colide', [0], VVVV.PinTypes.Value);
  var Box1Index = this.addOutputPin('Box1Index', [0], VVVV.PinTypes.Value);
  var Box2Colide = this.addOutputPin('Box2Colide', [0], VVVV.PinTypes.Value);
  var Box2Index = this.addOutputPin('Box2Index', [0], VVVV.PinTypes.Value);
 

  // evaluate() will be called each frame
  // (if the input pins have changed, or the nodes is flagged as auto-evaluating)
  this.evaluate = function() {
    var maxsizeBox1 =  Box1Position.getSliceCount()/3;  
    var maxsizeBox2 =  Box2Position.getSliceCount()/3;
    var iidx = 0;
    var idx = 0;
    var Box1Accumulate = 0;
    var Box2Accumulate = Array.apply(null, Array(maxsizeBox2)).map(Number.prototype.valueOf,0);
    var Box1IndexArray = [];
    var b1iix = 0;
    var Box2IndexArray = [];
    var b2iix = 0;
    
    for (var i=0; i<maxsizeBox1; i++) {
        var minX1 = Box1Position.getValue(iidx) - Box1Scale.getValue(iidx) /2 ;
        var minY1 = Box1Position.getValue(1+iidx) - Box1Scale.getValue(1+iidx) /2 ;
        var minZ1 = Box1Position.getValue(2+iidx) - Box1Scale.getValue(3+iidx) /2 ;
        var maxX1 = Box1Position.getValue(iidx) + Box1Scale.getValue(iidx) /2 ;
        var maxY1 = Box1Position.getValue(1+iidx) + Box1Scale.getValue(1+iidx) /2 ;
        var maxZ1 = Box1Position.getValue(2+iidx) + Box1Scale.getValue(3+iidx) /2 ;
        
        var Box1Accumulate = 0;
        
        
      for (var j=0; j<maxsizeBox2; j++) {
        var minX2 = Box2Position.getValue(idx) - Box2Scale.getValue(idx) /2 ;
        var minY2 = Box2Position.getValue(1+idx) - Box2Scale.getValue(1+idx) /2 ;
        var minZ2 = Box2Position.getValue(2+idx) - Box2Scale.getValue(3+idx) /2 ;
        var maxX2 = Box2Position.getValue(idx) + Box2Scale.getValue(idx) /2 ;
        var maxY2 = Box2Position.getValue(1+idx) + Box2Scale.getValue(1+idx) /2 ;
        var maxZ2 = Box2Position.getValue(2+idx) + Box2Scale.getValue(3+idx) /2 ;
        
        if((minX1 <= maxX2 && maxX1 >= minX2) &&
           (minY1 <= maxY2 && maxY1 >= minY2) &&
           (minZ1 <= maxZ2 && maxZ1 >= minZ2)) {
           Box1Accumulate++;
           Box2Accumulate[j] = Box2Accumulate[j]+1;
           Box1IndexArray.push(i);
           Box2IndexArray.push(j);
           Box1Index.setValue(b1iix, Box1IndexArray[b1iix]);
           Box2Index.setValue(b2iix, Box2IndexArray[b2iix]);
           
           
           b1iix++;
           b2iix++;
           
        }
        
        Box2Colide.setValue(j, Box2Accumulate[j]);
        idx=idx+3;
      }
      Box1Colide.setValue(i, Box1Accumulate);
      
      iidx=iidx+3;
      
    }
    

    
    Box1Colide.setSliceCount(maxsizeBox1);
    Box2Colide.setSliceCount(maxsizeBox2);
    Box2Index.setSliceCount(Box2IndexArray.length);
    Box1Index.setSliceCount(Box1IndexArray.length);
  }

}
VVVV.Nodes.CollisionBoxBox3d.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: CollisionBoxSweep (3d)
 Author(s): 'David Gann'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.CollisionBoxSweep3d = function(id, graph) {
  this.constructor(id, "CollisionBoxSweep (3d)", graph);
  
  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = true;
  
  // input pins
   var Box1Position = this.addInputPin("Box1Position", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var Box1Velocity = this.addInputPin("Box1Velocity", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var Box1Scale = this.addInputPin("Box1Scale", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var Box2Position = this.addInputPin("Box2Position", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var Box2Velocity = this.addInputPin("Box2Velocity", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var Box2Scale = this.addInputPin("Box2Scale", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   

  // output pins
  var Box1Colide = this.addOutputPin('Box1Colide', [0], VVVV.PinTypes.Value);
  var Box1Index = this.addOutputPin('Box1Index', [0], VVVV.PinTypes.Value);

  var Box2Colide = this.addOutputPin('Box2Colide', [0], VVVV.PinTypes.Value);
  var Box2Index = this.addOutputPin('Box2Index', [0], VVVV.PinTypes.Value);
  
  var NormalsOut = this.addOutputPin('NormalsOut', [0.0,0.0,0.0], VVVV.PinTypes.Value);
  var CollisionTime = this.addOutputPin('CollisionTime', [0.0], VVVV.PinTypes.Value);
  var Collide = this.addOutputPin('Collide', [0], VVVV.PinTypes.Value);

 

  // evaluate() will be called each frame
  // (if the input pins have changed, or the nodes is flagged as auto-evaluating)
  this.evaluate = function() {
      
    if(Box1Position.getSliceCount() >= 3){ var maxsizeBox1 =  Box1Position.getSliceCount()/3; }
    else {var maxsizeBox1 = 3;}
    if(Box2Position.getSliceCount() >= 3){var maxsizeBox2 =  Box2Position.getSliceCount()/3;}
    else {var maxsizeBox2 = 3;}


    var iidx = 0;
    var idx = 0;
    var Box1Accumulate = 0;
    var Box2Accumulate = Array.apply(null, Array(maxsizeBox2)).map(Number.prototype.valueOf,0);
    var Box1IndexArray = [];
    var b1iix = 0;
    var Box2IndexArray = [];
    var normalArray = [];
    var niix = 0;
    var CollisionTimeArray = [];
    var Collision = 0;

    for (var i=0; i<maxsizeBox1; i++) {
        var minX1 = Box1Position.getValue(iidx) - Box1Scale.getValue(iidx) /2 ;
        var minY1 = Box1Position.getValue(1+iidx) - Box1Scale.getValue(1+iidx) /2 ;
        var minZ1 = Box1Position.getValue(2+iidx) - Box1Scale.getValue(3+iidx) /2 ;
        var maxX1 = Box1Position.getValue(iidx) + Box1Scale.getValue(iidx) /2 ;
        var maxY1 = Box1Position.getValue(1+iidx) + Box1Scale.getValue(1+iidx) /2 ;
        var maxZ1 = Box1Position.getValue(2+iidx) + Box1Scale.getValue(3+iidx) /2 ;
        var Box1Accumulate = 0;    
        
      for (var j=0; j<maxsizeBox2; j++) {
        var minX2 = Box2Position.getValue(idx) - Box2Scale.getValue(idx) /2 ;
        var minY2 = Box2Position.getValue(1+idx) - Box2Scale.getValue(1+idx) /2 ;
        var minZ2 = Box2Position.getValue(2+idx) - Box2Scale.getValue(3+idx) /2 ;
        var maxX2 = Box2Position.getValue(idx) + Box2Scale.getValue(idx) /2 ;
        var maxY2 = Box2Position.getValue(1+idx) + Box2Scale.getValue(1+idx) /2 ;
        var maxZ2 = Box2Position.getValue(2+idx) + Box2Scale.getValue(3+idx) /2 ;
        
        var vX = -1*(Box1Velocity.getValue(iidx) - Box2Velocity.getValue(idx));
        var vY = -1*(Box1Velocity.getValue(iidx+1) - Box2Velocity.getValue(idx+1));
        var vZ = -1*(Box1Velocity.getValue(iidx+2) - Box2Velocity.getValue(idx+2));
        
        if (vX==0.0){vX=0.00000000001;}
        if (vY==0.0){vY=0.00000000001;}
        if (vZ==0.0){vZ=0.00000000001;}
        
        var normalDirX=1; var normalDirY=1; var normalDirZ=1;

        if(vX > 0){
            var EarlyTimeX = (minX2 - maxX1) / vX;
            var LateTimeX = (maxX2 - minX1) / vX;
            var normalDirX = 1;
        } 
        else if(vX < 0){
            var EarlyTimeX = (maxX2 - minX1) / vX;
            var LateTimeX = (minX2 - maxX1) / vX;
            var normalDirX = -1;
        } 
 
        if(vY > 0){
            var EarlyTimeY = (minY2 - maxY1) / vY;
            var LateTimeY = (maxY2 - minY1) / vY;
            var normalDirY = 1;
        } 
        else if(vY < 0){
            var EarlyTimeY = (maxY2 - minY1) / vY;
            var LateTimeY = (minY2 - maxY1) / vY;
            var normalDirY = -1;
        }
        if(vZ > 0){
            var EarlyTimeZ = (minZ2 - maxZ1) / vZ;
            var LateTimeZ = (maxZ2 - minZ1) / vZ;
            var normalDirZ = 1;
        }
        else if(vZ < 0){
            var EarlyTimeZ = (maxZ2 - minZ1) / vZ;
            var LateTimeZ = (minZ2 - maxZ1) / vZ;
            var normalDirZ = -1;
        }
        
        
        
        //Now earliest and latest collision Time unit from all axis
        var T0 = Math.max(EarlyTimeX,EarlyTimeY,EarlyTimeZ);
        var T1 = Math.min(LateTimeX,LateTimeY,LateTimeZ);
        
        //Collision  if(T0 <= T1 && T0>=0 && T0 <=1 )
        
       // if (T0 > T1 || EarlyTimeX <= 0.0 && EarlyTimeY <= 0.0 && EarlyTimeZ <= 0.0 || EarlyTimeX >= 1.0 && EarlyTimeY >= 1.0 && EarlyTimeZ >= 1.0)
        //{
        //}
        if(T0 <= T1 && T0>0 && T0 < 1 ){
           Collision = 1;
           Box1Accumulate++;
           Box2Accumulate[j] = Box2Accumulate[j]+1;
           Box1IndexArray.push(i);
           Box2IndexArray.push(j);
           Box1Index.setValue(b1iix, Box1IndexArray[b1iix]);
           Box2Index.setValue(b1iix, Box2IndexArray[b1iix]);
           CollisionTimeArray.push(T0);
           
           CollisionTime.setValue(b1iix, CollisionTimeArray[b1iix]);
           
           if(EarlyTimeX>EarlyTimeY && EarlyTimeX>EarlyTimeZ) {var normal=[1.0*normalDirX,0,0];}
           if(EarlyTimeY>EarlyTimeX && EarlyTimeY>EarlyTimeZ) {var normal=[0,1.0*normalDirY,0];}
           if(EarlyTimeZ>EarlyTimeX && EarlyTimeZ>EarlyTimeY) {var normal=[0,0,1.0*normalDirZ];}
           
           normalArray.push(normal[0]);normalArray.push(normal[1]);normalArray.push(normal[2]);
           NormalsOut.setValue(niix, normalArray[niix]);
           NormalsOut.setValue(niix+1, normalArray[niix+1]);
           NormalsOut.setValue(niix+2, normalArray[niix+2]);
          
           b1iix++;
          
           niix=niix+3;
        }
        Box2Colide.setValue(j, Box2Accumulate[j]);
        idx=idx+3;
      }
      Box1Colide.setValue(i, Box1Accumulate);
      Collide.setValue(0, Collision);
      
      
      iidx=iidx+3;
    }
    Box1Colide.setSliceCount(maxsizeBox1);
    Box2Colide.setSliceCount(maxsizeBox2);
    
    if (b1iix==0){
        Box2Index.setSliceCount(1);
        Box1Index.setSliceCount(1);
        NormalsOut.setSliceCount(3);
        CollisionTime.setSliceCount(1);
    }
    else {
        Box2Index.setSliceCount(Box2IndexArray.length);
        Box1Index.setSliceCount(Box1IndexArray.length);
        NormalsOut.setSliceCount(normalArray.length);
        CollisionTime.setSliceCount(CollisionTimeArray.length);
    }
    
   
  }

}
VVVV.Nodes.CollisionBoxSweep3d.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Trajectory (3d)
 Author(s): 'David Gann'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Trajectory3d = function(id, graph) {
  this.constructor(id, "Trajectory (3d)", graph);
  
  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = true;
  
  // input pins
   var InitPos = this.addInputPin("Initial Position", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var InitVel = this.addInputPin("Initial Velocity", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var MaxAge = this.addInputPin("Max Age", [100], VVVV.PinTypes.Value);
   
   var Create = this.addInputPin("Create", [0], VVVV.PinTypes.Value);
   
   var DestroyIndex = this.addInputPin("Destroy Index", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var Destroy = this.addInputPin("Destroy", [0], VVVV.PinTypes.Value);
   
   var NewVel = this.addInputPin("Update Velocity", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var UpdateIndex = this.addInputPin("Update Index", [0], VVVV.PinTypes.Value);
   var Update = this.addInputPin("Update", [0], VVVV.PinTypes.Value);

  // output pins
  var PositionXYZ = this.addOutputPin('PositionXYZ', [0.0,0.0,0.0], VVVV.PinTypes.Value);
  var VelocityXYZ = this.addOutputPin('VelocityXYZ', [0.0,0.0,0.0], VVVV.PinTypes.Value);
  var AgeOut = this.addOutputPin('Age', [0], VVVV.PinTypes.Value);
  
  var Pos = [];
  var Vel = [];
  var Age = [];
  var MaxAgeArray = [];
  // evaluate() will be called each frame
  // (if the input pins have changed, or the nodes is flagged as auto-evaluating)
  this.evaluate = function() {
      
    var maxInit= Math.max(InitPos.getSliceCount()/3,InitVel.getSliceCount()/3);  
    if(Create.getValue(0)==1) {
    for (var i=0; i<maxInit; i++) {
      Pos.push(InitPos.getValue(i*3)); 
      Pos.push(InitPos.getValue(i*3+1)); 
      Pos.push(InitPos.getValue(i*3+2)); 
      
      Vel.push(InitVel.getValue(i*3)); 
      Vel.push(InitVel.getValue(i*3+1)); 
      Vel.push(InitVel.getValue(i*3+2)); 
      Age.push(0);
      MaxAgeArray.push(MaxAge.getValue(i));
      
     }
    }
     
    if(Update.getValue(0)==1){
        for(var j=0; j<UpdateIndex.getSliceCount(); j++){
            Vel[UpdateIndex.getValue(j)*3]= NewVel.getValue(j*3);
            Vel[UpdateIndex.getValue(j)*3+1]= NewVel.getValue(j*3+1);
            Vel[UpdateIndex.getValue(j)*3+2]= NewVel.getValue(j*3+2);
        }
    }
    
    if(Destroy.getValue(0)==1){
        for(var k=0; k<DestroyIndex.getSliceCount(); k++){
            Pos.splice([DestroyIndex[k]*3],3);

            Vel.splice([DestroyIndex[k]*3],3);

            Age.splice([DestroyIndex[k]],1);
            
            MaxAgeArray.splice([DestroyIndex[k]],1);
        }
    }
    var maxSize= Math.max(Pos.length/3,Vel.length/3);  
    var AgeCount=0;
    var AgedIndices=[];
    
    //Mainloop
    if(maxSize != 0 || Create.getValue(0)==1){
        for(var n=0; n<maxSize; n++){
            Pos[n*3] = Pos[n*3]+ Vel[n*3];
            Pos[n*3+1] = Pos[n*3+1]+ Vel[n*3+1];
            Pos[n*3+2] = Pos[n*3+2]+ Vel[n*3+2];
            Age[n] = Age[n]+1;
            if(Age[n]>= MaxAgeArray[n]){  
                AgeCount=AgeCount+1;
                AgedIndices.push(n);
             }

        }
        
        if(AgeCount !== 0){
        for(var a=0; a<AgeCount; a++){
            
                Pos.splice(AgedIndices[a]*3,3);
                Vel.splice(AgedIndices[a]*3,3);
                Age.splice(AgedIndices[a],1);
                MaxAgeArray.splice(AgedIndices[a],1); ///doesnt remove array correctly?
             }

        }
        
        
        //updated array length
        maxSize= Math.max(Pos.length/3,Vel.length/3); 
        for(var l=0; l<maxSize; l++){
            
            PositionXYZ.setValue(l*3, Pos[l*3]);
            PositionXYZ.setValue(l*3+1, Pos[l*3+1]);
            PositionXYZ.setValue(l*3+2, Pos[l*3+2]);
            
            VelocityXYZ.setValue(l*3, -(Vel[l*3]));
            VelocityXYZ.setValue(l*3+1,(Vel[l*3+1]));
            VelocityXYZ.setValue(l*3+2, -(Vel[l*3+2]));
            
            AgeOut.setValue(l,Age[l]);
             
        }
    }
    else { 
        PositionXYZ.setValue(0,0.0);
        PositionXYZ.setValue(1,0.0);
        PositionXYZ.setValue(2,0.0);
        
        VelocityXYZ.setValue(0,0.0);
        VelocityXYZ.setValue(1,0.0);
        VelocityXYZ.setValue(2,0.0);
        
        AgeOut.setValue(0,0.0);
    }
    
    PositionXYZ.setSliceCount(Pos.length);
    VelocityXYZ.setSliceCount(Vel.length);
    AgeOut.setSliceCount(Age.length);

  }

}
VVVV.Nodes.Trajectory3d.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: CollisionResponse (3d)
 Author(s): 'David Gann'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.CollisionResponse3d = function(id, graph) {
  this.constructor(id, "CollisionResponse (3d)", graph);
  
  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = true;
  
  // input pins
   var Velocity = this.addInputPin('Velocity', [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var Normals = this.addInputPin('CollisionNormals', [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var CollisionTime = this.addInputPin('CollisionTime', [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var typeIn = this.addInputPin('ResponseType', ['deflect'], VVVV.PinTypes.Enum);
   typeIn.enumOptions = ["deflect", "slide"];
   var Collide= this.addInputPin('Collide', [0], VVVV.PinTypes.Value);

  // output pins
  var UpdatedVelocity = this.addOutputPin('UpdatedVelocityXYZ', [0.0,0.0,0.0], VVVV.PinTypes.Value);

  
  this.evaluate = function() {
      


    if (Collide.getValue(0)==1){
    var maxCount= Velocity.getSliceCount()/3;  
    
        for (var i=0; i<maxCount; i++) {
        var remainingtime = 1.0-CollisionTime.getValue(i); 
        
        
        if (typeIn.getValue(i)=='deflect'){
            var velX = -Velocity.getValue(i*3); //* remainingtime;
            var velY = -Velocity.getValue(i*3+1); //* remainingtime;
            var velZ = -Velocity.getValue(i*3+2); //* remainingtime;
            if(Math.abs(Normals.getValue(i*3))>0.0){
                velX = -velX;
                }
            if(Math.abs(Normals.getValue(i*3+1))>0.0){
                velY = -velY;
                }
            if(Math.abs(Normals.getValue(i*3+2))>0.0){
                velZ = -velZ;
                }
            }    
        

        if (typeIn.getValue(i)=='slide' || typeIn.getValue()==''){
            var velX = -Velocity.getValue(i*3); //* remainingtime;
            var velY = -Velocity.getValue(i*3+1); //* remainingtime;
            var velZ = -Velocity.getValue(i*3+2);
            
            var impulseX = -(velX*Normals.getValue(i*3))*Normals.getValue(i*3);
            var impulseY = -(velY*Normals.getValue(i*3+1))*Normals.getValue(i*3+1);
            var impulseZ = -(velZ*Normals.getValue(i*3+2))*Normals.getValue(i*3+2);
            
            velX += impulseX;
            velY += impulseY;
            velZ += impulseZ;
            }

             UpdatedVelocity.setValue(i*3, velX);
             UpdatedVelocity.setValue(i*3+1, velY);
             UpdatedVelocity.setValue(i*3+2, velZ);
        }
             UpdatedVelocity.setSliceCount(i*3);
        }
        else {
             UpdatedVelocity.setValue(0,0.0);UpdatedVelocity.setValue(1,0.0);UpdatedVelocity.setValue(2,0.0);
             UpdatedVelocity.setSliceCount(3);
        }
    }
    
}
VVVV.Nodes.CollisionResponse3d.prototype = new VVVV.Core.Node();



/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: RayTriangleIntersect (3d)
 Author(s): 'David Gann'
 Original Node Author(s): ''
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.RayTriangleIntersect3d = function(id, graph) {
  this.constructor(id, "RayTriangleIntersect (3d)", graph);
  
  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = true;
  
  // input pins
   var Mesh = this.addInputPin("Mesh", [], VVVV.PinTypes.WebGlResource);
   var Vertices = this.addInputPin('Vertices', [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var Indices = this.addInputPin('Indices', [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var RayOrigin = this.addInputPin('RayOrigin', [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var RayDirection = this.addInputPin('RayDirection', [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var applyIn = this.addInputPin('ApplyMesh', [1], VVVV.PinTypes.Value);
   
  // output pins
  var Intersect = this.addOutputPin('Intersect', [0], VVVV.PinTypes.Value);
  var IntersectPoint = this.addOutputPin('IntersectPoint', [0.0,0.0,0.0], VVVV.PinTypes.Value);
  
  
  ///ray-triangle intersection from https://github.com/substack/ray-triangle-intersection/blob/master/index.js
    function cross(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2],
        bx = b[0], by = b[1], bz = b[2]

    out[0] = ay * bz - az * by
    out[1] = az * bx - ax * bz
    out[2] = ax * by - ay * bx
    return out
    }

    function dot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
    }

    function sub(out, a, b) {
        out[0] = a[0] - b[0]
        out[1] = a[1] - b[1]
        out[2] = a[2] - b[2]
        return out
    }

    var EPSILON = 0.0001;//var EPSILON = 0.000001;
    var edge1 = [0,0,0];
    var edge2 = [0,0,0];
    var tvec = [0,0,0];
    var pvec = [0,0,0];
    var qvec = [0,0,0];
    var out = [0,0,0];


    function intersectTriangle (out, pt, dir, tri) {
        
        sub(edge1, tri[1], tri[0]);
        sub(edge2, tri[2], tri[0]);
        cross(pvec, dir, edge2);
        
        var det = dot(edge1, pvec);
        //if (det < EPSILON) console.log("null1"); return null;
        sub(tvec, pt, tri[0]);
        var u = dot(tvec, pvec);
        //if (u < 0 || u > det) console.log("null2"); return null;
        cross(qvec, tvec, edge1);
        var v = dot(dir, qvec);
        //if (v < 0 || u + v > det) console.log("null3"); return null;

        var t = dot(edge2, qvec) / det;
        out[0] = pt[0] + t * dir[0];
        out[1] = pt[1] + t * dir[1];
        out[2] = pt[2] + t * dir[2];
        return out;
    }
  
  
  var Indices = [];
  var VertexList = [];
  
  this.evaluate = function() {
      
  if (applyIn.getValue(0)>=.5) {
    if (Mesh.isConnected()) {
          var Geometry = Mesh.getValue(0);
          Indices = Geometry.indexBuffer;
          VertexList = Geometry.vertexBuffer.subBuffers.POSITION.data;
         
    }
  }
  //console.log(Indices); console.log(VertexList);    
  var pt = [RayOrigin.getValue(0), RayOrigin.getValue(1), RayOrigin.getValue(2)];
  var dir = [RayDirection.getValue(0), RayDirection.getValue(1), RayDirection.getValue(2)];
  
  var tri = [[Vertices.getValue(0), Vertices.getValue(1), Vertices.getValue(2)],
             [Vertices.getValue(3), Vertices.getValue(4), Vertices.getValue(5)],
             [Vertices.getValue(6), Vertices.getValue(7), Vertices.getValue(8)]];
  
  var Point = intersectTriangle(out, pt, dir, tri);
  if(Point == null) { Point = [-1,-1,-1];}
      
  
  
  IntersectPoint.setValue(0, Point[0]);
  IntersectPoint.setValue(1, Point[1]);
  IntersectPoint.setValue(2, Point[2]);
  
  }
  
    
}
VVVV.Nodes.RayTriangleIntersect3d.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: TerrainGrid (3d)
 Author(s): 'David Gann'
 Original Node Author(s): '000.graphics'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

//Create a Position and Index Grid for Dynamic Loading of HeightMap Based MultiGridded Terrain
//Only usefull with a set of indexed heightmap textures

VVVV.Nodes.TerrainGrid = function(id, graph) {
  this.constructor(id, "TerrainGrid (3d)", graph);
  
  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = true;
  
  // input pins
   var Position = this.addInputPin('PositionXYZ', [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var GridRes = this.addInputPin('GridResolutionXY', [128.0,128.0], VVVV.PinTypes.Value);
   var WorldDimension = this.addInputPin('WorldDimensionXY', [1000.0,1000.0], VVVV.PinTypes.Value);
   var ViewRadius = this.addInputPin('ViewRadius', [1.0], VVVV.PinTypes.Value);

  // output pins
  var GridXYZ = this.addOutputPin('GridXYZ', [0.0,0.0,0.0], VVVV.PinTypes.Value);
  var GridScaleXZ = this.addOutputPin('GridScaleXZ', [1.0,1.0], VVVV.PinTypes.Value);
  var GridIndex = this.addOutputPin('GridIndex', [0.0], VVVV.PinTypes.Value);
  
  //create arrays with 0s for the first evaluation frame
  var prevIndexArr = Array.apply(null, Array(ViewRadius.getValue(0)*8+1)).map(Number.prototype.valueOf,0);
  var prevXArr = Array.apply(null, Array(ViewRadius.getValue(0)*8+1)).map(Number.prototype.valueOf,0);
  var prevYArr = Array.apply(null, Array(ViewRadius.getValue(0)*8+1)).map(Number.prototype.valueOf,0);
  

  this.evaluate = function() {
    var IndexArr = []; 
    var xArr = [];
    var yArr = [];
    var grid_scaleX = WorldDimension.getValue(0)/GridRes.getValue(0);
    var grid_scaleY = WorldDimension.getValue(1)/GridRes.getValue(1);
    
    var posX = (Position.getValue(0)+WorldDimension.getValue(0)/2.0) / WorldDimension.getValue(0);
    var posY = (Position.getValue(2)+WorldDimension.getValue(1)/2.0) / WorldDimension.getValue(1);
    var indexX = Math.floor(GridRes.getValue(0)*posX + 0.5);
    var indexY = Math.floor(GridRes.getValue(1)* posY + 0.5);
    
    
    //get surounding indices and positions from grid
    var  k = 0;
    for (var x = -ViewRadius.getValue(0); x < ViewRadius.getValue(0)+1; x++){
       for (var y = -ViewRadius.getValue(0); y < ViewRadius.getValue(0)+1; y++){
        var iX = indexX + x 
        var iY = indexY + y;
        var gridPosX = (iX * grid_scaleX)-WorldDimension.getValue(0)/2.0;
        var gridPosY = (iY * grid_scaleY)-WorldDimension.getValue(1)/2.0;
        xArr.push(gridPosX);
        yArr.push(gridPosY);

        //GridXYZ.setValue(k*3, gridPosX);
        //GridXYZ.setValue(k*3+1, 0.0);
        //GridXYZ.setValue(k*3+2, gridPosY);
        //var IndexInGrid = (GridRes.getValue(1)-iY)*GridRes.getValue(0)-iX;
        var IndexInGrid = GridRes.getValue(1)*iY+iX;

        IndexArr.push(IndexInGrid);
        //GridIndex.setValue(k, IndexInGrid);
        k = k+1;
       }
    }
      
    GridScaleXZ.setValue(0,grid_scaleX);
    GridScaleXZ.setValue(1,grid_scaleY);
    
    //Index and Position Sorting to avoid relaoding of Textures
    var deletedIndices = [];
    var newIndices = [];

    
    if (prevIndexArr != IndexArr){ 
        
        for (var i = 0; i < ViewRadius.getValue(0)*8+1; i++){
            if(prevIndexArr.indexOf(IndexArr[i])==-1){ 
               newIndices.push(i); 
            }
            if(IndexArr.indexOf(prevIndexArr[i])==-1){
               deletedIndices.push(i); ; 
            }  
        }
        
        for(var j = 0; j < deletedIndices.length; j++){
          prevIndexArr[deletedIndices[j]]  = IndexArr[newIndices[j]];
          prevXArr[deletedIndices[j]]  = xArr[newIndices[j]];
          prevYArr[deletedIndices[j]]  = yArr[newIndices[j]];
        } 
    }
    
    //finaly write sorted array to output
    for (var i = 0; i < ViewRadius.getValue(0)*8+1; i++){
        GridIndex.setValue(i, prevIndexArr[i]);
        
        GridXYZ.setValue(i*3, prevXArr[i]);
        GridXYZ.setValue(i*3+1, 0.0);
        GridXYZ.setValue(i*3+2, prevYArr[i]);
        
    }
    
      
    }
    
}
VVVV.Nodes.TerrainGrid.prototype = new VVVV.Core.Node();




/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: TerrainCollision (3d)
 Author(s): 'David Gann'
 Original Node Author(s): '000.graphics'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

//Loads files that contain the heightmap as binary (0-255). Performs UV Collision Detection for 3d Points Input, using only the x and z value of the input.
//Y of Heightmap at Input X Z is output and normal of coresponding polygon.
// 

VVVV.Nodes.TerrainCollision = function(id, graph) {
  this.constructor(id, "TerrainCollision (3d)", graph);
  
  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = true;
  
  // input pins
   var Pos = this.addInputPin('PositionXYZ', [0.0,0.0,0.0], VVVV.PinTypes.Value);

   var GridPositions = this.addInputPin('GridPositions', [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var GridIndices = this.addInputPin('GridIndices', [0.0], VVVV.PinTypes.Value);
   var grid_scale = this.addInputPin('GridScaleXY', [16.0,16.0], VVVV.PinTypes.Value);
   var GridRes = this.addInputPin('GridResolutionXY', [128.0,128.0], VVVV.PinTypes.Value);
   var HeightMapRes = this.addInputPin('HeigthMapRes', [128.0,128.0], VVVV.PinTypes.Value);
   var WorldDimension = this.addInputPin('WorldDimensionXY', [1000.0,1000.0], VVVV.PinTypes.Value);
   var HFactor = this.addInputPin('HeigthFactor', [0.25], VVVV.PinTypes.Value);
   
   var filenamePin = this.addInputPin("FileName", ["http://localhost"], VVVV.PinTypes.String);

  // output pins
  var VertexPos = this.addOutputPin('VertexPos3D', [0.0,0.0,0.0], VVVV.PinTypes.Value);
  var CollissionY = this.addOutputPin('CollisionY', [0.0], VVVV.PinTypes.Value);
  var CollisionNormal = this.addOutputPin('CollisionNormal', [0.0,1.0,0.0], VVVV.PinTypes.Value);
  var ArrayOut = this.addOutputPin('ArrayOut', [0.0], VVVV.PinTypes.Value);

  var buffer = new ArrayBuffer(HeightMapRes.getValue(0)*HeightMapRes.getValue(1));
  var responseArray = new Uint16Array(buffer);
  var HasLoaded = [0,0,0,0,0,0,0,0,0];
   var prevFilenames = [];
   var filename = [];
   var xhr = [];
   var multiarray = [];
   
   var pA = [];
   var pB = [];
   var pC = [];
   
   var TileIndices = [];
   
    ///ray-triangle intersection from https://github.com/substack/ray-triangle-intersection/blob/master/index.js
    function cross(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2],
        bx = b[0], by = b[1], bz = b[2]

    out[0] = ay * bz - az * by
    out[1] = az * bx - ax * bz
    out[2] = ax * by - ay * bx
    return out
    }

    function dot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
    }

    function sub(out, a, b) {
        out[0] = a[0] - b[0]
        out[1] = a[1] - b[1]
        out[2] = a[2] - b[2]
        return out
    }

    var EPSILON = 0.000001;
    var edge1 = [0,0,0];
    var edge2 = [0,0,0];
    var tvec = [0,0,0];
    var pvec = [0,0,0];
    var qvec = [0,0,0];
    var out = [0,0,0];
    
   function intersectTriangle (out, pt, dir, tri) {
        sub(edge1, tri[1], tri[0]);
        sub(edge2, tri[2], tri[0]);
        cross(pvec, dir, edge2);
        var det = dot(edge1, pvec);
        //if (det < EPSILON) return null;
        sub(tvec, pt, tri[0]);
        var u = dot(tvec, pvec);
        //if (u < 0 || u > det) return null;
        cross(qvec, tvec, edge1);
        var v = dot(dir, qvec);
        //if (v < 0 || u + v > det) return null;

        var t = dot(edge2, qvec) / det;
        out[0] = pt[0] + t * dir[0];
        out[1] = pt[1] + t * dir[1];
        out[2] = pt[2] + t * dir[2];
        return out;
    }
    
  this.evaluate = function() {
    
    //console.log(maxCount);
    
    
    var grid_scaleX = grid_scale.getValue(0);
    var grid_scaleZ = grid_scale.getValue(1);


    //Array Loop
        for (var i=0; i<filenamePin.getSliceCount(); i++) {
            if (prevFilenames[i]!=filenamePin.getValue(i) | HasLoaded[i] == 0) {
            //fill the TileIndices Array for later Refference in Position Loop    
            TileIndices[i] = GridIndices.getValue(i);
            filename[i] = VVVV.Helpers.prepareFilePath(filenamePin.getValue(i), this.parentPatch);
                 // iteration of Byte Arrays XMLHttpRequests in function keeps i correctly handled
                (function(i) {
                  xhr[i] = new XMLHttpRequest();
                  xhr[i].responseType = 'arraybuffer';
                  xhr[i].open("GET", filename[i], true);
                  xhr[i].onreadystatechange = function (oEvent) {
                     if (xhr[i].readyState === 4) {
                        if (xhr[i].status === 200) {
                          responseArray = new Uint16Array(xhr[i].response);
                          multiarray[i] = Array.from(responseArray);
                          HasLoaded[i]=1;
                        } else {
                          console.log("Error", xhr[i].status);
                        }
                     }
                  };
                  xhr[i].send(null);
               })(i);
            }
            prevFilenames[i] = filenamePin.getValue(i); 
        }
        
    


    var WorldDimX = WorldDimension.getValue(0)  ;
    var WorldDimZ = WorldDimension.getValue(1)  ;
    var WorldResX = GridRes.getValue(0);
    var WorldResZ = GridRes.getValue(1);
    var ColumnCount = HeightMapRes.getValue(0);
    var RowCount = HeightMapRes.getValue(1);
    var Factor = HFactor.getValue(0);
    var maxCount = Pos.getSliceCount()/3; 

    
    //Position Loop
    if(HasLoaded.indexOf(0)==-1){
        
    for (var i=0; i<16384; i++) {
            ArrayOut.setValue(i, multiarray[4][i]);
        }        
        
    for (var i=0; i<maxCount; i++) {

        // normalized world position and index
        var posX = (Pos.getValue(i*3)+WorldDimX/2.0) / WorldDimX;
        var posZ = (Pos.getValue(i*3+2)+WorldDimZ/2.0) / WorldDimZ;
        var indexX = Math.floor(WorldResX*posX + 0.5);
        var indexZ = Math.floor(WorldResZ* posZ + 0.5);
        //World Grid Index
        var IndexInGrid = WorldResZ*indexZ+indexX;
        //normalized Position and Index in Subgrid (current heigthmap tile)
        var pTnX = (posX - indexX*(1/WorldResX))*WorldResX+0.5;
        var pTnZ = (posZ - indexZ*(1/WorldResZ))*WorldResZ+0.5;       
        
        //Quad Index
        var SubIndexX = Math.floor((ColumnCount-1)*pTnX); //got rid of +0.5
        var SubIndexZ = Math.floor((RowCount-1)-(RowCount-1)*pTnZ);  //var SubIndexZ = Math.floor((RowCount-1)-(RowCount-1)*pTnZ);
        //Calculate on which of the 2 Polygon Triangles on the Quad is the Position 

        var QuadScaleX = 1/(ColumnCount-1);
        var QuadScaleZ = 1/(RowCount-1);
        var QuadCenterX = SubIndexX * QuadScaleX + QuadScaleX/2;
        var QuadCenterZ = SubIndexZ * QuadScaleZ + QuadScaleZ/2;
        //bottom left and top right vertice to calculate m of linear equation
        
        var multiarrayIndex = TileIndices.indexOf(IndexInGrid);
        
        var x1 = (QuadCenterX - QuadScaleX/2) * grid_scaleX - grid_scaleX/2 + GridPositions.getValue(multiarrayIndex*3);
        var z1 = - (QuadCenterZ + QuadScaleZ/2) * grid_scaleZ +grid_scaleZ/2 + GridPositions.getValue(multiarrayIndex*3+2);
        var x2 = (QuadCenterX + QuadScaleX/2) * grid_scaleX - grid_scaleX/2 + GridPositions.getValue(multiarrayIndex*3);
        var z2 = - (QuadCenterZ - QuadScaleZ/2) * grid_scaleZ +grid_scaleZ/2 + GridPositions.getValue(multiarrayIndex*3+2);
        
        //calculate z on the diagonal that separates the two triangles in the quad
        // loosly leaning on https://lwjglgamedev.gitbooks.io/3d-game-development-with-lwjgl/content/chapter15/chapter15.html
        
        var z_diagonal = ((z1 - z2) / (x1 - x2)) * (Pos.getValue(i*3) - x1) + z1;

        // Vertex Indices Calculated from Quad Indices - Orderer is top left, top right, bottom left, bottom right
        var VertexIndices = [SubIndexX    + SubIndexZ*RowCount,
                             SubIndexX +1 + SubIndexZ*RowCount,
                             SubIndexX    + (SubIndexZ+1)*RowCount,
                             SubIndexX +1 + (SubIndexZ+1)*RowCount]; 
                         ////- gives better result but produce error on edges                 
        

        var HeigthFactor = 1/(65536) * Factor; 
        var PosWX = Pos.getValue(i*3);
        var PosWZ = Pos.getValue(i*3+2);

        
        if(multiarrayIndex !== -1){
            //Scale it back from normalization into Tile Grid Space and get the Height Values from Byte Array
            if(z_diagonal >= Pos.getValue(i*3+2)) {

            //vertex bottom right
            pA[0]= (QuadCenterX - QuadScaleX/2) * grid_scaleX - grid_scaleX/2 + GridPositions.getValue(multiarrayIndex*3);
            pA[1]= multiarray[multiarrayIndex][VertexIndices[2]] * HeigthFactor;
            pA[2]= - (QuadCenterZ + QuadScaleZ/2) * grid_scaleZ +grid_scaleZ/2 + GridPositions.getValue(multiarrayIndex*3+2);
            //vertex top left
            pB[0]= (QuadCenterX + QuadScaleX/2) * grid_scaleX - grid_scaleX/2 + GridPositions.getValue(multiarrayIndex*3);
            pB[1]= multiarray[multiarrayIndex][VertexIndices[1]] * HeigthFactor;
            pB[2]= - (QuadCenterZ - QuadScaleZ/2) * grid_scaleZ +grid_scaleZ/2 + GridPositions.getValue(multiarrayIndex*3+2);
            //vertex bottom right
            pC[0]= (QuadCenterX + QuadScaleX/2) * grid_scaleX - grid_scaleX/2 + GridPositions.getValue(multiarrayIndex*3);
            pC[1]= multiarray[multiarrayIndex][VertexIndices[3]] * HeigthFactor;
            pC[2]= - (QuadCenterZ + QuadScaleZ/2) * grid_scaleZ +grid_scaleZ/2 + GridPositions.getValue(multiarrayIndex*3+2);
            var status = true;
            }
            if(z_diagonal < Pos.getValue(i*3+2)){

            //vertex bottom left
            pA[0]= (QuadCenterX - QuadScaleX/2) * grid_scaleX - grid_scaleX/2 + GridPositions.getValue(multiarrayIndex*3);
            pA[1]= multiarray[multiarrayIndex][VertexIndices[2]] * HeigthFactor;
            pA[2]= - (QuadCenterZ + QuadScaleZ/2) * grid_scaleZ +grid_scaleZ/2 + GridPositions.getValue(multiarrayIndex*3+2);
            //vertex top right
            pB[0]= (QuadCenterX + QuadScaleX/2) * grid_scaleX - grid_scaleX/2 + GridPositions.getValue(multiarrayIndex*3);
            pB[1]= multiarray[multiarrayIndex][VertexIndices[1]] * HeigthFactor;
            pB[2]= - (QuadCenterZ - QuadScaleZ/2) * grid_scaleZ +grid_scaleZ/2 + GridPositions.getValue(multiarrayIndex*3+2);
            //vertex bottom right
            pC[0]= (QuadCenterX - QuadScaleX/2) * grid_scaleX - grid_scaleX/2 + GridPositions.getValue(multiarrayIndex*3);
            pC[1]= multiarray[multiarrayIndex][VertexIndices[0]] * HeigthFactor;
            pC[2]= - (QuadCenterZ - QuadScaleZ/2) * grid_scaleZ +grid_scaleZ/2 + GridPositions.getValue(multiarrayIndex*3+2);
            var status = false;
            }
        //console.log(posX + ' ' + posZ + ' ' + indexX + ' ' + indexZ + ' ' + 'SubIndexX, Y, IndexinGrid '+ SubIndexX + ' ' + SubIndexZ +  ' '+ IndexInGrid + ' PtXZ' + pTnX + ' ' + pTnZ + 'vIndices' + VertexIndices + ' status ' +status);    
        VertexPos.setValue(i*9, pA[0]);VertexPos.setValue(i*9+1, pA[1]);VertexPos.setValue(i*9+2, pA[2]);
        VertexPos.setValue(i*9+3, pB[0]);VertexPos.setValue(i*9+4, pB[1]);VertexPos.setValue(i*9+5, pB[2]);
        VertexPos.setValue(i*9+6, pC[0]);VertexPos.setValue(i*9+7, pC[1]);VertexPos.setValue(i*9+8, pC[2]);
        
        //console.log('pA '+ pA + 'pB ' + pB +  'pC ' + pC); 
        // Plane equation ax+by+cz+d=0
       // var pt = [Pos.getValue(i*3), 0.0, Pos.getValue(i*3+2)];
        var pt = [pTnX* grid_scaleX - grid_scaleX/2 + QuadScaleX + GridPositions.getValue(multiarrayIndex*3),
                    0.0,
                 pTnZ* grid_scaleZ -grid_scaleZ/2 + QuadScaleZ + GridPositions.getValue(multiarrayIndex*3+2)];
        var dir = [0.0,1000.0,0.0];
        var tri = [pA,pB,pC];
        //var out = [0,0,0];
        var Point = intersectTriangle(out, pt, dir, tri);
        //console.log(' pt ' + pt + ' dir ' + dir + ' tri  ' + tri + ' out  ' + out);
        if(Point == null) { Point = [-1,-1,-1];}
        
        //var y = Point[1];

        CollissionY.setValue(i*3, Point[0]);CollissionY.setValue(i*3+1, Point[1]);CollissionY.setValue(i*3+2, Point[2]);
        }
        else{
        //if position is not on active tiles then set y to 0
        CollissionY.setValue(i, 0);    
        }
        
        }
        CollissionY.setSliceCount(maxCount*3);
    }
    else{
        //if position is not on active tiles then set y to 0
        CollissionY.setValue(0, 0);   
        CollissionY.setSliceCount(1);
        }
    
    }
    
}
VVVV.Nodes.TerrainCollision.prototype = new VVVV.Core.Node();




}(vvvvjs_jquery));


