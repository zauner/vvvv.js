// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

VVVV.PinTypes.Color = {
  typeName: "Color",
  reset_on_disconnect: false,
  defaultValue: function() {
    return "1.0, 1.0, 1.0, 1.0";
  },
  primitive: true,
  hsvToRgb: function(h, s, v) {
    h = (h%1.0 + 1.0)%1.0 * 360;
    var hi = Math.floor(h/60.0);
    var f = (h/60.0) - hi;
    var p = v * (1-s);
    var q = v * (1-s*f);
    var t = v * (1-s*(1-f));
    switch (hi) {
      case 1: return [q, v, p];
      case 2: return [p, v, t];
      case 3: return [p, q, v];
      case 4: return [t, p, v];
      case 5: return [v, p, q];
      default: return [v, t, p];
    }
  },
  rgbToHsv: function(r, g, b) {
    var max = Math.max(r, Math.max(g, b));
    var min = Math.min(r, Math.min(g, b));
    var h;
    if (max==min)
      h = 0;
    else if (max == r)
      h = 60 * ( 0 + (g - b)/(max - min) );
    else if (max == g)
      h = 60 * ( 2 + (b - r)/(max - min) );
    else if (max == b)
      h = 60 * ( 4 + (r - g)/(max - min) );
    if (h<0)
      h = h + 360;
    var s = 0;
    if (max!=0)
      s = (max-min)/max;
    var v = max;
    return [h/360.0, s, v];
  }
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
  
  var outPin = this.addOutputPin("Output", ["1.0,1.0,1.0,1.0"], VVVV.PinTypes.Color);

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
  
  var outPin = this.addOutputPin("Output", ["1.0,1.0,1.0,1.0"], VVVV.PinTypes.Color);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      var h = huePin.getValue(i);
      var s = saturationPin.getValue(i);
      var v = valuePin.getValue(i);
      var a = alphaPin.getValue(i);
      
      var rgb = VVVV.PinTypes.Color.hsvToRgb(h, s, v);
      
      outPin.setValue(i, rgb[0]+","+rgb[1]+","+rgb[2]+","+a);
    }
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
  var colorinputIn = this.addInputPin('Color Input', ['0.0, 1.0, 0.0, 1.0'], VVVV.PinTypes.Color);

  // output pins
  var coloroutputOut = this.addOutputPin('Color Output', ['0.0, 1.0, 0.0, 1.0'], VVVV.PinTypes.Color);

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
  var inputIn = this.addInputPin('Input', ['0.0, 0.0, 0.0, 0.0'], VVVV.PinTypes.Color);
  var alphaIn = this.addInputPin('Alpha', [1.0], VVVV.PinTypes.Value);

  // output pins
  var outputOut = this.addOutputPin('Output', ['0.0, 0.0, 0.0, 1.0'], VVVV.PinTypes.Color);

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
  var switchIn = this.addInputPin('Switch', [0], VVVV.PinTypes.Value);
  var inputIn = [];
  inputIn[0] = this.addInputPin('Input 1', ['1.0, 1.0, 1.0, 1.0'], VVVV.PinTypes.Color);
  inputIn[1] = this.addInputPin('Input 2', ['1.0, 1.0, 1.0, 1.0'], VVVV.PinTypes.Color);

  // output pins
  var outputOut = this.addOutputPin('Output', ['1.0, 1.0, 1.0, 1.0'], VVVV.PinTypes.Color);

  // invisible pins
  var inputcountIn = this.addInvisiblePin('Input Count', [2], VVVV.PinTypes.Value);

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
