
VVVV.Nodes.IOBoxString = function(id, graph) {
  this.constructor(id, "IOBox (String)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.addInputPin("SliceOffset", [0], this);
  this.addInputPin("Input String", [""], this);
  
  this.addOutputPin("Output String", [""], this);

  this.evaluate = function() {
    if (this.inputPins["Input String"].pinIsChanged()) {
      for (var i=0; i<this.inputPins["Input String"].values.length; i++) {
        this.outputPins["Output String"].setValue(i, this.inputPins["Input String"].values[i]);
      }
    }
  }

}
VVVV.Nodes.IOBoxString.prototype = new VVVV.Core.Node();


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



