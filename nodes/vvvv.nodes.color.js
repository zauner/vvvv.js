// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

(function($) {

VVVV.PinTypes.Color = {
  typeName: "Color",
  reset_on_disconnect: false,
  defaultValue: function() {
    return new VVVV.Types.Color("1.0, 1.0, 1.0, 1.0");
  },
  primitive: true
}

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
  
  var redPin = this.addInputPin("Red", [1.0], VVVV.PinTypes.Value);
  var greenPin = this.addInputPin("Green", [1.0], VVVV.PinTypes.Value);
  var bluePin = this.addInputPin("Blue", [1.0], VVVV.PinTypes.Value);
  var alphaPin = this.addInputPin("Alpha", [1.0], VVVV.PinTypes.Value);
  
  var outPin = this.addOutputPin("Output", [], VVVV.PinTypes.Color);
  
  var colors = [];

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      if (!colors[i])
        colors[i] = new VVVV.Types.Color("0.0,0.0,0.0,0.0");
      colors[i].rgba[0] = redPin.getValue(i) || 0.0;
      colors[i].rgba[1] = greenPin.getValue(i) || 0.0;
      colors[i].rgba[2] = bluePin.getValue(i) || 0.0;
      colors[i].rgba[3] = alphaPin.getValue(i) || 0.0;
      
      outPin.setValue(i, colors[i]);
    }
    colors.length = maxSize;
    outPin.setSliceCount(maxSize);
  }

}
VVVV.Nodes.RGBJoin.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: HSV (Color Join)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/


VVVV.Nodes.HSVJoin = function(id, graph) {
  this.constructor(id, "HSV (Color Join)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var huePin = this.addInputPin("Hue", [0.33], VVVV.PinTypes.Value);
  var saturationPin = this.addInputPin("Saturation", [0.0], VVVV.PinTypes.Value);
  var valuePin = this.addInputPin("Value", [1.0], VVVV.PinTypes.Value);
  var alphaPin = this.addInputPin("Alpha", [1.0], VVVV.PinTypes.Value);
  
  var outPin = this.addOutputPin("Output", [], VVVV.PinTypes.Color);
  
  var colors = [];
  var h, s, v, a, rgb;

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      h = huePin.getValue(i);
      s = saturationPin.getValue(i);
      v = valuePin.getValue(i);
      a = alphaPin.getValue(i);
      
      if (!colors[i])
        colors[i] = new VVVV.Types.Color("0.0, 0.0, 0.0, 0.0");
      colors[i].setHSV(h, s, v);
      colors[i].rgba[3] = a;
      
      outPin.setValue(i, colors[i]);
    }
    colors.length = maxSize;
    outPin.setSliceCount(maxSize);
      
   
  }

}
VVVV.Nodes.HSVJoin.prototype = new VVVV.Core.Node();


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
  var colorinputIn = this.addInputPin('Color Input', [new VVVV.Types.Color("0.0, 1.0, 0.0, 1.0")], VVVV.PinTypes.Color);

  // output pins
  var coloroutputOut = this.addOutputPin('Color Output', [], VVVV.PinTypes.Color);

  // invisible pins
  var rowsIn = this.addInvisiblePin('Rows', [1], VVVV.PinTypes.Value);
  
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
  var inputIn = this.addInputPin('Input', [new VVVV.Types.Color("0.0, 0.0, 0.0, 0.0")], VVVV.PinTypes.Color);
  var alphaIn = this.addInputPin('Alpha', [1.0], VVVV.PinTypes.Value);

  // output pins
  var outputOut = this.addOutputPin('Output', [], VVVV.PinTypes.Color);
  
  var colors = [];

  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      var input = inputIn.getValue(i);
      var alpha = alphaIn.getValue(i);
      
      if (!colors[i])
        colors[i] = new VVVV.Types.Color("0.0, 0.0, 0.0, 0.0");
      colors[i].rgba[0] = input.rgba[0];
      colors[i].rgba[1] = input.rgba[1];
      colors[i].rgba[2] = input.rgba[2];
      colors[i].rgba[3] = alpha;
      
      outputOut.setValue(i, colors[i]);
    }
    colors.length = maxSize;
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
  var switchIn = this.addInputPin('Switch', [0], VVVV.PinTypes.Value);
  var inputIn = [];
  inputIn[0] = this.addInputPin('Input 1', [], VVVV.PinTypes.Color);
  inputIn[1] = this.addInputPin('Input 2', [], VVVV.PinTypes.Color);

  // output pins
  var outputOut = this.addOutputPin('Output', [], VVVV.PinTypes.Color);

  // invisible pins
  var inputcountIn = this.addInvisiblePin('Input Count', [2], VVVV.PinTypes.Value);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      outputOut.setValue(i, inputIn[Math.round(Math.abs(switchIn.getValue(i)))%inputIn.length].getValue(i));
    }
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.SwitchColorInput.prototype = new VVVV.Core.Node();

}(vvvvjs_jquery));
