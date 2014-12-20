// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

(function($) {

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
VVVV.Nodes.Integrate.prototype = new VVVV.Core.Node();

}(vvvvjs_jquery));