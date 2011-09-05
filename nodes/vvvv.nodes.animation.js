// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: LFO (Animation)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.LFO = function(id, graph) {
  this.constructor(id, "LFO (Animation)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Not spreadable yet']
  };
  
  this.auto_evaluate = true;
  
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


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: LinearFilter (Animation)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/


VVVV.Nodes.LinearFilter = function(id, graph) {
  this.constructor(id, "LinearFilter (Animation)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Sometimes doesnt stop when target reached', 'Cyclic Pin not implemented', 'Acceleration and Velocitity Out are not set yet']
  };
  
  this.auto_evaluate = true;
  
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
        
      var targetPos = parseFloat(positionIn.getValue(i));
      var filterTime = parseFloat(filterTimeIn.getValue(i));
      
      if (currPos[i]==undefined)
        currPos[i] = targetPos;
      
      if (!isFinite(targetPos) || !isFinite(filterTime)) {
        currPos[i] = undefined;
        positionOut.setValue(i, undefined);
        continue;
      }
        
      if (pinsChanged) {
        deltaPos[i] = undefined;
        if (filterTime>0)
          velocity[i] = (targetPos-currPos[i])/(filterTime*1000);
        else
          velocity[i] = 0;
      }
      
      currPos[i] += velocity[i]*dt;
      
      if (deltaPos[i]!=undefined && sign(targetPos-currPos[i]) != sign(deltaPos[i])) {
        velocity[i] = 0;
        currPos[i] = targetPos;
      }
      
      if (deltaPos[i]!=0)
        positionOut.setValue(i, currPos[i]);
      
      deltaPos[i] = targetPos - currPos[i];
      
      lastUpdate[i] = new Date().getTime();
    }
    
  }

}
VVVV.Nodes.LinearFilter.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Delay (Animation)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Delay = function(id, graph) {
  this.constructor(id, "Delay (Animation)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Reset not implemented', 'Linear Mode not implemented']
  };
  
  this.auto_evaluate = true;
  
  var inputIn = this.addInputPin("Input", [0.0], this);
  var timeIn = this.addInputPin("Time", [1.0], this);
  var insertIn = this.addInputPin("Insert", [1], this);
  
  var outputOut = this.addOutputPin("Output", [0.0], this);
  
  var queue = [];
  var times = new Array(1024);
  
  /*function reset(value) {
    for (var i=0; i<1024; i++) {
      queue[i] = value;
      times[i] = 0.0;
    }
  }
  reset(0.0);
  */

  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    now = new Date().getTime();
    var pinChanged = inputIn.pinIsChanged();
    
    if (inputIn.getValue(0)==undefined) {
      if (pinChanged) {
        outputOut.setValue(0, undefined);
      }
      return;
    }
    
    if (insertIn.getValue(0)==1 && pinChanged) {
      times.pop();
      times.unshift(now);
      for (var i=0; i<inputIn.values.length; i++) {
        if (queue[i]==undefined)
          queue[i] = new Array(1024);
        if (queue[i].length>=1024)
          queue[i].pop();
        queue[i].unshift(inputIn.getValue(i));
      }
    }
    
    for (var i=0; i<maxSize; i++) {
      var dt = now - timeIn.getValue(i)*1000;
      var found = false;
      for (j=0; j<1024; j++) {
        if (times[j]<=dt) {
          if (outputOut.values[i]!=queue[i%queue.length][j]) {
            outputOut.setValue(i, queue[i%queue.length][j]);
          }
          found = true;
          break;
        }
      }
      if (!found && outputOut.values[i]!=0.0) {
        outputOut.setValue(i, 0.0);
      }
    }
    
  }

}
VVVV.Nodes.Delay.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Change (Animation)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Change = function(id, graph) {
  this.constructor(id, "Change (Animation)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = true;
  
  var inputIn = this.addInputPin("Input", [0.0], this);
  
  var changeOut = this.addOutputPin("OnChange", [0], this);
  
  var values = [];

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    if (inputIn.pinIsChanged()) {
      for (var i=0; i<maxSize; i++) {
        if (values[i]!=inputIn.getValue(i)) {
          changeOut.setValue(i, 1);
        }
        else if (changeOut.getValue(i)==1)
          changeOut.setValue(i, 0);
        values[i] = inputIn.getValue(i);
      }
    }
    else {
      for (var i=0; i<maxSize; i++) {
        if (changeOut.getValue(i)==1)
          changeOut.setValue(i, 0);
      }
      values[i] = inputIn.getValue(i);
    }
    
    
  }

}
VVVV.Nodes.Change.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: TogEdge (Animation)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.TogEdge = function(id, graph) {
  this.constructor(id, "TogEdge (Animation)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = true;
  
  var inputIn = this.addInputPin("Input", [0.0], this);
  
  var upOut = this.addOutputPin("Up Edge", [0], this);
  var downOut = this.addOutputPin("Down Edge", [0], this);
  
  var values = [];

  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      if ((Math.round(values[i])<=0 || values[i]==undefined) && Math.round(inputIn.getValue(i))>=1)
        upOut.setValue(i, 1);
      else if (upOut.values[i]!=0)
        upOut.setValue(i, 0);
      if (Math.round(values[i])>=1 && Math.round(inputIn.getValue(i))<=0)
        downOut.setValue(i, 1);
      else if (downOut.values[i]!=0)
        downOut.setValue(i, 0);
      values[i] = inputIn.getValue(i);
    }
    
    
  }

}
VVVV.Nodes.TogEdge.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: FlipFlop (Animation)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.FlipFlop = function(id, graph) {
  this.constructor(id, "FlipFlop (Animation)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var setIn = this.addInputPin("Set", [0], this);
  var resetIn = this.addInputPin("Reset", [0], this);
  
  var outputOut = this.addOutputPin("Output", [0], this);
  var inverseOutputOut = this.addOutputPin("Inverse Output", [1], this);
  
  var initialized = false;
  

  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    
    if (setIn.pinIsChanged() || resetIn.pinIsChanged()) {
      for (var i=0; i<maxSize; i++) {
        var result = undefined;
        if (Math.round(resetIn.getValue(i))>=1)
          result = 0;
        if (Math.round(setIn.getValue(i))>=1)
          result = 1;
        if (result!=undefined) {
          outputOut.setValue(i, result);
          inverseOutputOut.setValue(i, 1-result);
        }
        else if (!initialized) {
          outputOut.setValue(i, 0);
          inverseOutputOut.setValue(i, 1);
        }
      }
    }
    initialized = true;

  }

}
VVVV.Nodes.FlipFlop.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: S+H (Animation)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SampleAndHold = function(id, graph) {
  this.constructor(id, "S+H (Animation)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var inputIn = this.addInputPin("Input", [0.0], this);
  var setIn = this.addInputPin("Set", [0], this);
  
  var outputOut = this.addOutputPin("Output", [0.0], this);
  

  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    
    if (setIn.pinIsChanged() || inputIn.pinIsChanged()) {
      for (var i=0; i<maxSize; i++) {
        if (outputOut.values[i]==undefined) {
          outputOut.setValue(i, 0);
        }
        if (Math.round(setIn.getValue(i))>=1) {
          outputOut.setValue(i, inputIn.getValue(i));
        }
      }
    }
    
    
  }

}
VVVV.Nodes.SampleAndHold.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: FrameDelay (Animation)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.FrameDelay = function(id, graph) {
  this.constructor(id, "FrameDelay (Animation)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['no dynamice pin count']
  };
  
  this.delays_output = true;
  
  var input1In = this.addInputPin("Input 1", [0.0], this);
  var default1In = this.addInputPin("Default 1", [0.0], this);
  var initIn = this.addInputPin("Initialize", [0], this);
  
  var output1Out = this.addOutputPin("Output 1", [0.0], this);
  

  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      if (initIn.getValue(i)>0.5)
        output1Out.setValue(i, default1In.getValue(i));
      else
        output1Out.setValue(i, input1In.getValue(i));
    }
    output1Out.setSliceCount(maxSize);
    
  }

}
VVVV.Nodes.FrameDelay.prototype = new VVVV.Core.Node();

