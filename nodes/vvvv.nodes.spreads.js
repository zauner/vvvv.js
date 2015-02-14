// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

(function($) {

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
    compatibility_issues: []
  };
  
  var inputIn = this.addInputPin("Input", [0.0], VVVV.PinTypes.Value);
  var binSizeIn = this.addInputPin("Bin Size", [1], VVVV.PinTypes.Value);
  var indexIn = this.addInputPin("Index", [0], VVVV.PinTypes.Value);
  
  var outputOut = this.addOutputPin("Output", [0.0], VVVV.PinTypes.Value);

  this.evaluate = function() {  
    var size = indexIn.getSliceCount();
    var res, binSize;
    var outIdx = 0;
    for (var i=0; i<size; i++) {
      binSize = binSizeIn.getValue(i);
      res = inputIn.getValue(Math.round(indexIn.getValue(i)), binSize);
      if (binSize>1) {
        for (var j=0; j<res.length; j++) {
          outputOut.setValue(outIdx, res[j]);
          outIdx++;
        }
      }
      else {
        outputOut.setValue(i, res);
        outIdx++;
      }
    }
    outputOut.setSliceCount(outIdx);
  }

}
VVVV.Nodes.GetSliceSpreads.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: SetSlice (Spreads)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SetSliceSpreads = function(id, graph) {
  this.constructor(id, "SetSlice (Spreads)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  // input pins
  var spreadIn = this.addInputPin('Spread', [0], VVVV.PinTypes.Value);
  var inputIn = this.addInputPin('Input', [0], VVVV.PinTypes.Value);
  var indexIn = this.addInputPin('Index', [0], VVVV.PinTypes.Value);

  // output pins
  var outputOut = this.addOutputPin('Output', [0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    var spreadSize = spreadIn.getSliceCount();
    
    for (var i=0; i<spreadSize; i++) {
      outputOut.setValue(i, spreadIn.getValue(i));
    }
    size = Math.max(inputIn.getSliceCount(), indexIn.getSliceCount());
    for (var i=0; i<size; i++) {
      outputOut.setValue(indexIn.getValue(i)%spreadSize, inputIn.getValue(i));
    }
    
    outputOut.setSliceCount(spreadSize);
  }

}
VVVV.Nodes.SetSliceSpreads.prototype = new VVVV.Core.Node();


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
  
  this.addInputPin("Input", [0.0], VVVV.PinTypes.Value);
  this.addInputPin("Width", [1.0], VVVV.PinTypes.Value);
  this.addInputPin("Random Seed", [0], VVVV.PinTypes.Value);
  this.addInputPin("Spread Count", [1], VVVV.PinTypes.Value);
  
  this.addOutputPin("Output", [0.0], VVVV.PinTypes.Value);
  
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

  this.evaluate = function() {
    var count = parseInt(this.inputPins["Spread Count"].getValue(0));
    var input = this.inputPins["Input"].getValue(0);
    var width = this.inputPins["Width"].getValue(0);
    var randomseed = parseInt(this.inputPins["Random Seed"].getValue(0));
    
    rng = new Rc4Random(randomseed.toString());
    
    this.outputPins["Output"].setSliceCount(count);
    for (var i=0; i<count; i++) {
      this.outputPins["Output"].setValue(i, rng.getRandomNumber()*width-width/2+input);
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
  
  this.addInputPin("Input", [0.0], VVVV.PinTypes.Value);
  
  this.addOutputPin("Output", [0.0], VVVV.PinTypes.Value);
  this.addOutputPin("Former Index", [0.0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    var sorted = _(this.inputPins["Input"].values).map(function(v,i) { return [v, i]; });
    sorted = _(sorted).sortBy(function(x) { return x[0] });
    
    for (var i=0; i<sorted.length; i++) {
      this.outputPins["Output"].setValue(i, sorted[i][0]);
      this.outputPins["Former Index"].setValue(i, sorted[i][1]);
    }
    this.outputPins["Output"].setSliceCount(sorted.length);
    this.outputPins["Former Index"].setSliceCount(sorted.length);
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
    compatibility_issues: ['phase does not work with Block alignment']
  };
  
  var inputIn = this.addInputPin("Input", [0.0], VVVV.PinTypes.Value);
  var widthIn = this.addInputPin("Width", [1.0], VVVV.PinTypes.Value);
  var alignmentIn = this.addInputPin("Alignment", ['Centered'], VVVV.PinTypes.Enum);
  alignmentIn.enumOptions = ["Centered", "Block", "LeftJustified", "RightJustified"]
  var phaseIn = this.addInputPin("Phase", [0.0], VVVV.PinTypes.Value);
  var countIn = this.addInputPin("Spread Count", [1], VVVV.PinTypes.Value);
  
  var outputOut = this.addOutputPin("Output", [0.0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    var idx = 0;
    for (var l=0; l<maxSize; l++) {
      var count = parseInt(countIn.getValue(l));
      var width = widthIn.getValue(l);
      var phase = phaseIn.getValue(l);
      var input = inputIn.getValue(l);
      var alignment = alignmentIn.getValue(l);
      if (alignment=='')
        alignment = 'Centered';
      var stepSize = width/count;
      if (alignment=='Block')
        stepSize = width/(count-1);
      var shift = stepSize/2;
      if (alignment=='Block' || alignment=='LeftJustified')
        shift = 0;
      if (alignment=='RightJustified')
        shift = stepSize;
      var result;
      for (var i=0; i<count; i++) {
        result = i*stepSize + shift;
        if (alignment!='Block') {
          if (width!=0)
            result = (result + phase*width) % width;
        }
        result = input-width/2 + result;
        outputOut.setValue(idx, result);
        idx++;
      }
    }
    outputOut.setSliceCount(idx);
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
  
  this.auto_nil = false;
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['Kalle'],
    credits: [],
    compatibility_issues: []
  };
  
  var inputIn = this.addInputPin("Input", [0.0], VVVV.PinTypes.Value);
  var defaultIn = this.addInputPin("Default", [0.0], VVVV.PinTypes.Value);
  
  var outputOut = this.addOutputPin("Output", [0.0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    if (inputIn.pinIsChanged() || defaultIn.pinIsChanged()) {
      var source = inputIn;
      if (inputIn.getSliceCount()==0) {
        source = defaultIn;
      }
      for (var i=0; i<source.values.length; i++) {
        outputOut.setValue(i, source.getValue(i));
      }
      outputOut.setSliceCount(source.getSliceCount());
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
  
  var inputIn = this.addInputPin("Input", [0.0], VVVV.PinTypes.Value);
  var columnCountIn = this.addInputPin("Column Count", [0.0], VVVV.PinTypes.Value);
  var rowCountIn = this.addInputPin("Row Count", [0.0], VVVV.PinTypes.Value);
  
  var outputOut = this.addOutputPin("Output", [0.0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    var columnCount = parseInt(columnCountIn.getValue(0));
    var rowCount = parseInt(rowCountIn.getValue(0));
    var outputCount = columnCount * rowCount;
    for (var i=0; i<outputCount; i++) {
      outputOut.setValue(i % columnCount * rowCount + parseInt(i / columnCount), inputIn.getValue(i));
    }
    outputOut.setSliceCount(outputCount);
  }

}
VVVV.Nodes.SwapDim.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: I (Spreads)
 Author(s): woei
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.I = function(id, graph) {
  this.constructor(id, "I (Spreads)", graph);
  
  this.meta = {
    authors: ['woei'],
    original_authors: ['VVVV Group'],
    credits: ['Matthias Zauner, Mórász Dávid (micro.D)'],
    compatibility_issues: []
  };
  
  var fromIn = this.addInputPin("[ From ..", [0], VVVV.PinTypes.Value);
  var toIn = this.addInputPin(".. To [", [1], VVVV.PinTypes.Value);
  var phaseIn = this.addInputPin("Phase", [0.0], VVVV.PinTypes.Value);
  
  var outputOut = this.addOutputPin("Output", [0], VVVV.PinTypes.Value);
  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    var idx = 0;
    for (var s=0; s<maxSize; s++) {
      var from = Math.round(fromIn.getValue(s));
      var to = Math.round(toIn.getValue(s));
      var phase = phaseIn.getValue(s);
      var range = to-from;
      var aRange = Math.abs(range);
      if (from<=to) {
        for (var i=0; i < aRange; i++, idx++ ) {
          var o = parseFloat(i)-(aRange*phase);
          o = Math.round(o) % range;
          if (o<0)
            o = range+o;
          o += from;
          outputOut.setValue(idx, o);
        }
      }
      else {
        for (var i=aRange; i > 0; i--, idx++ ) {
          var o = parseFloat(i)-(aRange*phase);
          o = Math.round(o) % range;
          if (range<0)
            o*=-1;
          if (o<0)
            o = range-o;
          o += from;
          outputOut.setValue(idx, o);
        }
        
      }
    }
    outputOut.setSliceCount(idx);
  }
}
VVVV.Nodes.I.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
NODE: CircularSpread (Spreads)
Author(s): Matija Miloslavich, woei
Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/


VVVV.Nodes.CircularSpread = function (id, graph) {
  this.constructor(id, "CircularSpread (Spreads)", graph);

  this.meta = {
      authors: ['Matija Miloslavich, woei'],
      original_authors: ['VVVV Group'],
      credits: [],
      compatibility_issues: []
  };

  this.xIn = this.addInputPin("Input X", [0.0], VVVV.PinTypes.Value);
  this.yIn = this.addInputPin("Input Y", [0.0], VVVV.PinTypes.Value);
  this.widthIn = this.addInputPin("Width", [1.0], VVVV.PinTypes.Value);
  this.heightIn = this.addInputPin("Height", [1.0], VVVV.PinTypes.Value);
  this.factorIn = this.addInputPin("Factor", [1.0], VVVV.PinTypes.Value);
  this.phaseIn = this.addInputPin("Phase", [0.0], VVVV.PinTypes.Value);
  this.sprcntIn = this.addInputPin("Spread Count", [1], VVVV.PinTypes.Value);

  this.xOut = this.addOutputPin("Output X", [0.0], VVVV.PinTypes.Value);
  this.yOut = this.addOutputPin("Output Y", [0.0], VVVV.PinTypes.Value);

  this.evaluate = function () {
    
    var pi2 = Math.PI * 2;
    var pCount = 0;

    for (var c = 0; c < this.getMaxInputSliceCount(); c++) {
      var cxi = this.xIn.getValue(c);
      var cyi = this.yIn.getValue(c);

      var cw = this.widthIn.getValue(c) * 0.5;
      var ch = this.heightIn.getValue(c) * 0.5;
      var cf = this.factorIn.getValue(c);
      var cph = this.phaseIn.getValue(c) *pi2;

      var spc = parseInt(this.sprcntIn.getValue(c));

      for (var p = 0; p < spc; p++) {
        var csa = cph + pi2 * (p / spc) * cf;

        var ox = cxi + Math.cos(csa) * cw;
        var oy = cyi + Math.sin(csa) * ch;

        this.xOut.setValue(pCount, ox);
        this.yOut.setValue(pCount, oy);

        pCount++;
      }
    }
    this.xOut.setSliceCount(pCount);
    this.yOut.setSliceCount(pCount);
  }
}
VVVV.Nodes.CircularSpread.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Reverse (Spreads)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.ReverseSpreads = function(id, graph) {
  this.constructor(id, "Reverse (Spreads)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  // input pins
  var inputIn = this.addInputPin('Input', [0], VVVV.PinTypes.Value);

  // output pins
  var outputOut = this.addOutputPin('Output', [0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    var inSize = inputIn.getSliceCount();
    for (var i=0; i<inSize; i++) {
      var input = inputIn.getValue(i);
      outputOut.setValue(inSize - i - 1, input);
    }
    outputOut.setSliceCount(inSize);
  }

}
VVVV.Nodes.ReverseSpreads.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Integral (Spreads)
 Author(s): 'Matthias Zauner, woei'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.IntegralSpreads = function(id, graph) {
  this.constructor(id, "Integral (Spreads)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner, woei'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  // input pins
  var inputIn = this.addInputPin('Input', [0], VVVV.PinTypes.Value);
  var binIn = this.addInputPin('Input Bin Size', [-1], VVVV.PinTypes.Value);
  var offsetIn = this.addInputPin('Offset', [0], VVVV.PinTypes.Value);

  // output pins
  var outputOut = this.addOutputPin('Output', [0], VVVV.PinTypes.Value);
  var binOut = this.addOutputPin('Output Bin Size', [2], VVVV.PinTypes.Value);

  this.evaluate = function() {
  	var cIn = inputIn.getSliceCount();
    var cBin = Math.max(binIn.getSliceCount(),offsetIn.getSliceCount());
    var binC = 0;
    var sliceMax = 0;
    var bins = [];
    if (cBin > 0) {
      while (binC < cBin || sliceMax < cIn) {
        var bin = parseInt(binIn.getValue(binC));
        if (bin<0)
          bin = parseInt(Math.round(cIn/parseFloat(Math.abs(bin))));
        sliceMax += bin;
        bins[binC] = bin;
        binC++;
      }
    }
    bins.splice(binC);

    var inId = 0;
    var outId = 0;
    for (var b=0; b<binC; b++) {
      var inSize = bins[b];
      binOut.setValue(b,inSize+1);

      var integral = offsetIn.getValue(b);
      for (var i=0; i<inSize; i++) {
      	outputOut.setValue(outId, integral);
        outId++;
        integral += inputIn.getValue(inId + i);
      }
      inId += inSize;
      outputOut.setValue(outId, integral);
      outId++;
    }

    outputOut.setSliceCount(outId);
    binOut.setSliceCount(binC);
  }

}
VVVV.Nodes.IntegralSpreads.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Differential (Spreads)
 Author(s): 'woei'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.DifferentialSpreads = function(id, graph) {
  this.constructor(id, "Differential (Spreads)", graph);
  
  this.meta = {
    authors: ['woei'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  // input pins
  var inputIn = this.addInputPin('Input', [0.0], VVVV.PinTypes.Value);
  var binIn = this.addInputPin('Input Bin Size', [-1], VVVV.PinTypes.Value);

  // output pins
  var outputOut = this.addOutputPin('Output', [0], VVVV.PinTypes.Value);
  var binOut = this.addOutputPin('Output Bin Size', [0], VVVV.PinTypes.Value);
  var offsetOut = this.addOutputPin('Offset', [0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    var cIn = inputIn.getSliceCount();
    var cBin = binIn.getSliceCount();
    var binC = 0;
    var sliceMax = 0;
    var bins = [];
    if (cBin > 0) {
      while (binC < cBin || sliceMax < cIn) {
        var bin = parseInt(binIn.getValue(binC));
        if (bin<0)
          bin = parseInt(Math.round(cIn/parseFloat(Math.abs(bin))));
        sliceMax += bin;
        bins[binC] = bin;
        binC++;
      }
    }
    bins.splice(binC);

    var inId = 0;
    var outId = 0;
    for (var b=0; b<binC; b++) {
      var size = bins[b]-1;
      var last =  inputIn.getValue(inId);
      binOut.setValue(b,size);
      offsetOut.setValue(b,last);
      for (var i=0; i<size; i++) {
        var input = inputIn.getValue(inId + i+1);
        outputOut.setValue(outId, input-last);
        last = input;
        outId++;
      }
      inId += size+1;
    }
        
    outputOut.setSliceCount(outId);
    binOut.setSliceCount(binC);
    offsetOut.setSliceCount(binC);
  }

}
VVVV.Nodes.DifferentialSpreads.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Cons (Spreads Legacy)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.ConsSpreads = function(id, graph) {
  this.constructor(id, "Cons (Spreads)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  var inputPins = [];

  // output pins
  var outputOut = this.addOutputPin('Output', [0], VVVV.PinTypes.Value);

  // invisible pins
  var inputcountIn = this.addInvisiblePin('Input Count', [2], VVVV.PinTypes.Value);
  
  // initialize() will be called after node creation
  this.initialize = function() {
    var inputCount = Math.max(2, inputcountIn.getValue(0));
    VVVV.Helpers.dynamicPins(this, inputPins, inputCount, function(i) {
      return this.addInputPin('Input '+(i+1), [0.0], VVVV.PinTypes.Value);
    })
  }

  this.evaluate = function() {
    if (inputcountIn.pinIsChanged())
      this.initialize();
    
    var idx = 0;
    for (var i=0; i<inputPins.length; i++) {
      for (var j=0; j<inputPins[i].getSliceCount(); j++) {
        outputOut.setValue(idx++, inputPins[i].getValue(j));
      }
    }
    outputOut.setSliceCount(idx);
  }

}
VVVV.Nodes.ConsSpreads.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Interval (Spreads)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.IntervalSpreads = function(id, graph) {
  this.constructor(id, "Interval (Spreads)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  // input pins
  var inputIn = this.addInputPin('Input', [0.5], VVVV.PinTypes.Value);
  var intervalsIn = this.addInputPin('Intervals', [0], VVVV.PinTypes.Value);

  // output pins
  var indexOut = this.addOutputPin('Index', [0], VVVV.PinTypes.Value);
  
  var minInterval = 0.0;

  this.evaluate = function() {
    var inSize = inputIn.getSliceCount();
    var intervalSize = intervalsIn.getSliceCount();
    if (intervalsIn.pinIsChanged()) {
      minInterval=undefined;
      for (var i=0; i<intervalSize; i++) {
        if (intervalsIn.getValue(i)<minInterval || minInterval==undefined)
          minInterval = intervalsIn.getValue(i);
      }
    }
    for (var i=0; i<inSize; i++) {
      var input = inputIn.getValue(i);
      if (input<minInterval) {
        indexOut.setValue(i, -1);
        continue;
      }
      for (var j=0; j<intervalSize-1; j++) {
        if (input>=intervalsIn.getValue(j) && input<intervalsIn.getValue(j+1)) {
          break;
        }
      }
      indexOut.setValue(i, j);
    }
    indexOut.setSliceCount(inSize);
  }

}
VVVV.Nodes.IntervalSpreads.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Queue (Spreads)
 Author(s): 'Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.QueueSpreads = function(id, graph) {
  this.constructor(id, "Queue (Spreads)", graph);
  
  this.meta = {
    authors: ['Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  var inputIn = this.addInputPin('Input', [0], VVVV.PinTypes.Value);
  var insertIn = this.addInputPin('Insert', [0], VVVV.PinTypes.Value);
  var framecountIn = this.addInputPin('Frame Count', [1], VVVV.PinTypes.Value);
  var resetIn = this.addInputPin('Reset', [0], VVVV.PinTypes.Value);

  var outputOut = this.addOutputPin('Output', [], VVVV.PinTypes.Value);
  var outputbinsizeOut = this.addOutputPin('Output Bin Size', [], VVVV.PinTypes.Value);
  
  var output = [];
  var binsizes = [];

  this.evaluate = function() {
    var insert = insertIn.getValue(0);
    var framecount = framecountIn.getValue(0);
    var reset = resetIn.getValue(0);

    var changed = false;
    if (insert>=0.5 && reset<0.5) {
      var newSize = inputIn.getSliceCount();
      for (var i=newSize-1; i>=0; i--) {
        output.unshift(inputIn.getValue(i));
      }
      binsizes.unshift(newSize);
      
      changed = true;
    }
    
    if (framecountIn.pinIsChanged() || changed) {
      currFrameCount = binsizes.length;
      for (var i=currFrameCount; i>framecount; i--) {
        output.splice(-binsizes[i-1])
      }
      binsizes.splice(framecount);
      
      changed = true;
    }
    
    if (changed) {
      for (var i=0; i<output.length; i++) {
        outputOut.setValue(i, output[i]);
      }
      for (var i=0; i<binsizes.length; i++) {
        outputbinsizeOut.setValue(i, binsizes[i]);
      }
      
      outputOut.setSliceCount(output.length);
      outputOut.setSliceCount(binsizes.length);
    }
    
    if (reset>=0.5) {
      output.length = 0;
      binsizes.length = 0;
      outputOut.setSliceCount(0);
      outputbinsizeOut.setSliceCount(0);
    }

  }

}
VVVV.Nodes.QueueSpreads.prototype = new VVVV.Core.Node();

}(vvvvjs_jquery));