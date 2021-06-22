// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }
define(function(require,exports) {

var Node = require('core/vvvv.core.node');
var VVVV = require('core/vvvv.core.defines');
var $ = require('jquery');

VVVV.Types.Json = function() {
  this.name = "root";
  this.data = '';
}

VVVV.PinTypes.Json = {
  typeName: "Json",
  reset_on_disconnect: true,
  defaultValue: function() {
    return new VVVV.Types.Json();
  }
}



/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: AsJSON (JSON)
 Author(s): 'JSON'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AsJson = function(id, graph) {
  this.constructor(id, "AsJson (JSON)", graph);

  this.meta = {
    authors: ['Luna Nane'],
    original_authors: [''],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  // input pins
  var jsonIn = this.addInputPin('JSON', ['{"vvvv.js":"awesome"}'], VVVV.PinTypes.String);

  // output pins
  var elementOut = this.addOutputPin('Output Node', [], VVVV.PinTypes.XElement);
  var successOut = this.addOutputPin('Success', [0], VVVV.PinTypes.Value)

  var element = new VVVV.Types.Json();
  var success = 0;

  this.evaluate = function() {

    try {
      element.data = JSON.parse(jsonIn.getValue(0));
      success = 1;
    }
    catch (ex) {
      element.data = {};
      success = 0;
      console.log(ex);
    }

    elementOut.setValue(0, element);
    successOut.setValue(0, success);
  }

}
VVVV.Nodes.AsJson.prototype = new Node();


});
