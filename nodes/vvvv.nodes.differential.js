// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }
define(function(require,exports) {

var Node = require('core/vvvv.core.node');
var VVVV = require('core/vvvv.core.defines');

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Integrate (Differential)
 Author(s): woei
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Integrate = function(id, graph) {
  this.constructor(id, "Integrate (Differential)", graph);

  this.meta = {
    authors: ['woei'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = true;

  var posIn = this.addInputPin('Position In', [0.0], VVVV.PinTypes.Value);
  var resetIn = this.addInputPin("Reset", [0], VVVV.PinTypes.Value);

  var posOut = this.addOutputPin("Position Out", [0.0], VVVV.PinTypes.Value);
  var velOut = this.addOutputPin("Velocity Out", [0.0], VVVV.PinTypes.Value);

  var current = [];

  this.evaluate = function() {

    dt = this.parentPatch.mainloop.deltaT/1000.0;
    var maxSize = this.getMaxInputSliceCount();
    for (var i=0; i<maxSize; i++) {

      if (current[i]==undefined) current[i] = 0.0;

      var pos = posIn.getValue(i);
      current[i] += pos*dt;

      var reset = resetIn.getValue(i);
      if (reset>=0.5) current[i] = 0.0;

      posOut.setValue(i,current[i]);
      velOut.setValue(i, pos);
    }
    posOut.setSliceCount(maxSize);
    velOut.setSliceCount(maxSize);
    current.splice(maxSize);
  }
}
VVVV.Nodes.Integrate.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Integrate (Differential Min Max)
 Author(s): woei
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.IntegrateMinMax = function(id, graph) {
  this.constructor(id, "Integrate (Differential Min Max)", graph);

  this.meta = {
    authors: ['woei'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = true;

  var posIn = this.addInputPin('Position In', [0.0], VVVV.PinTypes.Value);
  var resetIn = this.addInputPin("Reset", [0], VVVV.PinTypes.Value);

  var MinIn = this.addInputPin('Min', [-1.0], VVVV.PinTypes.Value);
  var MaxIn = this.addInputPin("Max", [1.0], VVVV.PinTypes.Value);

  var posOut = this.addOutputPin("Position Out", [0.0], VVVV.PinTypes.Value);
  var velOut = this.addOutputPin("Velocity Out", [0.0], VVVV.PinTypes.Value);



  var current = [];

  this.evaluate = function() {

    
    dt = this.parentPatch.mainloop.deltaT/1000.0;
    var maxSize = this.getMaxInputSliceCount();
    for (var i=0; i<maxSize; i++) {
      var min = MinIn.getValue(i % MinIn.getSliceCount());
      var max = MaxIn.getValue(i % MaxIn.getSliceCount());

      if (current[i]==undefined) current[i] = 0.0;

      var pos = posIn.getValue(i);
      current[i] += pos*dt;

      var reset = resetIn.getValue(i);
      if (reset>=0.5) current[i] = 0.0;

      if(current[i] >= max ){
        current[i] = max;
      }
      if(current[i] <= min ){
        current[i] = min;
      }

      posOut.setValue(i,current[i]);
      velOut.setValue(i, pos);
    }
    posOut.setSliceCount(maxSize);
    velOut.setSliceCount(maxSize);
    current.splice(maxSize);
  }
}
VVVV.Nodes.IntegrateMinMax.prototype = new Node();

});
