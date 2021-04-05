
var http = require('http')
var path = require('path');
var finalhandler = require('finalhandler')
var serveStatic = require('serve-static')
require('./vvvv.js')
var ws = require("nodejs-websocket");
var fs = require("fs");
var vvvvjsservices = require('./backend/vvvvjs-services');

var argv = require('minimist')(process.argv);

var documentRoot = "." //__dirname;
if (argv._.length>2) {
  documentRoot = argv._[2];
}

var edit_mode = false;
if (argv.e)
  edit_mode = true;

var serve = serveStatic(path.join(documentRoot));
var map = {
  '.ico': 'image/x-icon',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
}

VVVVContext.externalHandlers = [];
var http_hostname = "0.0.0.0";
var http_port = 5000;
var virtual_dir = "/vvvvjs"
try {
  var appconf = JSON.parse(fs.readFileSync(process.cwd()+"/vvvvjsapp.json"));
  if (appconf.externalHandlers) {
    for (var i=0; i<appconf.externalHandlers.length; i++) {
      VVVVContext.externalHandlers.push(require(process.cwd()+"/"+appconf.externalHandlers[i]));
    }
  }
  if (appconf.httpHostname)
    http_hostname = appconf.httpHostname;
  if (appconf.httpPort)
    http_port = appconf.httpPort;
  if (appconf.virtualVVVVJsDir)
    virtual_dir = appconf.virtualVVVVJsDir;
}
catch (e) { console.error(e.message)};
var virtual_dir_regex = new RegExp(virtual_dir+"/(.+)");

var server = http.createServer(function(req, res) {
  var match;
  if (match = /^\/vvvvjs-service\/([^\?]+)/.exec(req.url)) {
    if (match[1]=="create_subpatch") {
      vvvvjsservices.createSubpatch(req, res);
      return;
    }
  }
  for (var i=0; i<VVVVContext.externalHandlers.length; i++) {
    if (VVVVContext.externalHandlers[i].process(req,res)) {
      return;
    }
  }
  if (match = virtual_dir_regex.exec(req.url)) {
    fs.readFile(path.join(__dirname, match[1]), function(err, data){
      if(err){
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
      } else {
        res.setHeader('Content-type', map[path.parse(match[1]).ext] || 'text/javascript' );
        res.end(data);
      }
    });
    return;
  }
  // only if not processed by external handler
  var done = finalhandler(req, res)
  serve(req, res, done);
});
server.listen(http_port, http_hostname);
console.log("HTTP Server listening on "+http_hostname+":"+http_port);
if (edit_mode)
  console.log("EDIT MODE IS ENABLED.");

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
        if (!edit_mode)
          return;
        //console.log('receiving patch update for '+vvvv.Helpers.prepareFilePath(req.patch));
        var patches = patch.executionContext.Patches[vvvv.Helpers.prepareFilePath(req.patch)];
        var i = patches.length;
        while (i--) {
          patches[i].doLoad(req.command)
          patches[i].afterUpdate();
        }
      }

      if (req.save) {
        if (!edit_mode)
          return;
        console.log("saving on server");
        var p = patch.executionContext.Patches[vvvv.Helpers.prepareFilePath(req.patch)][0];
        fs.writeFile(vvvv.Helpers.prepareFilePath(req.patch)+".xml", p.toXML(), function() {
          console.log('saved '+req.patch+".xml");
        });
        fs.writeFile(vvvv.Helpers.prepareFilePath(req.patch), p.exportJSON(), function() {
          console.log('saved '+req.patch);
        })
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
      if (patch) patch.destroy();
      patch = undefined;
      if (mainloop) mainloop.stop();
      if (mainloop) mainloop.disposing = true;
      mainloop = undefined;
  		console.log("Connection closed");
  	})
    conn.on("error", function(err) {
      if (patch) patch.destroy();
      patch = undefined;
      if (mainloop) mainloop.stop();
      if (mainloop) mainloop.disposing = true;
      mainloop = undefined;
      console.log("Connection closed/reset");
    })
  }).listen(5001)
});

// fetch and register installed node.js packages
if (argv.e && VVVVContext.name=='nodejs')  {
  var npm = require('npm');
  console.log('Checking for installed Node.js packages ...')
  npm.load({loglevel: 'silent', progress: false, prefix: VVVVContext.Root}, function(err) {
    if (err)
      console.log(err);
    else {
      npm.commands.list([], function(err, res) {
        if (err && err.indexOf("extraneous")!==0) {
          console.log(err);
          return;
        }
        (function registerDeps(p) {
          for (var package_name in p.dependencies) {
            VVVVContext.LoadedLibs[package_name] = true;
            registerDeps(p.dependencies[package_name]);
          }
        })(res);
        console.log('Node.js packages scanned. Ready if you are.\n');
      })
    }
  })
}

// launch browser window in app mode
if (argv.mode=='app') {
  var bl = require('james-browser-launcher');
  bl(function(err, launch) {
    launch('http://localhost:'+http_port, {browser: 'chrome'}, function(err, instance) {
      console.log('Launched Chrome');
      instance.on('stop', function(code) {
        process.exit();
      })
    })
  });
}
