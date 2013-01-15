
VVVV.Core.MainLoop = function(patch, frames_per_second) {
  
  var fps = frames_per_second || 60;
  var framecount = 0;
  var dom = new VVVV.Core.DOMInterface(patch);
  var run = true;
  
  var measureStart = 0;
  var print_framerate = false;
  
  function update() {
    framecount ++;
    var start = new Date().getTime();
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
    if (run) // && framecount<=150)
      window.setTimeout(update, Math.max(0, Math.round(1000/fps-elapsed)));
  }
  
  this.stop = function() {
    run = false;
  }
  
  this.start = function() {
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