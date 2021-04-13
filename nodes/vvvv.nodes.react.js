// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }
define(function(require,exports) {

var Node = require('core/vvvv.core.node');
var VVVV = require('core/vvvv.core.defines');


VVVV.Types.Scene = function(data) {
  this.data = data;
  }

VVVV.PinTypes.Scene = {
  typeName: "Scene",
  reset_on_disconnect: true,
  defaultValue: function() {
    return "No Scene"
  }
}

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: ReactTest (react)
 Author(s): Luna Nane

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/


    VVVV.Nodes.ReactTest = function(id, graph) {
        this.constructor(id, "ReactTest (react)", graph);

        this.meta = {
          authors: ['Luna Nane'],
          original_authors: [],
          credits: [],
          compatibility_issues: []
        };

        this.auto_evaluate = true;


        var InputPin1 = this.addInputPin('Input', [ 0 ], VVVV.PinTypes.Value);
        var OutputPin1 = this.addOutputPin('Output', [ 0 ], VVVV.PinTypes.Value);


          this.evaluate = function()
          {

            var input = InputPin1.getValue(0);

            OutputPin1.setValue(input, 0);


          }
    }
    VVVV.Nodes.ReactTest.prototype = new Node();
    //VVVV.Nodes.ReactTest.requirements = ["react-dom"];
    //VVVV.Nodes.ReactTest.requirements = ["react"];



});
