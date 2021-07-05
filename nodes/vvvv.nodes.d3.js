// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }
define(function(require,exports) {

var $ = require('jquery');
var d3 = require('https://d3js.org/d3.v3.min.js');
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


  var graphIn = this.addInputPin("Graph Json", [], VVVV.PinTypes.String);
  var updateIn = this.addInputPin("Update", [], VVVV.PinTypes.Value);

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

var graph = graphIn.getValue(0);

d3.json("miserables.json", function(error, graph) {

//if( updateIn.pinIsChanged() && updateIn.getValue(0) == 1){
  
  //var graph = JSON.stringify(graphIn.getValue(0));
  console.log(graph);

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
//}
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

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: ForceDirectedGraph2 (D3)
 Author(s): 'Luna Nane'

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.ForceDirectedGraph2 = function(id, graph) {
  this.constructor(id, "ForceDirectedGraph2 (D3)", graph);

  this.meta = {
    authors: ['Luna Nane'],
    original_authors: ['d3'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  var graphIn = this.addInputPin("Graph Json", [], VVVV.PinTypes.String);
  
  var updateIn = this.addInputPin("Update", [], VVVV.PinTypes.Value);

  var element1In = this.addInputPin("Element1", [], VVVV.PinTypes.String);
  var linksIn = this.addInputPin("Connection", [], VVVV.PinTypes.String);
  var element2In = this.addInputPin("Element2", [], VVVV.PinTypes.String);

  var AddIn = this.addInputPin("Add", [], VVVV.PinTypes.Value);

  var initialized = 0;
  var graph;
  this.initialize = function() {



  }

  // evaluate() will be called each frame
  // (if the input pins have changed, or the nodes is flagged as auto-evaluating)
  this.evaluate = function() {

   


        // because of the way the network is created, nodes are created first, and links second,
    // so the lines were on top of the nodes, this just reorders the DOM to put the svg:g on top
    function keepNodesOnTop() {
      $(".nodeStrokeClass").each(function( index ) {
          var gnode = this.parentNode;
          gnode.parentNode.appendChild(gnode);
      });
  }
  function addNodes() {
      d3.select("svg")
              .remove();
       drawGraph();
  }



    function myGraph() {

        // Add and remove elements on the graph object
        this.addNode = function (id) {
            nodes.push({"id": id});
            update();
        };

        this.removeNode = function (id) {
            var i = 0;
            var n = findNode(id);
            while (i < links.length) {
                if ((links[i]['source'] == n) || (links[i]['target'] == n)) {
                    links.splice(i, 1);
                }
                else i++;
            }
            nodes.splice(findNodeIndex(id), 1);
            update();
        };

        this.removeLink = function (source, target) {
            for (var i = 0; i < links.length; i++) {
                if (links[i].source.id == source && links[i].target.id == target) {
                    links.splice(i, 1);
                    break;
                }
            }
            update();
        };

        this.removeallLinks = function () {
            links.splice(0, links.length);
            update();
        };

        this.removeAllNodes = function () {
            nodes.splice(0, links.length);
            update();
        };

        this.addLink = function (source, target, value) {
            links.push({"source": findNode(source), "target": findNode(target), "value": value});
            update();
        };

        var findNode = function (id) {
            for (var i in nodes) {
                if (nodes[i]["id"] === id) return nodes[i];
            }
            ;
        };

        var findNodeIndex = function (id) {
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].id == id) {
                    return i;
                }
            }
            ;
        };


        var color = d3.scale.category10();

       

        var force = d3.layout.force();

        var nodes = force.nodes(),
                links = force.links();

        var update = function () {
            var link = vis.selectAll("line")
                    .data(links, function (d) {
                        return d.source.id + "-" + d.target.id;
                    });

            link.enter().append("line")
                    .attr("id", function (d) {
                        return d.source.id + "-" + d.target.id;
                    })
                    .attr("stroke-width", function (d) {
                        return d.value / 10;
                    })
                    .attr("class", "link");
            link.append("title")
                    .text(function (d) {
                        return d.value;
                    });
            link.exit().remove();

            var node = vis.selectAll("g.node")
                    .data(nodes, function (d) {
                        return d.id;
                    });

            var nodeEnter = node.enter().append("g")
                    .attr("class", "node")
                    .call(force.drag);

            nodeEnter.append("svg:circle")
                    .attr("r", 12)
                    .attr("id", function (d) {
                        return "Node;" + d.id;
                    })
                    .attr("class", "nodeStrokeClass")
                    .attr("fill", function(d) { return color(d.id); });

            nodeEnter.append("svg:text")
                    .attr("class", "textClass")
                    .attr("x", 14)
                    .attr("y", ".31em")
                    .text(function (d) {
                        return d.id;
                    });

            node.exit().remove();

            force.on("tick", function () {

                node.attr("transform", function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });

                link.attr("x1", function (d) {
                    return d.source.x;
                })
                        .attr("y1", function (d) {
                            return d.source.y;
                        })
                        .attr("x2", function (d) {
                            return d.target.x;
                        })
                        .attr("y2", function (d) {
                            return d.target.y;
                        });
            });

            // Restart the force layout.
            force
                    .gravity(.01)
                    .charge(-80000)
                    .friction(0)
                    .linkDistance( function(d) { return d.value * 10 } )
                    .size([w, h])
                    .start();
        };


        // Make it all go
        update();
    }


    
    if(updateIn.getValue(0)==1){
      
      // set up the D3 visualisation in the specified element
      var w = 960,
              h = 450;

    var vis = d3.select("body")
    .append("svg:svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("id", "svg")
    .attr("pointer-events", "all")
    .attr("viewBox", "0 0 " + w + " " + h)
    .attr("perserveAspectRatio", "xMinYMid")
    .append('svg:g');


    //.call(d3.behavior.zoom().on("zoom", function () {
    //svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
    //}))

    graph = new myGraph("#svgdiv");

    
    initialized = 1;

  }


  if(initialized == 1){


       


        graph.addNode('Sophia');
        graph.addNode('Sophia');
        graph.addNode('Daniel');
        graph.addNode('Ryan');
        graph.addNode('Lila');
        graph.addNode('Suzie');
        graph.addNode('Riley');
        graph.addNode('Grace');
        graph.addNode('Dylan');
        graph.addNode('Mason');
        graph.addNode('Emma');
        graph.addNode('Alex');
        graph.addLink('Alex', 'Ryan', '20');
        graph.addLink('Sophia', 'Ryan', '20');
        graph.addLink('Daniel', 'Ryan', '20');
        graph.addLink('Ryan', 'Lila', '30');
        graph.addLink('Lila', 'Suzie', '20');
        graph.addLink('Suzie', 'Riley', '10');
        graph.addLink('Suzie', 'Grace', '30');
        graph.addLink('Grace', 'Dylan', '10');
        graph.addLink('Dylan', 'Mason', '20');
        graph.addLink('Dylan', 'Emma', '20');
        graph.addLink('Emma', 'Mason', '10');
        keepNodesOnTop();

      

        if(AddIn.getValue(0)>0.5){
          console.log("add node")
        var e1 = element1In.getValue(0);
        var e2 = element2In.getValue(1);


          graph.addNode(e1);
          graph.addNode(e2);
          graph.addLink(e1, e2, '20');
          keepNodesOnTop();
        }
  





  }
      
  }

}
VVVV.Nodes.ForceDirectedGraph2.prototype = new Node();




});
