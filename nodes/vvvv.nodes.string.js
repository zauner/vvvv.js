// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: IOBox (String)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.IOBoxString = function(id, graph) {
  this.constructor(id, "IOBox (String)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.addInvisiblePin("Rows",[1.0],this);
  
  this.addInputPin("SliceOffset", [0], this);
  this.addInputPin("Input String", [""], this);
  
  this.addOutputPin("Output String", [""], this);

  this.evaluate = function() {
    if (this.inputPins["Input String"].pinIsChanged()) 
	{
	  this.outputPins["Output String"].setSliceCount(this.inputPins["Input String"].getSliceCount());
      for (var i=0; i<this.inputPins["Input String"].values.length; i++) {
        this.outputPins["Output String"].setValue(i, this.inputPins["Input String"].values[i]);
      }
    }
  }

}
VVVV.Nodes.IOBoxString.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Switch (String Input)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SwitchStringInput = function(id, graph) {
  this.constructor(id, "Switch (String Input)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['No dynamic pin count yet']
  };
  
  var switchIn = this.addInputPin("Switch", [0], this);
  var inputIn = []
  inputIn[0] = this.addInputPin("Input 1", ["text"], this);
  inputIn[1] = this.addInputPin("Input 2", ["text"], this);
  
  var outputOut = this.addOutputPin("Output", ["text"], this);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    var pinsChanged = switchIn.pinIsChanged();
    for (var i=0; i<inputIn.length; i++) {
      pinsChanged = inputIn[i].pinIsChanged() || pinsChanged;
    }
    
    if (pinsChanged) {
      if (switchIn.getValue(0)==undefined) {
        outputOut.setValue(0, undefined);
        return;
      }
      for (var i=0; i<maxSize; i++) {
        outputOut.setValue(i, inputIn[switchIn.getValue(i)%inputIn.length].getValue(i));
      }
    }
  }

}
VVVV.Nodes.SwitchStringInput.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Add (String)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AddString = function(id, graph) {
  this.constructor(id, "Add (String)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['No dynamic pin count yet', 'Intersperse *Enum* not implemented']
  };
  
  var inputIn = []
  inputIn[0] = this.addInputPin("Input 1", ["text"], this);
  inputIn[1] = this.addInputPin("Input 2", ["text"], this);
  
  var intersperseStringIn = this.addInputPin("Intersperse String", [""], this);
  
  var outputOut = this.addOutputPin("Output", ["texttext"], this);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    var pinsChanged = false;
    for (var i=0; i<inputIn.length; i++) {
      pinsChanged = pinsChanged || inputIn[i].pinIsChanged();
    }
    
    if (pinsChanged) {
      for (var i=0; i<maxSize; i++) {
        var pieces = [];
        var intersperse = intersperseStringIn.getValue(i);
        if (intersperse==undefined)
          intersperse = '';
        for (var j=0; j<inputIn.length; j++) {
          pieces.push(inputIn[j].getValue(i));
        }
        outputOut.setValue(i, pieces.join(intersperse));
      }
    }
  }

}
VVVV.Nodes.AddString.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: GetSlice (String)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GetSliceString = function(id, graph) {
  this.constructor(id, "GetSlice (String)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Bin Size not implemented']
  };
  
  var inputIn = this.addInputPin("Input", ["text"], this);
  var binSizeIn = this.addInputPin("Bin Size", [1], this);
  var indexIn = this.addInputPin("Index", [0], this);
  
  var outputOut = this.addOutputPin("Output", ["text"], this);

  this.evaluate = function() {
    var pinsChanged = inputIn.pinIsChanged() || indexIn.pinIsChanged();
    
    if (pinsChanged) {
      outputOut.values = [];
      
      for (var i=0; i<indexIn.values.length; i++) {
        
        outputOut.setValue(i, inputIn.getValue(Math.round((indexIn.getValue(i)))));
      }
    }
  }

}
VVVV.Nodes.GetSliceString.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: AsValue (String)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AsValue = function(id, graph) {
  this.constructor(id, "AsValue (String)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var inputIn = this.addInputPin("Input", [], this);
  var defaultIn = this.addInputPin("Default", [0.0], this);
  
  var outputOut = this.addOutputPin("Output", [0.0], this);

  this.evaluate = function() {
    
      var maxSize = this.getMaxInputSliceCount();
      for (var i=0; i<maxSize; i++) {
        var inp = inputIn.getValue(i);
        if (/^[0-9.e]+$/.test(inp))
          outputOut.setValue(i, inp);
        else
          outputOut.setValue(i, parseFloat(defaultIn.getValue(i)));
      }
  }

}
VVVV.Nodes.AsValue.prototype = new VVVV.Core.Node();



