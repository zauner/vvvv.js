

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }

define(function(require,exports) {


  var _ = require('underscore');
  var $ = require('jquery');
  var VVVV = require('./vvvv.core.defines');

  var ServerSync = function(root_patch) {
    var socket = new WebSocket("ws://localhost:5001");
    socket.onmessage = function(str) {
      var patch = root_patch; // TODO: get the concerning patch from the JSON message, instead of assuming it's the root patch
      var msg = JSON.parse(str.data);
      if (msg.node_id) {
        for (var pinname in msg.outputPinValues) {
          var i = msg.outputPinValues[pinname].length;
          while (i--) {
            patch.nodeMap[msg.node_id].outputPins[pinname].setValue(i, msg.outputPinValues[pinname][i]);
          }
        }
      }
    };

    // Mixin for VVVV.Core.Node
    this.sendPinValues = function(node) {
      console.log("better do this remotely ...");
      var msg = {patch: node.parentPatch.nodename, node_id: node.id, inputPinValues: {}};
      for (var pinname in node.inputPins) {
        msg.inputPinValues[pinname] = node.inputPins[pinname].values;
      }
      socket.send(JSON.stringify(msg));
    }

    this.sendPatchUpdate = function(patch, command) {
      console.log('patch update ....');
      var msg = {patch: patch.nodename, command: command};
      socket.send(JSON.stringify(msg));
    }
  }


  return ServerSync;
});
