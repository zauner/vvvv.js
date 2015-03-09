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
        for(pinname in this.node.outputPins) {
          if (this.node.outputPins[pinname].typeName!=oldType.typeName)
            continue;
          this.node.outputPins[pinname].setType(type);
          if (this.node.outputPins[pinname].slavePin)
            this.node.outputPins[pinname].slavePin.setType(type);
        }
        for(pinname in this.node.inputPins) {
          if (this.node.inputPins[pinname].typeName!=oldType.typeName)
            continue;
          this.node.inputPins[pinname].setType(type);
          if (this.node.inputPins[pinname].masterPin)
            this.node.inputPins[pinname].masterPin.setType(type);
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
          // check if there's an input connection
          var reset_to_node_type = true;
          for (var pinname in this.node.inputPins) {
            if (this.node.inputPins[pinname].isConnected())
              reset_to_node_type = false;
          }
          for (var pinname in this.node.outputPins) {
            if (this.node.outputPins[pinname].isConnected())
              reset_to_node_type = false;
          }
          if (reset_to_node_type)
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
          // check if there's an input connection
          var reset_to_node_type = true;
          for (var pinname in this.node.inputPins) {
            if (this.node.inputPins[pinname].isConnected())
              reset_to_node_type = false;
          }
          for (var pinname in this.node.outputPins) {
            if (this.node.outputPins[pinname].isConnected())
              reset_to_node_type = false;
          }
          if (reset_to_node_type)
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

}(vvvvjs_jquery));
