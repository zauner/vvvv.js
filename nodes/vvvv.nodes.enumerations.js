// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

(function($) {


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: String2Enum (Enumerations)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.String2Enum = function(id, graph) {
  this.constructor(id, "String2Enum (Enumerations)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Validation check does not work']
  };
  
  var inputIn = this.addInputPin("String Value", [], VVVV.PinTypes.String);
  
  var outputOut = this.addOutputPin("Enum", [], VVVV.PinTypes.Enum);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    for (var i=0; i<maxSize; i++) {
      outputOut.setValue(i, inputIn.getValue(i));
    }
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.String2Enum.prototype = new VVVV.Core.Node();

}(vvvvjs_jquery));