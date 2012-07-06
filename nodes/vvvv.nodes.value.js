// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Add (Value)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AddValue = function(id, graph) {
  this.constructor(id, "Add (Value)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['']
  };
  
  var cntCfg = this.addInvisiblePin("Input Count",[2.0],this); 
  var inputPins = []; 
  var outPin;
  
  this.initialize = function() {
  	outPin = this.addOutputPin("Output", [0.0], this);
  	
  	var incnt = cntCfg.getValue(0);
  	for (var i = 0; i < incnt; i++)
  	{
  		var InPin = this.addInputPin("Input " + (i+1),[0.0],this);
  		inputPins[i] = InPin;
  	}
  }
  

  this.evaluate = function() 
  {
  	var maxSpreadSize = this.getMaxInputSliceCount();
  	
  	outPin.setSliceCount(maxSpreadSize);
	
    for (var i=0; i<maxSpreadSize; i++) 
  	{
  		var o = parseFloat(inputPins[0].getValue(i));
  		for (var j=1; j < inputPins.length;j++)
  		{
  			o += parseFloat(inputPins[j].getValue(i));
  		}
      outPin.setValue(i,o);
    }  
  }

}
VVVV.Nodes.AddValue.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Subtract (Value)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SubtractValue = function(id, graph) {
  this.constructor(id, "Subtract (Value)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['']
  };
  
  var cntCfg = this.addInvisiblePin("Input Count",[2.0],this); 
  var inputPins = []; 
  var outPin;
  
  this.initialize = function() {
  	outPin = this.addOutputPin("Output", [0.0], this);
  	
  	var incnt = cntCfg.getValue(0);
  	for (var i = 0; i < incnt; i++)
  	{
  		var InPin = this.addInputPin("Input " + (i+1),[0.0],this);
  		inputPins[i] = InPin;
  	}
  }
  

  this.evaluate = function() 
  {
  	var maxSpreadSize = this.getMaxInputSliceCount();
  	
  	outPin.setSliceCount(maxSpreadSize);
  	
    for (var i=0; i<maxSpreadSize; i++) 
  	{
  		var o = parseFloat(inputPins[0].getValue(i));
  		for (var j=1; j < inputPins.length;j++)
  		{
  			o -= parseFloat(inputPins[j].getValue(i));
  		}
      outPin.setValue(i,o);
    }  
  }

}
VVVV.Nodes.SubtractValue.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: EQ (Value)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.EqValue = function(id, graph) {
  this.constructor(id, "EQ (Value)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner', 'Fibo'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var input1In = this.addInputPin("Input 1", [0.0], this);
  var input2In = this.addInputPin("Input 2", [0.0], this);
  var epsilonIn = this.addInputPin("Epsilon", [0.0], this);
  
  var outputOut = this.addOutputPin("Output", [0.0], this);
  var invOutputOut = this.addOutputPin("Inverse Output", [0.0], this);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      var result = 0;
      if (Math.abs(input1In.getValue(i)-input2In.getValue(i))<=Math.abs(epsilonIn.getValue(i)))
        result = 1;
      outputOut.setValue(i, result);
      invOutputOut.setValue(i, 1-result);
    }
    outputOut.setSliceCount(maxSize);
    invOutputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.EqValue.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: GT (Value)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GtValue = function(id, graph) {
  this.constructor(id, "GT (Value)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['No dynamic pin count yet']
  };
  
  var input1In = this.addInputPin("Input 1", [0.0], this);
  var input2In = this.addInputPin("Input 2", [0.0], this);
  
  var outputOut = this.addOutputPin("Output", [0.0], this);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      var result = 0;
      if (parseFloat(input1In.getValue(i))>parseFloat(input2In.getValue(i)))
        result = 1;
      outputOut.setValue(i, result);
    }
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.GtValue.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: LT (Value)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.LtValue = function(id, graph) {
  this.constructor(id, "LT (Value)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['No dynamic pin count yet']
  };
  
  var input1In = this.addInputPin("Input 1", [0.0], this);
  var input2In = this.addInputPin("Input 2", [0.0], this);
  
  var outputOut = this.addOutputPin("Output", [0.0], this);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      var result = 0;
      if (parseFloat(input1In.getValue(i))<parseFloat(input2In.getValue(i)))
        result = 1;
      outputOut.setValue(i, result);
    }
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.LtValue.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Multiply (Value)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.MultiplyValue = function(id, graph) {
  this.constructor(id, "Multiply (Value)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['']
  };
  
  var cntCfg = this.addInvisiblePin("Input Count",[2.0],this); 
  var inputPins = []; 
  var outPin;
  
  this.initialize = function() {
  	outPin = this.addOutputPin("Output", [0.0], this);
  	
  	var incnt = cntCfg.getValue(0);
  	for (var i = 0; i < incnt; i++)
  	{
  		var InPin = this.addInputPin("Input " + (i+1),[0.0],this);
  		inputPins[i] = InPin;
  	}
  }
  

  this.evaluate = function() 
  {
  	var maxSpreadSize = this.getMaxInputSliceCount();
  	
  	outPin.setSliceCount(maxSpreadSize);
  	
    for (var i=0; i<maxSpreadSize; i++) 
  	{
  		var o = parseFloat(inputPins[0].getValue(i));
  		for (var j=1; j < inputPins.length;j++)
  		{
  			o *= parseFloat(inputPins[j].getValue(i));
  		}
      outPin.setValue(i,o);
    } 
  }

}
VVVV.Nodes.MultiplyValue.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Divide (Value)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.DivideValue = function(id, graph) {
  this.constructor(id, "Divide (Value)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var inputCfg = this.addInvisiblePin("Inputs Count",[2.0],this);
  var input1In = this.addInputPin("Input", [0.0], this);
  var input2In = this.addInputPin("Input 2", [0.0], this);
  
  var outputOut = this.addOutputPin("Output", [0.0], this);
  
  
  this.initialize = function() {
	
    
  }

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSize; i++) {
      outputOut.setValue(i, input1In.getValue(i)/input2In.getValue(i));
    }
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.DivideValue.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: IOBox (Value Advanced)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.IOBoxValueAdvanced = function(id, graph) {
  this.constructor(id, "IOBox (Value Advanced)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.addInputPin("SliceOffset", [0], this);
  this.addInputPin("X Input Value", [0.0], this);
  this.addInputPin("Y Input Value", [0.0], this);
  this.addInvisiblePin("Rows",[1.0],this);
  
  this.addOutputPin("X Output Value", [0.0], this);
  this.addOutputPin("Y Output Value", [0.0], this);

  this.evaluate = function() {
    if (this.inputPins["Y Input Value"].pinIsChanged()) {
      for (var i=0; i<this.inputPins["Y Input Value"].values.length; i++) {
        this.outputPins["Y Output Value"].setValue(i, parseFloat(this.inputPins["Y Input Value"].values[i]));
      }
      this.outputPins["Y Output Value"].setSliceCount(this.inputPins["Y Input Value"].getSliceCount());
    }
    
    if (this.inputPins["X Input Value"].pinIsChanged()) {
      for (var i=0; i<this.inputPins["X Input Value"].values.length; i++) {
        this.outputPins["X Output Value"].setValue(i, parseFloat(this.inputPins["X Input Value"].values[i]));
      }
      this.outputPins["X Output Value"].setSliceCount(this.inputPins["X Input Value"].getSliceCount());
    }
  }

}
VVVV.Nodes.IOBoxValueAdvanced.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Count (Value)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/


VVVV.Nodes.CountValue = function(id, graph) {
  this.constructor(id, "Count (Value)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.addInputPin("Input", [0.0], this);
  
  this.addOutputPin("Count", [1.0], this);
  this.addOutputPin("High", [0.0], this);

  this.evaluate = function() {
    if (this.inputPins["Input"].pinIsChanged()) {
      this.outputPins["Count"].setValue(0, this.inputPins["Input"].values.length);
      this.outputPins["High"].setValue(0, this.inputPins["Input"].values.length-1);
    }
  }

}
VVVV.Nodes.CountValue.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Switch (Value Input)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SwitchValueInput = function(id, graph) {
  this.constructor(id, "Switch (Value Input)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['No dynamic pin count yet']
  };
  
  var switchIn = this.addInputPin("Switch", [0], this);
  var inputIn = []
  inputIn[0] = this.addInputPin("Input 1", [0.0], this);
  inputIn[1] = this.addInputPin("Input 2", [0.0], this);
  
  var outputOut = this.addOutputPin("Output", [0.0], this);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    if (switchIn.getValue(0)==undefined) {
      outputOut.setValue(0, undefined);
      return;
    }
    for (var i=0; i<maxSize; i++) {
      outputOut.setValue(i, inputIn[Math.round(switchIn.getValue(i))%inputIn.length].getValue(i));
    }
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.SwitchValueInput.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Select (Value)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SelectValue = function(id, graph) {
  this.constructor(id, "Select (Value)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var inputIn = this.addInputPin("Input", [0.0], this);
  var selectIn = this.addInputPin("Select", [1], this);
  
  var outputOut = this.addOutputPin("Output", [0.0], this);
  var formerSliceOut = this.addOutputPin("Former Slice", [0], this);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    var outputIndex = 0;
    for (var i=0; i<maxSize; i++) {
      for (var j=0; j<selectIn.getValue(i); j++) {
        outputOut.setValue(outputIndex, inputIn.getValue(i));
        formerSliceOut.setValue(outputIndex, i);
        outputIndex++;
      }
    }
    outputOut.setSliceCount(outputIndex);
    formerSliceOut.setSliceCount(outputIndex);
  }

}
VVVV.Nodes.SelectValue.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: AsString (Value)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AsString = function(id, graph) {
  this.constructor(id, "AsString (Value)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['SubType not implemented, always returns float formatting']
  };
  
  var inputIn = this.addInputPin("Input", [0.0], this);
  var subtypeIn = this.addInputPin("SubType", [''], this);
  
  var outputOut = this.addOutputPin("Output", [0.0], this);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSize; i++) {
      outputOut.setValue(i, parseFloat(inputIn.getValue(i)).toFixed(4));
    }
    outputOut.setSliceCount(maxSize);

  }

}
VVVV.Nodes.AsString.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Frac (Value)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Frac = function(id, graph) {
  this.constructor(id, "Frac (Value)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var inputIn = this.addInputPin("Input", [0.0], this);
  
  var wholeOut = this.addOutputPin("Whole Part", [0], this);
  var realOut = this.addOutputPin("Real Part", [0.5], this);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      var inValue = parseFloat(inputIn.getValue(i));
      wholeOut.setValue(i, Math.floor(inValue));
      realOut.setValue(i, inValue - Math.floor(inValue));
    }
    wholeOut.setSliceCount(maxSize);
    realOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.Frac.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Add (Value Spectral)
 Author(s): David Mórász (micro.D), Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AddValueSpectral = function(id, graph) {
  this.constructor(id, "Add (Value Spectral)", graph);
  
  this.meta = {
    authors: ['David Mórász (micro.D)', 'Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.addInputPin("Input", [0.0], this);
  this.addInputPin("Bin Size", [-1], this);
  
  this.addOutputPin("Output", [0.0], this);

  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();
    
    var binNum = 0;
    var subIndex = 0;
    for (var j=0; j<maxSpreadSize || (this.inputPins["Bin Size"].getValue(0)>0 && (subIndex>0 || binNum%this.inputPins["Bin Size"].values.length!=0)); j++) {
      if (subIndex == 0)
        var sum = 0;
        
      sum += parseFloat(this.inputPins["Input"].getValue(j));
      
      subIndex++;
      if (this.inputPins["Bin Size"].getValue(0)>0) {
        if (subIndex>=this.inputPins["Bin Size"].getValue(binNum)) {
          this.outputPins["Output"].setValue(binNum, sum);
          binNum++;
          subIndex = 0;
        }
      }
      else
        this.outputPins["Output"].setValue(0, sum);
    }
    this.outputPins["Output"].setSliceCount(binNum+(subIndex>0));
  }
}
VVVV.Nodes.AddValueSpectral.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: WaveShaper (Value)
 Author(s): 'sebl'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.WaveShaperValue = function(id, graph) {
  this.constructor(id, "WaveShaper (Value)", graph);
  
  this.meta = {
    authors: ['sebl'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  // input pins
  var inputIn = this.addInputPin('Input', [0], this);
  var shapeIn = this.addInputPin('Shape',["Linear"], this);

  // output pins
  var outputOut = this.addOutputPin('Output', [0], this);

  // initialize() will be called after node creation
  this.initialize = function() {   
  }

  // evaluate() will be called each frame
  // (if the input pins have changed, or the nodes is flagged as auto-evaluating)
  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    var twoPi = 6.28318530717959;
    
    for (var i=0; i<maxSize; i++) {
      var input = inputIn.getValue(i);
      var shape = shapeIn.getValue(i);

      switch (shape) {
        case 'Linear':
        //Linear code here
        outputOut.setValue(i, input);
        break;
        
        case 'Inverse':
        //Inverse code here
        outputOut.setValue(i, 1 - input);
        break;
        
        case 'Triangle':
        //Triangle code here
        if(input < 0.5){
          outputOut.setValue(i, input * 2 );
        }else{
          outputOut.setValue(i, (1 - input )* 2 );
        }
        break;
      
        case 'Sine':
        //Sine code here
        //outputOut.setValue(i, input * Math.sin(input * Pi));
        inp = (( input + 0.25 ) % 1 ) * twoPi;
        outputOut.setValue(i, (Math.sin(inp) / 2) + 0.5);
        break;
        
        case 'Rectangle':
        //Rectangle code here
        if(input < 0.5){
        outputOut.setValue(i, 0);
        }else{
        outputOut.setValue(i, 1);
        }  
        break;
      
      }
      
    }
    
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.WaveShaperValue.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Map (Value)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.MapValue = function(id, graph) {
  this.constructor(id, "Map (Value)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Mirror Mapping Mode not implemented']
  };
  
  this.auto_evaluate = false;
  
  // input pins
  var inputIn = this.addInputPin('Input', [0.5], this);
  var srcMinimumIn = this.addInputPin('Source Minimum', [0], this);
  var srcMaximumIn = this.addInputPin('Source Maximum', [1], this);
  var destMinimumIn = this.addInputPin('Destination Minimum', [0], this);
  var destMaximumIn = this.addInputPin('Destination Maximum', [1], this);
  var mappingIn = this.addInputPin('Mapping', ['Float'], this);

  // output pins
  var outputOut = this.addOutputPin('Output', [0.5], this);

  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      var input = parseFloat(inputIn.getValue(i));
      var srcMin = parseFloat(srcMinimumIn.getValue(i));
      var srcMax = parseFloat(srcMaximumIn.getValue(i));
      var destMin = parseFloat(destMinimumIn.getValue(i));
      var destMax = parseFloat(destMaximumIn.getValue(i));
      var mapping = mappingIn.getValue(i);
      
      input = input - srcMin;
      srcMax = srcMax - srcMin;
      
      switch (mapping) {
        case "Clamp":
          input = Math.max(0, Math.min(srcMax, input));
        break;
        case "Wrap":
          input = (srcMax + input % srcMax) % srcMax;
        break;
        case "Mirror":
          // to be implemented
        break;
      }
      
      var k = (destMax - destMin) / srcMax;
      
      outputOut.setValue(i, input * k + destMin);
    }
    
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.MapValue.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Min (Value)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.MinValue = function(id, graph) {
  this.constructor(id, "Min (Value)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;

  // output pins
  var outputOut = this.addOutputPin('Output', [0], this);

  // invisible pins
  var inputcountIn = this.addInvisiblePin('Input Count', [0.0], this);
  
  var inputPins = [];
  
  // initialize() will be called after node creation
  this.initialize = function() {
    var inputCount = Math.max(2, inputcountIn.getValue(0));
    var currentCount = inputPins.length;
    for (var i=currentCount; i<inputCount; i++) {
      inputPins[i] = this.addInputPin('Input '+(i+1), [0.0], this);
    }
    inputPins.length = inputCount;
  }

  this.evaluate = function() {
    if (inputcountIn.pinIsChanged())
      this.initialize();
    
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      var min = undefined;
      for (var j=0; j<inputPins.length; j++) {
        if (min == undefined || inputPins[j].getValue(i) < min)
          min = inputPins[j].getValue(i);
      }
      
      outputOut.setValue(i, min);
    }
    
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.MinValue.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Max (Value)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.MaxValue = function(id, graph) {
  this.constructor(id, "Max (Value)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;

  // output pins
  var outputOut = this.addOutputPin('Output', [0], this);

  // invisible pins
  var inputcountIn = this.addInvisiblePin('Input Count', [0.0], this);
  
  var inputPins = [];
  
  // initialize() will be called after node creation
  this.initialize = function() {
    var inputCount = Math.max(2, inputcountIn.getValue(0));
    var currentCount = inputPins.length;
    for (var i=currentCount; i<inputCount; i++) {
      inputPins[i] = this.addInputPin('Input '+(i+1), [0.0], this);
    }
    inputPins.length = inputCount;
  }

  this.evaluate = function() {
    if (inputcountIn.pinIsChanged())
      this.initialize();
    
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      var max = undefined;
      for (var j=0; j<inputPins.length; j++) {
        if (max == undefined || inputPins[j].getValue(i) > max)
          max = inputPins[j].getValue(i);
      }
      
      outputOut.setValue(i, max);
    }
    
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.MaxValue.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Mod (Value)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.ModValue = function(id, graph) {
  this.constructor(id, "Mod (Value)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;

  // output pins
  var outputOut = this.addOutputPin('Output', [0], this);

  // invisible pins
  var inputcountIn = this.addInvisiblePin('Input Count', [0.0], this);
  
  var inputPins = [];
  
  // initialize() will be called after node creation
  this.initialize = function() {
    var inputCount = Math.max(2, inputcountIn.getValue(0));
    var currentCount = inputPins.length;
    for (var i=currentCount; i<inputCount; i++) {
      inputPins[i] = this.addInputPin('Input '+(i+1), [0.0], this);
    }
    inputPins.length = inputCount;
  }

  this.evaluate = function() {
    if (inputcountIn.pinIsChanged())
      this.initialize();
    
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      var result = inputPins[0].getValue(i);
      for (var j=1; j<inputPins.length; j++) {
        if (inputPins[j].getValue(i)==0)
          result = 0.0;
        else
          result = result % inputPins[j].getValue(i);
      }
      
      outputOut.setValue(i, result);
    }
    
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.ModValue.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Power (Value)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.PowerValue = function(id, graph) {
  this.constructor(id, "Power (Value)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;

  // output pins
  var outputOut = this.addOutputPin('Output', [0], this);

  // invisible pins
  var inputcountIn = this.addInvisiblePin('Input Count', [0.0], this);
  
  var inputPins = [];
  
  // initialize() will be called after node creation
  this.initialize = function() {
    var inputCount = Math.max(2, inputcountIn.getValue(0));
    var currentCount = inputPins.length;
    for (var i=currentCount; i<inputCount; i++) {
      inputPins[i] = this.addInputPin('Input '+(i+1), [1.0], this);
    }
    inputPins.length = inputCount;
  }

  this.evaluate = function() {
    if (inputcountIn.pinIsChanged())
      this.initialize();
    
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      var result = inputPins[0].getValue(i);
      for (var j=1; j<inputPins.length; j++) {
        result = Math.pow(result, inputPins[j].getValue(i));
      }
      
      outputOut.setValue(i, result);
    }
    
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.PowerValue.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Random (Value)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.RandomValue = function(id, graph) {
  this.constructor(id, "Random (Value)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = true;
  
  // input pins
  var enabledIn = this.addInputPin('Enabled', [1], this);
  var isintegerIn = this.addInputPin('Is Integer', [0], this);
  var scaleIn = this.addInputPin('Scale', [1], this);
  var preventfromdoublesIn = this.addInputPin('Prevent from doubles', [1], this);

  // output pins
  var outputOut = this.addOutputPin('Output', [0], this);
  
  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      var enabled = enabledIn.getValue(i);
      var isinteger = isintegerIn.getValue(i);
      var scale = scaleIn.getValue(i);
      var preventfromdoubles = preventfromdoublesIn.getValue(i);
      
      var current = outputOut.values[i];
      if (current==undefined)
        outputOut.setValue(i, 0.0);

      if (enabled>=0.5) {
        var current = outputOut.values[i];
        do {
          var r = Math.random() * scale;
          if (isinteger>=0.5)
            r = Math.round(r);
        }
        while (preventfromdoubles>=0.5 && r==current);
        
        outputOut.setValue(i, r);
      }
    }

    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.RandomValue.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Sign (Value)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SignValue = function(id, graph) {
  this.constructor(id, "Sign (Value)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  // input pins
  var inputIn = this.addInputPin('Input', [0], this);

  // output pins
  var signpartOut = this.addOutputPin('Sign Part', [0], this);
  var absolutepartOut = this.addOutputPin('Absolute Part', [0], this);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      var input = inputIn.getValue(i);
      
      signpartOut.setValue(i, input == 0 ? 0.0 : input / Math.abs(input));
      absolutepartOut.setValue(i, Math.abs(input));
    }
    
    absolutepartOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.SignValue.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: InputMorph (Value)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.InputMorphValue = function(id, graph) {
  this.constructor(id, "InputMorph (Value)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  var switchIn = this.addInputPin('Switch', [0], this);

  // output pins
  var outputOut = this.addOutputPin('Output', [0], this);

  // invisible pins
  var inputcountIn = this.addInvisiblePin('Input Count', [0.0], this);
  
  var inputPins = [];
  
  this.initialize = function() {
    var inputCount = Math.max(2, inputcountIn.getValue(0));
    var currentCount = inputPins.length;
    for (var i=currentCount; i<inputCount; i++) {
      inputPins[i] = this.addInputPin('Input '+(i+1), [0.0], this);
    }
    inputPins.length = inputCount;
  }

  this.evaluate = function() {
    if (inputcountIn.pinIsChanged())
      this.initialize();
    
    var maxSize = this.getMaxInputSliceCount();
    
    var s;
    var inp1;
    var inp2;
    var v;
    for (var i=0; i<maxSize; i++) {
      s = switchIn.getValue(i);
      inp1 = ((Math.floor(s) + inputPins.length) % inputPins.length + inputPins.length) % inputPins.length;
      inp2 = ((Math.ceil(s) + inputPins.length) % inputPins.length + inputPins.length) % inputPins.length;
      v = s - Math.floor(s);
      
      outputOut.setValue(i, (1-v) * inputPins[inp1].getValue(i) + v * inputPins[inp2].getValue(i));
    }
    
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.InputMorphValue.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Sift (Value)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Sift = function(id, graph) {
  this.constructor(id, "Sift (Value)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  // input pins
  var inputIn = this.addInputPin('Input', [0.0], this);
  var filterIn = this.addInputPin('Filter', [0.0], this);
  var epsilonIn = this.addInputPin('Epsilon', [0.0], this);
  var findModeIn = this.addInputPin('Find', ['First'], this);

  // output pins
  var hitsOut = this.addOutputPin('Hits', [0], this);
  var inputindexOut = this.addOutputPin('Input Index', [0], this);
  var filterindexOut = this.addOutputPin('Filter Index', [0], this);

  this.evaluate = function() {
    
    var maxSize = this.getMaxInputSliceCount();
    
    var inputCount = inputIn.getSliceCount();
    var filterCount = filterIn.getSliceCount();
    hitsOut.setSliceCount(inputCount);
    
    var epsilon = epsilonIn.getValue(0);
    var findMode = findModeIn.getValue(0);
    
    var alreadySearched = {};
    
    var hitIdx = 0;
    
    for (var i=0; i<inputCount; i++) {
      
      var inpSlice = i;
      if (findMode=='Last')
        inpSlice = inputCount - i - 1;
      
      var input = inputIn.getValue(inpSlice);
      if (findMode != 'All') {
        if (alreadySearched[input]) {
          hitsOut.setValue(inpSlice, 0);
          continue;
        }
        alreadySearched[input] = true;
      }
      
      var hits = 0;
      for (var j=0; j<filterCount; j++) {
        filter = filterIn.getValue(j);
        if (filter==input) {
          inputindexOut.setValue(hitIdx, inpSlice);
          filterindexOut.setValue(hitIdx, j);
          hitIdx++;
          hits++;
          break;
        }
      }
      hitsOut.setValue(inpSlice, hits);
    }
    inputindexOut.setSliceCount(hitIdx);
    filterindexOut.setSliceCount(hitIdx);
    
  }

}
VVVV.Nodes.Sift.prototype = new VVVV.Core.Node();

