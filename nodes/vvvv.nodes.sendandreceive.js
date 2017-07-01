// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }
define(function(require,exports) {

var Node = require('core/vvvv.core.node');
var VVVV = require('core/vvvv.core.defines');

var types = [
  {name: "Value", pintype: VVVV.PinTypes.Value, defaultValue: "0"},
  {name: "String", pintype: VVVV.PinTypes.String, defaultValue: "text"},
  {name: "Color", pintype: VVVV.PinTypes.Color, defaultValue: new VVVV.Types.Color("0.0, 1.0, 0.0, 1.0")},
  {name: "Node", pintype: VVVV.PinTypes.Node, defaultValue: undefined},
];

VVVVContext.SnRRegistry = {};

types.forEach(function(type) {

  VVVV.Nodes["Send"+type.name] = function(id, graph) {
    this.constructor(id, "S ("+type.name+")", graph);

    this.meta = {
      authors: ['Matthias Zauner'],
      original_authors: ['VVVV Group'],
      credits: [],
      compatibility_issues: ['']
    };

    this.auto_nil = false;

    var inputIn = this.addInputPin("Input", [type.defaultValue], type.pintype);
    var nameIn = this.addInputPin("Name", ['none'], VVVV.PinTypes.String);

    var currName = undefined;

    this.evaluate = function()
    {
      if (nameIn.pinIsChanged()) {
        if (nameIn.getValue(0)!="none") {
          if (currName) {
            // TODO: kill all references from R nodes
            VVVVContext.SnRRegistry[currName] = undefined;
            delete VVVVContext.SnRRegistry[currName];
          }
          if (VVVVContext.SnRRegistry[nameIn.getValue(0)]===undefined)
            VVVVContext.SnRRegistry[nameIn.getValue(0)] = {pin: inputIn, targetPins: []};
          else {
            VVVVContext.SnRRegistry[nameIn.getValue(0)].pin = inputIn;
            var j = VVVVContext.SnRRegistry[nameIn.getValue(0)].targetPins.length;
            while (j--) {
              var pin = VVVVContext.SnRRegistry[nameIn.getValue(0)].targetPins[j];
              pin.node.dirty = true;
              pin.node.sendReferenceUpdated = true;
            }
          }

          currName = nameIn.getValue(0);
        }
      }

      if (nameIn.getValue(0)!=="none" && inputIn.pinIsChanged()) {
        var j = VVVVContext.SnRRegistry[nameIn.getValue(0)].targetPins.length;
        while (j--) {
          var pin = VVVVContext.SnRRegistry[nameIn.getValue(0)].targetPins[j];
          pin.node.dirty = true;
          pin.node.sendPinChanged = true;
        }
      }
    }

  }
  VVVV.Nodes["Send"+type.name].prototype = new Node();

  VVVV.Nodes["Receive"+type.name] = function(id, graph) {
    this.constructor(id, "R ("+type.name+")", graph);

    this.meta = {
      authors: ['Matthias Zauner'],
      original_authors: ['VVVV Group'],
      credits: [],
      compatibility_issues: ['']
    };

    var nameIn = this.addInputPin("Name", ['none'], VVVV.PinTypes.Enum);
    nameIn.enumOptions = ['none'];
    for (var name in VVVVContext.SnRRegistry) {
      if (VVVVContext.SnRRegistry[name].pin.typeName==type.pintype.typeName || (type.pintype.typeName=="Node" && !VVVV.PinTypes[VVVVContext.SnRRegistry[name].pin.typeName].primitive))
        nameIn.enumOptions.push(name);
    }

    var outputOut = this.addOutputPin("Output", [type.defaultValue], type.pintype);

    var currName = undefined;
    var srcPin = undefined;

    this.sendPinChanged = false;
    this.sendReferenceUpdated = false;

    this.evaluate = function()
    {
      var doInit = false;
      if ((nameIn.pinIsChanged() && nameIn.getValue(0)!=="none") || this.sendReferenceUpdated) {
        if (VVVVContext.SnRRegistry[nameIn.getValue(0)]) {
          srcPin = VVVVContext.SnRRegistry[nameIn.getValue(0)].pin;
          VVVVContext.SnRRegistry[nameIn.getValue(0)].targetPins.push(outputOut);
          if (srcPin)
            doInit = true;
        }
        else {
          VVVVContext.SnRRegistry[nameIn.getValue(0)] = {pin: undefined, targetPins: []};
          VVVVContext.SnRRegistry[nameIn.getValue(0)].targetPins.push(outputOut);
        }
      }

      if (this.sendPinChanged || doInit) {
        var i = srcPin.getSliceCount();
        while (i--) {
          outputOut.setValue(i, srcPin.getValue(i));
        }
        outputOut.setSliceCount(srcPin.getSliceCount());
      }
    }

  }
  VVVV.Nodes["Receive"+type.name].prototype = new Node();

});

});
