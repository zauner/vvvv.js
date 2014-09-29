// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Timing (Debug)
 Author(s): Gleb Storozhik
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Timing = function(id, graph) {
  this.constructor(id, "Timing (Debug)", graph);

  this.meta = {
    authors: ['Gleb Storozhik'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var outputOut = this.addOutputPin("FPS", [0.0], VVVV.PinTypes.Value);

  this.auto_evaluate = true;
  var lastLoop = new Date;

  this.evaluate = function() {
    var thisLoop = new Date;
    var fps = 1000 / (thisLoop - lastLoop);
    lastLoop = thisLoop;
    outputOut.setSliceCount(1);
    outputOut.setValue(0, fps);
  }
}
VVVV.Nodes.Timing.prototype = new VVVV.Core.Node();
