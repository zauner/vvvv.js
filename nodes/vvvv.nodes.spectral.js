// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

(function($) {



/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Bounds (Spectral)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.BoundsSpectral = function(id, graph) {
  this.constructor(id, "Bounds (Spectral)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  // input pins
  var inputIn = this.addInputPin('Input', [0], VVVV.PinTypes.Value);
  var binSizeIn = this.addInputPin('Bin Size', [-1], VVVV.PinTypes.Value);

  // output pins
  var centerOut = this.addOutputPin('Center', [0], VVVV.PinTypes.Value);
  var widthOut = this.addOutputPin('Width', [0], VVVV.PinTypes.Value);
  var minimumOut = this.addOutputPin('Minimum', [0], VVVV.PinTypes.Value);
  var maximumOut = this.addOutputPin('Maximum', [0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    
    var maxSpreadSize = this.getMaxInputSliceCount();
    var binNum = 0;
    var subIndex = 0;
    var input, minimum, maximum;
    
    for (var i=0; i<maxSpreadSize || (binSizeIn.getValue(0)>0 && (subIndex>0 || binNum%binSizeIn.getSliceCount()!=0)); i++) {
      input = inputIn.getValue(i);
      if (subIndex == 0) {
        center = minimum = maximum = input;
        width = 0.0;
      }
      minimum = Math.min(input, minimum);
      maximum = Math.max(input, maximum);
      
      subIndex++;
      if (binSizeIn.getValue(0)>0) {
        if (subIndex>=binSizeIn.getValue(binNum)) {
          minimumOut.setValue(binNum, minimum);
          maximumOut.setValue(binNum, maximum);
          centerOut.setValue(binNum, minimum + (maximum - minimum)/2);
          widthOut.setValue(binNum, Math.abs(maximum - minimum));
          binNum++;
          subIndex = 0;
        }
      }
    }
    if (binSizeIn.getValue(0)==-1) {
      minimumOut.setValue(binNum, minimum);
      maximumOut.setValue(binNum, maximum);
      centerOut.setValue(binNum, minimum + (maximum - minimum)/2);
      widthOut.setValue(binNum, Math.abs(maximum - minimum));
    }
    
    // you also might want to do stuff like this:
    centerOut.setSliceCount(binNum+(subIndex>0));
    widthOut.setSliceCount(binNum+(subIndex>0));
    minimumOut.setSliceCount(binNum+(subIndex>0));
    maximumOut.setSliceCount(binNum+(subIndex>0));
  }

}
VVVV.Nodes.BoundsSpectral.prototype = new VVVV.Core.Node();

}(vvvvjs_jquery));