
var http = require('http')
var path = require('path');
var finalhandler = require('finalhandler')
var serveStatic = require('serve-static')
require('./vvvv.js')
var ws = require("nodejs-websocket");
var fs = require("fs");

var documentRoot = __dirname;
if (process.argv.length>=3) {
  documentRoot = process.argv[2];
}

var serve = serveStatic(path.join(documentRoot));

var server = http.createServer(function(req, res) {
  var done = finalhandler(req, res)
  serve(req, res, done);
});
server.listen(5000)

VVVVContext.init('./', 'full', function (vvvv) {
  VVVVContext.DocumentRoot = documentRoot;
  var websocket_server = ws.createServer(function (conn) {
  	console.log("New connection");
    var patch = null;
    var mainloop = null;
  	conn.on("text", function (str) {
      var req = JSON.parse(str);

  		if (patch==null && req.patch && req.app_root) {
        console.log("Spawning patch "+req.patch+" in "+req.app_root);
        VVVVContext.AppRoot = req.app_root;
        patch = new vvvv.Patch(req.patch, function() {
          this.serverSync.socket = conn;
        });
      }

      if (req.nodes) {
        //console.log('-> '+str);
        if (!mainloop)
          mainloop = new vvvv.MainLoop(patch, 0.2);
        var i=req.nodes.length;
        var node = null;
        var p = patch.serverSync.patchRegistry[req.patch];
        while (i--) {
          node = req.nodes[i];
          if (!p.nodeMap[node.node_id]) // TODO: this handles the case when a synced nodes is created on the client side, and pin values are sent before the actual update arrived. Should be handled cleaner
            continue;
          for (var pinname in node.pinValues) {
            p.nodeMap[node.node_id].inputPins[pinname].values = node.pinValues[pinname];
            p.nodeMap[node.node_id].inputPins[pinname].markPinAsChanged();
          }
        }
        if (mainloop) {
          mainloop.stop();
          mainloop.start();
        }
      }

      if (req.command) {
        //console.log(req.patch);
        console.log('receiving patch update for '+vvvv.Helpers.prepareFilePath(req.patch));
        var patches = VVVVContext.Patches[vvvv.Helpers.prepareFilePath(req.patch)];
        var i = patches.length;
        while (i--) {
          patches[i].doLoad(req.command)
          patches[i].afterUpdate();
        }
      }

      if (req.save) {
        var p = VVVVContext.Patches[vvvv.Helpers.prepareFilePath(req.patch)][0];
        fs.writeFile(vvvv.Helpers.prepareFilePath(req.patch), p.toXML(), function() {
          console.log('saved '+req.patch);
        });
      }

      if (req.message) {
        var p = patch.serverSync.patchRegistry[req.patch]
        if (typeof p.nodeMap[req.node].handleBackendMessage === 'function')
          p.nodeMap[req.node].handleBackendMessage(req.message);
      }
  	})
    conn.on("binary", function(inStream) {
      var chunks = [];
      var totalByteLength = 0;
      var meta_data = undefined;
      inStream.on("readable", function() {
        var newData = inStream.read();
        if (!newData)
          return;
        var offset = 0;
        if (meta_data==undefined) {
          var meta_len = newData.readUInt16BE(0);
          offset = 2;
          var meta = "";
          for (var i=0; i<meta_len; i++) {
            meta += String.fromCharCode(newData.readInt16BE(offset));
            offset += 2;
          }
          meta_data = JSON.parse(meta);
        }
        var data = newData.buffer.slice(newData.byteOffset, newData.byteOffset + newData.byteLength).slice(offset);
        chunks.push(data);
        totalByteLength += data.byteLength;
      })
      inStream.on("end", function() {
        var p = patch.serverSync.patchRegistry[meta_data.patch];
        if (p && p.nodeMap[meta_data.node] && (typeof p.nodeMap[meta_data.node].handleBackendMessage === 'function')) {
          var buf = new Uint8Array(totalByteLength);
          var offset=0;
          for (var i=0; i<chunks.length; i++) {
            var dv2 = new Uint8Array(chunks[i]);
            for (var j=0; j<dv2.length; j++) {
              buf[offset] = dv2[j];
              offset++;
            }
          }
          p.nodeMap[meta_data.node].handleBackendMessage(buf, meta_data);
        }
      })
    })
  	conn.on("close", function (code, reason) {
      delete patch;
      delete mainloop;
  		console.log("Connection closed");
  	})
  }).listen(5001)


});
