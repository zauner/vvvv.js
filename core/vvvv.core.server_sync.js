

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }

define(function(require,exports) {


  var _ = require('underscore');
  var $ = require('jquery');
  var VVVV = require('./vvvv.core.defines');

  var ServerSync = function(root_patch) {
    this.socket = null;

    this.connect = function() {
      if (VVVVContext.name!="browser" || this.socket!==null)
        return;
      this.socket = new WebSocket("ws://localhost:5001");

      this.socket.onopen = function() {
        var msg = {app_root: location.pathname, patch: root_patch.nodename};
        this.send(JSON.stringify(msg));
      }

      this.socket.onmessage = function(str) {
        var msg = JSON.parse(str.data);
        var p = VVVVContext.Patches[msg.patch];
        console.log("-> "+str.data);
        if (msg.nodes) {
          var i=msg.nodes.length;
          var node = null;
          while (i--) {
            node = msg.nodes[i];
            for (var pinname in node.pinValues) {
              var j=node.pinValues[pinname].length;
              while (j--) {
                p.nodeMap[node.node_id].outputPins[pinname].setValue(j, node.pinValues[pinname][j]);
              }
            }

          }
        }
      };
    }

    this.isConnected = function() {
      return this.socket!==null;
    }

    this.sendPatchUpdate = function(patch, command) {
      console.log('patch update ....');
      var msg = {patch: patch.nodename, command: command};
      this.socket.send(JSON.stringify(msg));
    }

  }

  return ServerSync;
});
