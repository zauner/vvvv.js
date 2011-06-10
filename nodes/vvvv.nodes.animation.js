
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
  
  var lastUpdate = new Date().getTime();
  var currPos = [];
  var velocity = [];

  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    var pinsChanged = positionIn.pinIsChanged() || filterTimeIn.pinIsChanged();
    var dt = new Date().getTime()-lastUpdate;
    
    for (var i=0; i<maxSize; i++) {
      if (currPos[i]==undefined)
        currPos[i] = 0.0;
      var targetPos = parseFloat(positionIn.getValue(i));
      var filterTime = parseFloat(filterTimeIn.getValue(i));
        
      if (pinsChanged) {
        console.log(this.inputPins["Go To Position"]);
        console.log(positionIn);
        dt = 0;
        
        if (filterTime>0)
          velocity[i] = (targetPos-currPos[i])/(filterTime*1000);
        else
          velocity[i] = 0;
        console.log(velocity[i]);
      
      }
      
      if (currPos[i]>=targetPos)
          return;
      
      currPos[i] += velocity[i]*dt;
      
      positionOut.setValue(i, currPos[i]);
      
    }
    
    lastUpdate = new Date().getTime();
  }

}
VVVV.Nodes.LinearFilter.prototype = new VVVV.Core.Node();