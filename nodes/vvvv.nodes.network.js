// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }
define(function(require,exports) {

var Node = require('core/vvvv.core.node');
var VVVV = require('core/vvvv.core.defines');
var $ = require('jquery');

VVVV.PinTypes.Socket = {
  typeName: "Socket",
  reset_on_disconnect: true,
  defaultValue: function() {
    return "NONE";
  }
}

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: HTTP (Network Get)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.HTTPGet = function(id, graph) {
  this.constructor(id, "HTTP (Network Get)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Doesnt handle get variables yet','Doesnt support proxies','No header output pin yet']
  };

  this.auto_evaluate = true;
  this.environments = ['browser'];

  var urlIn = this.addInputPin("URL", ["http://localhost"], VVVV.PinTypes.String);
  var nameIn = this.addInputPin("Name", [""], VVVV.PinTypes.String);
  var valueIn = this.addInputPin("Value", [""], VVVV.PinTypes.String);
  var refreshIn = this.addInputPin("Refresh", [0], VVVV.PinTypes.Value);

  var statusOut = this.addOutputPin("Status", [""], VVVV.PinTypes.String);
  var bodyOut = this.addOutputPin("Body", [""], VVVV.PinTypes.String);
  var failOut = this.addOutputPin("Fail", [0], VVVV.PinTypes.Value);
  var successOut = this.addOutputPin("Success", [0], VVVV.PinTypes.Value);

  var body;
  var status;
  var success;
  var fail;

  var requestComplete = false;

  var doResetOutPins = -1;

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();

    var pinsChanged = (refreshIn.pinIsChanged() && refreshIn.getValue(0)==1);

    if (successOut.getValue(0)==1)
      successOut.setValue(0,0);
    if (failOut.getValue(0)==1)
      failOut.setValue(0, 0);

    if (requestComplete) {
      bodyOut.setValue(0, body);
      statusOut.setValue(0, status);
      successOut.setValue(0, success);
      failOut.setValue(0, fail);
      requestComplete = false;
    }

    if (pinsChanged) {
      var i = 0;
      if (urlIn.getValue(i)==undefined) {
        bodyOut.setValue(0, '');
        statusOut.setValue(0, '');
        return;
      }
      $.ajax({
        url: urlIn.getValue(i),
        type: 'get',
        dataType: 'text',
        success: function(response, status, xhr) {
          body = response;
          status = xhr.status;
          success = 1;
          requestComplete = true;
        },
        error: function(xhr, status) {
          body = '';
          fail = 1;
          status = xhr.status;
          requestComplete = true;
        }
      });
    }
  }

}
VVVV.Nodes.HTTPGet.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: HTTP (Network Post)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.HTTPPost = function(id, graph) {
  this.constructor(id, "HTTP (Network Post)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Doesnt support proxies','No header output pin yet']
  };

  this.auto_evaluate = true;
  this.environments = ['browser'];

  var urlIn = this.addInputPin("URL", ["http://localhost"], VVVV.PinTypes.String);
  var nameIn = this.addInputPin("Name", [""], VVVV.PinTypes.String);
  var valueIn = this.addInputPin("Value", [""], VVVV.PinTypes.String);
  var fileNameIn = this.addInputPin("File Name", [""], VVVV.PinTypes.String);
  var fileIn = this.addInputPin("File", ["No File"], VVVV.PinTypes.Node);
  var refreshIn = this.addInputPin("Refresh", [0], VVVV.PinTypes.Value);

  var statusOut = this.addOutputPin("Status", [""], VVVV.PinTypes.String);
  var bodyOut = this.addOutputPin("Body", [""], VVVV.PinTypes.String);
  var progressOut = this.addOutputPin("Progress", [0], VVVV.PinTypes.Value);
  var failOut = this.addOutputPin("Fail", [0], VVVV.PinTypes.Value);
  var successOut = this.addOutputPin("Success", [0], VVVV.PinTypes.Value);

  var body;
  var status;
  var success;
  var fail;

  var requestComplete = false;

  var doResetOutPins = -1;

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();

    var pinsChanged = (refreshIn.pinIsChanged() && refreshIn.getValue(0)==1);

    if (successOut.getValue(0)==1)
      successOut.setValue(0,0);
    if (failOut.getValue(0)==1)
      failOut.setValue(0, 0);

    if (requestComplete) {
      bodyOut.setValue(0, body);
      statusOut.setValue(0, status);
      successOut.setValue(0, success);
      failOut.setValue(0, fail);
      requestComplete = false;
    }

    if (pinsChanged) {
      var i = 0;
      if (urlIn.getValue(i)==undefined) {
        bodyOut.setValue(0, '');
        statusOut.setValue(0, '');
        return;
      }
      var formData = new FormData();
      var paramsCount = Math.max(nameIn.getSliceCount(), valueIn.getSliceCount());
      for (var i=0; i<paramsCount; i++) {
        formData.append(nameIn.getValue(i), valueIn.getValue(i));
      }
      paramsCount = Math.max(fileNameIn.getSliceCount(), fileIn.getSliceCount());
      for (var i=0; i<paramsCount; i++) {
        formData.append(fileNameIn.getValue(i), fileIn.getValue(i));
      }
      var xhr = new XMLHttpRequest();
      xhr.open("POST", urlIn.getValue(0));

      xhr.onload = function(e) {
        if (xhr.status==200) {
          body = xhr.responseText;
          status = xhr.status;
          success = 1;
          requestComplete = true;
        }
        else {
          body = xhr.responseText;
          status = xhr.status;
          fail = 1
          requestComplete = true;
        }
      }

      xhr.upload.addEventListener("progress", function(e) {
        progressOut.setValue(0, e.loaded / e.total);
      });

      xhr.onerror = function(e) {
        body = '';
        status = xhr.status;
        fail = 1;
        requestComplete = true;
      }

      xhr.send(formData);
    }
  }

}
VVVV.Nodes.HTTPPost.prototype = new Node();



