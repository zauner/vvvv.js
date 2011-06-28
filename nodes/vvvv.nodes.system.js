

VVVV.Nodes.MouseGlobal = function(id, graph) {
  this.constructor(id, "Mouse (System Global)", graph);
  
  
  var xOut = this.addOutputPin("X", [0], this);
  var yOut = this.addOutputPin("Y", [0], this);
  
  var x = 0;
  var y = 0;
  
  $(document).mousemove(function(e) {
    x = e.pageX*2/parseInt($('body').css('width')) - 1;
    y = e.pageY*2/parseInt($('body').css('height')) -1;
  });

  this.evaluate = function() {
    
    if (xOut.getValue(0)!=x)
      xOut.setValue(0, x);
    if (yOut.getValue(0)!=y)
      yOut.setValue(0, y);
  }

}
VVVV.Nodes.MouseGlobal.prototype = new VVVV.Core.Node();




VVVV.Nodes.ShellExecute = function(id, graph) {
  this.constructor(id, "ShellExecute (Windows)", graph);
  
  
  var fileIn = this.addInputPin("File", [0], this);
  var doExecuteIn = this.addInputPin("Do Execute", [0], this);
  
  var resultOut = this.addOutputPin("Result", [''], this);

  this.evaluate = function() {
    
    if (Math.round(doExecuteIn.getValue(0))>=1) {
      var result = eval(fileIn.getValue(0));
      if (!result instanceof Array)
        result = [ result ];
      if (result==undefined)
        return;
      for (var j=0; j<result.length; j++) {
        resultOut.setValue(j, result[j]);
      }
    }
    
  }

}
VVVV.Nodes.ShellExecute.prototype = new VVVV.Core.Node();