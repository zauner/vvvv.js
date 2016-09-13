// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

(function($) {


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: AND (Boolean)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.And = function(id, graph) {
  this.constructor(id, "AND (Boolean)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var inputCountIn = this.addInvisiblePin("Input Count", [2], VVVV.PinTypes.Value);
  
  var inputPins = [];
  
  var outputOut = this.addOutputPin("Output", [1], VVVV.PinTypes.Value);
  
  this.initialize = function() {
    var inputCount = Math.max(2, inputCountIn.getValue(0));
    VVVV.Helpers.dynamicPins(this, inputPins, inputCount, function(i) {
      return this.addInputPin('Input '+(i+1), [1], VVVV.PinTypes.Value);
    })
  }

  this.evaluate = function() {
    if (inputCountIn.pinIsChanged())
      this.initialize();
    var maxSliceCount = this.getMaxInputSliceCount();
    var inputCount = inputPins.length;
    var res;
    for (var i=0; i<maxSliceCount; i++) {
      res = true;
      for (var j=0; j<inputCount; j++) {
        res = res && inputPins[j].getValue(i)>=0.5;
      }
      outputOut.setValue(i, res ? 1 : 0);
    }
    outputOut.setSliceCount(maxSliceCount);
  }

}
VVVV.Nodes.And.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: OR (Boolean)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Or = function(id, graph) {
  this.constructor(id, "OR (Boolean)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var inputCountIn = this.addInvisiblePin("Input Count", [2], VVVV.PinTypes.Value);
  
  var inputPins = [];
  
  var outputOut = this.addOutputPin("Output", [1], VVVV.PinTypes.Value);
  
  this.initialize = function() {
    var inputCount = Math.max(2, inputCountIn.getValue(0));
    VVVV.Helpers.dynamicPins(this, inputPins, inputCount, function(i) {
      return this.addInputPin('Input '+(i+1), [1], VVVV.PinTypes.Value);
    })
  }

  this.evaluate = function() {
    if (inputCountIn.pinIsChanged())
      this.initialize();
    var maxSliceCount = this.getMaxInputSliceCount();
    var inputCount = inputPins.length;
    var res;
    for (var i=0; i<maxSliceCount; i++) {
      res = false;
      for (var j=0; j<inputCount; j++) {
        res = res || inputPins[j].getValue(i)>=0.5;
      }
      outputOut.setValue(i, res ? 1 : 0);
    }
    outputOut.setSliceCount(maxSliceCount);
  }

}
VVVV.Nodes.Or.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: NOT (Boolean)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Not = function(id, graph) {
  this.constructor(id, "NOT (Boolean)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var inputIn = this.addInputPin("Input", [1], VVVV.PinTypes.Value);
  
  var outputOut = this.addOutputPin("Output", [1], VVVV.PinTypes.Value);

  this.evaluate = function() {
    var maxSliceCount = this.getMaxInputSliceCount();
    for (var i=0; i<maxSliceCount; i++) {
      outputOut.setValue(i, 1-Math.round(inputIn.getValue(i)));
    }
    outputOut.setSliceCount(this.getMaxInputSliceCount());
  }

}
VVVV.Nodes.Not.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: OR (Boolean Spectral)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/


VVVV.Nodes.OrSpectral = function(id, graph) {
  this.constructor(id, "OR (Boolean Spectral)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var inputIn = this.addInputPin("Input", [0.0], VVVV.PinTypes.Value);
  var binSizeIn = this.addInputPin("Bin Size", [-1], VVVV.PinTypes.Value);
  
  var outputOut = this.addOutputPin("Output", [0], VVVV.PinTypes.Value);

  this.evaluate = function() {
  
    var maxSpreadSize = this.getMaxInputSliceCount();
    var binNum = 0;
    var subIndex = 0;
    var result = false;
    
    for (var i=0; i<maxSpreadSize || (binSizeIn.getValue(0)>0 && (subIndex>0 || binNum%binSizeIn.getSliceCount()!=0)); i++) {
      if (subIndex == 0)
        var result = false;
      result = result || (inputIn.getValue(i)>=.5);
      
      subIndex++;
      if (binSizeIn.getValue(0)>0) {
        if (subIndex>=binSizeIn.getValue(binNum)) {
          outputOut.setValue(binNum, result ? 1 : 0);
          binNum++;
          subIndex = 0;
        }
      }
      else
        outputOut.setValue(0, result ? 1 : 0);
    }
    outputOut.setSliceCount(binNum+(subIndex>0));
  }

}
VVVV.Nodes.OrSpectral.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: AND (Boolean Spectral)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AndSpectral = function(id, graph) {
  this.constructor(id, "AND (Boolean Spectral)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var inputIn = this.addInputPin("Input", [0.0], VVVV.PinTypes.Value);
  var binSizeIn = this.addInputPin("Bin Size", [-1], VVVV.PinTypes.Value);
  
  var outputOut = this.addOutputPin("Output", [0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();
    var binNum = 0;
    var subIndex = 0;
    var result = false;
    
    for (var i=0; i<maxSpreadSize || (binSizeIn.getValue(0)>0 && (subIndex>0 || binNum%binSizeIn.getSliceCount()!=0)); i++) {
      if (subIndex == 0)
        var result = true;
      result = result && (inputIn.getValue(i)>=.5);
      
      subIndex++;
      if (binSizeIn.getValue(0)>0) {
        if (subIndex>=binSizeIn.getValue(binNum)) {
          outputOut.setValue(binNum, result ? 1 : 0);
          binNum++;
          subIndex = 0;
        }
      }
      else
        outputOut.setValue(0, result ? 1 : 0);
    }
    outputOut.setSliceCount(binNum+(subIndex>0));    
  }

}
VVVV.Nodes.AndSpectral.prototype = new VVVV.Core.Node();

}(vvvvjs_jquery));