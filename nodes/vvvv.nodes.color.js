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
      outPin.setSliceCount(maxSize);
      
    }
   
  }

}
VVVV.Nodes.RGBJoin.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: IOBox (Color)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.IOBoxColor = function(id, graph) {
  this.constructor(id, "IOBox (Color)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  // input pins
  var colorinputIn = this.addInputPin('Color Input', ['0.0, 1.0, 0.0, 1.0'], this);

  // output pins
  var coloroutputOut = this.addOutputPin('Color Output', ['0.0, 1.0, 0.0, 1.0'], this);

  // invisible pins
  var rowsIn = this.addInvisiblePin('Rows', [0.0], this);
  
  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      coloroutputOut.setValue(i, colorinputIn.getValue(i));
    }
    
    // you also might want to do stuff like this:
    coloroutputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.IOBoxColor.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: SetAlpha (Color)
 Author(s): 'Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SetAlphaColor = function(id, graph) {
  this.constructor(id, "SetAlpha (Color)", graph);
  
  this.meta = {
    authors: ['Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  // input pins
  var inputIn = this.addInputPin('Input', ['0.0, 0.0, 0.0, 0.0'], this);
  var alphaIn = this.addInputPin('Alpha', [1.0], this);

  // output pins
  var outputOut = this.addOutputPin('Output', ['0.0, 0.0, 0.0, 1.0'], this);

  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      var input = inputIn.getValue(i);
      var alpha = alphaIn.getValue(i);
      
      outputOut.setValue(i, input.replace(/[^, ]+$/, alpha));
    }
    
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.SetAlphaColor.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Switch (Color Input)
 Author(s): 'Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SwitchColorInput = function(id, graph) {
  this.constructor(id, "Switch (Color Input)", graph);
  
  this.meta = {
    authors: ['Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  // input pins
  var switchIn = this.addInputPin('Switch', [0], this);
  var inputIn = [];
  inputIn[0] = this.addInputPin('Input 1', ['1.0, 1.0, 1.0, 1.0'], this);
  inputIn[1] = this.addInputPin('Input 2', ['1.0, 1.0, 1.0, 1.0'], this);

  // output pins
  var outputOut = this.addOutputPin('Output', ['1.0, 1.0, 1.0, 1.0'], this);

  // invisible pins
  var inputcountIn = this.addInvisiblePin('Input Count', [2], this);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    if (this.hasNilInputs()) {
      outputOut.setSliceCount(0);
      return;
    }
    for (var i=0; i<maxSize; i++) {
      outputOut.setValue(i, inputIn[Math.round(Math.abs(switchIn.getValue(i)))%inputIn.length].getValue(i));
    }
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.SwitchColorInput.prototype = new VVVV.Core.Node();
