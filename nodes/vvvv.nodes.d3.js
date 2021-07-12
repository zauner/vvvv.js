// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }
define(function(require,exports) {

var $ = require('jquery');
//var d3 = require('lib/d3/d3.v6.min');

require('d3');
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
                    .gravity(0.01)
                    .charge(100)
                    .friction(0.1)
                    .linkDistance( function(d) { return d.value * 20 } )
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

          console.log(graph)
        }
  





  }
      
  }

}
VVVV.Nodes.ForceDirectedGraph2.prototype = new Node();





/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Cooarchi_ForceDirected (D3)
 Author(s): 'Luna Nane'

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Cooarchi_ForceDirected = function(id, graph) {
  this.constructor(id, "Cooarchi_ForceDirected (D3)", graph);

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
  
  var updateGraph = this.addInputPin("update Graph", [], VVVV.PinTypes.Value);


  var initialized = 0;
  var graph;

  var width = 1000,
  height = 1000;
  var dataIn= "{}";
  var dataObj={};
  
  this.initialize = function() {
    

  }

  // evaluate() will be called each frame
  // (if the input pins have changed, or the nodes is flagged as auto-evaluating)
  this.evaluate = function() {

if(updateIn.getValue(0)==1){

  
    var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("border", "1px solid black");

var view = svg.append("view")
    .attr("id", "view")
    .attr("viewBox", "500 500 1000 1000");

var path = svg.append("g").selectAll("path"),
    circle = svg.append("g").selectAll("circle"),
    hypertext = svg.append("g").selectAll("text");

    initialized = 1;
}




if(initialized ==1){

var force = d3.layout.force()
    .size([width, height])
    .linkDistance(60)
    .charge(-300)
    .gravity(0.2)
    .on("tick", tick);





        if(updateGraph.getValue(0)==1){

          dataIn = graphIn.getValue(0) ;
          dataObj = JSON.parse(dataIn );
          var data = dataObj ;

          console.log(data);


          var nodes = data.nodes;
          var links = data.links;

          update(links);
        }

        if(AddIn.getValue(0)==1){

          console.log("add node")
          var e1 = element1In.getValue(0);
          var e2 = element2In.getValue(1);
          addNode(e1);
          addNode(e2);
          addLink(e1, e2, '20');
          console.log(data.nodes);
          console.log('hit');
      
      }


function update(links) {
    // Compute the distinct nodes from the links.
    links.forEach(function (link) {
        link.source = nodes[link.source];
        link.target = nodes[link.target];
    });

    force.nodes(nodes)
        .links(links)
        .start();

    // -------------------------------

    // Compute the data join. This returns the update selection.
    path = path.data(force.links());

    // Remove any outgoing/old paths.
    path.exit().remove();

    // Compute new attributes for entering and updating paths.
    path.enter().append("path")
        .attr("class", "link")
        .style("stroke", function (d) {
            return d3.rgb(5*d.value, 200+d.value, 127-2*d.value);
         })
        .attr("marker-end", "url(#arrow)");
  
    // -------------------------------

    // Compute the data join. This returns the update selection.
    circle = circle.data(force.nodes());

    // Add any incoming circles.
    circle.enter().append("circle");

    // Remove any outgoing/old circles.
    circle.exit().remove();

    // Compute new attributes for entering and updating circles.
    circle.attr("r", 6)
        .attr("is", function(d){return "node-"+d.name})
        .call(force.drag);


    // Compute the data join. This returns the update selection.
    hypertext  = hypertext .data(force.nodes());

    // Add any incoming texts.
    hypertext.enter().append("text")
        .append("a")
    //.attr("xlink:show", "new")
        .attr("target", "_blank");

    // Remove any outgoing/old texts.
    hypertext.exit().remove();

    // Compute new attributes for entering and updating texts.
    hypertext.attr("x", 8)
        .attr("y", ".31em")
    .select("a")    
    .attr("xlink:href", function (d) {
        return "http://example.com/" + d.name;
    })
    .text(function (d) {
        return d.name;
    });
}

// Use elliptical arc path segments to doubly-encode directionality.
function tick() {
    path.attr("d", linkArc);
    circle.attr("transform", transform);
    hypertext.attr("transform", transform);
}

function linkArc(d) {
    var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = Math.sqrt(dx * dx + dy * dy);
    return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
}

function transform(d) {
    return "translate(" + d.x + "," + d.y + ")";
}


function getData() {
    return {"nodes":[{"name":"1011101"},{"name":"112176121201"},{"name":"112176121205"},{"name":"112176121207"},{"name":"112176121211"},{"name":"10111016"},{"name":"103715"},{"name":"1013112"},{"name":"2161977265"},{"name":"512512029"},{"name":"10131830"},{"name":"15755133206"},{"name":"15756107158"},{"name":"6555138158"},{"name":"1013228156"},{"name":"17325211027"},{"name":"101322881"},{"name":"51195213199"},{"name":"51217228210"},{"name":"1013232129"},{"name":"17631180173"},{"name":"51217211178"},{"name":"1013232220"},{"name":"161691320"},{"name":"655519293"},{"name":"8211616"},{"name":"10132329"},{"name":"10816817082"},{"name":"2062078167"},{"name":"101710921"},{"name":"10171615"},{"name":"7112522121"},{"name":"767112860"},{"name":"1017172"},{"name":"10171737"},{"name":"501820111"},{"name":"1017186"},{"name":"1017228203"},{"name":"51228210221"},{"name":"791257132"},{"name":"101723218"},{"name":"1731911337"},{"name":"1992776185"},{"name":"20712316126"},{"name":"6121525580"},{"name":"62212831"},{"name":"66251100192"},{"name":"6916120216"},{"name":"9318121690"},{"name":"10191119"},{"name":"1019228101"},{"name":"11217712"},{"name":"101922827"},{"name":"1019983"},{"name":"1021101"},{"name":"137135212181"},{"name":"7111911887"},{"name":"10211022"},{"name":"10211322"},{"name":"102123282"},{"name":"1072017223"},{"name":"10721121191"},{"name":"1072120695"},{"name":"10721237215"},{"name":"10722216218"},{"name":"232116135"},{"name":"232116820"},{"name":"232117911"},{"name":"232117980"},{"name":"232117998"},{"name":"232120365"},{"name":"2321213201"},{"name":"2321237118"},{"name":"232315971"},{"name":"501981226"},{"name":"10301026"},{"name":"1030981"},{"name":"15755133201"},{"name":"51209150252"},{"name":"103610323"},{"name":"1037228158"},{"name":"1037228182"},{"name":"1037228187"},{"name":"1111682183"},{"name":"237818179"},{"name":"1037228192"},{"name":"106910129"},{"name":"1069117"},{"name":"2085017021"},{"name":"31137133"},{"name":"692821350"},{"name":"10691222"},{"name":"106912330"},{"name":"2331197163"},{"name":"597200"},{"name":"10691311"},{"name":"6131231235"},{"name":"106913222"},{"name":"10691332"},{"name":"6275138232"},{"name":"9612611653"},{"name":"10691611"},{"name":"1069221100"},{"name":"13713516875"},{"name":"51228210163"},{"name":"1069221169"},{"name":"23231111"},{"name":"501718395"},{"name":"106922181"},{"name":"10720113205"},{"name":"107212027"},{"name":"10721225131"},{"name":"1072196207"},{"name":"1763128131"},{"name":"18173161236"},{"name":"18173193172"},{"name":"18173209155"},{"name":"2321170103"},{"name":"2321223235"},{"name":"2323129216"},{"name":"2323231103"},{"name":"232397189"},{"name":"5016192111"},{"name":"1069232138"},{"name":"10922861"},{"name":"176311873"},{"name":"5122820719"},{"name":"109232115"},{"name":"50112101217"},{"name":"51211213193"},{"name":"51211213202"},{"name":"109317"},{"name":"106912"},{"name":"109513"},{"name":"109325"},{"name":"20717911119"},{"name":"192168111"},{"name":"2131367010"},{"name":"192168110"},{"name":"216218117189"},{"name":"617058139"},{"name":"6323631225"},{"name":"68232199157"},{"name":"68232199158"},{"name":"68232199159"},{"name":"9319111798"}],"links":[{"source":0,"target":1,"value":1},{"source":0,"target":2,"value":1},{"source":0,"target":3,"value":1},{"source":0,"target":4,"value":1},{"source":5,"target":6,"value":4},{"source":7,"target":8,"value":1},{"source":7,"target":9,"value":1},{"source":10,"target":11,"value":1},{"source":10,"target":12,"value":1},{"source":10,"target":13,"value":1},{"source":14,"target":15,"value":1},{"source":16,"target":17,"value":1},{"source":16,"target":18,"value":1},{"source":19,"target":20,"value":1},{"source":19,"target":21,"value":1},{"source":22,"target":23,"value":1},{"source":22,"target":24,"value":1},{"source":22,"target":25,"value":1},{"source":26,"target":27,"value":1},{"source":26,"target":28,"value":1},{"source":29,"target":6,"value":17},{"source":30,"target":31,"value":1},{"source":30,"target":32,"value":1},{"source":33,"target":6,"value":8},{"source":34,"target":35,"value":1},{"source":36,"target":6,"value":1},{"source":37,"target":38,"value":1},{"source":37,"target":39,"value":1},{"source":40,"target":41,"value":1},{"source":40,"target":42,"value":1},{"source":40,"target":43,"value":1},{"source":40,"target":44,"value":1},{"source":40,"target":45,"value":2},{"source":40,"target":46,"value":1},{"source":40,"target":47,"value":1},{"source":40,"target":48,"value":5},{"source":49,"target":35,"value":1},{"source":50,"target":51,"value":2},{"source":52,"target":15,"value":1},{"source":53,"target":6,"value":3},{"source":54,"target":55,"value":1},{"source":54,"target":56,"value":1},{"source":57,"target":6,"value":2},{"source":58,"target":6,"value":183},{"source":59,"target":60,"value":1},{"source":59,"target":61,"value":1},{"source":59,"target":62,"value":1},{"source":59,"target":63,"value":1},{"source":59,"target":64,"value":1},{"source":59,"target":65,"value":1},{"source":59,"target":66,"value":1},{"source":59,"target":67,"value":1},{"source":59,"target":68,"value":1},{"source":59,"target":69,"value":1},{"source":59,"target":70,"value":1},{"source":59,"target":71,"value":1},{"source":59,"target":72,"value":1},{"source":59,"target":73,"value":1},{"source":59,"target":74,"value":1},{"source":75,"target":15,"value":1},{"source":76,"target":77,"value":1},{"source":76,"target":78,"value":1},{"source":79,"target":6,"value":2},{"source":80,"target":51,"value":2},{"source":81,"target":51,"value":2},{"source":82,"target":83,"value":1},{"source":82,"target":84,"value":1},{"source":85,"target":51,"value":1},{"source":86,"target":6,"value":76},{"source":87,"target":88,"value":1},{"source":87,"target":89,"value":1},{"source":87,"target":90,"value":3},{"source":91,"target":6,"value":5},{"source":92,"target":93,"value":1},{"source":92,"target":94,"value":1},{"source":95,"target":6,"value":3},{"source":95,"target":96,"value":1},{"source":97,"target":6,"value":3},{"source":98,"target":99,"value":1},{"source":98,"target":100,"value":1},{"source":101,"target":6,"value":1},{"source":102,"target":103,"value":1},{"source":102,"target":104,"value":1},{"source":105,"target":106,"value":1},{"source":105,"target":107,"value":1},{"source":108,"target":109,"value":1},{"source":108,"target":110,"value":1},{"source":108,"target":111,"value":1},{"source":108,"target":112,"value":1},{"source":108,"target":113,"value":1},{"source":108,"target":114,"value":1},{"source":108,"target":115,"value":1},{"source":108,"target":116,"value":1},{"source":108,"target":117,"value":1},{"source":108,"target":118,"value":1},{"source":108,"target":119,"value":1},{"source":108,"target":120,"value":1},{"source":108,"target":121,"value":1},{"source":108,"target":122,"value":1},{"source":123,"target":51,"value":2},{"source":124,"target":125,"value":1},{"source":124,"target":126,"value":1},{"source":127,"target":128,"value":1},{"source":127,"target":129,"value":1},{"source":127,"target":130,"value":1},{"source":131,"target":132,"value":1},{"source":131,"target":133,"value":1},{"source":134,"target":135,"value":4},{"source":136,"target":135,"value":1},{"source":135,"target":134,"value":4},{"source":135,"target":136,"value":1},{"source":137,"target":138,"value":9},{"source":139,"target":138,"value":2},{"source":140,"target":136,"value":1},{"source":141,"target":138,"value":1},{"source":142,"target":136,"value":1},{"source":143,"target":136,"value":1},{"source":144,"target":136,"value":1},{"source":145,"target":136,"value":1}],"records":119};
}

// Add and remove elements on the graph object
addNode = function (id) {
  data.nodes.push({"name": id});
  update(links);
};

addLink = function (source, target, value) {
  data.links.push({"source": findNode(source), "target": findNode(target), "value": value});
  update(links);
};











    }
      
  }

}
VVVV.Nodes.Cooarchi_ForceDirected.prototype = new Node();





});
