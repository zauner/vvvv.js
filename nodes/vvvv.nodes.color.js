// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: RGB (Color Join)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/


VVVV.Nodes.RGBJoin = function(id, graph) {
  this.constructor(id, "RGB (Color Join)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var redPin = this.addInputPin("Red", [1.0], this);
  var greenPin = this.addInputPin("Green", [1.0], this);
  var bluePin = this.addInputPin("Blue", [1.0], this);
  var alphaPin = this.addInputPin("Alpha", [1.0], this);
  
  var outPin = this.addOutputPin("Output", ["1.0,1.0,1.0,1.0"], this);

  this.evaluate = function() {
    if (redPin.pinIsChanged() || greenPin.pinIsChanged || bluePin.pinIsChanged() || alphaPin.pinIsChanged()) {
      var maxSize = this.getMaxInputSliceCount();
      
      for (var i=0; i<maxSize; i++) {
        var r = redPin.getValue(i) || 0.0;
        var g = greenPin.getValue(i) || 0.0;
        var b = bluePin.getValue(i) || 0.0;
        var a = alphaPin.getValue(i) || 0.0;
        
        outPin.setValue(i, r+","+g+","+b+","+a);
      }
      
    }
   
  }

}
VVVV.Nodes.RGBJoin.prototype = new VVVV.Core.Node();
