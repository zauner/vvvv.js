
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
