
VVVV.Nodes.HTTPGet = function(id, graph) {
  this.constructor(id, "HTTP (Network Get)", graph);
  
  var urlIn = this.addInputPin("URL", ["http://localhost"], this);
  var nameIn = this.addInputPin("Name", [""], this);
  var valueIn = this.addInputPin("Value", [""], this);
  var refreshIn = this.addInputPin("Refresh", [0], this);
  
  var statusOut = this.addOutputPin("Status", [""], this);
  var bodyOut = this.addOutputPin("Body", [""], this);
  var failOut = this.addOutputPin("Fail", [0], this);
  var successOut = this.addOutputPin("Success", [0], this);
  
  var doResetOutPins = false;

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    var pinsChanged = urlIn.pinIsChanged() || nameIn.pinIsChanged() || valueIn.pinIsChanged() || (refreshIn.pinIsChanged() && refreshIn.getValue(0)==1);
    
    if (doResetOutPins) {
      failOut.setValue(0, 0);
      successOut.setValue(0, 0);
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
        success: function(response, status, xhr) {
          bodyOut.setValue(0, response);
          statusOut.setValue(0, xhr.status);
          successOut.setValue(0, 1);
          doResetOutPins = true;
        },
        error: function(xhr, status) {
          bodyOut.setValue(0, '');
          failOut.setValue(0, 1);
          statusOut.setValue(0, xhr.status);
          doResetOutPins = true;
        }
      });
    }
  }

}
VVVV.Nodes.HTTPGet.prototype = new VVVV.Core.Node();