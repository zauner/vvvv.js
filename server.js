
var http = require('http')
var path = require('path');
var finalhandler = require('finalhandler')
var serveStatic = require('serve-static')
require('./vvvv.js')
var ws = require("nodejs-websocket")

var serve = serveStatic(path.join(__dirname));

var server = http.createServer(function(req, res){
  var done = finalhandler(req, res)
  serve(req, res, done);
});

function roughSizeOfObject( object ) {

    var objectList = [];
    var stack = [ object ];
    var bytes = 0;

    while ( stack.length ) {
        var value = stack.pop();

        if ( typeof value === 'boolean' ) {
            bytes += 4;
        }
        else if ( typeof value === 'string' ) {
            bytes += value.length * 2;
        }
        else if ( typeof value === 'number' ) {
            bytes += 8;
        }
        else if
        (
            typeof value === 'object'
            && objectList.indexOf( value ) === -1
        )
        {
            objectList.push( value );

            for( var i in value ) {
                stack.push( value[ i ] );
            }
        }
    }
    return bytes;
}

// Listen
server.listen(5000)

VVVVContext.init('./', 'full', function (vvvv) {

  var websocket_server = ws.createServer(function (conn) {
  	console.log("New connection");
    var patch = null;
    var mainloop = null;
  	conn.on("text", function (str) {
      var req = JSON.parse(str);

  		if (patch==null) {
        console.log("Spawning patch "+req.patch+" in "+req.app_root);
        VVVVContext.AppRoot = req.app_root;
        patch = new vvvv.Patch(req.patch, function() {
          this.serverSync.socket = conn;
          mainloop = new vvvv.MainLoop(this, 0.2);
        });

        console.log("PATCH SIZE:", roughSizeOfObject(patch));
      }

      if (req.nodes) {
        //console.log(str);
        var i=req.nodes.length;
        var node = null;
        var p = patch.serverSync.patchRegistry[req.patch];
        while (i--) {
          node = req.nodes[i];
          if (!patch.nodeMap[node.node_id]) // TODO: this handles the case when a synced nodes is created on the client side, and pin values are sent before the actual update arrived. Should be handled cleaner
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
        console.log(req.patch);
        console.log('receiving patch update for '+vvvv.Helpers.prepareFilePath(req.patch));
        var patches = VVVVContext.Patches[vvvv.Helpers.prepareFilePath(req.patch)];
        var i = patches.length;
        while (i--) {
          patches[i].doLoad(req.command)
          patches[i].afterUpdate();
        }
      }
  	})
  	conn.on("close", function (code, reason) {
      delete patch;
      delete mainloop;
  		console.log("Connection closed");
  	})
  }).listen(5001)


});
