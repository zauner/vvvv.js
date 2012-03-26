// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

if (!WebSocket && MozWebSocket)
  var WebSocket = MozWebSocket;

VVVV.Core.VVVVConnector = function(patch) {
  
  this.patch = patch;
  this.host = false;
  var socket = false;

  var that = this;
  
  this.enable = function(opts) {
    opts = opts || {}
    if (!this.host)
      return;
    socket = new WebSocket(this.host+":4444");
    var initialized = false;
    var opened = false;
    socket.onopen = function() {
      opened = true;
      console.log("connected to VVVV ...");
      that.pushCompletePatch();
      window.setTimeout(function() {
        that.pullCompletePatch();
      }, 1000);
      if (opts.success)
        opts.success();
    }
    socket.onclose = function() {
      if (!opened && opts.error)
        opts.error();
      opened = false;
    }
    socket.onmessage = function(m) {
      patch.doLoad(m.data);
      if (!initialized) {
        initialized = true;
        if (patch.success)
          patch.success();
        patch.afterUpdate();
      }
      else
        patch.afterUpdate();
    }
  }
  
  this.disable = function() {
    if (socket)
      socket.close();
    socket.onmessage = null;
    socket.onopen = null;
    socket = false;
  }
  
  this.pullCompletePatch = function() {
    console.log('pulling patch...');
    socket.send('PULL');
  }
  
  this.pushCompletePatch = function() {
    console.log('pushing patch ...');
    socket.send('PUSH'+this.patch.XMLCode);
  }
  
  this.isConnected = function() {
    return socket!==false;
  }
  
}
