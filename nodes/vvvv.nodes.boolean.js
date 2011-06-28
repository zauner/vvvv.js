

VVVV.Nodes.And = function(id, graph) {
  this.constructor(id, "AND (Boolean)", graph);
  
  var input1In = this.addInputPin("Input 1", [1], this);
  var input2In = this.addInputPin("Input 2", [1], this);
  
  var outputOut = this.addOutputPin("Output", [1], this);

  this.evaluate = function() {
  
  
    if (input1In.pinIsChanged() || input2In.pinIsChanged()) {
      
      for (var i=0; i<this.getMaxInputSliceCount(); i++) {
        if (Math.round(input1In.getValue(i))>=1 && Math.round(input2In.getValue(i))>=1)
          outputOut.setValue(i, 1);
        else
          outputOut.setValue(i, 0);
      }
      
    }
    
    
  }

}
VVVV.Nodes.And.prototype = new VVVV.Core.Node();



VVVV.Nodes.Or = function(id, graph) {
  this.constructor(id, "OR (Boolean)", graph);
  
  var input1In = this.addInputPin("Input 1", [1], this);
  var input2In = this.addInputPin("Input 2", [1], this);
  
  var outputOut = this.addOutputPin("Output", [1], this);

  this.evaluate = function() {
  
  
    if (input1In.pinIsChanged() || input2In.pinIsChanged()) {
      
      for (var i=0; i<this.getMaxInputSliceCount(); i++) {
        if (Math.round(input1In.getValue(i))>=1 || Math.round(input2In.getValue(i))>=1)
          outputOut.setValue(i, 1);
        else
          outputOut.setValue(i, 0);
      }
      
    }
    
    
  }

}
VVVV.Nodes.Or.prototype = new VVVV.Core.Node();



VVVV.Nodes.Not = function(id, graph) {
  this.constructor(id, "NOT (Boolean)", graph);
  
  var inputIn = this.addInputPin("Input", [1], this);
  
  var outputOut = this.addOutputPin("Output", [1], this);

  this.evaluate = function() {
  
  
    if (inputIn.pinIsChanged()) {
      
      for (var i=0; i<this.getMaxInputSliceCount(); i++) {
        outputOut.setValue(i, 1-Math.round(parseFloat(inputIn.getValue(i))));
      }
      
    }
    
    
  }

}
VVVV.Nodes.Not.prototype = new VVVV.Core.Node();


VVVV.Nodes.OrSpectral = function(id, graph) {
  this.constructor(id, "OR (Boolean Spectral)", graph);
  
  var inputIn = this.addInputPin("Input", [0.0], this);
  var binSizeIn = this.addInputPin("Bin Size", [-1], this);
  
  var outputOut = this.addOutputPin("Output", [0], this);

  this.evaluate = function() {
  
  
    if (inputIn.pinIsChanged()) {
      
      var binNum = 0;
      var result = false;
      
      for (var i=0; i<inputIn.values.length; i++) {
        if (Math.round(inputIn.getValue(i))>=1) {
          result = true;
        }
      }
      outputOut.setValue(binNum, result ? 1 : 0);
      
    }
    
    
  }

}
VVVV.Nodes.OrSpectral.prototype = new VVVV.Core.Node();




VVVV.Nodes.AndSpectral = function(id, graph) {
  this.constructor(id, "AND (Boolean Spectral)", graph);
  
  var inputIn = this.addInputPin("Input", [0.0], this);
  var binSizeIn = this.addInputPin("Bin Size", [-1], this);
  
  var outputOut = this.addOutputPin("Output", [0], this);

  this.evaluate = function() {
  
  
    if (inputIn.pinIsChanged()) {
      
      var binNum = 0;
      var result = true;
      
      for (var i=0; i<inputIn.values.length; i++) {
        if (Math.round(inputIn.getValue(i))<1) {
          result = false;
        }
      }
      outputOut.setValue(binNum, result ? 1 : 0);
      
    }
    
    
  }

}
VVVV.Nodes.AndSpectral.prototype = new VVVV.Core.Node();