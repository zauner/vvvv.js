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
 NODE: CanvasD3 (2d)
 Author(s): 'Constantine Nisidis'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.CanvasD3 = function(id, graph) {
  this.constructor(id, "Canvas (D3)", graph);

  this.meta = {
    authors: ['Constantine Nisidis'],
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

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: CircleD3 (HTML)
 Author(s): Constantine Nisidis
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.CircleD3 = function(id, graph) {
  this.constructor(id, "CircleD3 (HTML)", graph);

  this.meta = {
    authors: ['c nisidis'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.environments = ['browser'];

  var elementIn = this.addInputPin("Element", [], VVVV.PinTypes.HTMLLayer);
  var cxIn = this.addInputPin("cx", [50], VVVV.PinTypes.Value);
  var cyIn = this.addInputPin("cy", [50], VVVV.PinTypes.Value);
  var rIn = this.addInputPin("r", [20], VVVV.PinTypes.Value);
  var fillIn = this.addInputPin("fill", [], VVVV.PinTypes.Color);
  var strokeIn = this.addInputPin("stroke", [], VVVV.PinTypes.Color);
  var applyIn = this.addInputPin("Apply", [0], VVVV.PinTypes.Value);
  var binSizeIn = this.addInputPin("Class BinSize", [-1], VVVV.PinTypes.Value);

  var outputNode = this.addOutputPin("LayerD3", [-1], VVVV.PinTypes.Node);

  //var canvas =  d3.select("body").append("svg").attr("width", 500).attr("height", 500).attr("id", "d3canvas");

  this.evaluate = function() {

    var maxSpreadSize = elementIn.getSliceCount();
    // if (!elementIn.isConnected() || elementIn.getValue(0).tagName=='' )
    //   return;

    var attrIdx = 0;
    // var attrCount = attributeIn.getSliceCount();
    var attrCount = Math.max(cxIn.getSliceCount(), cyIn.getSliceCount());
    var posBinSize = binSizeIn.getValue(0) >= 0;

    var e;
    circles = [];

    for (var i=0; i<attrCount; i++) {

      if (posBinSize)
        attrCount = binSizeIn.getValue(i);
      //removed line because it was itterating i*j times the inputs
      //for (var j=0; j<attrCount; j++) {
        if (cxIn.getValue(attrIdx)!='' && applyIn !=0) {

          console.log(attrIdx);

          // circle = this.canvas.append("circle")
					// 						.attr("cx", cxIn.getValue(i))
					// 						.attr("cy", cyIn.getValue(i))
					// 						.attr("r", rIn.getValue(i))
					// 						.attr("fill", "#ff0000");

          attrIdx++;
        }

      //}
    }

  }
  if (this.applyIn != 0){
    this.evaluate();
  }

  //cnavas.innerHTML('');
}
VVVV.Nodes.CircleD3.prototype = new Node();

});
