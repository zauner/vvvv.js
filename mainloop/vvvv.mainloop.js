
VVVV.fps = 60;

VVVV.Core.MainLoop = function(patch, frames_per_second) {
  
  VVVV.fps = frames_per_second || 60;
  var framecount = 0;
  var dom = new VVVV.Core.DOMInterface(patch);
  var run = true;
  var start = undefined;
  
  var measureStart = 0;
  var print_framerate = false;
  
  this.deltaT = 1000/VVVV.fps;
  
  patch.setMainloop(this);

  var that = this;  
  function update() {
    if (patch.resourcesPending==0) {
      framecount ++;
      var now = new Date().getTime();
      if (start)
        that.deltaT = now - start;
      start = now;
      dom.populateInputConnectors();
      patch.evaluate();
      dom.processOutputConnectors();
      var elapsed = new Date().getTime()-start;
      if (framecount%10 == 0) {
        if (print_framerate) {
          console.log((1 / ((start-measureStart)/(1000*10)))+'fps');
          print_framerate = false;
        }
        measureStart = start;
      }
    }
    if (run) // && framecount<1)
      window.setTimeout(update, Math.max(0, Math.round(1000/VVVV.fps-elapsed)));
    
  }
  
  this.stop = function() {
    run = false;
  }
  
  this.start = function() {
    if (run) return;
    run = true;
    update();
  }
  
  this.isRunning = function() {
    return run;
  }
  
  update();
  
  $(window).keydown(function(e) {
    // ctrl + alt + F to print framerate
    if ((e.which==102 || e.which==70) && e.altKey && e.ctrlKey)
      print_framerate = true;
  });
  

}