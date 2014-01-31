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
  
  this.addInputPin("Input", [0.0], VVVV.PinTypes.Value);
  this.addInputPin("Bin Size", [1], VVVV.PinTypes.Value);
  this.addInputPin("Index", [0], VVVV.PinTypes.Value);
  
  this.addOutputPin("Output", [0.0], VVVV.PinTypes.Value);

  this.evaluate = function() {  
    var size = this.inputPins["Index"].values.length;
    for (var i=0; i<size; i++) {
      this.outputPins["Output"].setValue(i, parseFloat(this.inputPins["Input"].getValue(Math.round(this.inputPins["Index"].getValue(i)))));
    }
    this.outputPins["Output"].setSliceCount(size);
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
    var input = parseFloat(this.inputPins["Input"].getValue(0));
    var width = parseFloat(this.inputPins["Width"].getValue(0));
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
    
    var count = parseInt(countIn.getValue(0));
    var width = parseFloat(widthIn.getValue(0));
    var phase = parseFloat(phaseIn.getValue(0));
    var input = parseFloat(inputIn.getValue(0));
    var alignment = alignmentIn.getValue(0);
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
      outputOut.setValue(i, result.toFixed(4));
    }
    
    outputOut.setSliceCount(count);
    

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
      if (inputIn.values[0]==undefined) {
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
 Author(s): David Mórász (micro.D)
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.I = function(id, graph) {
  this.constructor(id, "I (Spreads)", graph);
  
  this.meta = {
    authors: ['Mórász Dávid (micro.D)'],
    original_authors: ['VVVV Group'],
    credits: ['Matthias Zauner'],
    compatibility_issues: ['This has no phase pin.','Smaller "from" than "to" isn\'t working yet']
  };
  
  var fromIn = this.addInputPin("[ From ..", [0], VVVV.PinTypes.Value);
  var toIn = this.addInputPin(".. To [", [1], VVVV.PinTypes.Value);
  
  var outputOut = this.addOutputPin("Output", [0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    
    var from = Math.round(fromIn.getValue(0));
    var to = Math.round(toIn.getValue(0));
    var idx = 0;
    if (from<=to) {
      for (var i=from; i < to; i++, idx++ ) {
        outputOut.setValue(idx, i);
      }
      outputOut.setSliceCount(to-from);
    }
    else {
      for (var i=from; i > to; i--, idx++ ) {
        outputOut.setValue(idx, i);
      }
      outputOut.setSliceCount(from-to);
    }
  }
}
VVVV.Nodes.I.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
NODE: CircularSpread (Spreads)
Author(s): Matija Miloslavich
Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/


VVVV.Nodes.CircularSpread = function (id, graph) {
  this.constructor(id, "CircularSpread (Spreads)", graph);

  this.meta = {
      authors: ['Matija Miloslavich'],
      original_authors: ['VVVV Group'],
      credits: [],
      compatibility_issues: ['only x and y inputs are spreadable']
  };

  this.inpxin = this.addInputPin("Input X", [0.0], VVVV.PinTypes.Value);
  this.inpyin = this.addInputPin("Input Y", [0.0], VVVV.PinTypes.Value);
  this.widhin = this.addInputPin("Width", [1.0], VVVV.PinTypes.Value);
  this.heightin = this.addInputPin("Height", [1.0], VVVV.PinTypes.Value);
  this.factorin = this.addInputPin("Factor", [1.0], VVVV.PinTypes.Value);
  this.phasein = this.addInputPin("Phase", [0.0], VVVV.PinTypes.Value);
  this.sprcntin = this.addInputPin("Spread Count", [1], VVVV.PinTypes.Value);

  this.xout = this.addOutputPin("Output X", [0.0], VVVV.PinTypes.Value);
  this.yout = this.addOutputPin("Output Y", [0.0], VVVV.PinTypes.Value);

  this.evaluate = function () {
    
    var cw = parseFloat(this.widhin.getValue(0)) * 0.5;
    var ch = parseFloat(this.heightin.getValue(0)) * 0.5;
    var cf = parseFloat(this.factorin.getValue(0));
    var cph = parseFloat(this.phasein.getValue(0));

    var spc = parseInt(this.sprcntin.getValue(0));

    var pi2 = Math.PI * 2;
    var ca = pi2 * cph;

    var ovi = 0;

    var insc = Math.max(this.inpyin.getSliceCount(), this.inpxin.getSliceCount());
    
    for (var insi = 0; insi < insc*spc; insi++) {
      var cxi = parseFloat(this.inpxin.getValue(insi));
      var cyi = parseFloat(this.inpyin.getValue(insi));

      for (var csi = 0; csi < spc; csi++) {
        var csa = ca + pi2 * (csi / spc) * cf;

        var ox = cxi + Math.cos(csa) * cw;
        var oy = cyi + Math.sin(csa) * ch;

        this.xout.setValue(ovi, ox);
        this.yout.setValue(ovi, oy);

        ovi++;
      }
    }
    this.xout.setSliceCount(spc*insc);
    this.yout.setSliceCount(spc*insc);
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
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.IntegralSpreads = function(id, graph) {
  this.constructor(id, "Integral (Spreads)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  // input pins
  var inputIn = this.addInputPin('Input', [0], VVVV.PinTypes.Value);
  var offsetIn = this.addInputPin('Offset', [0], VVVV.PinTypes.Value);

  // output pins
  var outputOut = this.addOutputPin('Output', [0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    var inSize = inputIn.getSliceCount();
    var integral = parseFloat(offsetIn.getValue(0));
    outputOut.setValue(0, integral);
    for (var i=0; i<inSize; i++) {
      var input = parseFloat(inputIn.getValue(i));
      integral += input;
      outputOut.setValue(i+1, integral);
    }
    outputOut.setSliceCount(inSize + 1);
  }

}
VVVV.Nodes.IntegralSpreads.prototype = new VVVV.Core.Node();


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
    var inputCount = inputcountIn.getValue(0);
    for (var i=inputPins.length; i<inputCount; i++) {
      inputPins[i] = this.addInputPin("Input "+(i+1), [0.0], VVVV.PinTypes.Value);
    }
    inputPins.length = inputCount;
  }

  this.evaluate = function() {
    if (inputcountIn.pinIsChanged()) {
      this.initialize();
    }
    
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

  this.evaluate = function() {
    var insert = insertIn.getValue(0);
    var framecount = framecountIn.getValue(0);
    var reset = resetIn.getValue(0);

    var changed = false;
    if (insert>=0.5 && reset<0.5) {
      var newSize = inputIn.getSliceCount();
      for (var i=newSize-1; i>=0; i--) {
        outputOut.values.unshift(inputIn.getValue(i));
      }
      outputbinsizeOut.values.unshift(newSize);
      
      changed = true;
    }
    
    if (framecountIn.pinIsChanged() || changed) {
      currFrameCount = outputbinsizeOut.values.length;
      for (var i=currFrameCount; i>framecount; i--) {
        outputOut.values.splice(-outputbinsizeOut.values[i-1])
      }
      outputbinsizeOut.values.splice(framecount);
      
      changed = true;
    }
    
    if (changed) {
      for (var i=0; i<outputOut.values.length; i++) {
        outputOut.setValue(i, outputOut.values[i]);
      }
      for (var i=0; i<outputbinsizeOut.values.length; i++) {
        outputbinsizeOut.setValue(i, outputbinsizeOut.values[i]);
      } 
    }
    
    if (reset>=0.5) {
      outputOut.setSliceCount(0);
      outputbinsizeOut.setSliceCount(0);
    }

  }

}
VVVV.Nodes.QueueSpreads.prototype = new VVVV.Core.Node();