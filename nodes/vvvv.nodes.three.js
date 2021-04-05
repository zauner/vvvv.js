// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }
define(function(require,exports) {

var $ = require('jquery');
var _ = require('underscore');
var Node = require('core/vvvv.core.node');
var VVVV = require('core/vvvv.core.defines');


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Scene (three)
 Author(s): 'Luna'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.CanvasD3 = function(id, graph) {
  this.constructor(id, "Canvas (D3)", graph);

  this.meta = {
    authors: ['Luna'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  // input pins
  var elementIn = this.addInputPin('Layer(D3)',[], VVVV.PinTypes.Node );
  var widthIn = this.addInputPin('width', [512], VVVV.PinTypes.Value);
  var heightIn = this.addInputPin('height', [512], VVVV.PinTypes.Value);



  // evaluate() will be called each frame
  // (if the input pins have changed, or the nodes is flagged as auto-evaluating)
  this.evaluate = function() {

    var idx = 0;
    for (var i=0; i<widthIn.getSliceCount(); i++) {
        idx++;
    }

    canvas = d3.select("body")
                .append("svg")
                .attr("width", widthIn.getValue(0))
                .attr("height", heightIn.getValue(0));

    //youtOut.setSliceCount(idx);
  }

}
VVVV.Nodes.CanvasD3.prototype = new Node();



});
