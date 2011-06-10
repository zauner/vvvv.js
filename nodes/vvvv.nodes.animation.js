
VVVV.Nodes.LFO = function(id, graph) {
  this.constructor(id, "LFO (Animation)", graph);
  
  this.addInputPin("Period", [1.0], this);
  this.addInputPin("Pause", [0], this);
  this.addInputPin("Reverse", [0], this);
  this.addInputPin("Reset", [0], this);
  this.addInputPin("Phase", [0.0], this);
  
  this.addOutputPin("Output", [0.0], this);
  this.addOutputPin("Cycles", [0], this);
  
  var current = 0.0;
  var cycles = 0;
  var lastUpdate = new Date().getTime();

  this.evaluate = function() {
    var period = parseFloat(this.inputPins["Period"].getValue(0));
    var paused = parseInt(this.inputPins["Pause"].getValue(0));
    var reverse = parseInt(this.inputPins["Reverse"].getValue(0));
    var reset = parseInt(this.inputPins["Reset"].getValue(0));
    var phase = parseFloat(this.inputPins["Phase"].getValue(0));
  
    var dt = new Date().getTime()-lastUpdate;
    
    if (paused<=0 && period!=0 && isFinite(period)) {
      
      dv = (1/(period*1000)*dt);
      if (reverse>0)
        dv *= -1;
      current += dv;
      if (current<0) {
        cycles -= Math.ceil(-current);
        current = 1.0 + current;
      }
      if (current>1)
        cycles += Math.floor(current);
    }
    
    lastUpdate = new Date().getTime();
    
    if (reset>0)
      current = 0.0;
    
    this.outputPins["Output"].setValue(0, (current+phase)%1);
    this.outputPins["Cycles"].setValue(0, cycles);
    
    current = current %1;
  }

}
VVVV.Nodes.LFO.prototype = new VVVV.Core.Node();



VVVV.Nodes.LinearFilter = function(id, graph) {
  this.constructor(id, "LinearFilter (Animation)", graph);
  
  var positionIn = this.addInputPin("Go To Position", [0.0], this);
  var filterTimeIn = this.addInputPin("FilterTime", [1.0], this);
  
  var positionOut = this.addOutputPin("Position Out", [0.0], this);
  var velocityOut = this.addOutputPin("Velocity Out", [0.0], this);
  var accelerationOut = this.addOutputPin("Acceleration Out", [0.0], this);
  
  var lastUpdate = [];
  var currPos = [];
  var velocity = [];
  var deltaPos = [];
  
  function sign(n) {
    return n>=0;
  }

  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    var pinsChanged = positionIn.pinIsChanged() || filterTimeIn.pinIsChanged();
    
    for (var i=0; i<maxSize; i++) {
    
      if (lastUpdate[i]==undefined)
        lastUpdate[i] = new Date().getTime();
      var dt = new Date().getTime()-lastUpdate[i];
      if (currPos[i]==undefined)
        currPos[i] = 0.0;
        
      var targetPos = parseFloat(positionIn.getValue(i));
      var filterTime = parseFloat(filterTimeIn.getValue(i));
      
      if (!isFinite(targetPos) || !isFinite(filterTime)) {
        currPos[i] = undefined;
        positionOut.setValue(i, undefined);
        continue;
      }
        
      if (pinsChanged) {
        dt = 0;
        deltaPos[i] = undefined;
        if (filterTime>0)
          velocity[i] = (targetPos-currPos[i])/(filterTime*1000);
        else
          velocity[i] = 0;
      }
      
      currPos[i] += velocity[i]*dt;
      
      if (deltaPos[i]!=undefined && deltaPos[i]!=0 && sign(targetPos-currPos[i]) != sign(deltaPos[i])) {
        velocity[i] = 0;
        currPos[i] = targetPos;
      }
      
      deltaPos[i] = targetPos - currPos[i];
      
      positionOut.setValue(i, currPos[i]);
      
      lastUpdate[i] = new Date().getTime();
    }
    
  }

}
VVVV.Nodes.LinearFilter.prototype = new VVVV.Core.Node();