
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



VVVV.Nodes.IOBoxValueAdvanced = function(id, graph) {
  this.constructor(id, "IOBox (Value Advanced)", graph);
  
  this.addInputPin("Y Input Value", [0.0], this);
  
  this.addOutputPin("Y Output Value", [0.0], this);

  this.evaluate = function() {
    if (this.inputPins["Y Input Value"].pinIsChanged()) {
      for (var i=0; i<this.inputPins["Y Input Value"].values.length; i++) {
        this.outputPins["Y Output Value"].setValue(i, parseFloat(this.inputPins["Y Input Value"].values[i]));
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













