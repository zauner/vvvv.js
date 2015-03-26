// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

(function($) {

/**
 * The Node Pin Type
 * @mixin
 * @property {String} typeName "Node"
 */
VVVV.PinTypes.Node = {
  typeName: "Node",
  reset_on_disconnect: true,
  connectionChangedHandlers: {
    'nodepin': function() {
      function setPinTypes(oldType, type) {
        // check if there's an input connection
        for (var pinname in this.node.inputPins) {
          if (this.pinname!=pinname && this.node.inputPins[pinname].typeName==oldType.typeName && this.node.inputPins[pinname].typeName!='Node' && this.node.inputPins[pinname].isConnected())
            return;
        }
        for (var pinname in this.node.outputPins) {
          if (this.pinname!=pinname && this.node.outputPins[pinname].typeName==oldType.typeName && this.node.outputPins[pinname].typeName!='Node' && this.node.outputPins[pinname].isConnected())
            return;
        }
        
        for(pinname in this.node.outputPins) {
          if (this.node.outputPins[pinname].typeName!=oldType.typeName)
            continue;
          this.node.outputPins[pinname].setType(type);
          if (this.node.outputPins[pinname].slavePin)
            this.node.outputPins[pinname].slavePin.setType(type);
          var i=this.node.outputPins[pinname].links.length;
          while (i--) {
            if (this.node.outputPins[pinname].links[i].toPin.typeName!=type.typeName)
              this.node.outputPins[pinname].links[i].toPin.connectionChanged();
          }
        }
        for(pinname in this.node.inputPins) {
          if (this.node.inputPins[pinname].typeName!=oldType.typeName)
            continue;
          this.node.inputPins[pinname].setType(type);
          if (this.node.inputPins[pinname].masterPin)
            this.node.inputPins[pinname].masterPin.setType(type);
          if (this.pinname!=pinname && this.node.inputPins[pinname].links.length>0)
            this.node.inputPins[pinname].links[0].fromPin.connectionChanged();
        }
      }
      
      if (this.direction==VVVV.PinDirection.Input) {
        if (this.isConnected()) {
          var fromPin;
          if (this.links.length>0)
            fromPin = this.links[0].fromPin
          else if (this.masterPin)
            fromPin = this.masterPin
          setPinTypes.call(this, VVVV.PinTypes.Node, VVVV.PinTypes[fromPin.typeName]);
        }
        else {
          setPinTypes.call(this, VVVV.PinTypes[this.typeName], VVVV.PinTypes.Node);
        }
      }
      else if (this.direction==VVVV.PinDirection.Output) {
        if (this.isConnected()) {
          var toPin;
          if (this.links.length>0)
            toPin = this.links[0].toPin
          else if (this.slavePin)
            toPin = this.slavePin
          setPinTypes.call(this, VVVV.PinTypes.Node, VVVV.PinTypes[toPin.typeName]);
        }
        else {
          setPinTypes.call(this, VVVV.PinTypes[this.typeName], VVVV.PinTypes.Node);
        }
      }
    }
  }
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
  var inputnodeIn = this.addInputPin('Input Node', [], VVVV.PinTypes.Node);

  // output pins
  var outputnodeOut = this.addOutputPin('Output Node', [], VVVV.PinTypes.Node);

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
  
  this.auto_nil = false;
  
  var switchIn = this.addInputPin("Switch", [0], VVVV.PinTypes.Value);
  var inputcountIn = this.addInvisiblePin("Input Count", [2], VVVV.PinTypes.Value);
  var inputIn = []
  
  var outputOut = this.addOutputPin("Output", [], VVVV.PinTypes.Node);
  
  this.initialize = function() {
    var inputCount = inputcountIn.getValue(0);
    for (var i=inputIn.length; i<inputCount; i++) {
      inputIn[i] = this.addInputPin("Input "+(i+1), [], VVVV.PinTypes.Node);
    }
    inputIn.length = inputCount;
  }

  this.evaluate = function() {
    
    if (inputcountIn.pinIsChanged()) {
      this.initialize();
    }
    
    if (switchIn.getValue(0)==undefined) {
      outputOut.setValue(0, undefined);
      return;
    }
    
    var pin = inputIn[Math.round(Math.abs(switchIn.getValue(0)))%inputIn.length]
    var slices = pin.getSliceCount();
    
    for (var i=0; i<slices; i++) {
      outputOut.setValue(i, pin.getValue(i));
    }
    outputOut.setSliceCount(slices);
  }

}
VVVV.Nodes.SwitchNodeInput.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: GetSlice (Node)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GetSliceNode = function(id, graph) {
  this.constructor(id, "GetSlice (Node)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var inputIn = this.addInputPin("Input", [], VVVV.PinTypes.Node);
  var binSizeIn = this.addInputPin("BinSize", [1], VVVV.PinTypes.Value);
  var indexIn = this.addInputPin("Index", [0], VVVV.PinTypes.Value);
  
  var outputOut = this.addOutputPin("Output", [], VVVV.PinTypes.Node);

  this.evaluate = function() {
    var size = indexIn.getSliceCount();
    var res, binSize;
    var outIdx = 0;
    for (var i=0; i<size; i++) {
      binSize = binSizeIn.getValue(i);
      res = inputIn.getValue(Math.round(indexIn.getValue(i)), binSize);
      if (binSize>1) {
        for (var j=0; j<res.length; j++) {
          outputOut.setValue(outIdx, res[j]);
          outIdx++;
        }
      }
      else {
        outputOut.setValue(i, res);
        outIdx++;
      }
    }
    outputOut.setSliceCount(outIdx);
  }

}
VVVV.Nodes.GetSliceNode.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Select (Node)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SelectNode = function(id, graph) {
  this.constructor(id, "Select (Node)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var inputIn = this.addInputPin("Input", [], VVVV.PinTypes.Node);
  var selectIn = this.addInputPin("Select", [1], VVVV.PinTypes.Value);
  
  var outputOut = this.addOutputPin("Output", [], VVVV.PinTypes.Node);
  var formerSliceOut = this.addOutputPin("Former Slice", [0], VVVV.PinTypes.Value);

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
VVVV.Nodes.SelectNode.prototype = new VVVV.Core.Node();

}(vvvvjs_jquery));
