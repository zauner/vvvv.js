


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