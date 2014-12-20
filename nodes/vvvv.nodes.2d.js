// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

(function($) {

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Cross (2d)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Cross2d = function(id, graph) {
  this.constructor(id, "Cross (2d)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  // input pins
  var xinIn = this.addInputPin('X In', [0], VVVV.PinTypes.Value);
  var yinIn = this.addInputPin('Y In', [0], VVVV.PinTypes.Value);
  var includeupperIn = this.addInputPin('Include Upper', [1], VVVV.PinTypes.Value);
  var includelowerIn = this.addInputPin('Include Lower', [1], VVVV.PinTypes.Value);
  var includeequalIn = this.addInputPin('Include Equal', [1], VVVV.PinTypes.Value);

  // output pins
  var xoutOut = this.addOutputPin('X Out', [0], VVVV.PinTypes.Value);
  var youtOut = this.addOutputPin('Y Out', [0], VVVV.PinTypes.Value);

  // evaluate() will be called each frame
  // (if the input pins have changed, or the nodes is flagged as auto-evaluating)
  this.evaluate = function() {
    
    var idx = 0;
    for (var i=0; i<yinIn.getSliceCount(); i++) {
      for (var j=0; j<xinIn.getSliceCount(); j++) {
        if (includeupperIn.getValue(0)<0.5 && i>j)
          continue;
        if (includelowerIn.getValue(0)<0.5 && i<j)
          continue;
        if (includeequalIn.getValue(0)<0.5 && i==j)
          continue;
        xoutOut.setValue(idx, xinIn.getValue(j));
        youtOut.setValue(idx, yinIn.getValue(i));
        idx++;
      }
    }
    xoutOut.setSliceCount(idx);
    youtOut.setSliceCount(idx);
  }

}
VVVV.Nodes.Cross2d.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Polar (2d)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Polar2d = function(id, graph) {
  this.constructor(id, "Polar (2d)", graph);
  
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

  // output pins
  var angleOut = this.addOutputPin('Angle', [0], VVVV.PinTypes.Value);
  var lengthOut = this.addOutputPin('Length', [1], VVVV.PinTypes.Value);

  this.initialize = function() {
    
  }

  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      var x = xIn.getValue(i);
      var y = yIn.getValue(i);
      
      angleOut.setValue(i, Math.atan2(y, x)/(2*Math.PI));
      lengthOut.setValue(i, Math.sqrt(x*x + y*y));
    }
    
    angleOut.setSliceCount(maxSize);
    lengthOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.Polar2d.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Cartesian (2d)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Cartesian2d = function(id, graph) {
  this.constructor(id, "Cartesian (2d)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  // input pins
  var angleIn = this.addInputPin('Angle', [0], VVVV.PinTypes.Value);
  var lengthIn = this.addInputPin('Length', [1], VVVV.PinTypes.Value);

  // output pins
  var xOut = this.addOutputPin('X', [1], VVVV.PinTypes.Value);
  var yOut = this.addOutputPin('Y', [0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      var angle = angleIn.getValue(i);
      var length = lengthIn.getValue(i);
      
      xOut.setValue(i, length * Math.cos(angle * Math.PI * 2));
      yOut.setValue(i, length * Math.sin(angle * Math.PI * 2));
    }
    
    xOut.setSliceCount(maxSize);
    yOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.Cartesian2d.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Points2Vector (2d)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Points2Vector2d = function(id, graph) {
  this.constructor(id, "Points2Vector (2d)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  // input pins
  var x1In = this.addInputPin('X1', [0], VVVV.PinTypes.Value);
  var y1In = this.addInputPin('Y1', [0], VVVV.PinTypes.Value);
  var x2In = this.addInputPin('X2', [1], VVVV.PinTypes.Value);
  var y2In = this.addInputPin('Y2', [0], VVVV.PinTypes.Value);

  // output pins
  var xOut = this.addOutputPin('X', [0], VVVV.PinTypes.Value);
  var yOut = this.addOutputPin('Y', [0], VVVV.PinTypes.Value);
  var lengthOut = this.addOutputPin('Length', [1], VVVV.PinTypes.Value);
  var angleOut = this.addOutputPin('Angle', [0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      var x1 = x1In.getValue(i);
      var y1 = y1In.getValue(i);
      var x2 = x2In.getValue(i);
      var y2 = y2In.getValue(i);
      
      var x = x2 - x1;
      var y = y2 - y1;
      
      xOut.setValue(i, x1 + x/2);
      yOut.setValue(i, y1 + y/2);
      lengthOut.setValue(i, Math.sqrt(x*x + y*y));
      angleOut.setValue(i, Math.atan2(y, x) / (2 * Math.PI));
    }
    
    xOut.setSliceCount(maxSize);
    yOut.setSliceCount(maxSize);
    lengthOut.setSliceCount(maxSize);
    angleOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.Points2Vector2d.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Vector2Points (2d)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Vector2Points2d = function(id, graph) {
  this.constructor(id, "Vector2Points (2d)", graph);
  
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
  var lengthIn = this.addInputPin('Length', [1], VVVV.PinTypes.Value);
  var angleIn = this.addInputPin('Angle', [0], VVVV.PinTypes.Value);

  // output pins
  var x1Out = this.addOutputPin('X1', [0], VVVV.PinTypes.Value);
  var y1Out = this.addOutputPin('Y1', [0], VVVV.PinTypes.Value);
  var x2Out = this.addOutputPin('X2', [0], VVVV.PinTypes.Value);
  var y2Out = this.addOutputPin('Y2', [0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      var x = xIn.getValue(i);
      var y = yIn.getValue(i);
      var length = lengthIn.getValue(i);
      var angle = angleIn.getValue(i) - .25 * 2 * Math.PI;

      var dx = length/2 * Math.sin(angle);
      var dy = -length/2 * Math.cos(angle);
      
      x1Out.setValue(i, x + dx);
      y1Out.setValue(i, y + dy);
      x2Out.setValue(i, x - dx);
      y2Out.setValue(i, y - dy);
    }
    
    // you also might want to do stuff like this:
    x1Out.setSliceCount(maxSize);
    y1Out.setSliceCount(maxSize);
    x2Out.setSliceCount(maxSize);
    y2Out.setSliceCount(maxSize);
  }

}
VVVV.Nodes.Vector2Points2d.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Attractor (2d)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Attractor2d = function(id, graph) {
  this.constructor(id, "Attractor (2d)", graph);
  
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
  var attractorxIn = this.addInputPin('Attractor X', [0], VVVV.PinTypes.Value);
  var attractoryIn = this.addInputPin('Attractor Y', [0], VVVV.PinTypes.Value);
  var attractorstrengthIn = this.addInputPin('Attractor Strength', [1], VVVV.PinTypes.Value);
  var attractorpowerIn = this.addInputPin('Attractor Power', [1], VVVV.PinTypes.Value);
  var attractorradiusIn = this.addInputPin('Attractor Radius', [0.1], VVVV.PinTypes.Value);

  // output pins
  var outputxOut = this.addOutputPin('Output X', [0], VVVV.PinTypes.Value);
  var outputyOut = this.addOutputPin('Output Y', [0], VVVV.PinTypes.Value);
  
  function sign(f) {
    return f<0 ? -1 : ( f>0 ? 1 : 0);
  }

  this.evaluate = function() {
    
    var posSize = Math.max(xIn.getSliceCount(), yIn.getSliceCount());
    var attrSize = Math.max(attractorxIn.getSliceCount(), attractoryIn.getSliceCount());
    
    var x, y, attractorx, attractory, attractorystrength, attractorpower, attractorradius;
    var dx, dy;
    
    for (var i=0; i<posSize; i++) {
      x = xIn.getValue(i);
      y = yIn.getValue(i);
      
      for (var j=0; j<attrSize; j++) {
        attractorx = attractorxIn.getValue(j);
        attractory = attractoryIn.getValue(j);
        attractorstrength = attractorstrengthIn.getValue(j);
        attractorpower = attractorpowerIn.getValue(j);
        attractorradius = attractorradiusIn.getValue(j);
  
        dx = x - attractorx;
        dy = y - attractory;
        if (dx!=0 || dy!=0) {
          var l = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2))
          var m = 0.0;
          if (l<=attractorradius) {
            var s = l / attractorradius;
            m = attractorstrength * (Math.pow(s, attractorpower) * sign(s) / s - 1);
          }
          
          x += dx * m;
          y += dy * m;
        }
      }
      outputxOut.setValue(i, x);
      outputyOut.setValue(i, y);
    }
    
    // you also might want to do stuff like this:
    outputxOut.setSliceCount(posSize);
    outputyOut.setSliceCount(posSize);
  }

}
VVVV.Nodes.Attractor2d.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: ConnectAll (2d)
 Author(s): 'woei'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.ConnectAll2d = function(id, graph) {
  this.constructor(id, "ConnectAll (2d)", graph);
  
  this.meta = {
    authors: ['woei'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  // input pins
  var xinIn = this.addInputPin('X In', [0], VVVV.PinTypes.Value);
  var yinIn = this.addInputPin('Y In', [0], VVVV.PinTypes.Value);

  // output pins
  var x1outOut = this.addOutputPin('X1 Out', [0], VVVV.PinTypes.Value);
  var y1outOut = this.addOutputPin('Y1 Out', [0], VVVV.PinTypes.Value);
  var x2outOut = this.addOutputPin('X2 Out', [0], VVVV.PinTypes.Value);
  var y2outOut = this.addOutputPin('Y2 Out', [0], VVVV.PinTypes.Value);

  // evaluate() will be called each frame
  // (if the input pins have changed, or the nodes is flagged as auto-evaluating)
  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();

    var idx = 0;
    for (var i=0; i<maxSize; i++) {
      for (var j=i+1; j<maxSize; j++) {
        x1outOut.setValue(idx, xinIn.getValue(i));
        y1outOut.setValue(idx, yinIn.getValue(i));
        x2outOut.setValue(idx, xinIn.getValue(j));
        y2outOut.setValue(idx, yinIn.getValue(j));
        idx++;
      }
    }

    x1outOut.setSliceCount(idx);
    y1outOut.setSliceCount(idx);
    x2outOut.setSliceCount(idx);
    y2outOut.setSliceCount(idx);
  }

}
VVVV.Nodes.ConnectAll2d.prototype = new VVVV.Core.Node();

}(vvvvjs_jquery));