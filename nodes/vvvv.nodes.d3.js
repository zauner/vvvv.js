// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }
define(function(require,exports) {

var $ = require('jquery');
var d3 = require('lib/d3-v4/d3.v4.min');
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
  var LayerIn = this.addInputPin('Layer(D3)',[], VVVV.PinTypes.Node );
  var elementIn = this.addInputPin("Element", [], VVVV.PinTypes.HTMLLayer);


  var widthIn = this.addInputPin('width', [512], VVVV.PinTypes.Value);
  var heightIn = this.addInputPin('height', [512], VVVV.PinTypes.Value);



  // evaluate() will be called each frame
  // (if the input pins have changed, or the nodes is flagged as auto-evaluating)
  this.evaluate = function() {

  

    var element = $("body");
    if (elementIn.isConnected()){
      var element = elementIn.getValue(i).element[0];

    }
    console.log( "test" + element);


    
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


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: ForceDirectedGraph (D3)
 Author(s): 'Luna Nane'

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.ForceDirectedGraph = function(id, graph) {
  this.constructor(id, "ForceDirectedGraph (D3)", graph);

  this.meta = {
    authors: ['Luna Nane'],
    original_authors: ['d3'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;





  // evaluate() will be called each frame
  // (if the input pins have changed, or the nodes is flagged as auto-evaluating)
  this.evaluate = function() {

    
    


    var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

    console.log("anything" + svg);

var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

d3.json("miserables.json", function(error, graph) {
  if (error) throw error;

  var link = svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
      .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

  var node = svg.append("g")
      .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes)
    .enter().append("circle")
      .attr("r", 5)
      .attr("fill", function(d) { return color(d.group); })
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

  node.append("title")
      .text(function(d) { return d.id; });

  simulation
      .nodes(graph.nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(graph.links);

  function ticked() {
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  }
});

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

    
  }

}
VVVV.Nodes.ForceDirectedGraph.prototype = new Node();



});
