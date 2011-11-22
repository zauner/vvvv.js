// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

VVVV.Core.ClientBridge = function(patch, host) {
  
  this.patch = patch;
  
  function initPatch() {
    $.ajax({
      url: host,
      type: 'GET',
      dataType: 'text',
      success: function(xml) {
        patch.doLoad(xml);
        if (patch.success)
          patch.success();
      }
    });
  }
  
  function syncPatchWith(remotePatch) {
    for (var i=0; i<remotePatch.nodeList.length; i++) {
      var remoteNode = remotePatch.nodeList[i];
      var localNode = patch.nodeMap[remoteNode.id];
      if (localNode) {
        localNode.x = remoteNode.x;
        localNode.y = remoteNode.y;
      }
    }
    patch.afterEvaluate();
  }
  
  function updatePatch() {
    $.ajax({
      url: host,
      type: 'GET',
      dataType: 'text',
      success: function(xml) {
        var remotePatch = new VVVV.Core.Patch(xml);
        syncPatchWith(remotePatch);
      }
    });
  }
  
  initPatch();
  setInterval(updatePatch, 100);
  
}
