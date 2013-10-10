
var UIState = {
  'Idle': 0,
  'Connecting': 1,
  'Moving': 2,
  'Creating': 3,
  'Changing': 4
}

VVVV.PinTypes.Generic.openInputBox = function(win, element, pin) {
  
  $('.pininputbox', win.window.document).remove();
  $inputbox = $("<input type='text' value='"+pin.getValue(0)+"' class='pininputbox'/>");
  $('body', win.window.document).append($inputbox);
  $inputbox.css('left', $(element).offset().left);
  $inputbox.css('top', $(element).offset().top);
  $inputbox.get(0).select();
  
  $inputbox.change(function() {
    pin.node.parentPatch.doLoad("<PATCH><NODE id='"+pin.node.id+"'><PIN pinname='"+pin.pinname+"' values='"+$(this).val()+"'/></NODE>");
  });
  $inputbox.keydown(function(e) {
    if (e.which==13) {
      $(this).change();
      $(this).remove();
    }
  });
  $inputbox.bind('mousewheel', function(e) {
    var delta = e.originalEvent.wheelDelta/120;
    var mod = $(this).val()%1;
    if (mod!=NaN) {
      var incr, offset;
      offset = 1;
      incr = delta > 0 ? 1.0 : -1.0;
      if (e.altKey || mod!==0)
        offset = 1.0/100.0;
      incr = incr * offset;
      $(this).val(parseFloat($(this).val())+incr);
      $(this).change();
    }
    e.preventDefault();
    return false;
  });
  $inputbox.bind('DOMMouseScroll', function(e) {
    var delta = -e.originalEvent.detail/3;
    var mod = $(this).val()%1;
    if (mod!=NaN) {
      var incr;
      incr = delta > 0 ? 1.0 : -1.0;
      if (mod!==0)
        incr = incr/100.0;
      $(this).val(parseFloat($(this).val())+incr);
      $(this).change();
    }
    e.preventDefault();
    return false;
  })
}

VVVV.Editors.BrowserEditor = {}

