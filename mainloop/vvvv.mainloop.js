

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }

define(function(require,exports) {


var _ = require('underscore');
var $ = require('jquery');
var DOMInterface = require('mainloop/vvvv.dominterface');

/** The frames per second VVVV.js should run, defaults to 60fps */
VVVVContext.fps = 60;

/**
 * The MainLoop continuously runs {@link VVVV.Core.Patch.evaluate} at a specified frame rate, and holds timing information
 * @class
 * @constructor
 * @param {VVVV.Core.Patch} patch the root patch
 * @param {Integer} [frames_per_second] default is 60
 */
var MainLoop = function(patch, frames_per_second) {

  VVVVContext.fps = frames_per_second || 60;
  var framecount = 0;
  if (VVVVContext.name=='browser')
    var dom = new DOMInterface(patch);
  var run = true;
  var start = undefined;
  var evaluateRequested = false;

  this.lowFrameRateCount = 0;
  var measureStart = 0;
  var print_framerate = false;

  /** the time in ms elapsed since the last evaluation cycle */
  this.deltaT = 1000/VVVVContext.fps;

  /** the frame number */
  this.frameNum = 0;
  patch.setMainloop(this);

  var nodeEnvTimer = null;

  var isIdle = true;

  var that = this;

  /**
   * Called every 1000/VVVVContext.fps ms, and subsequently calls {@link VVVV.Core.Patch.evaluate}. It also triggers population of DOM IOBoxes
   * before, and processing of DOM IOBoxes after evaluation.
   */
  function update() {
    if (patch.resourcesPending==0) {
      isIdle = false;
      framecount ++;
      var now = new Date().getTime();
      if (start)
        that.deltaT = now - start;
      start = now;
      if (VVVVContext.name=='browser')
        dom.populateInputConnectors();
      patch.evaluate();
      if (VVVVContext.name=='browser')
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
        VVVVContext.onLowFrameRate();
      }
      else
        lowFrameRateCount = 0;
    }

    isIdle = true;

    if (run) // && framecount<1)
      if (VVVVContext.name=='browser') {
        window.setTimeout(function() {
          window.requestAnimationFrame(update);
        }, Math.max(0, Math.round(1000/VVVVContext.fps-elapsed)));
      }
      else if (VVVVContext.name=='nodejs') {
        nodeEnvTimer = setTimeout(update, Math.max(0, evaluateRequested ? 1000/5 : Math.round(1000/VVVVContext.fps-elapsed)));
        evaluateRequested = false;
      }

  }

  /**
   * pauses the main loop
   */
  this.stop = function() {
    run = false;
    if (nodeEnvTimer!==null)
      clearTimeout(nodeEnvTimer);
  }

  /**
   * (re)starts the main loop
   */
  this.start = function() {
    if (run) return;
    if (nodeEnvTimer!==null)
      clearTimeout(nodeEnvTimer);
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

  this.requestEvaluate = function() {
    if (isIdle && !that.disposing) {
      this.stop();
      this.start();
    }
    else
      evaluateRequested = true;
  }

  update();

  $(window).keydown(function(e) {
    // ctrl + alt + F to print framerate
    if ((e.which==102 || e.which==70) && e.altKey && e.ctrlKey)
      print_framerate = true;
  });


}


  return MainLoop;
})
