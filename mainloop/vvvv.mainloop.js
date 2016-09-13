
(function($) {

/** The frames per second VVVV.js should run, defaults to 60fps */
VVVV.fps = 60;

/** 
 * The MainLoop continuously runs {@link VVVV.Core.Patch.evaluate} at a specified frame rate, and holds timing information
 * @class
 * @constructor
 * @param {VVVV.Core.Patch} patch the root patch
 * @param {Integer} [frames_per_second] default is 60
 */
VVVV.Core.MainLoop = function(patch, frames_per_second) {
  
  VVVV.fps = frames_per_second || 60;
  var framecount = 0;
  var dom = new VVVV.Core.DOMInterface(patch);
  var run = true;
  var start = undefined;
  var animFrameRequested = false;
  
  this.lowFrameRateCount = 0;
  var measureStart = 0;
  var print_framerate = false;
  
  /** the time in ms elapsed since the last evaluation cycle */
  this.deltaT = 1000/VVVV.fps;
  
  /** the frame number */
  this.frameNum = 0;
  
  patch.setMainloop(this);

  var that = this;  
  
  /**
   * Called every 1000/VVVV.fps ms, and subsequently calls {@link VVVV.Core.Patch.evaluate}. It also triggers population of DOM IOBoxes
   * before, and processing of DOM IOBoxes after evaluation.
   */
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
      that.frameNum++;
      
      if (elapsed>66 && that.lowFrameRateCount++>50) {
        VVVV.onLowFrameRate();
      }
      else
        lowFrameRateCount = 0;
    }
    if (run) // && framecount<1)
      window.setTimeout(function() {
        window.requestAnimationFrame(update);
      }, Math.max(0, Math.round(1000/VVVV.fps-elapsed)));
    
  }
  
  /**
   * pauses the main loop
   */
  this.stop = function() {
    run = false;
  }
  
  /**
   * (re)starts the main loop
   */
  this.start = function() {
    if (run) return;
    run = true;
    update();
  }
  
  /**
   * tells, if the main loop is running
   * @return {Boolean} true, if it's running, false otherwise
   */
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

}(vvvvjs_jquery));