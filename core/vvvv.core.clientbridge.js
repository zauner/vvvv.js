// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

VVVV.Core.ClientBridge = function(patch, host) {
  
  this.patch = patch;
  
  var socket = new WebSocket("ws://localhost:4444/devel");
  var initialized = false;
  socket.onopen = function() {
    console.log("connected to VVVV ...");
  }
  
  socket.onmessage = function(m) {
    patch.doLoad(m.data);
    if (!initialized) {
      initialized = true;
      if (patch.success)
        patch.success();
    }
    else
      patch.afterUpdate();
  }
  
}
