
VVVV.Nodes = {}

VVVV.Nodes.AddValue = function(id, graph) {
  this.constructor(id, "Add (Value)", graph);
  
  this.addInputPin("Input 1", [0.0], this);
  this.addInputPin("Input 2", [0.0], this);
  
  this.addOutputPin("Output", [0.0], this);

  this.evaluate = function() {
    if (this.inputPins["Input 1"].pinIsChanged() || this.inputPins["Input 2"].pinIsChanged()) {
      var maxSpreadSize = Math.max(this.inputPins["Input 1"].values.length, this.inputPins["Input 2"].values.length);
      
      for (var i=0; i<maxSpreadSize; i++) {
        this.outputPins["Output"].setValue(i, parseFloat(this.inputPins["Input 1"].getValue(i)) + parseFloat(this.inputPins["Input 2"].getValue(i)));
      }
    }
    
  }

}
VVVV.Nodes.AddValue.prototype = new VVVV.Core.Node();



VVVV.Nodes.SubtractValue = function(id, graph) {
  this.constructor(id, "Subtract (Value)", graph);
  
  var input1In = this.addInputPin("Input 1", [0.0], this);
  var input2In = this.addInputPin("Input 2", [0.0], this);
  
  var outputOut = this.addOutputPin("Output", [0.0], this);

  this.evaluate = function() {
    if (input1In.pinIsChanged() || input2In.pinIsChanged()) {
      var maxSize = this.getMaxInputSliceCount();
      
      for (var i=0; i<maxSize; i++) {
        outputOut.setValue(i, parseFloat(input1In.getValue(i))-parseFloat(input2In.getValue(i)));
      }
    }
    
  }

}
VVVV.Nodes.SubtractValue.prototype = new VVVV.Core.Node();



VVVV.Nodes.EqValue = function(id, graph) {
  this.constructor(id, "EQ (Value)", graph);
  
  var input1In = this.addInputPin("Input 1", [0.0], this);
  var input2In = this.addInputPin("Input 2", [0.0], this);
  var epsilonIn = this.addInputPin("Epsilon", [0.0], this);
  
  var outputOut = this.addOutputPin("Output", [0.0], this);
  var invOutputOut = this.addOutputPin("Inverse Output", [0.0], this);

  this.evaluate = function() {
    if (input1In.pinIsChanged() || input2In.pinIsChanged() || epsilonIn.pinIsChanged()) {
      var maxSize = this.getMaxInputSliceCount();
      
      for (var i=0; i<maxSize; i++) {
        var result = 0;
        if (input1In.getValue(i)==input2In.getValue(i))
          result = 1;
        outputOut.setValue(i, result);
        invOutputOut.setValue(i, 1-result);
      }
    }
    
  }

}
VVVV.Nodes.EqValue.prototype = new VVVV.Core.Node();




VVVV.Nodes.GtValue = function(id, graph) {
  this.constructor(id, "GT (Value)", graph);
  
  var input1In = this.addInputPin("Input 1", [0.0], this);
  var input2In = this.addInputPin("Input 2", [0.0], this);
  
  var outputOut = this.addOutputPin("Output", [0.0], this);

  this.evaluate = function() {
    if (input1In.pinIsChanged() || input2In.pinIsChanged()) {
      var maxSize = this.getMaxInputSliceCount();
      
      for (var i=0; i<maxSize; i++) {
        var result = 0;
        if (input1In.getValue(i)>input2In.getValue(i))
          result = 1;
        outputOut.setValue(i, result);
      }
    }
    
  }

}
VVVV.Nodes.GtValue.prototype = new VVVV.Core.Node();



VVVV.Nodes.LtValue = function(id, graph) {
  this.constructor(id, "LT (Value)", graph);
  
  var input1In = this.addInputPin("Input 1", [0.0], this);
  var input2In = this.addInputPin("Input 2", [0.0], this);
  
  var outputOut = this.addOutputPin("Output", [0.0], this);

  this.evaluate = function() {
    if (input1In.pinIsChanged() || input2In.pinIsChanged()) {
      var maxSize = this.getMaxInputSliceCount();
      
      for (var i=0; i<maxSize; i++) {
        var result = 0;
        if (input1In.getValue(i)<input2In.getValue(i))
          result = 1;
        outputOut.setValue(i, result);
      }
    }
    
  }

}
VVVV.Nodes.LtValue.prototype = new VVVV.Core.Node();



VVVV.Nodes.MultiplyValue = function(id, graph) {
  this.constructor(id, "Multiply (Value)", graph);
  
  this.addInputPin("Input 1", [0.0], this);
  this.addInputPin("Input 2", [0.0], this);
  
  this.addOutputPin("Output", [0.0], this);

  this.evaluate = function() {
    if (this.inputPins["Input 1"].pinIsChanged() || this.inputPins["Input 2"].pinIsChanged()) {
      var maxSpreadSize = Math.max(this.inputPins["Input 1"].values.length, this.inputPins["Input 2"].values.length);
      
      for (var i=0; i<maxSpreadSize; i++) {
        this.outputPins["Output"].setValue(i, parseFloat(this.inputPins["Input 1"].getValue(i)) * parseFloat(this.inputPins["Input 2"].getValue(i)));
      }
    }
    
  }

}
VVVV.Nodes.MultiplyValue.prototype = new VVVV.Core.Node();



