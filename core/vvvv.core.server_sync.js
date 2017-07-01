

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }

define(function(require,exports) {


  var _ = require('underscore');
  var $ = require('jquery');
  var VVVV = require('./vvvv.core.defines');

  var ServerSync = function(root_patch) {
    this.socket = null;
    this.patchRegistry = {};

    this.connect = function(success_callback) {
      if (VVVVContext.name!="browser" || this.socket!==null)
        return;
      this.socket = new WebSocket("ws://"+location.hostname+":5001/vvvvjs-rt");
      root_patch.resourcesPending++;

      var that = this;

      this.socket.onopen = function() {
        var msg = {app_root: location.pathname.substring(0, location.pathname.lastIndexOf("/")+1), patch: root_patch.nodename};
        this.send(JSON.stringify(msg));
        root_patch.resourcesPending--;
        if (success_callback)
          success_callback.call(root_patch);
      }

      this.socket.onclose = function() {
        VVVVContext.onConnectionLost.call();
      }

      var messageQueue = {};
      this.processMessage = function(patchIdentifier) {
        var p = that.patchRegistry[patchIdentifier];
        if (!messageQueue[patchIdentifier])
          return;
        if ((msg = messageQueue[patchIdentifier].shift())!==undefined) {
          console.log('->');
          console.log(msg);
          var i=msg.nodes.length;
          var node = null;
          while (i--) {
            node = msg.nodes[i];
            for (var pinname in node.pinValues) {
              var j=node.pinValues[pinname].length;
              while (j--) {
                p.nodeMap[node.node_id].outputPins[pinname].setValue(j, node.pinValues[pinname][j]);
              }
              p.nodeMap[node.node_id].outputPins[pinname].setSliceCount(node.pinValues[pinname].length);
            }

          }
        }
      }

      this.socket.onmessage = function(str) {
        var msg = JSON.parse(str.data);
        var p = that.patchRegistry[msg.patch];
        //console.log("-> "+str.data);
        if (msg.nodes) {
          if (!messageQueue[msg.patch])
            messageQueue[msg.patch] = [];
          messageQueue[msg.patch].push(msg);
        }
        if (msg.message) {
          if (typeof p.nodeMap[msg.node].handleBackendMessage === 'function')
            p.nodeMap[msg.node].handleBackendMessage(msg.message);
        }
      };
    }

    this.isConnected = function() {
      return this.socket!==null;
    }

    this.sendPatchUpdate = function(patch, command) {
      console.log('patch update ....');
      var msg = {patch: VVVV.Helpers.prepareFilePath(patch.nodename, patch.parentPatch), command: command};
      this.socket.send(JSON.stringify(msg));
    }

    this.sendPatchSave = function(patch) {
      var msg = {patch: VVVV.Helpers.prepareFilePath(patch.nodename, patch.parentPatch), save: true};
      this.socket.send(JSON.stringify(msg));
    }

    this.registerPatch = function(p) {
      this.patchRegistry[p.getPatchIdentifier()] = p;
    }

    this.unregisterPatch = function(p) {
      delete this.patchRegistry[p.getPatchIdentifier()];
    }

    this.sendBinaryBackendMessage = function(node, buf, meta) {
      if (meta==undefined)
        meta = {};
      meta.patch = node.parentPatch.getPatchIdentifier();
      meta.node = node.id;
      var meta = JSON.stringify(meta);
      var message = new ArrayBuffer(buf.byteLength + meta.length*2 + 2);
      var message_dv = new DataView(message);
      var payload_dv = new DataView(buf);
      message_dv.setUint16(0, meta.length);
      var offset = 2;
      for (var j=0; j<meta.length; j++) {
        message_dv.setInt16(offset, meta.charCodeAt(j));
        offset += 2;
      }
      for (var j=0; j<buf.byteLength; j++) {
        message_dv.setUint8(offset+j, payload_dv.getUint8(j));
      }
      this.socket.send(message);
    }

  }

  return ServerSync;
});
