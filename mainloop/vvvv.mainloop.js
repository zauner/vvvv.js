
VVVV.Core.MainLoop = {

  run: function(graph) {
  
    var fps = 30;
    var framecount = 0;
    
    function update() {
      framecount ++;
      var start = new Date().getTime();
      VVVV.Core.DOMInterface.populateIOBoxes(graph);
      graph.evaluate();
      VVVV.Core.DOMInterface.processOutputIOBoxes(graph);
      var elapsed = new Date().getTime()-start;
      window.status = elapsed;
      //if (framecount<20)
        window.setTimeout(update, Math.max(0, Math.round(1000/fps-elapsed)));
    }
    
    update();
  
  
  }

}