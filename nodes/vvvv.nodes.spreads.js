// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: GetSlice (Spreads)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GetSliceSpreads = function(id, graph) {
  this.constructor(id, "GetSlice (Spreads)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Bin Size not implemented']
  };
  
  this.addInputPin("Input", [0.0], this);
  this.addInputPin("Bin Size", [1], this);
  this.addInputPin("Index", [0], this);
  
  this.addOutputPin("Output", [0.0], this);

  this.evaluate = function() {
    this.outputPins["Output"].values = [];
    
    for (var i=0; i<this.inputPins["Index"].values.length; i++) {
      this.outputPins["Output"].setValue(i, parseFloat(this.inputPins["Input"].getValue(Math.round(this.inputPins["Index"].getValue(i)))));
    }
  }

}
VVVV.Nodes.GetSliceSpreads.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: RandomSpread (Spreads)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.RandomSpread = function(id, graph) {
  this.constructor(id, "RandomSpread (Spreads)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: ['http://www.webdeveloper.com/forum/showthread.php?t=140572'],
    compatibility_issues: ['Doesnt handle spreaded inputs','random result will differ from original vvvv node because of different algorithm']
  };
  
  this.addInputPin("Input", [0.0], this);
  this.addInputPin("Width", [1.0], this);
  this.addInputPin("Random Seed", [0], this);
  this.addInputPin("Spread Count", [1], this);
  
  this.addOutputPin("Output", [0.0], this);

  this.evaluate = function() {
    if (this.inputPins["Spread Count"].pinIsChanged() || this.inputPins["Input"].pinIsChanged() || this.inputPins["Width"].pinIsChanged() || this.inputPins["Random Seed"].pinIsChanged()) {
      var count = parseInt(this.inputPins["Spread Count"].getValue(0));
      var input = parseFloat(this.inputPins["Input"].getValue(0));
      var width = parseFloat(this.inputPins["Width"].getValue(0));
      var randomseed = parseInt(this.inputPins["Random Seed"].getValue(0));
      
      // Rc4Random function taken from http://www.webdeveloper.com/forum/showthread.php?t=140572
      function Rc4Random(seed)
      {
        var keySchedule = [];
        var keySchedule_i = 0;
        var keySchedule_j = 0;
        
        function init(seed) {
          for (var i = 0; i < 256; i++)
            keySchedule[i] = i;
          
          var j = 0;
          for (var i = 0; i < 256; i++)
          {
            j = (j + keySchedule[i] + seed.charCodeAt(i % seed.length)) % 256;
            
            var t = keySchedule[i];
            keySchedule[i] = keySchedule[j];
            keySchedule[j] = t;
          }
        }
        init(seed);
        
        function getRandomByte() {
          keySchedule_i = (keySchedule_i + 1) % 256;
          keySchedule_j = (keySchedule_j + keySchedule[keySchedule_i]) % 256;
          
          var t = keySchedule[keySchedule_i];
          keySchedule[keySchedule_i] = keySchedule[keySchedule_j];
          keySchedule[keySchedule_j] = t;
          
          return keySchedule[(keySchedule[keySchedule_i] + keySchedule[keySchedule_j]) % 256];
        }
        
        this.getRandomNumber = function() {
          var number = 0;
          var multiplier = 1;
          for (var i = 0; i < 8; i++) {
            number += getRandomByte() * multiplier;
            multiplier *= 256;
          }
          return number / 18446744073709551616;
        }
      }
      
      rng = new Rc4Random(randomseed.toString());
      
      this.outputPins["Output"].setSliceCount(count);
      for (var i=0; i<count; i++) {
        this.outputPins["Output"].setValue(i, rng.getRandomNumber()*width-width/2+input);
      }
    }
  }
  
  

}
VVVV.Nodes.RandomSpread.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Sort (Spreads)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SortSpreads = function(id, graph) {
  this.constructor(id, "Sort (Spreads)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.addInputPin("Input", [0.0], this);
  
  this.addOutputPin("Output", [0.0], this);
  this.addOutputPin("Former Index", [0.0], this);

  this.evaluate = function() {
    var sorted = _(this.inputPins["Input"].values).map(function(v,i) { return [v, i]; });
    sorted = _(sorted).sortBy(function(x) { return x[0] });
    
    this.outputPins["Output"].values = [];
    for (var i=0; i<sorted.length; i++) {
      this.outputPins["Output"].setValue(i, sorted[i][0]);
      this.outputPins["Former Index"].setValue(i, sorted[i][1]);
    }
  }

}
VVVV.Nodes.SortSpreads.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: LinearSpread (Spreads)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.LinearSpread = function(id, graph) {
  this.constructor(id, "LinearSpread (Spreads)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Doesnt handle alignment enum']
  };
  
  var inputIn = this.addInputPin("Input", [0.0], this);
  var widthIn = this.addInputPin("Width", [1.0], this);
  var alignmentIn = this.addInputPin("Alignment", [''], this);
  var phaseIn = this.addInputPin("Phase", [0.0], this);
  var countIn = this.addInputPin("Spread Count", [1], this);
  
  var outputOut = this.addOutputPin("Output", [0.0], this);

  this.evaluate = function() {
    var recalculate = false;
    if (countIn.pinIsChanged()) {
      outputOut.values = [];
      recalculate = true;
    }
    
    recalculate = recalculate || inputIn.pinIsChanged() || widthIn.pinIsChanged() || alignmentIn.pinIsChanged() || countIn.pinIsChanged();
    
    if (recalculate) {
      var stepSize = widthIn.getValue(0)/countIn.getValue(0);
      var shift = stepSize/2;
      var result;
      for (var i=0; i<countIn.getValue(0); i++) {
        result = inputIn.getValue(0)-widthIn.getValue(0)/2 + i*stepSize + shift + phaseIn.getValue(0);
        outputOut.setValue(i, result.toFixed(4));
      }
    }
    

  }

}
VVVV.Nodes.LinearSpread.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: AvoidNil (Spreads)
 Author(s): Matthias Zauner
 Original Node Author(s): Kalle
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AvoidNil = function(id, graph) {
  this.constructor(id, "AvoidNIL (Spreads)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['Kalle'],
    credits: [],
    compatibility_issues: []
  };
  
  var inputIn = this.addInputPin("Input", [0.0], this);
  var defaultIn = this.addInputPin("Default", [0.0], this);
  
  var outputOut = this.addOutputPin("Output", [0.0], this);

  this.evaluate = function() {
    if (inputIn.pinIsChanged() || defaultIn.pinIsChanged()) {
      var source = inputIn;
      if (inputIn.values[0]==undefined) {
        source = defaultIn;
      }
      outputOut.values = [];
      for (var i=0; i<source.values.length; i++) {
        outputOut.setValue(i, source.getValue(i));
      }
    }
    

  }

}
VVVV.Nodes.AvoidNil.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: SwapDim (Spreads)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SwapDim = function(id, graph) {
  this.constructor(id, "SwapDim (Spreads)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['BinSize not implemented']
  };
  
  var inputIn = this.addInputPin("Input", [0.0], this);
  var columnCountIn = this.addInputPin("Column Count", [0.0], this);
  var rowCountIn = this.addInputPin("Row Count", [0.0], this);
  
  var outputOut = this.addOutputPin("Output", [0.0], this);

  this.evaluate = function() {
    if (inputIn.pinIsChanged() || rowCountIn.pinIsChanged() || columnCountIn.pinIsChanged()) {
      var columnCount = parseInt(columnCountIn.getValue(0));
      var rowCount = parseInt(rowCountIn.getValue(0));
      for (var i=0; i<inputIn.values.length; i++) {
        outputOut.setValue(i % columnCount * rowCount + i / columnCount, inputIn.getValue(i));
      }
    }
    

  }

}
VVVV.Nodes.SwapDim.prototype = new VVVV.Core.Node();