
VVVV.Nodes = {}

VVVV.Nodes.AddValue = function(id, graph) {
  this.constructor(id, "Add (Value)", graph);
  
  this.addInputPin("Input 1", [0.0], this);
  this.addInputPin("Input 2", [0.0], this);
  
  this.addOutputPin("Output", [0.0], this);

  this.evaluate = function() {
    var maxSpreadSize = Math.max(this.inputPins["Input 1"].values.length, this.inputPins["Input 2"].values.length);
    
    for (var i=0; i<maxSpreadSize; i++) {
      this.outputPins["Output"].setValue(i, parseFloat(this.inputPins["Input 1"].getValue(i)) + parseFloat(this.inputPins["Input 2"].getValue(i)));
    }
    
  }

}
VVVV.Nodes.AddValue.prototype = new VVVV.Core.Node();



VVVV.Nodes.IOBoxValueAdvanced = function(id, graph) {
  this.constructor(id, "IOBox (Value Advanced)", graph);
  
  this.addInputPin("Y Input Value", [0.0], this);
  
  this.addOutputPin("Y Output Value", [0.0], this);

  this.evaluate = function() {
    for (var i=0; i<this.inputPins["Y Input Value"].values.length; i++) {
      this.outputPins["Y Output Value"].setValue(i, parseFloat(this.inputPins["Y Input Value"].values[i]));
    }
  }

}
VVVV.Nodes.IOBoxValueAdvanced.prototype = new VVVV.Core.Node();


VVVV.Nodes.IOBoxString = function(id, graph) {
  this.constructor(id, "IOBox (String)", graph);
  
  this.addInputPin("Input String", [""], this);
  
  this.addOutputPin("Output String", [""], this);

  this.evaluate = function() {
    for (var i=0; i<this.inputPins["Input String"].values.length; i++) {
      this.outputPins["Output String"].setValue(i, this.inputPins["Input String"].values[i]);
    }
  }

}
VVVV.Nodes.IOBoxString.prototype = new VVVV.Core.Node();



VVVV.Nodes.GetSliceSpreads = function(id, graph) {
  this.constructor(id, "GetSlice (Spreads)", graph);
  
  this.addInputPin("Input", [0.0], this);
  this.addInputPin("Bin Size", [1], this);
  this.addInputPin("Index", [0], this);
  
  this.addOutputPin("Output", [0.0], this);

  this.evaluate = function() {
    this.outputPins["Output"].values = [];
    
    for (var i=0; i<this.inputPins["Index"].values.length; i++) {
      this.outputPins["Output"].setValue(i, parseFloat(this.inputPins["Input"].getValue(this.inputPins["Index"].getValue(i))));
    }
  }

}
VVVV.Nodes.GetSliceSpreads.prototype = new VVVV.Core.Node();


VVVV.Nodes.CountValue = function(id, graph) {
  this.constructor(id, "Count (Value)", graph);
  
  this.addInputPin("Input", [0.0], this);
  
  this.addOutputPin("Count", [1.0], this);
  this.addOutputPin("High", [0.0], this);

  this.evaluate = function() {
    this.outputPins["Count"].setValue(0, this.inputPins["Input"].values.length);
    this.outputPins["High"].setValue(0, this.inputPins["Input"].values.length-1);
  }

}
VVVV.Nodes.CountValue.prototype = new VVVV.Core.Node();


VVVV.Nodes.RandomSpread = function(id, graph) {
  this.constructor(id, "RandomSpread (Spreads)", graph);
  
  this.addInputPin("Input", [0.0], this);
  this.addInputPin("Width", [1.0], this);
  this.addInputPin("Random Seed", [0], this);
  this.addInputPin("Spread Count", [1], this);
  
  this.addOutputPin("Output", [0.0], this);

  this.evaluate = function() {
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
    
    this.outputPins["Output"].values = [];
    for (var i=0; i<count; i++) {
      this.outputPins["Output"].setValue(i, rng.getRandomNumber()*width-width/2+input);
    }
  }
  
  

}
VVVV.Nodes.RandomSpread.prototype = new VVVV.Core.Node();



VVVV.Nodes.LFO = function(id, graph) {
  this.constructor(id, "LFO (Animation)", graph);
  
  this.addInputPin("Period", [1.0], this);
  this.addInputPin("Pause", [0], this);
  this.addInputPin("Reverse", [0], this);
  this.addInputPin("Reset", [0], this);
  this.addInputPin("Phase", [0.0], this);
  
  this.addOutputPin("Output", [0.0], this);
  this.addOutputPin("Cycles", [0], this);
  
  var current = 0.0;
  var cycles = 0;
  var lastUpdate = new Date().getTime();

  this.evaluate = function() {
    var period = parseFloat(this.inputPins["Period"].getValue(0));
    var paused = parseInt(this.inputPins["Pause"].getValue(0));
    var reverse = parseInt(this.inputPins["Reverse"].getValue(0));
    var reset = parseInt(this.inputPins["Reset"].getValue(0));
    var phase = parseFloat(this.inputPins["Phase"].getValue(0));
  
    var dt = new Date().getTime()-lastUpdate;
    
    if (paused<=0 && period!=0 && isFinite(period)) {
      
      dv = (1/(period*1000)*dt);
      if (reverse>0)
        dv *= -1;
      current += dv;
      if (current<0) {
        cycles -= Math.ceil(-current);
        current = 1.0 + current;
      }
      if (current>1)
        cycles += Math.floor(current);
    }
    
    lastUpdate = new Date().getTime();
    
    if (reset>0)
      current = 0.0;
    
    this.outputPins["Output"].setValue(0, (current+phase)%1);
    this.outputPins["Cycles"].setValue(0, cycles);
    
    current = current %1;
  }

}
VVVV.Nodes.LFO.prototype = new VVVV.Core.Node();




VVVV.Nodes.SortSpreads = function(id, graph) {
  this.constructor(id, "Sort (Spreads)", graph);
  
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


VVVV.Nodes.RGBJoin = function(id, graph) {
  this.constructor(id, "RGB (Color Join)", graph);
  
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


