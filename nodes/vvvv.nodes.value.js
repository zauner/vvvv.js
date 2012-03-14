// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.


VVVV.Nodes = {}

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