VVVV.Nodes.DivideValue = function(id, graph) {
  this.constructor(id, "Divide (Value)", graph);
  
  var input1In = this.addInputPin("Input", [0.0], this);
  var input2In = this.addInputPin("Input 2", [0.0], this);
  
  var outputOut = this.addOutputPin("Output", [0.0], this);

  this.evaluate = function() {
    if (input1In.pinIsChanged() || input2In.pinIsChanged()) {
      var maxSize = this.getMaxInputSliceCount();
      
      for (var i=0; i<maxSize; i++) {
        outputOut.setValue(i, input1In.getValue(i)/input2In.getValue(i));
      }
    }
    
  }

}
VVVV.Nodes.DivideValue.prototype = new VVVV.Core.Node();



VVVV.Nodes.IOBoxValueAdvanced = function(id, graph) {
  this.constructor(id, "IOBox (Value Advanced)", graph);
  
  this.addInputPin("SliceOffset", [0], this);
  this.addInputPin("X Input Value", [0.0], this);
  this.addInputPin("Y Input Value", [0.0], this);
  
  this.addOutputPin("X Output Value", [0.0], this);
  this.addOutputPin("Y Output Value", [0.0], this);

  this.evaluate = function() {
    if (this.inputPins["Y Input Value"].pinIsChanged()) {
      for (var i=0; i<this.inputPins["Y Input Value"].values.length; i++) {
        this.outputPins["Y Output Value"].setValue(i, parseFloat(this.inputPins["Y Input Value"].values[i]));
      }
    }
    
    if (this.inputPins["X Input Value"].pinIsChanged()) {
      for (var i=0; i<this.inputPins["X Input Value"].values.length; i++) {
        this.outputPins["X Output Value"].setValue(i, parseFloat(this.inputPins["X Input Value"].values[i]));
      }
    }
  }

}
VVVV.Nodes.IOBoxValueAdvanced.prototype = new VVVV.Core.Node();





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



VVVV.Nodes.SwitchValueInput = function(id, graph) {
  this.constructor(id, "Switch (Value Input)", graph);
  
  var switchIn = this.addInputPin("Switch", [0], this);
  var inputIn = []
  inputIn[0] = this.addInputPin("Input 1", [0.0], this);
  inputIn[1] = this.addInputPin("Input 2", [0.0], this);
  
  var outputOut = this.addOutputPin("Output", [0.0], this);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    var pinsChanged = switchIn.pinIsChanged();
    for (var i=0; i<inputIn.length; i++) {
      pinsChanged = pinsChanged || inputIn[i].pinIsChanged();
    }
    
    if (pinsChanged) {
      if (switchIn.getValue(0)==undefined) {
        outputOut.setValue(0, undefined);
        return;
      }
      for (var i=0; i<maxSize; i++) {
        outputOut.setValue(i, inputIn[switchIn.getValue(i)%inputIn.length].getValue(i));
      }
    }
  }

}
VVVV.Nodes.SwitchValueInput.prototype = new VVVV.Core.Node();



VVVV.Nodes.SelectValue = function(id, graph) {
  this.constructor(id, "Select (Value)", graph);
  
  var inputIn = this.addInputPin("Input", [0.0], this);
  var selectIn = this.addInputPin("Select", [1], this);
  
  var outputOut = this.addOutputPin("Output", [0.0], this);
  var formerSliceOut = this.addOutputPin("Former Slice", [0], this);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    var pinsChanged = inputIn.pinIsChanged() || selectIn.pinIsChanged();
    
    if (pinsChanged) {
      outputOut.values = [];
      formerSliceOut.values = [];
      
      var outputIndex = 0;
      for (var i=0; i<maxSize; i++) {
        for (var j=0; j<selectIn.getValue(i); j++) {
          outputOut.setValue(outputIndex, inputIn.getValue(i));
          formerSliceOut.setValue(outputIndex, i);
          outputIndex++;
        }
      }
    }
  }

}
VVVV.Nodes.SelectValue.prototype = new VVVV.Core.Node();




VVVV.Nodes.AsString = function(id, graph) {
  this.constructor(id, "AsString (Value)", graph);
  
  var inputIn = this.addInputPin("Input", [0.0], this);
  var subtypeIn = this.addInputPin("SubType", [''], this);
  
  var outputOut = this.addOutputPin("Output", [0.0], this);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    var pinsChanged = inputIn.pinIsChanged() || subtypeIn.pinIsChanged();
    
    if (pinsChanged) {
      for (var i=0; i<maxSize; i++) {
        outputOut.setValue(i, parseFloat(inputIn.getValue(i)).toFixed(4));
      }
    }
  }

}
VVVV.Nodes.AsString.prototype = new VVVV.Core.Node();



VVVV.Nodes.Frac = function(id, graph) {
  this.constructor(id, "Frac (Value)", graph);
  
  var inputIn = this.addInputPin("Input", [0.0], this);
  
  var wholeOut = this.addOutputPin("Whole Part", [0], this);
  var realOut = this.addOutputPin("Real Part", [0.5], this);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    var pinsChanged = inputIn.pinIsChanged();
    
    if (pinsChanged) {
      for (var i=0; i<maxSize; i++) {
        var inValue = parseFloat(inputIn.getValue(i));
        wholeOut.setValue(i, Math.floor(inValue));
        realOut.setValue(i, inValue - Math.floor(inValue));
      }
    }
  }

}
VVVV.Nodes.Frac.prototype = new VVVV.Core.Node();