VVVV.Editors.BrowserEditor.PatchWindow = function(p) {
  
  this.state = UIState.Idle;
  
  var dragStart = {x: 0, y: 0};
  var chart, nodes, inputPins, outputPins, links;
  var linkStart = undefined;
  var selectedNodes = [];
  var patch = p;
  var maxNodeId = 0;
  
  this.window = window.open(VVVV.Root+'patch.html', p.nodename, "location=no, width="+p.width+", height="+p.height+", toolbar=no" );
  
  var thatWin = this;
  window.setTimeout(function() {
    for (var i=0; i<patch.nodeList.length; i++) {
      maxNodeId = Math.max(maxNodeId, patch.nodeList[i].id);
    }
    
    thatWin.window.document.title = p.nodename;
    root = d3.select(thatWin.window.document.body);
    
    chart = root
    .append('svg:svg')
      .attr('class','chart')
      .attr('width', patch.width)
      .attr('height', patch.height)
      .on('mousemove', function() {
        if (thatWin.state==UIState.Connecting) {
          chart.select('line.vvvv-link.current-link')
            .attr('x2', d3.event.pageX-4)
            .attr('y2', d3.event.pageY-1)
        }
        else if (thatWin.state==UIState.Moving) {
          var dx = d3.event.pageX - dragStart.x;
          var dy = d3.event.pageY - dragStart.y;
          // during drag, data and visualization are out of sync, as node.x/node.y do not match the position in the graphics
          chart.selectAll('.vvvv-node.selected')
            .attr('transform', function(d) { return 'translate('+(d.x+dx)+','+(d.y+dy)+')' })
          for (var i=0; i<selectedNodes.length; i++) {
            var n = selectedNodes[i];
            chart.selectAll('.vvvv-link')
              .filter(function(d) { return d.fromPin.node.id == n.id })
              .attr('x1', function(d) { return d.fromPin.x + d.fromPin.node.x + dx })
              .attr('y1', function(d) { return d.fromPin.y + d.fromPin.node.y + dy })
            chart.selectAll('.vvvv-link')
              .filter(function(d) { return d.toPin.node.id == n.id })
              .attr('x2', function(d) { return d.toPin.x + d.toPin.node.x + dx })
              .attr('y2', function(d) { return d.toPin.y + d.toPin.node.y + dy })
          }
        }
      })
      .on('contextmenu', function() {
        if (thatWin.state==UIState.Connecting) {
          chart.select('line.vvvv-link.current-link').remove();
          thatWin.state = UIState.Idle;
        }
      })
      .on('mouseup', function() {
        if (thatWin.state==UIState.Moving) {
          thatWin.state=UIState.Idle;
          var dx = d3.event.pageX - dragStart.x;
          var dy = d3.event.pageY - dragStart.y;
          chart.selectAll('.vvvv-node.selected')
            .attr('class', function(d) { return d.isIOBox? 'vvvv-node vvvv-iobox' : 'vvvv-node' })
          var cmd = "<PATCH>";
          for (var i=0; i<selectedNodes.length; i++) {
            var n = selectedNodes[i];
            cmd += "<NODE componentmode='Node' id='"+n.id+"'><BOUNDS type='Node' left='"+(dx+n.x)*15+"' top='"+(dy+n.y)*15+"' width='"+n.width+"' height='"+n.height+"'/></NODE>";
          }
          cmd += "</PATCH>";
          patch.doLoad(cmd);
          patch.afterUpdate();
          selectedNodes = [];
        }
      })
      .on('dblclick', function() {
        $('#node_selection').remove();
        var x = d3.event.pageX;
        var y = d3.event.pageY;
        var $nodeselection = $('<div id="node_selection"><input type="text" id="node_filter"/></div>');
        var $nodeselectionlist = $('<select id="new_node" size="8">');
        $nodeselection.append($nodeselectionlist);        
        $nodeselection.css('left', x);
        $nodeselection.css('top', y);
        
        $('body', thatWin.window.document).append($nodeselection)
        $nodeselection.find('#node_filter').get(0).focus();
        function filterNodes(e) {
          $nodeselectionlist.empty();
          for (var i=0; i<VVVV.NodeNames.length; i++) {
            if (VVVV.NodeNames[i].toLowerCase().indexOf($nodeselection.find('#node_filter').val().toLowerCase())>=0) {
              var $o = $('<option>'+VVVV.NodeNames[i]+'</option>')
              $nodeselectionlist.append($o);
            }
          }
          $nodeselectionlist.find('option').first().attr('selected', true);
        }
        filterNodes();
        $nodeselection.find('#node_filter').keyup(function(e) {
          if (e.which==13) {
            tryAddNode();
            return;
          }
          if (e.which==40) {
            $nodeselectionlist.find('option:selected').first().next().attr('selected', true);
            return false;
          }
          if (e.which==38) {
            $nodeselectionlist.find('option:selected').first().prev().attr('selected', true);
            return false;
          }
          filterNodes();
        });
        
        function tryAddNode() {
          var nodename = $nodeselection.find('#new_node option:selected').val();
          console.log(nodename);
          if (nodename) {
            maxNodeId++;
            var cmd = "<PATCH>";
            cmd += "<NODE componentmode='Hidden' id='"+maxNodeId+"' nodename='"+nodename+"' systemname='"+nodename+"'>";
            cmd += "<BOUNDS type='Node' left='"+x*15+"' top='"+y*15+"' width='100' height='100'/>";
            cmd += "</NODE>";
            cmd += "</NODE>";
            patch.doLoad(cmd);
            patch.afterUpdate();
          }
          $nodeselection.remove();
        }
        $nodeselection.find('#new_node').click(tryAddNode);
      })
      
    chart.append('svg:rect')
    .attr('class','background')
    .attr('width', patch.width)
    .attr('height', patch.height)
    
    thatWin.drawComplete();
    
    //graph.afterEvaluate = this.redraw;
    patch.afterUpdate = thatWin.drawComplete;
  }, 1000);
  
  this.drawComplete = function() {
    if (nodes)
      nodes.remove();
    if (links)
      links.remove();
    
    // NODES
      
    nodes = chart.selectAll('g.vvvv-node')
      .data(patch.nodeList)
      .enter().append('svg:g')
        .attr('class', function(d) { return d.isIOBox? 'vvvv-node vvvv-iobox' : 'vvvv-node' })
        .attr('id', function(d) { return 'vvvv-node-'+d.id})
        .attr('transform', function(d) { return 'translate('+d.x+','+d.y+')' })
       
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
        .attr('font-family', 'Lucida Sans Unicode')
        
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
        chart.selectAll('#vvvv-node-'+d.node.id+' g.vvvv-input-pin').filter(function(d, j) { return j==i }).each(function() {
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
        chart.selectAll('#vvvv-node-'+d.node.id+' g.vvvv-input-pin text').remove();
        chart.selectAll('#vvvv-node-'+d.node.id+' g.vvvv-input-pin rect.vvvv-input-pin-highlight').remove();
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
        chart.selectAll('#vvvv-node-'+d.node.id+' g.vvvv-output-pin').filter(function(d, j) { return j==i }).each(function() {
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
        chart.selectAll('#vvvv-node-'+d.node.id+' g.vvvv-output-pin text').remove();
        chart.selectAll('#vvvv-node-'+d.node.id+' g.vvvv-output-pin rect.vvvv-output-pin-highlight').remove();
      })
      
      
    links = chart.selectAll('line.vvvv-link')
      .data(patch.linkList)
      .enter().append('svg:line')
        .attr('class', 'vvvv-link')
        //.attr('shape-rendering', 'crispEdges')
        .attr('x1', function(d) { return d.fromPin.x + d.fromPin.node.x + 2 + .5 })
        .attr('y1', function(d) { return d.fromPin.y + d.fromPin.node.y + 4 + .5 })
        .attr('x2', function(d) { return d.toPin.x + d.toPin.node.x + 2 + .5 })
        .attr('y2', function(d) { return d.toPin.y + d.toPin.node.y + .5 });
    
    $('line.vvvv-link').insertAfter($('.chart>rect')); // move links to the top, to get the right drawing order
    
    // Editing Functionality starts here ...
    
    chart.selectAll('g.vvvv-input-pin')
      .on('contextmenu', function(d, i) {
        console.log('opening input box');
        VVVV.PinTypes[d.typeName].openInputBox(thatWin, this, d);
        
        d3.event.preventDefault();
      })
      
    chart.selectAll('g.vvvv-input-pin, g.vvvv-output-pin')
    .on('click', function(d, i) {
      if (thatWin.state!=UIState.Connecting) {
        linkStart = d;
        console.log('starting connect');
        thatWin.state = UIState.Connecting;
        var that = this;
        chart.append('svg:line')
          .attr('class', 'vvvv-link current-link')
          .attr('x1', d.x + d.node.x + 2 + .5)
          .attr('y1', d.y + d.node.y + 2 + .5)
          .attr('x2', d.x + d.node.x + 2 + .5)
          .attr('y2', d.y + d.node.y + 2 + .5)
      }
      else {
        thatWin.state = UIState.Idle;
        chart.select('line.vvvv-link.current-link').remove();
        
        if (linkStart.direction==PinDirection.Input) {
          var srcPin = d;
          var dstPin = linkStart;
        }
        else {
          var srcPin = linkStart;
          var dstPin = d;
        }
        
        var cmd = "<PATCH>";
        _(dstPin.links).each(function(l) {
          cmd += "<LINK deleteme='pronto' srcnodeid='"+l.fromPin.node.id+"' srcpinname='"+l.fromPin.pinname+"' dstnodeid='"+l.toPin.node.id+"' dstpinname='"+l.toPin.pinname+"'/>";
        });
        cmd += "<LINK createme='pronto' srcnodeid='"+srcPin.node.id+"' srcpinname='"+srcPin.pinname+"' dstnodeid='"+dstPin.node.id+"' dstpinname='"+dstPin.pinname+"'/>";
        cmd += "</PATCH>";
        
        patch.doLoad(cmd)
        patch.afterUpdate();
      }
      d3.event.stopPropagation();
    })
    .on('mousedown', function() {
      d3.event.stopPropagation();
    })
    
    chart.selectAll('line.vvvv-link')
      .on("contextmenu", function(d) {
        patch.doLoad("<PATCH><LINK deleteme='pronto' srcnodeid='"+d.fromPin.node.id+"' srcpinname='"+d.fromPin.pinname+"' dstnodeid='"+d.toPin.node.id+"' dstpinname='"+d.toPin.pinname+"'/></PATCH>")
        patch.afterUpdate();
        
        d3.event.preventDefault();
      })
      
    nodes.on('mousedown', function(d) {
      thatWin.state = UIState.Moving;
      d3.select(this).attr('class', 'vvvv-node selected');
      selectedNodes.push(d);
      dragStart.x = d3.event.pageX;
      dragStart.y = d3.event.pageY;
    })
    
    $(thatWin.window.document).keyup(function(e) {
      if (e.which==46 && selectedNodes.length>0) {
        var cmd = "<PATCH>";
        for (var i=0; i<selectedNodes.length; i++) {
          var n = selectedNodes[i];
          cmd += "<NODE id='"+selectedNodes[i].id+"' deleteme='pronto'/>";
          _(n.inputPins).each(function(pin) {
            _(pin.links).each(function(l) {
              cmd += "<LINK deleteme='pronto' srcnodeid='"+l.fromPin.node.id+"' srcpinname='"+l.fromPin.pinname+"' dstnodeid='"+l.toPin.node.id+"' dstpinname='"+l.toPin.pinname+"'/>";
            });
          })
          _(n.outputPins).each(function(pin) {
            _(pin.links).each(function(l) {
              cmd += "<LINK deleteme='pronto' srcnodeid='"+l.fromPin.node.id+"' srcpinname='"+l.fromPin.pinname+"' dstnodeid='"+l.toPin.node.id+"' dstpinname='"+l.toPin.pinname+"'/>";
            });
          })
        }
        cmd += "</PATCH>";
        
        patch.doLoad(cmd);
        patch.afterUpdate();
        selectedNodes = [];
      }
    })
  }
  
}

VVVV.Editors.BrowserEditor.Interface = function() {
  
  var patchWindows = [];
  
  this.enable = function(p, opts) {
    patchWindows.push(new VVVV.Editors.BrowserEditor.PatchWindow(p));
  }
  
  this.disable = function() {
    
  }
  
  
};

VVVV.Editors["edit"] = new VVVV.Editors.BrowserEditor.Interface();
