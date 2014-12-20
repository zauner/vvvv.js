// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

(function($) {

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Abs (Complex)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Abs = function(id, graph) {
  this.constructor(id, "Abs (Complex)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var inputRealIn = this.addInputPin("Input Real", [0.0], VVVV.PinTypes.Value);
  var inputImagIn = this.addInputPin("Input Imagiary", [0.0], VVVV.PinTypes.Value);
  
  var outputOut = this.addOutputPin("Output", [0.5], VVVV.PinTypes.Value);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      outputOut.setValue(i,
        Math.sqrt(
          Math.pow(inputRealIn.getValue(i), 2) +
          Math.pow(inputImagIn.getValue(i), 2)
        )
      );
    }
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.Abs.prototype = new VVVV.Core.Node();

}(vvvvjs_jquery));