VVVV.Nodes.WebsocketClient = function(id, graph) {
  this.constructor(id, "Websocket (Network Client)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = true;
  this.environments = ['browser'];

  var hostIn = this.addInputPin("URL", ["localhost"], VVVV.PinTypes.String);
  var portIn = this.addInputPin("Port", [8006], VVVV.PinTypes.Value);
  var inputIn = this.addInputPin("Input", ["Hello"], VVVV.PinTypes.String);
  var doSendIn = this.addInputPin("DoSend", [0], VVVV.PinTypes.Value);
  var enabledIn = this.addInputPin("Enabled", [0], VVVV.PinTypes.Value);

  var outputOut = this.addOutputPin("Output", [""], VVVV.PinTypes.String);
  var onDataOut = this.addOutputPin("OnData", [0], VVVV.PinTypes.Value);
  var connectedOut = this.addOutputPin("Connected", [0], VVVV.PinTypes.Value);

  var ws = null;
  var queue = [];

  this.evaluate = function() {

    if ((enabledIn.getValue(0)<0.5 || hostIn.pinIsChanged() || portIn.pinIsChanged()) && ws!=null) {
      ws.close();
      ws = null;
    }

    if (enabledIn.getValue(0)>=0.5 && ws == null) {
      ws = new WebSocket("ws://"+hostIn.getValue(0)+":"+portIn.getValue(0));
      ws.onopen = function(e) {
        connectedOut.setValue(0, 1);
      }
      ws.onclose = function(e) {
        connectedOut.setValue(0, 0);
      }
      ws.onmessage = function(e) {
        queue.push(e.data);
      }
    }

    if (queue.length>0) {
      outputOut.setValue(0, queue.shift());
      onDataOut.setValue(0, 1);
    }
    else {
      outputOut.setValue(0, "");
      onDataOut.setValue(0, 0);
    }

    if (doSendIn.getValue(0)>=0.5 && ws) {
      ws.send(inputIn.getValue(0));
    }

  }

}
VVVV.Nodes.WebsocketClient.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: UDP (Network Server)
 Author(s): 'Matthias Zauner'
 Original Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.UDPServer = function(id, graph) {
  this.constructor(id, "UDP (Network Server)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;
  this.environments = ['nodejs'];

  var portIn = this.addInputPin("Port", [8007], VVVV.PinTypes.Value);
  var enabledIn = this.addInputPin("Enabled", [0], VVVV.PinTypes.Value);

  var outputOut = this.addOutputPin("Output", [""], VVVV.PinTypes.Buffer);
  var onDataOut = this.addOutputPin("OnData", [0], VVVV.PinTypes.Value);
  onDataOut.auto_reset = true;

  var server = undefined;
  var state;
  var thatNode = this;
  var localqueue = [];
  var currentPtr = 0;

  function createSocket() {
    var dgram = window.server_req('dgram');
    server = dgram.createSocket('udp4');
    server.on('listening', function() {
      state.listening = true;
      console.log('UDP Server listening on '+server.address().address+':'+server.address().port);
    })
    server.on('error', function(err) {
      console.error('UDP Server Error: '+err.message);
      state.listening = false;
      server.close();
    })
    server.on('message', function(message, remote) {
      state.queue.push(message);
      if (state.queue.length>100) {
        state.queue.shift();
        state.queue_offset++;
      }
      thatNode.sharedRessources().markAsChanged();
    })
    return server;
  }

  this.initialize = function() {
    this.sharedRessources().registerNode(this);
  }

  this.evaluate = function() {
    if (portIn.getValue(0)==0)
      return;
    if (this.sharedRessources().has('server')) {
      server = this.sharedRessources().get('server');
      state = this.sharedRessources().get('state');
    }
    else {
      state = {enabled: false, listening: false, port: undefined, queue: [], queue_offset: 0};
      this.sharedRessources().share('state', state);
    }

    if ((!state.enabled && enabledIn.pinIsChanged() && enabledIn.getValue(0)>=0.5) || (enabledIn.getValue(0)>=0.5 && portIn.pinIsChanged())) {
      if (state.listening && state.port!=portIn.getValue(0)) {
        server.close();
        server = undefined;
        state.listening = false;
      }
      if (!state.listening) {
        if (server==undefined) {
          server = createSocket();
          this.sharedRessources().share('server', server);
          server.bind(portIn.getValue(0));
          state.port = portIn.getValue(0);
          state.enabled = true;
        }
      }
    }

    if (state.enabled && enabledIn.pinIsChanged() && enabledIn.getValue(0)<0.5) {
      if (state.listening) {
        server.close();
        server = undefined;
      }
      state.enabled = false;
      state.listening = false;
      state.port = 0;
      this.sharedRessources().share('server', server);
    }

    for (; currentPtr<state.queue.length+state.queue_offset; currentPtr++) {
      localqueue.push(state.queue[currentPtr-state.queue_offset]);
    }

    var val;
    if (val = localqueue.shift()) {
      outputOut.setValue(0, val);
      onDataOut.setValue(0, 1);
    }

  }

  this.destroy = function() {
    console.log('destroying UDP server');
    this.sharedRessources().unregisterNode(this);
    if (this.sharedRessources().registeredNodes.length==0) {
      server.close();
      VVVVContext.sharedRessourceStores[this.parentPatch.getPatchIdentifier()+"/"+this.id] = undefined;
    }
  }

}
VVVV.Nodes.UDPServer.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: UDP (Network Client)
 Author(s): 'Matthias Zauner'
 Original Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.UDPClient = function(id, graph) {
  this.constructor(id, "UDP (Network Client)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;
  this.environments = ['nodejs'];

  var dataIn = this.addInputPin("Input", [], VVVV.PinTypes.Buffer);
  var doSendIn = this.addInputPin("Do Send", [0], VVVV.PinTypes.Value);
  var hostIn = this.addInputPin("Remote Host", ['localhost'], VVVV.PinTypes.String);
  var portIn = this.addInputPin("Remote Port", [8007], VVVV.PinTypes.Value);

  var client = undefined;
  var thatNode = this;

  this.initialize = function() {
    var dgram = window.server_req('dgram');
    client = dgram.createSocket('udp4');
  }

  this.evaluate = function() {
    if (!dataIn.isConnected())
      return;
    var maxSliceCount = this.getMaxInputSliceCount();
    for (var i=0; i<maxSliceCount; i++) {
      if (doSendIn.getValue(i)>=.5)
        client.send(dataIn.getValue(i), portIn.getValue(i), hostIn.getValue(i));
    }
  }

  this.destroy = function() {
    client.close();
  }

}
VVVV.Nodes.UDPClient.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: TCP (Network Server)
 Author(s): 'Matthias Zauner'
 Original Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.TCPServer = function(id, graph) {
  this.constructor(id, "TCP (Network Server)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;
  this.environments = ['nodejs'];

  var portIn = this.addInputPin("Port", [8007], VVVV.PinTypes.Value);
  var enabledIn = this.addInputPin("Enabled", [0], VVVV.PinTypes.Value);

  var outputOut = this.addOutputPin("Output", [""], VVVV.PinTypes.Buffer);
  var onDataOut = this.addOutputPin("OnData", [0], VVVV.PinTypes.Value);
  onDataOut.auto_reset = true;
  var socketOut = this.addOutputPin("Remote Connection", [], VVVV.PinTypes.Socket);
  var clientsOut = this.addOutputPin("Remote Host", [], VVVV.PinTypes.String);

  var server = undefined;
  var state;
  var thatNode = this;
  var localqueues = [];

  function createServer(port, state) {
    var net = window.server_req('net');
    state.server = net.createServer(function(socket) {
      console.log('New Connection from ', socket.remoteAddress);
      var connection = {socket: socket, queue: [], queue_offset: 0};
      state.connections.push(connection);

      socket.on('data', function(data) {
        connection.queue.push(data);
        if (connection.queue.length>100) {
          connection.queue.shift();
          connection.queue_offset++;
        }
        thatNode.sharedRessources().markAsChanged();
      });

      socket.on('end', function() {
        state.connections.splice(state.connections.indexOf(connection), 1);
        console.log('Connection to ', socket.remoteAddress, ' closed.');
        thatNode.sharedRessources().markAsChanged();
      });

      thatNode.sharedRessources().markAsChanged();
    }).listen(port);

    state.server.on('listening', function() {
      console.log('TCP Server listening at port ', port);
      state.listening = true;
    });
  }

  this.initialize = function() {
    this.sharedRessources().registerNode(this);
  }

  this.evaluate = function() {
    if (portIn.getValue(0)==0)
      return;
    if (this.sharedRessources().has('state')) {
      state = this.sharedRessources().get('state');
    }
    else {
      state = {enabled: false, listening: false, port: undefined, server: undefined, connections: []};
      this.sharedRessources().share('state', state);
    }

    if ((!state.enabled && enabledIn.pinIsChanged() && enabledIn.getValue(0)>=0.5) || (enabledIn.getValue(0)>=0.5 && portIn.pinIsChanged())) {
      if (state.listening && state.port!=portIn.getValue(0)) {
        for (var i=0; i<state.connections.length; i++) {
          state.connections[i].socket.end();
        }
        state.server.close();
        state.server = undefined;
        state.listening = false;
      }
      if (!state.listening) {
        if (state.server==undefined) {
          createServer(portIn.getValue(0), state);
          state.port = portIn.getValue(0);
          state.enabled = true;
        }
      }
    }

    if (state.enabled && enabledIn.pinIsChanged() && enabledIn.getValue(0)<0.5) {
      console.log('Disabling ...');
      for (var i=0; i<state.connections.length; i++) {
        state.connections[i].socket.end();
      }
      state.server.close();
      state.server = undefined;
      state.listening = false;
      state.enabled = false;
      state.port = 0;
    }

    var conn;
    for (var i=0; i<state.connections.length; i++) {
      conn = state.connections[i];
      clientsOut.setValue(i, conn.socket.remoteAddress+':'+conn.socket.remotePort);
      socketOut.setValue(i, conn.socket);
      if (localqueues[i]==undefined) {
        localqueues[i] = [];
        localqueues[i].currentPtr = conn.queue.length+conn.queue_offset;
      }
      for (; localqueues[i].currentPtr<conn.queue.length+conn.queue_offset; localqueues[i].currentPtr++) {
        localqueues[i].push(conn.queue[localqueues[i].currentPtr-conn.queue_offset]);
      }
    }
    clientsOut.setSliceCount(state.connections.length);
    socketOut.setSliceCount(state.connections.length);
    localqueues.length = state.connections.length;

    var val;
    for (var i=0; i<localqueues.length; i++) {
      if (val = localqueues[i].shift()) {
        outputOut.setValue(i, val);
        onDataOut.setValue(i, 1);
      }
      else {
        outputOut.setValue(i, "");
        onDataOut.setValue(i, 0);
      }
    }
    outputOut.setSliceCount(localqueues.length);
    onDataOut.setSliceCount(localqueues.length);

  }

  this.destroy = function() {
    console.log('destroying TCP server');
    this.sharedRessources().unregisterNode(this);
    if (this.sharedRessources().registeredNodes.length==0) {
      for (var i=0; i<state.connections.length; i++) {
        state.connections[i].socket.end();
      }
      if (state.server)
        state.server.close();
      VVVVContext.sharedRessourceStores[this.parentPatch.getPatchIdentifier()+"/"+this.id] = undefined;
    }
  }

}
VVVV.Nodes.TCPServer.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: TCP (Network Client)
 Author(s): 'Matthias Zauner'
 Original Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.TCPClient = function(id, graph) {
  this.constructor(id, "TCP (Network Client)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;
  this.environments = ['nodejs'];

  var hostIn = this.addInputPin("Host", ["localhost"], VVVV.PinTypes.String);
  var portIn = this.addInputPin("Port", [8007], VVVV.PinTypes.Value);
  var enabledIn = this.addInputPin("Enabled", [0], VVVV.PinTypes.Value);

  var outputOut = this.addOutputPin("Output", [""], VVVV.PinTypes.Buffer);
  var onDataOut = this.addOutputPin("OnData", [0], VVVV.PinTypes.Value);
  onDataOut.auto_reset = true;
  var socketOut = this.addOutputPin("Remote Connection", [], VVVV.PinTypes.Socket);
  var connectedOut = this.addOutputPin("Connected", [0], VVVV.PinTypes.Value);

  var client = undefined;
  var socket = undefined;
  var queue = [];
  var thatNode = this;

  function createClient(host, port) {
    var net = window.server_req('net');
    var s = new net.Socket();
    s.connect(port, host, function() {
      s.unref();
      console.log("Established TCP Connection to ", s.remoteAddress, ":", s.remotePort);
      s.on('data', function(d) {
        queue.push(d);
        thatNode.dirty = true;
        thatNode.parentPatch.mainloop.requestEvaluate();
      })
      s.on('end', function() {
        console.log("Closed connection to ", s.remoteAddress, ":", s.remotePort);
        thatNode.dirty = true;
        thatNode.parentPatch.mainloop.requestEvaluate();
      })
      thatNode.dirty = true;
      thatNode.parentPatch.mainloop.requestEvaluate();
    })
    return s;
  }

  this.evaluate = function() {
    if (portIn.getValue(0)==0)
      return;
    if ((enabledIn.pinIsChanged() && enabledIn.getValue(0)>=0.5) || (enabledIn.getValue(0)>=0.5 && (portIn.pinIsChanged() || hostIn.pinIsChanged()))) {
      if (socket) {
        socket.end();
        socket = undefined;
      }
      socket = createClient(hostIn.getValue(0), portIn.getValue(0));
    }

    if (enabledIn.pinIsChanged() && enabledIn.getValue(0)<0.5) {
      console.log('Disabling ...');
      if (socket)
        socket.end();
      socket = undefined;
    }

    if (socket) {
      connectedOut.setValue(0, 1);
      socketOut.setValue(0, socket);
    }
    else {
      connectedOut.setValue(0, 0);
      socketOut.setSliceCount(0);
    }

    var val;
    if (val = queue.shift()) {
      outputOut.setValue(0, val);
      onDataOut.setValue(0, 1);
    }
    else {
      outputOut.setValue(0, VVVV.PinTypes.Buffer.defaultValue());
      onDataOut.setValue(0, 0);
    }
  }

  this.destroy = function() {
    if (socket)
      socket.end();
  }

}
VVVV.Nodes.TCPClient.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: TCPSend (Network)
 Author(s): 'Matthias Zauner'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.TCPSend = function(id, graph) {
  this.constructor(id, "TCPSend (Network)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;
  this.environments = ['nodejs'];

  var socketIn = this.addInputPin("Connection", [], VVVV.PinTypes.Socket);
  var dataIn = this.addInputPin("Input", [], VVVV.PinTypes.Buffer);
  var doSendIn = this.addInputPin("Do Send", [0], VVVV.PinTypes.Value);

  var sentOut = this.addOutputPin("Sent", [0], VVVV.PinTypes.Value);
  sentOut.auto_reset = true;

  var thatNode = this;
  var sent = [];

  this.initialize = function() {
  }

  this.evaluate = function() {
    if (!socketIn.isConnected() || !dataIn.isConnected())
      return;
    var sliceCount = this.getMaxInputSliceCount()
    var i = sliceCount;
    console.log(sliceCount);
    while (i--) {
      if (doSendIn.getValue(i)>=.5) {
        sent[i] = false;
        (function(j) {
          socketIn.getValue(j).write(dataIn.getValue(j), 'utf-8', function() {
            sent[j] = true;
            thatNode.dirty = true;
          });
        })(i);
      }
      if (sent[i])
        sentOut.setValue(i, 1);
      else
        sentOut.setValue(i, 0);
      sent[i] = false;
    }
    sentOut.setSliceCount(sliceCount);
    sent.length = sliceCount;
  }

}
VVVV.Nodes.TCPSend.prototype = new Node();

});
