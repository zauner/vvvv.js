// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

VVVV.PinTypes.Node = {
  typeName: "Node"
}

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: IOBox (Node)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.IOBoxNode = function(id, graph) {
  this.constructor(id, "IOBox (Node)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  // input pins
  var inputnodeIn = this.addInputPin('Input Node', [], this, true, VVVV.PinTypes.Node);

  // output pins
  var outputnodeOut = this.addOutputPin('Output Node', [], this, VVVV.PinTypes.Node);
  
  this.initialize = function() {
    inputnodeIn.connectionChangedHandlers['nodepin'] = function() {
      if (this.isConnected()) {
        var fromPin;
        if (this.links.length>0)
          fromPin = this.links[0].fromPin
        else if (this.masterPin)
          fromPin = this.masterPin
        this.setType(VVVV.PinTypes[fromPin.typeName]);
        outputnodeOut.setType(VVVV.PinTypes[fromPin.typeName]);
        if (outputnodeOut.slavePin)
          outputnodeOut.slavePin.setType(VVVV.PinTypes[fromPin.typeName]);
      }
      else {
        if (!outputnodeOut.isConnected()) {
          this.setType(VVVV.PinTypes.Node);
          outputnodeOut.setType(VVVV.PinTypes.Node);
          if (outputnodeOut.slavePin)
            outputnodeOut.slavePin.setType(VVVV.PinTypes.Node);
        }
      }
    }
    
    outputnodeOut.connectionChangedHandlers['nodepin'] = function() {
      if (this.isConnected()) {
        var toPin;
        if (this.links.length>0)
          toPin = this.links[0].toPin
        else if (this.slavePin)
          toPin = this.slavePin
        this.setType(VVVV.PinTypes[toPin.typeName]);
        inputnodeIn.setType(VVVV.PinTypes[toPin.typeName]);
        if (inputnodeIn.masterPin)
          inputnodeIn.masterPin.setType(VVVV.PinTypes[toPin.typeName]);
      }
      else {
        if (!inputnodeIn.isConnected()) {
          this.setType(VVVV.PinTypes.Node);
          inputnodeIn.setType(VVVV.PinTypes.Node);
          if (inputnodeIn.masterPin)
            inputnodeIn.masterPin.setType(VVVV.PinTypes.Node);
        }
      }
    }
  }

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      outputnodeOut.setValue(i, inputnodeIn.getValue(i));
    }

    outputnodeOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.IOBoxNode.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Switch (Node Input)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SwitchNodeInput = function(id, graph) {
  this.constructor(id, "Switch (Node Input)", graph);
  
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
      outputOut.setValue(i, inputIn[Math.round(Math.abs(switchIn.getValue(i)))%inputIn.length].getValue(i));
    }
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.SwitchNodeInput.prototype = new VVVV.Core.Node();