// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.


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
    
    var pinsChanged = urlIn.pinIsChanged() || nameIn.pinIsChanged() || valueIn.pinIsChanged() || (refreshIn.pinIsChanged() && refreshIn.getValue(0)==1);
    
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
VVVV.Nodes.HTTPGet.prototype = new VVVV.Core.Node();