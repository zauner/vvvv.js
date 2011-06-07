
VVVV.Core.MainLoop = {

  run: function(graph) {
  
    var fps = 30;
    var framecount = 0;
    var dom = new VVVV.Core.DOMInterface(graph);
    
    function update() {
      framecount ++;
      var start = new Date().getTime();
      dom.populateIOBoxes();
      graph.evaluate();
      dom.processOutputIOBoxes();
      var elapsed = new Date().getTime()-start;
      window.status = elapsed;
      //if (framecount<1)
        window.setTimeout(update, Math.max(0, Math.round(1000/fps-elapsed)));
    }
    
    update();
  
  
  }

}