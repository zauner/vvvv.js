


VVVV.VVVViewer = function(graph, selector) {
    
  // RENDERING
  
  if (!selector) {
    selector = 'vvvv-generated-vvvviewer-'+(new Date()).getTime();
    $('body').append('<div id="'+selector+'">');
    selector = '#'+selector;
  }
  
  $(selector).empty();

  var chart = d3.select(selector)
    .append('svg:svg')
      .attr('class','chart')
      .attr('width', graph.width)
      .attr('height', graph.height);
      
  chart.append('svg:rect')
    .attr('class','background')
    .attr('width', graph.width)
    .attr('height', graph.height)
    .on('dblclick', function() {
      if (graph.parentPatch)
        var subviewer = new VVVV.VVVViewer(graph.parentPatch, selector);
      return false;
    })
    
  var nodes, inputPins, outputPins, links;
    
  this.drawComplete = function() {
    if (nodes)
      nodes.remove();
    if (links)
      links.remove();
    
    // NODES
      
    nodes = chart.selectAll('g.vvvv-node')
      .data(graph.nodeList)
      .enter().append('svg:g')
        .attr('class', function(d) { return d.isIOBox? 'vvvv-node vvvv-iobox' : 'vvvv-node' })
        .attr('id', function(d) { return 'vvvv-node-'+d.id})
        .attr('transform', function(d) { return 'translate('+d.x+','+d.y+')' })
        .on('dblclick', function(n) {
          if (n.isSubpatch)
            var subviewer = new VVVV.VVVViewer(n, selector);
          return false
        })
       
    nodes.append('svg:rect')
      .attr('class', 'vvvv-node-background')
      .attr('height', function(d) { return d.getHeight(); })
      .attr('width', function(d) { return d.getWidth(); })
      .attr('fill', function(d) {
        if (d.isComment())
          return 'rgba(0,0,0,0)';
        else if (d.not_implemented)
          return 'rgba(255,0,0,1)';
        else if (d.isIOBox && d.IOBoxType()=="Color") {
          var col = d.IOBoxInputPin().getValue(0).split(',');
          for (var i=0; i<col.length; i++) {
            col[i] = parseInt(col[i]*256);
          }
          return 'rgba('+col.join(',')+')';
        }
        else
          return '#cdcdcd';
      })
    
    nodes.append('svg:rect')
      .attr('class', 'vvvv-node-pinbar')
      .attr('height', function (d) { return d.isIOBox? 2 : 4 })
      .attr('fill', function(d) { return d.isIOBox? "#dddddd" : "#9a9a9a"; })
      .attr('width', function(d) { return d.getWidth(); })
      
    nodes.append('svg:rect')
      .attr('class', 'vvvv-node-pinbar')
      .attr('y',function(d) { return d.isIOBox? d.getHeight() -2 : d.getHeight()-4; })
      .attr('height', function (d) { return d.isIOBox? 2 : 4 })
      .attr('fill', function(d) { return d.isIOBox? "#dddddd" : "#9a9a9a"; })
      .attr('width', function(d) { return d.getWidth(); })
      
    nodes.append('svg:text')
      .text(function(d) { return (d.invisiblePins["Descriptive Name"]) ? d.invisiblePins["Descriptive Name"].getValue(0) : null })
      .attr('class', 'vvvv-node-descriptive-name')
      .attr('shape-rendering', 'crispEdges')
      .attr('dy', function(d) { return d.getHeight()+12 })
      .attr('font-size', 10)
      .attr('font-family', 'Lucida Sans Unicode')
      
    nodes.selectAll('text.vvvv-node-label')
      .data(function(d) {
        if (!d.isIOBox)
          return [ d.label() ];
        else {
          ret = [];
          for (i=0; i<d.IOBoxRows(); i++) {
            var v = d.IOBoxInputPin().getValue(i);
            if (typeof v == "string")
              v = v.substr(0,8);
            else if (typeof v == "number")
              v = v.toFixed(4);
            ret.push(v);
          }
          return ret;
        }
      })
      .enter().append('svg:text')
        .text(function(d) { return d; })
        .attr('class', 'vvvv-node-label')
        .attr('shape-rendering', 'crispEdges')
        .attr('dy', function(d, i) { 
          return i*12+12;
        })
        .attr('dx', 4)
        .attr('font-size', 10)
        .attr('font-family', 'Lucida Sans Unicode');
      
    // INPUT PINS
      
    inputPins = nodes.selectAll('g.vvvv-input-pin')
      .data(function(d) { 
        if (d.isSubpatch)
          return _(d.inputPins).sortBy(function(p) { return p.slavePin ? p.slavePin.node.x : 1 }).map(function(p,k) { return p });
        else
          return _(d.inputPins).map(function(p,k) { return p });
      })
      .enter().append('svg:g')
        .attr('class', 'vvvv-input-pin')
        .attr('transform', function(d, i) {
          pinOffset = 0;
          if (_(d.node.inputPins).size()>1)
            pinOffset = (d.node.getWidth()-4)/(_(d.node.inputPins).size()-1);
          d.y = 0;
          d.x = i*pinOffset;
          //if (d.node.isIOBox)
          //  d.x = d.node.getWidth() - d.x - 4;
          return 'translate('+d.x+', 0)';
        })
        
    inputPins.append('svg:rect')
      .attr('width', 4)
      .attr('height', 4)
      .attr('fill', function(d) { return d.node.isComment() ? 'rgba(0,0,0,0)' : '#666666' })
      .on('mouseover', function(d, i) {
        d3.selectAll('#vvvv-node-'+d.node.id+' g.vvvv-input-pin').filter(function(d, j) { return j==i }).each(function() {
          d3.select(this).append('svg:rect')
            .attr('class', 'vvvv-input-pin-highlight')
            .attr('width', 4)
            .attr('height', 4)
            .attr('fill', 'rgba(0,0,0,1)')
            .attr('y', -4)
            
          d3.select(this).append('svg:text')
            .text(function(d) {
              if (d.getSliceCount()>1)
                return d.pinname+"("+d.getSliceCount()+"): "+d.getValue(0);
              else
                return d.pinname+": "+d.getValue(0);
            })
            .attr('dy', 30)
            .attr('font-size', 10)
            .attr('font-family', 'Lucida Sans Unicode')
            .attr('fill', 'rgba(0,0,0,1)');
        });
      })
      .on('mouseout', function(d, i) {
        d3.selectAll('#vvvv-node-'+d.node.id+' g.vvvv-input-pin text').remove();
        d3.selectAll('#vvvv-node-'+d.node.id+' g.vvvv-input-pin rect.vvvv-input-pin-highlight').remove();
      })
      
    outputPins = nodes.selectAll('g.vvvv-output-pin')
      .data(function(d) { return _(d.outputPins).map(function(p,k) { return p }); })
      .enter().append('svg:g')
        .attr('class', 'vvvv-output-pin')
        .attr('transform', function(d, i) {
          pinOffset = 0;
          if (_(d.node.outputPins).size()>1)
            pinOffset = (d.node.getWidth()-4)/(_(d.node.outputPins).size()-1);
          d.y = d.node.getHeight()-4;
          d.x = i*pinOffset;
          //if (d.node.isIOBox)
          //  d.x = d.node.getWidth() - d.x - 4;
          return 'translate('+d.x+', '+d.y+')';
        });
        
    outputPins.append('svg:rect')
      .attr('width', 4)
      .attr('height', 4)
      .attr('fill', function(d) { return d.node.isComment() ? 'rgba(0,0,0,0)' : '#666666' })
      .on('mouseover', function(d, i) {
        d3.selectAll('#vvvv-node-'+d.node.id+' g.vvvv-output-pin').filter(function(d, j) { return j==i }).each(function() {
          d3.select(this).append('svg:rect')
            .attr('class', 'vvvv-output-pin-highlight')
            .attr('width', 4)
            .attr('height', 4)
            .attr('fill', 'rgba(0,0,0,1)')
            .attr('y', -4)
            
          d3.select(this).append('svg:text')
            .text(function(d) {
              if (d.getSliceCount()>1)
                return d.pinname+"("+d.getSliceCount()+"): "+d.getValue(0);
              else
                return d.pinname+": "+d.getValue(0);
            })
            .attr('dy', 30)
            .attr('font-size', 10)
            .attr('font-family', 'Lucida Sans Unicode')
            .attr('fill', 'rgba(0,0,0,1)');
        });
      })
      .on('mouseout', function(d, i) {
        d3.selectAll('#vvvv-node-'+d.node.id+' g.vvvv-output-pin text').remove();
        d3.selectAll('#vvvv-node-'+d.node.id+' g.vvvv-output-pin rect.vvvv-output-pin-highlight').remove();
      })
      
      
    links = chart.selectAll('line.vvvv-link')
      .data(graph.linkList)
      .enter().append('svg:line')
        .attr('class', 'vvvv-link')
        //.attr('shape-rendering', 'crispEdges')
        .attr('x1', function(d) { return d.fromPin.x + d.fromPin.node.x + 2 + .5 })
        .attr('y1', function(d) { return d.fromPin.y + d.fromPin.node.y + 4 + .5 })
        .attr('x2', function(d) { return d.toPin.x + d.toPin.node.x + 2 + .5 })
        .attr('y2', function(d) { return d.toPin.y + d.toPin.node.y + .5 });
    
    $('line.vvvv-link').insertAfter($('.chart>rect')); // move links to the top, to get the right drawing order
  }
  this.drawComplete();
      
  this.redraw = function() {
    nodes.selectAll('text.vvvv-node-label')
      .data(function(d) {
        if (!d.isIOBox)
          return [ d.label() ];
        else {
          ret = [];
          for (i=0; i<d.IOBoxRows(); i++) {
            var v = d.IOBoxInputPin().getValue(i);
            if (typeof v == "string")
              v = v.substr(0, d.getWidth()/5);
            else if (typeof v == "number")
              v = v.toFixed(4);
          ret.push(v);
          }
          return ret;
        }
      })
      .text(function(d) { return d; });
  }
  
  this.destroy = function() {
    $(selector).empty();
  }
  
  graph.afterEvaluate = this.redraw;
  graph.afterUpdate = this.drawComplete;
  
}

