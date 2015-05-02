// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

(function($) {

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: LFO (Animation)
 Author(s): Matthias Zauner, sebl, woei
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.LFO = function(id, graph) {
  this.constructor(id, "LFO (Animation)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner, sebl, woei'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Not spreadable yet']
  };
  
  this.auto_evaluate = true;
  
  var PeriodIn = this.addInputPin('Period', [1.0], VVVV.PinTypes.Value);
  var PauseIn = this.addInputPin("Pause", [0], VVVV.PinTypes.Value);
  var ReverseIn = this.addInputPin("Reverse", [0], VVVV.PinTypes.Value);
  var ResetIn = this.addInputPin("Reset", [0], VVVV.PinTypes.Value);
  var PhaseIn = this.addInputPin("Phase", [0.0], VVVV.PinTypes.Value);
  
  var outputOut = this.addOutputPin("Output", [0.0], VVVV.PinTypes.Value);
  var changeOut = this.addOutputPin("Change", [0], VVVV.PinTypes.Value);
  var CyclesOut = this.addOutputPin("Cycles", [0], VVVV.PinTypes.Value);
  
  var current = [];
  var cycles = [];
  
  var dt = new Date().getTime();
  var lastUpdate = new Date().getTime();

  this.evaluate = function() {
  
    var maxSize = this.getMaxInputSliceCount();
    
    dt = new Date().getTime()-lastUpdate;

    for (var i=0; i<maxSize; i++) {

      var period = PeriodIn.getValue(i);
      var paused = PauseIn.getValue(i);
      var reverse = ReverseIn.getValue(i);
      var reset = ResetIn.getValue(i);
      var phase = PhaseIn.getValue(i);

      var change = 0;

      if (current[i]==undefined) current[i] = 0.0;
      if (cycles[i]==undefined) cycles[i] = 0.0;

      if (paused<0.5 && period!=0 && isFinite(period)) {

        dv = (1/(period*1000)*dt);

        if (reverse>0){
          dv *= -1;
        }

        current[i] += dv;

        if (current[i]<0) {
          cycles[i] -= Math.ceil(-current[i]);
          current[i] = 1.0 + current[i];
          change = 1;
        }

        if (current[i]>1){
          cycles[i] += Math.floor(current[i]);
          change = 1;
        }
      }

      lastUpdate = new Date().getTime();

      if (reset>=0.5){
        current[i] = 0.0;
        cycles[i] = 0;
        change = 1;
      }

      if (paused<0.5 || reset>=0.5) { 
        outputOut.setValue(i, (current[i]+phase)%1);
        changeOut.setValue(i, change);
        CyclesOut.setValue(i, cycles[i]);
      }

      current[i] = current[i] %1;
    }
    outputOut.setSliceCount(maxSize);
    changeOut.setSliceCount(maxSize);
    CyclesOut.setSliceCount(maxSize);
    current.splice(maxSize);
    cycles.splice(maxSize);
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
    compatibility_issues: ['Cyclic Pin not implemented', 'Acceleration Out is not set yet']
  };
  
  this.auto_evaluate = true;
  
  var positionIn = this.addInputPin("Go To Position", [0.0], VVVV.PinTypes.Value);
  var filterTimeIn = this.addInputPin("FilterTime", [1.0], VVVV.PinTypes.Value);
  
  var positionOut = this.addOutputPin("Position Out", [0.0], VVVV.PinTypes.Value);
  var velocityOut = this.addOutputPin("Velocity Out", [0.0], VVVV.PinTypes.Value);
  var accelerationOut = this.addOutputPin("Acceleration Out", [0.0], VVVV.PinTypes.Value);
  
  var lastUpdate = [];
  var targetPos = [];
  var filterTimes = [];
  var currPos = [];
  var velocity = [];
  var deltaPos = [];

  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    var pinsChanged = positionIn.pinIsChanged() || filterTimeIn.pinIsChanged();
    
    for (var i=0; i<maxSize; i++) {
    
      if (lastUpdate[i]==undefined)
        lastUpdate[i] = new Date().getTime();
      var dt = this.parentPatch.mainloop.deltaT; //new Date().getTime()-lastUpdate[i];
        
      var pos = positionIn.getValue(i);
      var filterTime = filterTimeIn.getValue(i);
      
      if (currPos[i]==undefined)
        currPos[i] = pos;
        
      if (pos!=targetPos[i] || filterTime!=filterTimes[i]) {
        deltaPos[i] = undefined;
        targetPos[i] = pos;
        filterTimes[i] = filterTime;
        if (filterTimes[i]>0)
          velocity[i] = (targetPos[i]-currPos[i])/(filterTimes[i]*1000);
        else
          velocity[i] = 0;
      }
      
      if (Math.abs(velocity[i]*dt) > Math.abs(targetPos[i]-currPos[i]))
        currPos[i] = targetPos[i];
      else
        currPos[i] += velocity[i]*dt;
      
      if (deltaPos[i]!=0) {
        positionOut.setValue(i, currPos[i]);
        velocityOut.setValue(i, velocity[i]);
      }
      
      deltaPos[i] = targetPos[i] - currPos[i];
      
      lastUpdate[i] = new Date().getTime();
    }
    
    if (pinsChanged && positionOut.getSliceCount()!=maxSize) {
      targetPos.splice(maxSize);
      filterTimes.splice(maxSize);
      lastUpdate.splice(maxSize);
      currPos.splice(maxSize);
      velocity.splice(maxSize);
      deltaPos.splice(maxSize);
      positionOut.setSliceCount(maxSize);
    }
    
  }

}
VVVV.Nodes.LinearFilter.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Damper (Animation)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/


VVVV.Nodes.Damper = function(id, graph) {
  this.constructor(id, "Damper (Animation)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Cyclic Pin not implemented', 'Acceleration Out is not set yet']
  };
  
  this.auto_evaluate = true;
  
  var positionIn = this.addInputPin("Go To Position", [0.0], VVVV.PinTypes.Value);
  var filterTimeIn = this.addInputPin("FilterTime", [1.0], VVVV.PinTypes.Value);
  
  var positionOut = this.addOutputPin("Position Out", [0.0], VVVV.PinTypes.Value);
  var velocityOut = this.addOutputPin("Velocity Out", [0.0], VVVV.PinTypes.Value);
  var accelerationOut = this.addOutputPin("Acceleration Out", [0.0], VVVV.PinTypes.Value);
  
  var lastUpdate = [];
  var currPos = [];
  var velocity = [];
  var deltaPos = [];

  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    var pinsChanged = positionIn.pinIsChanged() || filterTimeIn.pinIsChanged();
    
    for (var i=0; i<maxSize; i++) {
    
      if (lastUpdate[i]==undefined)
        lastUpdate[i] = new Date().getTime();
      var dt = this.parentPatch.mainloop.deltaT; //new Date().getTime()-lastUpdate[i];
        
      var pos = positionIn.getValue(i);
      var filterTime = filterTimeIn.getValue(i);
      
      if (currPos[i]==undefined)
        currPos[i] = pos;
        
      if (filterTime>0)
        velocity[i] = (pos-currPos[i])/(filterTime*1000);
      else
        velocity[i] = 0;
      
      if (Math.abs(velocity[i]*dt) > Math.abs(pos-currPos[i]))
        currPos[i] = pos;
      else
        currPos[i] += velocity[i]*dt;
      
      if (deltaPos[i]!=0) {
        positionOut.setValue(i, currPos[i]);
        velocityOut.setValue(i, velocity[i]);
      }
      
      deltaPos[i] = pos - currPos[i];
      
      lastUpdate[i] = new Date().getTime();
    }
    
    if (pinsChanged && positionOut.getSliceCount()!=maxSize) {
      lastUpdate.splice(maxSize);
      currPos.splice(maxSize);
      velocity.splice(maxSize);
      deltaPos.splice(maxSize);
      positionOut.setSliceCount(maxSize);
    }
    
  }

}
VVVV.Nodes.Damper.prototype = new VVVV.Core.Node();

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
  
  var inputIn = this.addInputPin("Input", [0.0], VVVV.PinTypes.Value);
  var timeIn = this.addInputPin("Time", [1.0], VVVV.PinTypes.Value);
  var insertIn = this.addInputPin("Insert", [1], VVVV.PinTypes.Value);
  
  var outputOut = this.addOutputPin("Output", [0.0], VVVV.PinTypes.Value);
  
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
    
    if (insertIn.getValue(0)==1 && (pinChanged || timeIn.pinIsChanged())) {
      times.pop();
      times.unshift(now);
      for (var i=0; i<maxSize; i++) {
        if (queue[i]==undefined) {
          queue[i] = new Array(1024);
          var j = 1024;
          while (j--) {
            queue[i][j] = 0.0;
          }
        }
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
          if (outputOut.values[i]!=queue[i][j]) {
            outputOut.setValue(i, queue[i][j]);
          }
          found = true;
          break;
        }
      }
      if (!found && outputOut.values[i]!=0.0) {
        outputOut.setValue(i, 0.0);
      }
    }
    
    outputOut.setSliceCount(maxSize);
    queue.splice(maxSize);
    
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
  
  var inputIn = this.addInputPin("Input", [0.0], VVVV.PinTypes.Value);
  
  var changeOut = this.addOutputPin("OnChange", [0], VVVV.PinTypes.Value);
  
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
      changeOut.setSliceCount(maxSize);
    }
    else {
      for (var i=0; i<maxSize; i++) {
        if (changeOut.getValue(i)==1) {
          changeOut.setValue(i, 0);
          changeOut.setSliceCount(maxSize);
        }
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
  
  var inputIn = this.addInputPin("Input", [0.0], VVVV.PinTypes.Value);
  
  var upOut = this.addOutputPin("Up Edge", [0], VVVV.PinTypes.Value);
  var downOut = this.addOutputPin("Down Edge", [0], VVVV.PinTypes.Value);
  
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
    
    upOut.setSliceCount(maxSize);
    downOut.setSliceCount(maxSize);
    
    
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
  
  var setIn = this.addInputPin("Set", [0], VVVV.PinTypes.Value);
  var resetIn = this.addInputPin("Reset", [0], VVVV.PinTypes.Value);
  
  var outputOut = this.addOutputPin("Output", [0], VVVV.PinTypes.Value);
  var inverseOutputOut = this.addOutputPin("Inverse Output", [1], VVVV.PinTypes.Value);
  
  var initialized = false;
  

  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    
    var currSize = outputOut.getSliceCount();
    if (maxSize>currSize) {
      for (var i=currSize; i<maxSize; i++) {
        outputOut.setValue(i, 0);
        inverseOutputOut.setValue(i, 1);
      }
    }
    
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
    outputOut.setSliceCount(maxSize);
    inverseOutputOut.setSliceCount(maxSize);

    initialized = true;

  }

}
VVVV.Nodes.FlipFlop.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: MonoFlop (Animation)
 Author(s): woei
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.MonoFlop = function(id, graph) {
  this.constructor(id, "MonoFlop (Animation)", graph);
  
  this.meta = {
    authors: ['woei'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = true;
  
  var setIn = this.addInputPin("Set", [0], VVVV.PinTypes.Value);
  var resetIn = this.addInputPin("Reset", [0], VVVV.PinTypes.Value);
  var timeIn = this.addInputPin("Time", [0], VVVV.PinTypes.Value);
  var retrigIn = this.addInputPin("Retriggerable", [0], VVVV.PinTypes.Value);
  
  var outputOut = this.addOutputPin("Output", [0], VVVV.PinTypes.Value);
  var inverseOutputOut = this.addOutputPin("Inverse Output", [1], VVVV.PinTypes.Value);
  
  var buffer = [];

  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    
    var currSize = outputOut.getSliceCount();
    if (maxSize>currSize) {
      for (var i=currSize; i<maxSize; i++) {
        outputOut.setValue(i, 0);
        inverseOutputOut.setValue(i, 1);
      }
    }
    
    for (var i = 0; i < maxSize; i++) {
      if (buffer[i] == undefined)
        buffer[i] = 0.0;
      if (outputOut.getValue(i) == undefined)
        outputOut.setValue(i,0);

      if (outputOut.getValue(i) == 1) {
        buffer[i] += this.parentPatch.mainloop.deltaT/1000.0;
        
        if ((setIn.getValue(i) == 1) && (retrigIn.getValue(i) == 1)) {
          buffer[i] = 0;
        }
        
        if (buffer[i] >= timeIn.getValue(i) || (resetIn.getValue(i) == 1)) {
          buffer[i] = 0.0;
          outputOut.setValue(i, 0);
          inverseOutputOut.setValue(i, 1);
        }
      }
      else if (setIn.getValue(i) == 1) {
        outputOut.setValue(i, 1);
        inverseOutputOut.setValue(i, 0);
      }
    }
    outputOut.setSliceCount(maxSize);
    inverseOutputOut.setSliceCount(maxSize);
    buffer.splice(maxSize);
  }

}
VVVV.Nodes.MonoFlop.prototype = new VVVV.Core.Node();

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
    compatibility_issues: ['different output slice count in pure VVVV, if Set pin has only one slice']
  };
  
  var inputIn = this.addInputPin("Input", [0.0], VVVV.PinTypes.Value);
  var setIn = this.addInputPin("Set", [0], VVVV.PinTypes.Value);
  
  var outputOut = this.addOutputPin("Output", [0.0], VVVV.PinTypes.Value);
  

  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    
    if (setIn.pinIsChanged() || inputIn.pinIsChanged()) {
      for (var i=0; i<maxSize; i++) {
        if (outputOut.values[i]==undefined) {
          outputOut.setValue(i, 0.0);
        }
        if (Math.round(setIn.getValue(i))>=1) {
          outputOut.setValue(i, inputIn.getValue(i));
        }
      }
      outputOut.setSliceCount(maxSize);
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
  this.auto_evaluate = true;
  
  var input1In = this.addInputPin("Input 1", [0.0], VVVV.PinTypes.Value);
  var default1In = this.addInputPin("Default 1", [0.0], VVVV.PinTypes.Value);
  var initIn = this.addInputPin("Initialize", [0], VVVV.PinTypes.Value);
  
  var output1Out = this.addOutputPin("Output 1", [0.0], VVVV.PinTypes.Value);
  var buf = [];

  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      if (initIn.getValue(i)>0.5 || buf[i]==undefined)
        output1Out.setValue(i, default1In.getValue(i));
      else
        output1Out.setValue(i, buf[i]);
    }
    
    for (var i=0; i<maxSize; i++) {
      buf[i] = input1In.getValue(i);
    }
    
    output1Out.setSliceCount(maxSize);
    
  }

}
VVVV.Nodes.FrameDelay.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Toggle (Animation)
 Author(s): David Mórász (micro.D)
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Toggle = function(id, graph) {
  this.constructor(id, "Toggle (Animation)", graph);
  
  this.meta = {
    authors: ['David Mórász (micro.D)'],
    original_authors: ['VVVV Group'],
    credits: ['Matthias Zauner'],
    compatibility_issues: []
  };
  
  this.auto_evaluate = true;
  
  var inputIn = this.addInputPin("Input", [0], VVVV.PinTypes.Value);
  var resetIn = this.addInputPin("Reset", [0], VVVV.PinTypes.Value);
  
  var outputOut = this.addOutputPin("Output", [0], VVVV.PinTypes.Value);
  var inverseOutputOut = this.addOutputPin("Inverse Output", [1], VVVV.PinTypes.Value);
  
  var initialized = false;
  

  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    
    var currSize = outputOut.getSliceCount();
    if (maxSize>currSize) {
      for (var i=currSize; i<maxSize; i++) {
        outputOut.setValue(i, 0);
        inverseOutputOut.setValue(i, 1);
      }
    }
    
    for (var i=0; i<maxSize; i++) {
      var result = undefined;
      if (Math.round(resetIn.getValue(i))>=1)
        result = 0;
      if (Math.round(inputIn.getValue(i))>=1)
        result = 1 - outputOut.getValue(i);
      if (result!=undefined && outputOut.getValue(i)!=result) {
        outputOut.setValue(i, result);
        inverseOutputOut.setValue(i, 1-result);
      }
      else if (!initialized) {
        outputOut.setValue(i, 0);
        inverseOutputOut.setValue(i, 1);
      }
    }
    
    outputOut.setSliceCount(maxSize);
    inverseOutputOut.setSliceCount(maxSize);
    
    initialized = true;

  }

}
VVVV.Nodes.Toggle.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Counter (Animation)
 Author(s): David Mórász (micro.D)
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Counter = function(id, graph) {
  this.constructor(id, "Counter (Animation)", graph);
  
  this.meta = {
    authors: ['David Mórász (micro.D)', 'Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = true;
  
  var upIn = this.addInputPin("Up", [0], VVVV.PinTypes.Value);
  var downIn = this.addInputPin("Down", [0], VVVV.PinTypes.Value);
  var minIn = this.addInputPin("Minimum", [0], VVVV.PinTypes.Value);
  var maxIn = this.addInputPin("Maximum", [15], VVVV.PinTypes.Value);
  var incrIn = this.addInputPin("Increment", [1], VVVV.PinTypes.Value);
  var defaultIn = this.addInputPin("Default", [0], VVVV.PinTypes.Value);
  var resetIn = this.addInputPin("Reset", [0], VVVV.PinTypes.Value);
  var modeIn = this.addInputPin("Mode", ['Wrap'], VVVV.PinTypes.Enum);
  modeIn.enumOptions = ["Wrap", "Unlimited", "Clamp"];
  
  var outputOut = this.addOutputPin("Output", [0.0], VVVV.PinTypes.Value);
  var uflowOut = this.addOutputPin("Underflow", [0.0], VVVV.PinTypes.Value);
  var oflowOut = this.addOutputPin("Overflow", [0.0], VVVV.PinTypes.Value);
  
  var initialized = false;
  
  this.evaluate = function() { 
    var maxSize = this.getMaxInputSliceCount();
    
    var doCount = minIn.pinIsChanged() || maxIn.pinIsChanged() || defaultIn.pinIsChanged() || resetIn.pinIsChanged() || modeIn.pinIsChanged();
    for (var i=0; i<maxSize; i++) {
      if (oflowOut.getValue(i)==1 || !initialized)
        oflowOut.setValue(i, 0);
      if (uflowOut.getValue(i)==1 || !initialized)
        uflowOut.setValue(i, 0);
      if (!initialized)
        outputOut.setValue(i, 0);
      doCount = doCount || upIn.getValue(i)>=.5 || downIn.getValue(i)>=.5;
    }

    if(doCount)
    {
      for(var i=0; i<maxSize; i++) {
        var incr = incrIn.getValue(i);
        var output = i>=outputOut.getSliceCount() ? 0.0 : outputOut.getValue(i);
        var max = maxIn.getValue(i);
        var min = minIn.getValue(i);
      
        var mode = 0;
        if(modeIn.getValue(i)=='Unlimited') mode=1;
        if(modeIn.getValue(i)=='Clamp') mode=2;
        switch(mode) {
          case 1:
            if(upIn.getValue(i)>=.5) {
              output = output + incr;
            }
            if(downIn.getValue(i)>=.5) {
              output = output - incr;
            }
          break;
          case 2:
            if(upIn.getValue(i)>=.5) {
              output = output + incr;
            }
            if(downIn.getValue(i)>=.5) {
              output = output - incr;
            }
            if(output>max) {
              output =  max;
              oflowOut.setValue(i, 1);
            }
            if(output<min) {
              output =  min;
              uflowOut.setValue(i, 1);
            }
          break;
          default:
            if(upIn.getValue(i)>=.5) {
              output =  output + incr;
            }
            if(downIn.getValue(i)>=.5) {
              output =  output - incr;
            }
            if(output>max) {
              output =  min;
              oflowOut.setValue(i, 1);
            }
            if(output<min) {
              output =  max;
              uflowOut.setValue(i, 1);
            }
        }
        if (outputOut.getValue(i)!=output)
          outputOut.setValue(i, output);
        if(resetIn.getValue(i)>=.5) outputOut.setValue(i, defaultIn.getValue(i));
      }
      outputOut.setSliceCount(maxSize);
      uflowOut.setSliceCount(maxSize);
      oflowOut.setSliceCount(maxSize);
    }
    initialized = true;
  }
}
VVVV.Nodes.Counter.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Counter (Animation)
 Author(s): Lukas Winter
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.ADSR = function(id, graph) {
  this.constructor(id, "ADSR (Animation)", graph);
  
  this.meta = {
    authors: ['Lukas Winter'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = true;
  
  var inputIn = this.addInputPin("Input", [0], VVVV.PinTypes.Value);
  var attackTimeIn = this.addInputPin("Attack Time", [0.1], VVVV.PinTypes.Value);
  var decayTimeIn = this.addInputPin("Decay Time", [0.1], VVVV.PinTypes.Value);
  var sustainLevelIn = this.addInputPin("Sustain Level", [0.5], VVVV.PinTypes.Value);
  var releaseTimeIn = this.addInputPin("Release Time", [0.5], VVVV.PinTypes.Value);
  
  var outputOut = this.addOutputPin("Output", [0], VVVV.PinTypes.Value);
  
  //create a little state machine for each slice
  var phase = ['idle'];
  var tOld = new Date().getTime();
  var inputValues = [0];
  var oldInputValues = [0];
  
  this.evaluate = function() { 
    var maxSize = this.getMaxInputSliceCount();
    var t = new Date().getTime();
    var dt = t - tOld;
    inputValues = inputIn.getValue(0, maxSize);
    if(!inputValues.length) inputValues = [inputValues];
    outputOut.setSliceCount(maxSize);
    
    for(var i = 0; i < maxSize; i++)
    {
      if(inputValues[i] > 0.5 && oldInputValues[i] < 0.5)
        phase[i] = 'attack';
      var held = inputValues[i];
      var level = outputOut.getValue(i);
      var attackTime = attackTimeIn.getValue(i) * 1000;
      var decayTime = decayTimeIn.getValue(i) * 1000;
      var sustainLevel = sustainLevelIn.getValue(i);
      var releaseTime = releaseTimeIn.getValue(i) * 1000;
      
      //console.log(inputValues[i], phase[i]);
      switch(phase[i])
      {
        case 'attack':
        {
          level += dt / attackTime;
          if(level >= 1)
          {
            level = 1;
            phase[i] = held ? 'decay' : 'release';
          }
        }
        break;
        case 'decay':
        {
          level -= dt / decayTime;
          if(!held)
          {
            phase[i] = 'release';
          }
          else if(level <= sustainLevel)
          {
            level = sustainLevel;
            phase[i] = 'sustain';
          }
        }
        break;
        case 'sustain':
        {
          if(!held)
            phase[i] = 'release';
        }
        break;
        case 'release':
        {
          level -= dt / releaseTime * sustainLevel;
          if(level <= 0)
          {
            level = 0;
            phase[i] = 'idle';
          }
        }
        break;
      }
      outputOut.setValue(i, level);
    }
    
    tOld = t;
    oldInputValues = inputValues;
  }
}
VVVV.Nodes.ADSR.prototype = new VVVV.Core.Node();

}(vvvvjs_jquery));
