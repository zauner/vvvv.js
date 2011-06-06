
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