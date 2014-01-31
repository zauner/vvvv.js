// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: LFO (Animation)
 Author(s): Matthias Zauner, sebl
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.LFO = function(id, graph) {
  this.constructor(id, "LFO (Animation)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner, sebl'],
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
  var CyclesOut = this.addOutputPin("Cycles", [0], VVVV.PinTypes.Value);
  
  var current = [];
  var cycles = [];
  
  var dt = new Date().getTime();
  var lastUpdate = new Date().getTime();

  this.evaluate = function() {
  
    var maxSize = this.getMaxInputSliceCount();
    
    dt = new Date().getTime()-lastUpdate;

    for (var i=0; i<maxSize; i++) {

      var period = PeriodIn.getValue(i % PeriodIn.values.length);
      var paused = PauseIn.getValue(i % PauseIn.values.length);
      var reverse = ReverseIn.getValue(i % ReverseIn.values.length);
      var reset = ResetIn.getValue(i % ResetIn.values.length);
      var phase = PhaseIn.getValue(i % PhaseIn.values.length);

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
        }

        if (current[i]>1){
          cycles[i] += Math.floor(current[i]);
        }
      }

      lastUpdate = new Date().getTime();

      if (reset>=0.5){
        current[i] = 0.0;
        cycles[i] = 0;
      }

      if (paused<0.5 || reset>=0.5) { 
        outputOut.setValue(i, (current[i]+phase)%1);
        CyclesOut.setValue(i, cycles[i]);
      }

      current[i] = current[i] %1;
    }
    outputOut.setSliceCount(maxSize);
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
    compatibility_issues: ['Sometimes doesnt stop when target reached', 'Cyclic Pin not implemented', 'Acceleration and Velocitity Out are not set yet']
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
  var direction = [];
  
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
        direction[i] = sign(targetPos-currPos[i]);
        if (filterTime>0)
          velocity[i] = (targetPos-currPos[i])/(filterTime*1000);
        else
          velocity[i] = 0;
      }
      
      if (direction[i] == sign(targetPos-currPos[i]))
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
    
    if (pinsChanged && positionOut.getSliceCount()!=maxSize) {
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
  
  var input1In = this.addInputPin("Input 1", [0.0], VVVV.PinTypes.Value);
  var default1In = this.addInputPin("Default 1", [0.0], VVVV.PinTypes.Value);
  var initIn = this.addInputPin("Initialize", [0], VVVV.PinTypes.Value);
  
  var output1Out = this.addOutputPin("Output 1", [0.0], VVVV.PinTypes.Value);
  

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
        result = 1 - parseFloat(outputOut.getValue(i));
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
  var modeIn = this.addInputPin("Mode", ['Wrap'], VVVV.PinTypes.Value);
  
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
        var incr = parseFloat(incrIn.getValue(i));
        var output = i>=outputOut.getSliceCount() ? 0.0 : parseFloat(outputOut.getValue(i));
        var max = parseFloat(maxIn.getValue(i));
        var min = parseFloat(minIn.getValue(i));
      
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
