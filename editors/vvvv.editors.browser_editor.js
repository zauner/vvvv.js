
if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }

define(function(require,exports) {

var pin_scale_x = 7;
var pin_scale_y = 7;
var node_scale_y =24;
var node_outline_color = "#999";
var iobox_outline_color = "#999";
var connection_color = "#999";
var background_color = "#999";
var connection_new_color = '#28edae';
var font_size = 10;
var font_color = 10;
var node_label_offset = node_scale_y/2 + font_size/2 -1;

var $ = require('jquery');
require('d3');
var VVVV = require('core/vvvv.core.defines');
var Makros = require('vvvv.makros');

var UIState = {
  'Idle': 0,
  'Connecting': 1,
  'Moving': 2,
  'Creating': 3,
  'Changing': 4,
  'AreaSelecting': 5,
  'PinDragging': 6,
  'Resizing': 7
}

function getAllUpstreamNodes(origin_node, node) {
  if (node==undefined)
    node = origin_node;
  var upnodes = [];
  var u = node.getUpstreamNodes();
  for (var j=0; j<u.length; j++) {
    if (u[j]!=origin_node && !u[j].delays_output) {
      upnodes.push(u[j]);
      upnodes = upnodes.concat(getAllUpstreamNodes(origin_node, u[j]));
    }
  }
  return upnodes;
}

function getAllDownstreamNodes(origin_node, node) {
  if (node==undefined)
    node = origin_node;
  var upnodes = [];
  var u = node.getDownstreamNodes();
  for (var j=0; j<u.length; j++) {
    if (u[j]!=origin_node && !u[j].delays_output) {
      upnodes.push(u[j]);
      upnodes = upnodes.concat(getAllDownstreamNodes(origin_node, u[j]));
    }
  }
  return upnodes;
}

var defaultOpacity = 0.85;
var blurredOpacity = 0.35;

VVVV.PinTypes.Value.makeLabel = VVVV.PinTypes.String.makeLabel = function(element, node) {
  var rowCount = node.IOBoxRows();
  var sliceCount = node.IOBoxInputPin().getSliceCount();
  /*d3.select(element)
  .append('svg:clipPath')
    .attr('id', 'clip-path-'+node.id)
    .append("svg:rect")
      .attr('width', node.getWidth())
      .attr('height', node.getHeight())*/

  d3.select(element).selectAll('.vvvv-node-label').remove();
  for (var i=0; i<rowCount; i++) {
    d3.select(element)
    .append('svg:text')
      .text(node.IOBoxInputPin().getValue(i))
      .attr('class', 'vvvv-node-label')
      .attr('shape-rendering', 'crispEdges')
      .attr('dy', function(d) {
        return i*12+12;
      })
      .attr('dx', 4)
      .attr('dy', node_label_offset)
      .attr('font-size', font_size)
      .style('fill', "#f27900")
      .attr('font-family', "'Lucida Sans Unicode', sans-serif")
      //.attr('clip-path', 'url(#clip-path-'+node.id+')')
  }
}

VVVV.PinTypes.Value.openInputBox = VVVV.PinTypes.String.openInputBox = function(win, $element, pin, sliceIdx) {
  $inputbox = $("<input type='text' value='"+pin.getValue(sliceIdx).toString().replace(/\|/g, "||").replace(/'/g, '&apos;').replace(/</g, '&lt;').replace(/>/g, '&gt;')+"' class='pininputbox value resettable'/>");
  $inputbox.css('position', $element.css('position'));
  $inputbox.css('width', $element.css('width'));
  $inputbox.css('height', $element.css('height'));
  $inputbox.css('left', $element.css('left'));
  $inputbox.css('top', $element.css('top'));
  $element.replaceWith($inputbox);
  $inputbox.get(0).select();

  win.window.document.exitPointerLock = win.window.document.exitPointerLock    ||
                                        win.window.document.mozExitPointerLock ||
                                        win.window.document.webkitExitPointerLock;

  $inputbox.change(function() {
    if (pin.typeName=="Value")
      pin.setValue(sliceIdx, parseFloat($(this).val()));
    else
      pin.setValue(sliceIdx, $(this).val());
    var cmd = {syncmode: 'diff', nodes: {}, links: []};
    cmd.nodes[pin.node.id] = {pins: {}};
    cmd.nodes[pin.node.id].pins[pin.pinname] = {values: pin.values};
    pin.node.parentPatch.editor.update(pin.node.parentPatch, cmd);
    //pin.node.parentPatch.afterUpdate();
  });
  $inputbox.keydown(function(e) {
    if (e.which==13) {
      $(this).change();
      $(this).remove();
    }
    e.stopPropagation();
  });

  if (pin.typeName=='Value') {
    function scroll(el, delta, e) {
      var mod = $(el).val()%1;
      if (!isNaN(mod)) {
        var offset;
        offset = 1;
        if (e.altKey || mod!==0)
          offset = 1.0/100.0;
        delta *= offset;
        $(el).val(parseFloat($(el).val())+delta);
        $(el).change();
      }
    }
    $inputbox.bind('mousewheel', function(e) {
      var delta = e.originalEvent.wheelDelta/120;
      scroll(this, delta, e);
      e.preventDefault();
      return false;
    });
    $inputbox.bind('DOMMouseScroll', function(e) {
      var delta = -e.originalEvent.detail/3;
      scroll(this, delta, e);
      e.preventDefault();
      return false;
    })

    win.window.document.addEventListener('pointerlockerror', function(e) {
      console.log('POINTER LOCK ERROR');
      /*alert("It seems Pointer Lock is not allowed yet. Click somewhere in the browser window (not the patch window) to request Pointer Lock");
      var addPointerLockRequest = function()  {
        this.requestPointerLock();
      }
      $('body').bind('click', addPointerLockRequest);

      $(document).on('pointerlockchange', function() {
        if (document.pointerLockElement) {
          alert('ok, you should be good now.');
        }
        $('body').unbind("click", addPointerLockRequest);
      })*/
    })

    $inputbox.mousedown(function(e) {
      if (e.which==3) {
        this.requestPointerLock();
      }
    })

    $inputbox.mouseup(function(e) {
      if (e.which==3) {
        win.window.document.exitPointerLock();
        window.setTimeout(function() { $inputbox.remove(); }, 100); // has to be delayed, because Chrome crashes otherwise ..
        win.state = UIState.Idle;
      }
    })

    $inputbox.mousemove(function(e) {
      if (win.window.document.pointerLockElement) {
        win.state = UIState.PinDragging;
        if (Math.abs(e.originalEvent.movementY)<50) // for some reason, movementY is some large number at the beginning
          scroll(this, Math.floor(e.originalEvent.movementY*-0.5), e);
      }
    })
  }

  $inputbox.bind('paste', function(e) {
    e.stopPropagation();
  })
  $inputbox.bind('copy', function(e) {
    e.stopPropagation();
  })
}

VVVV.PinTypes.Enum.openInputBox = function(win, $element, pin, sliceIdx) {
  $inputbox = $("<select class='pininputbox value resettable'>");
  for (var i=0; i<pin.enumOptions.length; i++) {
    $opt = $('<option value="'+pin.enumOptions[i]+'">'+pin.enumOptions[i]+'</option>');
    if (pin.getValue(sliceIdx)==pin.enumOptions[i])
      $opt.attr('selected', true);
    $inputbox.append($opt);
  }
  $inputbox.css('position', $element.css('position'));
  $inputbox.css('width', $element.css('width'));
  $inputbox.css('height', $element.css('height'));
  $inputbox.css('left', $element.css('left'));
  $inputbox.css('top', $element.css('top'));
  $element.replaceWith($inputbox);

  $inputbox.change(function() {
    pin.setValue(sliceIdx, $(this).val());
    var cmd = {syncmode: 'diff', nodes: {}, links: []};
    cmd.nodes[pin.node.id] = {pins: {}};
    cmd.nodes[pin.node.id].pins[pin.pinname] = {values: pin.values};
    pin.node.parentPatch.editor.update(pin.node.parentPatch, cmd);
    //pin.node.parentPatch.afterUpdate();
    $(this).remove();
  });
}

VVVV.PinTypes.Color.makeLabel = function(element, node) {
  var rowCount = node.IOBoxRows();
  var sliceCount = node.IOBoxInputPin().getSliceCount();
  d3.select(element).selectAll('.vvvv-node-label').remove();
  for (var i=0; i<rowCount; i++) {
    d3.select(element)
      .append('svg:rect')
        .attr('class', 'vvvv-node-label')
        .attr('height', node.getHeight()/rowCount-8)
        .attr('width', node.getWidth())
        .attr('y', i * 12 + 4)
        .attr('fill', function(d) {
          var col = node.IOBoxInputPin().getValue(i);
          var svgcol = [0, 0, 0, 0];
          if (col) {
            for (var j=0; j<col.rgba.length; j++) {
              svgcol[j] = parseInt(col.rgba[j]*256);
            }
          }
          return 'rgba('+svgcol.join(',')+')';
      })
   }
}

VVVV.PinTypes.Color.openInputBox = function(win, $element, pin, sliceIdx) {

  var modulatedComp = 0;
  function setModulatedComp(e) {
    if (e.altKey && e.shiftKey)
      modulatedComp = 3;
    else if (e.altKey)
      modulatedComp = 1;
    else if (e.shiftKey)
      modulatedComp = 2;
    else
      modulatedComp = 0;
  }

  $(win.window.document)
    .keydown(setModulatedComp)
    .keyup(setModulatedComp)

  $inputbox = $('<div class="pininputbox color resettable"></div>');
  $inputbox.css('position', $element.css('position'));
  $inputbox.css('width', "120px");
  $inputbox.css('height', "66px");
  $inputbox.css('left', $element.css('left'));
  $inputbox.css('top', ($element.offset().top-60)+'px');
  var col = pin.getValue(sliceIdx);
  var svgcol = [];
  for (var i=0; i<col.rgba.length; i++) {
    svgcol[i] = parseInt(col.rgba[i]*256);
  }
  svgcol[3] = 255; // ignore alpha here ...
  $inputbox.css('background-color', 'rgba('+svgcol.join(',')+')');

  $element.replaceWith($inputbox);

  var hsv = col.getHSV();
  hsv[3] = col.rgba[3];

  var labels = "HSVA";
  for (var i=0; i<4; i++) {
    $slider = $('<input type="range" name="hsv[]" min="0" max="1" step="0.001" value="'+hsv[i]+'"/>');
    $inputbox.append('<span class="color-component">'+labels[i]+":</div>");
    $inputbox.append($slider);

    (function(j) {
      $slider.on('input', function() {
        hsv[j] = parseFloat($(this).val());
        setPin();
      });
    }(i));
  }

  function scroll(delta) {
    var incr = delta * 0.01;
    hsv[modulatedComp] += incr;
    if (modulatedComp!=0)
    hsv[modulatedComp] = Math.min(1.0, Math.max(0.0, hsv[modulatedComp]));
    setPin();
    $inputbox.find("input[type='range']").each(function(i) {
      $(this).val(hsv[i]);
    });
  }

  function setPin() {
    col.setHSV(hsv[0], hsv[1], hsv[2]);
    col.rgba[3] = hsv[3];
    $inputbox.css('background-color', 'rgba('+_(col.rgba).map(function(c) { return parseInt(c*255) }).join(',')+')');
    ibx = $inputbox;
    //var cmd = "<PATCH><NODE id='"+pin.node.id+"'><PIN pinname='"+pin.pinname+"' values='|"+col.toString()+"|'/></NODE></PATCH>";
    pin.setValue(sliceIdx, col);
    var cmd = {syncmode: 'diff', nodes: {}, links: []};
    cmd.nodes[pin.node.id] = {pins: {}};
    cmd.nodes[pin.node.id].pins[pin.pinname] = {values: _(pin.values).map(function(v) { return v.toString() }) };
    pin.node.parentPatch.editor.update(pin.node.parentPatch, cmd);
  }

  $inputbox.on('mousewheel', function(e) {
    var delta = e.originalEvent.wheelDelta/120;
    scroll(delta);
    e.preventDefault();
    return false;
  })
  $inputbox.bind('DOMMouseScroll', function(e) {
    var delta = -e.originalEvent.detail/3;
    scroll(delta);
    e.preventDefault();
    return false;
  })
}

var BrowserEditor = {}

BrowserEditor.PatchWindow = function(p, editor, selector) {

  this.state = UIState.Idle;

  var dragStart = {x: 0, y: 0};
  var chart, nodes, inputPins, outputPins, links;
  var linkStart = undefined;
  var selectedNodes = [];
  var patch = p;
  var maxNodeId = 0;
  var pageURL = location.protocol+'//'+location.host+(VVVVContext.Root[0]=='/' ? '' : location.pathname.replace(/\/[^\/]*$/, '')+'/')+VVVVContext.Root+'/patch.html';
  var modKeyPressed = {CTRL: false, SHIFT: false, ALT: false};
  var selectionBB = {x1: 0, y1: 0, x2: 0, y2: 0};
  var focusedNodes = [];

  if (!selector)
    this.window = window.open(pageURL, p.nodename, "location=no, left=250, width="+p.windowWidth+", height="+p.windowHeight+", toolbar=no" );
  else
    this.window = window;

  function resetSelection() {
    chart.selectAll('.vvvv-node.selected')
      .attr('class', function(d) { return d.isIOBox? 'vvvv-node vvvv-iobox' : 'vvvv-node' })
    selectedNodes = [];
    chart.selectAll('.vvvv-node')
      .attr('opacity', defaultOpacity);
    chart.selectAll('.vvvv-link')
      .attr('opacity', 1.0);
  }

  function focusSubGraph(node) {
    focusedNodes = [node].concat(getAllUpstreamNodes(node).concat(getAllDownstreamNodes(node)));
    if (focusedNodes.length<=1)
      return;
    chart.selectAll('.vvvv-node').filter(function(d) {
      return focusedNodes.indexOf(d)<0;
    })
    .attr('opacity', blurredOpacity);

    chart.selectAll('.vvvv-link').filter(function(d) {
      return focusedNodes.indexOf(d.fromPin.node)<0 || focusedNodes.indexOf(d.toPin.node)<0;
    })
    .attr('opacity', blurredOpacity);
  }

  function unfocusSubGraph() {
    chart.selectAll('.vvvv-node').attr('opacity', defaultOpacity);
    chart.selectAll('.vvvv-link').attr('opacity', defaultOpacity);
    focusedNodes.length = 0;
  }

  var thatWin = this;
  window.setTimeout(function() {
    for (var i=0; i<patch.nodeList.length; i++) {
      maxNodeId = Math.max(maxNodeId, patch.nodeList[i].id);
    }

    if (!selector) {
      thatWin.window.document.title = p.nodename;
      root = d3.select(thatWin.window.document.body);
    }
    else
      root = d3.select($(selector).get(0));

    if (!selector) {
      $('body', thatWin.window.document).on('copy', function(e) {
        var $patch = $('<PATCH>');
        var links = [];
        var selectedNodeIDs = _(selectedNodes).map(function(n) { return n.id });
        for (var i=0; i<selectedNodes.length; i++) {
          $patch.append(selectedNodes[i].serialize());
          _(selectedNodes[i].inputPins).each(function(pin) {
            for (var j=0; j<pin.links.length; j++) {
              if (selectedNodeIDs.indexOf(pin.links[j].fromPin.node.id)>=0)
                links.push(pin.links[j]);
            }
          });
        }
        for (var i=0; i<links.length; i++) {
          $patch.append(links[i].serialize());
        }
        var xml = '<!DOCTYPE PATCH  SYSTEM "http://vvvv.org/versions/vvvv45beta28.1.dtd" >'+$patch.wrapAll('<d></d>').parent().html();
        xml = xml.replace(/<patch/g, "<PATCH");
        xml = xml.replace(/<\/patch>/g, "\n  </PATCH>");
        xml = xml.replace(/<node/g, "\n  <NODE");
        xml = xml.replace(/<\/node>/g, "\n  </NODE>");
        xml = xml.replace(/<bounds/g, "\n  <BOUNDS");
        xml = xml.replace(/<\/bounds>/g, "\n  </BOUNDS>");
        xml = xml.replace(/<pin/g, "\n  <PIN");
        xml = xml.replace(/<\/pin>/g, "\n  </PIN>");
        xml = xml.replace(/<lonk/g, "\n  <LINK");
        xml = xml.replace(/<\/lonk>/g, "\n  </LINK>");

        e.originalEvent.clipboardData.setData("text/plain", xml);
        e.preventDefault();
        return false;
      });

      var mouseX = 0;
      var mouseY = 0;
      $('body', thatWin.window.document).mousemove(function(e) {
        mouseX = e.pageX;
        mouseY = e.pageY;
      });
      $('body', thatWin.window.document).on('paste', function(e) {
        var xml = e.originalEvent.clipboardData.getData("text/plain");
        if (!xml.match(/^<!DOCTYPE PATCH/))
          return false;
        $patch = $(xml);

        var boundsLeft = undefined;
        var boundsTop = undefined;
        $patch.find('node bounds').each(function() {
          var left = parseInt($(this).attr("left"));
          var top = parseInt($(this).attr("top"));
          if (!boundsLeft || left<boundsLeft)
            boundsLeft = left;
          if (!boundsTop || top<boundsTop)
            boundsTop = top;
        });

        var oldNewNodeIdMap = {};
        $patch.find('node').each(function() {
          maxNodeId++;
          oldNewNodeIdMap[$(this).attr("id")] = maxNodeId;
          $(this).attr("createme", "pronto");
          $(this).attr("id", maxNodeId);
          var left = parseInt($(this).find('bounds').attr("left")) - boundsLeft + mouseX*15;
          var top = parseInt($(this).find('bounds').attr("top")) - boundsTop + mouseY*15;
          $(this).find('bounds').attr("left", left);
          $(this).find('bounds').attr("top", top);
        });
        $patch.find('link').each(function() {
          $(this).attr("createme", "pronto");
          var fromNodeId = $(this).attr("srcnodeid");
          var toNodeId = $(this).attr("dstnodeid");
          $(this).attr("srcnodeid", oldNewNodeIdMap[fromNodeId]);
          $(this).attr("dstnodeid", oldNewNodeIdMap[toNodeId]);
        });

        var xml = $patch.wrapAll('<d></d>').parent().html();
        xml = xml.replace(/<patch/g, "<PATCH");
        xml = xml.replace(/<\/patch>/g, "\n  </PATCH>");
        xml = xml.replace(/<node/g, "\n  <NODE");
        xml = xml.replace(/<\/node>/g, "\n  </NODE>");
        xml = xml.replace(/<bounds/g, "\n  <BOUNDS");
        xml = xml.replace(/<\/bounds>/g, "\n  </BOUNDS>");
        xml = xml.replace(/<pin/g, "\n  <PIN");
        xml = xml.replace(/<\/pin>/g, "\n  </PIN>");
        xml = xml.replace(/<link/g, "\n  <LINK");
        xml = xml.replace(/<\/link>/g, "\n  </LINK>");
        editor.update(patch, xml);

        resetSelection();
        var newNodeIDs = _(oldNewNodeIdMap).map(function(node_id) { return node_id});
        chart.selectAll('.vvvv-node').each(function(node) {
          if (newNodeIDs.indexOf(parseInt(node.id))>=0) {
            selectedNodes.push(node);
            d3.select(this).attr("class", "vvvv-node selected");
          }
        })
      });
    }

    chart = root
    .append('svg:svg')
      .attr('class','chart')
      .attr('width', Math.max(patch.windowWidth, patch.boundingBox.width))
      .attr('height', Math.max(patch.windowHeight, patch.boundingBox.height))

    var background = chart.append('svg:rect')
    .attr('class','background')
    .attr('width', Math.max(patch.windowWidth, patch.boundingBox.width))
    .attr('height', Math.max(patch.windowHeight, patch.boundingBox.height))

    if (!selector) {
      chart.on('mousemove', function() {
        if (thatWin.state==UIState.Connecting) {
          chart.select('.vvvv-link.current-link')
            .attr('x2', function(d) { return d3.event.pageX + (d3.select(this).attr('x1')<d3.event.pageX ? -1 : 1) })
            .attr('y2', function(d) { return d3.event.pageY + (d3.select(this).attr('y1')<d3.event.pageY ? -1 : 1) })
        }
        else if (thatWin.state==UIState.Moving) {
          var dx = d3.event.pageX - dragStart.x;
          var dy = d3.event.pageY - dragStart.y;
          // during drag, data and visualization are out of sync, as node.x/node.y do not match the position in the graphics
          chart.selectAll('.vvvv-node.selected')
            .attr('transform', function(d) { return 'translate('+(d.x+dx)+','+(d.y+dy)+')' })
          for (var i=0; i<selectedNodes.length; i++) {
            var n = selectedNodes[i];
            chart.selectAll('.vvvv-link path')
              .filter(function(d) { return d.fromPin.node.id == n.id || d.toPin.node.id == n.id })
              .attr('d', function(d) {
                var dx1 = dx * (selectedNodes.indexOf(d.fromPin.node)>=0);
                var dy1 = dy * (selectedNodes.indexOf(d.fromPin.node)>=0);
                var dx2 = dx * (selectedNodes.indexOf(d.toPin.node)>=0);
                var dy2 = dy * (selectedNodes.indexOf(d.toPin.node)>=0);
                var deltaY = d.toPin.node.y + dy2 - (d.fromPin.node.y + dy1) - d.fromPin.node.getHeight();
                var cy = Math.min(Math.max(deltaY * 0.2, 6), 30);
                if (deltaY<12 && deltaY>3)
                  cy = deltaY * 0.5;
                var smooth = Math.max(0, Math.min(7, (deltaY - 2*cy)/2));
                return 'M'+(d.fromPin.x + d.fromPin.node.x + 2 + .5 + dx1)+','+(d.fromPin.y + d.fromPin.node.y+ 4 + .5 + dy1)
                      +' L'+(d.fromPin.x + d.fromPin.node.x + 2 + .5 + dx1)+','+(d.fromPin.y + d.fromPin.node.y + 4 + dy1 + cy)
                      +' C'+(d.fromPin.x + d.fromPin.node.x + 2 + .5 + dx1)+','+(d.fromPin.y + d.fromPin.node.y + 4 + dy1 + cy + smooth)
                      +' '+(d.toPin.x + d.toPin.node.x + 2 + .5 + dx2)+','+(d.toPin.y + d.toPin.node.y + dy2 - (cy + smooth))
                      +' '+(d.toPin.x + d.toPin.node.x + 2 + .5 + dx2)+','+(d.toPin.y + d.toPin.node.y + .5 + dy2 -cy)
                      +' L'+(d.toPin.x + d.toPin.node.x + 2 + .5 + dx2)+','+(d.toPin.y + d.toPin.node.y + .5 + dy2)
              })
          }
        }
        else if (thatWin.state==UIState.AreaSelecting) {
          selectionBB.x2 = d3.event.pageX;
          selectionBB.y2 = d3.event.pageY;

          chart.select('.selection-area')
            .attr('transform', 'translate('+Math.min(selectionBB.x1, selectionBB.x2)+', '+Math.min(selectionBB.y1, selectionBB.y2)+')')
            .attr('width', Math.abs(selectionBB.x2 - selectionBB.x1))
            .attr('height', Math.abs(selectionBB.y2 - selectionBB.y1))

          resetSelection();
          chart.selectAll('.vvvv-node').each(function(d) {
            var bounds = {x: [d.x, d.x + d.getWidth()], y: [d.y, d.y + d.getHeight()]};
            var inArea= false;
            for (var i=0; i<2; i++) {
              for (var j=0; j<2; j++) {
                if (bounds.x[i] >= Math.min(selectionBB.x1, selectionBB.x2)
                && bounds.x[i] <= Math.max(selectionBB.x1, selectionBB.x2)
                && bounds.y[j] >= Math.min(selectionBB.y1, selectionBB.y2)
                && bounds.y[j] <= Math.max(selectionBB.y1, selectionBB.y2)) {
                  inArea = true;
                }
              }
            }
            if (inArea) {
              d3.select(this).attr('class', 'vvvv-node selected');
              selectedNodes.push(d);
            }
          })
        }
        else if(thatWin.state==UIState.Resizing) {
          var dx = d3.event.pageX - dragStart.x;
          var cmd = {syncmode: 'diff', nodes: {}, links: []};
          var n = selectedNodes[0];
          var width = Math.max(n.getWidth()+dx, Math.max((_(n.inputPins).size()-1)*12+4, (n.label().length+2)*6))
          cmd.nodes[n.id] = {x: n.x*15, y: n.y*15, width: width*15, height: n.height};
          dragStart.x = d3.event.pageX;
          editor.update(patch, cmd);
        }
      })
      .on('contextmenu', function() {
        if (thatWin.state==UIState.Connecting) {
          chart.select('.vvvv-link.current-link').remove();
          $('.resettable', thatWin.window.document).remove();
          chart.selectAll('.vvvv-input-pin rect, .vvvv-output-pin rect')
            .attr('width', pin_scale_x)
            .attr('height', pin_scale_y)
            .attr('x', 0)
            .attr('y', 0)
            .attr('class', '')
          thatWin.state = UIState.Idle;
        }
        d3.event.stopPropagation();
        d3.event.preventDefault();
        return false;
      })
      .on('mouseup', function() {
        if (thatWin.state==UIState.Moving) {
          thatWin.state=UIState.Idle;
          var dx = d3.event.pageX - dragStart.x;
          var dy = d3.event.pageY - dragStart.y;
          var cmd = {syncmode: 'diff', nodes: {}, links: []};
          for (var i=0; i<selectedNodes.length; i++) {
            var n = selectedNodes[i];
            cmd.nodes[n.id] = {x: (dx+n.x)*15, y: (dy+n.y)*15, width: n.width, height: n.height};
          }
          editor.update(patch, cmd);
        }
        if (thatWin.state==UIState.AreaSelecting) {
          chart.select('.selection-area').remove();
          thatWin.state = UIState.Idle;
        }
        if (thatWin.state==UIState.Resizing) {
          thatWin.state = UIState.Idle;
        }
      })
      .on('dblclick', function() {
        unfocusSubGraph();
        $('#node_selection', thatWin.window.document).remove();
        var x = d3.event.pageX;
        var y = d3.event.pageY;
        var $nodeselection = $('<div id="node_selection"><input type="text" id="node_filter"/></div>');
        var $nodeselectionlist = $('<select id="new_node" size="8">');
        $nodeselection.append($nodeselectionlist);
        $nodeselection.css('left', x);
        $nodeselection.css('top', y);

        $('body', thatWin.window.document).append($nodeselection)
        $nodeselection.find('input').bind('paste', function(e) {
          e.stopPropagation();
        });
        $nodeselection.find('#node_filter').get(0).focus();
        function filterNodes(e) {
          $nodeselectionlist.empty();
          var filter = $nodeselection.find('#node_filter').val().toLowerCase();
          if (filter!="") {
            $('.makro', thatWin.window.document).remove();
            $('.subpatch_controls', thatWin.window.document).remove();
          }
          var available_nodes = VVVV.NodeNames.concat(_(p.executionContext.ShaderCodeResources).map(function(s,k) { return k.replace("%VVVV%/effects/", ""); }));
          var matchingNodes = _(_(available_nodes).filter(function(n) { return VVVV.Helpers.translateOperators(n).toLowerCase().indexOf(filter)>=0 })).sortBy(function(n) { return n.toLowerCase().indexOf(filter);  });
          for (var i=0; i<matchingNodes.length; i++) {
            $nodeselectionlist.append($('<option>'+matchingNodes[i]+'</option>'));
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
          var filtertext = $nodeselection.find('#node_filter').val();
          var nodename = $nodeselection.find('#new_node option:selected').val();
          var filename = "";

          if (!nodename && (filtertext.match(/\.fx$/) || filtertext.match(/\.v4p$/)) )  // if no option from the dropdown matches
            nodename = filtertext;

          if (nodename) {
            var match;
            // ./some/path/to/SomeShader.fx with path
            if (match = nodename.match(/^(.*\/([^\.]+))(\.vvvvjs)?\.fx$/)) {
              nodename = match[2]+" (EX9.Effect)";
              filename = match[1]+".fx";
            }
            // SomeShader.fx -> system shader in VVVV.js' effects directory
            else if (match = nodename.match("([^\.]+)(\.vvvvjs)?\.fx$")) {
              nodename = match[1]+" (EX9.Effect)";
              filename = "%VVVV%/effects/"+match[1]+".fx";
            }
            else if (match = nodename.match("[^\/]\.v4p$")) {
              nodename = filtertext;
              filename = filtertext;
            }

            maxNodeId++;
            var cmd = {syncmode: 'diff', nodes: {}, links: []};
            cmd.nodes[maxNodeId] = {nodename: nodename, x: x*15, y: y*15, width: 100, height: 100};
            if (filename!="")
              cmd.nodes[maxNodeId].filename = filename;
            editor.update(patch, cmd);

            $nodeselection.remove();
          }
          else {
            maxNodeId++;
            var cmd = "<PATCH>";
            cmd += "<NODE componentmode='Hidden' id='"+maxNodeId+"' nodename='IOBox (String)' systemname='IOBox (String)'>";
            cmd += "<BOUNDS type='Node' left='"+x*15+"' top='"+y*15+"' width='100' height='100'/>";
            cmd += "<PIN pinname='Input String' values='|"+filtertext+"|'/>";
            cmd += "</NODE>";
            // TODO: Why does this not work with a cmd object?
            //var cmd = {syncmode: 'diff', nodes: {}, links: []};
            //cmd.nodes[maxNodeId] = {nodename: "IOBox (String)", x: x*15, y: y*15, width: 100, height: 100};
            //cmd.nodes[maxNodeId].pins = {"Input String": filtertext};
            editor.update(patch, cmd);

            $nodeselection.remove();
          }
          $('.makro', thatWin.window.document).remove();
        }
        $nodeselection.find('#new_node').click(tryAddNode);

        var makros = chart.selectAll('g.makro')
          .data(Makros)
          .enter().append('svg:g')
            .attr('class', 'makro resettable')
            .attr('transform', function(d, i) { return "translate("+(x-85-(i%2)*85)+", "+(y+Math.floor(i/2)*25)+")"; })
            .on('click', function(d) {
              var command = d.command.replace("{left}", x*15).replace("{top}", y*15).replace("{id}", ++maxNodeId);
              editor.update(patch, command);

              $nodeselection.remove();
              $('.makro', thatWin.window.document).remove();
              $('.resettable', thatWin.window.document).remove();
            })

        makros.append('svg:rect')
          .attr('width', 80)
          .attr('height', 20)
          .attr('fill', '#AAA')

        makros.append('svg:text')
          .text(function(d) { return d.name })
          .attr('text-anchor', 'middle')
          .attr('fill', '#333')
          .attr('font-size', 10)
          .attr('font-family', "'Lucida Sans Unicode', sans-serif")
          .attr('dy', 12)
          .attr('dx', 40)

        if (patch.serverSync) {
          var subpatch_controls = chart.selectAll('g.subpatch_controls')
            .data(["New Subpatch ..."])
            .enter().append('svg:g')
              .attr('class', 'subpatch_controls resettable')
              .attr('transform', function(d, i) { return 'translate('+x+', '+(y-25*(i+1))+')'; })
              .on('click', function(d, i) {
                $nodeselection.remove();
                $('.resettable', thatWin.window.document).remove();
                var modal = $('<div class="modal resettable"><div class="modal-contents"><h1>New Supatch</h1><label>Filename:</label><input onload="this.focus()" type="text" id="new_subpatch_name" value="supersubsub.v4p"/></div></div>');
                var create_subpatch_button = $('<input class="button" type="button" value="OK"/>');
                var cancel_button = $('<input class="button cancel" type="button" value="X"/>');
                modal.find('.modal-contents').append(create_subpatch_button);
                modal.find('.modal-contents').append(cancel_button);
                $('body', thatWin.window.document).append(modal);
                modal.find('#new_subpatch_name').on('focus', function() { this.setSelectionRange(0, 11) });

                cancel_button.click(function(e) {
                  $('.resettable', thatWin.window.document).remove();
                });
                create_subpatch_button.click(function() {
                  $('.resettable', thatWin.window.document).remove();
                  var filename = modal.find('#new_subpatch_name').val();
                  if (filename=="")
                    return;
                  $.ajax({
                    url: '/vvvvjs-service/create_subpatch',
                    type: 'get',
                    dataType: 'json',
                    data: {filename: location.pathname+"/"+VVVV.Helpers.prepareFilePath(filename, patch)},
                    success: function(response) {
                      if (response.status!="OK") {
                        alert(response.message);
                        return;
                      }
                      maxNodeId++;
                      var cmd = {syncmode: 'diff', nodes: {}, links: []};
                      cmd.nodes[maxNodeId] = {nodename: filename, filename: filename, x: x*15, y: y*15, width: 100, height: 100};
                      editor.update(patch, cmd);
                    },
                    error: function(response) {
                      alert(response.message);
                    }
                  })
                });
              })

            subpatch_controls.append('svg:rect')
              .attr('width', 90)
              .attr('height', 20)
              .attr('fill', '#AAA')

            subpatch_controls.append('svg:text')
              .text(function(d) { return d })
              .attr('text-anchor', 'middle')
              .attr('fill', '#333')
              .attr('font-size', 10)
              .attr('font-family', "'Lucida Sans Unicode', sans-serif")
              .attr('dy', 12)
              .attr('dx', 43)
        }

      })
      .on('mousedown', function() {
        if (thatWin.state!=UIState.Idle || d3.event.which!=1)
          return;
        thatWin.state = UIState.AreaSelecting;
        selectionBB.x1 = selectionBB.x2 = d3.event.pageX+1;
        selectionBB.y1 = selectionBB.y2 = d3.event.pageY+1;

        chart.append('svg:rect')
          .attr('class', 'selection-area')
          .attr('stroke', '#000')
          .attr('stroke-dasharray', '2,2')
          .attr('stroke-width', 1)
          .attr('fill', 'rgba(0,0,0,0)')
          .attr('transform', 'translate('+selectionBB.x1+', '+selectionBB.y1+')')
          .attr('width', 0)
          .attr('height', 0)

        resetSelection();
        unfocusSubGraph();
      })

      background.on('click', function() {
        thatWin.state = UIState.Idle;
        $('.resettable', thatWin.window.document).remove();
        chart.selectAll('.vvvv-input-pin rect, .vvvv-output-pin rect')
          .attr('width', pin_scale_x)
          .attr('height', pin_scale_y)
          .attr('x', 0)
          .attr('y', 0)
          .attr('class', '')
        $('#node_selection', thatWin.window.document).remove();
        resetSelection();
        unfocusSubGraph();
        linkStart = undefined;
      })

      // set modifier keys
      function setModifierKeys(e) {
        modKeyPressed.CTRL = e.ctrlKey;
        modKeyPressed.ALT = e.altKey;
        modKeyPressed.SHIFT = e.shiftKey;
      }
      $(thatWin.window.document).keydown(setModifierKeys);
      $(thatWin.window.document).keyup(setModifierKeys);

      $(thatWin.window.document).keydown(function(e) {
        // DELETE key
        if ((e.which==46 || e.which==8) && selectedNodes.length>0) {
          var cmd = {syncmode: 'diff', nodes: {}, links: []};
          for (var i=0; i<selectedNodes.length; i++) {
            var n = selectedNodes[i];
            cmd.nodes[selectedNodes[i].id] = {delete: true};
            _(n.inputPins).each(function(pin) {
              _(pin.links).each(function(l) {
                cmd.links.push({delete: true, srcnodeid: l.fromPin.node.id, srcpinname: l.fromPin.pinname, dstnodeid: l.toPin.node.id, dstpinname: l.toPin.pinname})
              });
            })
            _(n.outputPins).each(function(pin) {
              _(pin.links).each(function(l) {
                cmd.links.push({delete: true, srcnodeid: l.fromPin.node.id, srcpinname: l.fromPin.pinname, dstnodeid: l.toPin.node.id, dstpinname: l.toPin.pinname})
              });
            })
          }

          editor.update(patch, cmd);
          selectedNodes = [];
        }
        // CTRL + S / Save
        else if ((e.which==115 || e.which==83) && e.ctrlKey) {
          editor.save(patch);
          e.preventDefault();
          return false;
        }
        // CTRL + I / Open Inspector
        else if ((e.which==73) && e.ctrlKey) {
          if (editor.inspector)
            editor.inspector.win.focus();
          else {
            editor.openInspector(".");
          }
          e.preventDefault();
          return false;
        }
        // CTRL + A / Select All
        else if ((e.which==65) && e.ctrlKey) {
          resetSelection();
          chart.selectAll('.vvvv-node').each(function(d) {
            selectedNodes.push(d);
            d3.select(this).attr("class", "vvvv-node selected");
          });
          e.preventDefault();
          return false;
        }
      })

      $(thatWin.window).resize(function() {
        patch.windowWidth = $(this).width();
        patch.windowHeight = $(this).height();
        patch.boundingBox.width = Math.max(patch.windowWidth, patch.boundingBox.width);
        patch.boundingBox.height = Math.max(patch.windowHeight, patch.boundingBox.height);
        patch.afterUpdate();
      })
    }

    thatWin.drawComplete();

    //graph.afterEvaluate = this.redraw;
    patch.afterUpdate = function() {
      thatWin.drawComplete();
      if (editor.inspector)
        window.setTimeout(editor.inspector.update, 100); // TODO: why has this to be delayed?
    }
    patch.afterEvaluate = function() {
      nodes.filter(function(d) {
        return d.isIOBox && VVVV.PinTypes[d.IOBoxInputPin().typeName].makeLabel;
      })
      .each(function(d) {
        VVVV.PinTypes[d.IOBoxInputPin().typeName].makeLabel(this, d);
      });
    }
  }, 1000);

  this.close = function() {
    this.window.close();
  }

  this.drawComplete = function() {
    if (patch.disposing)
      return;
    if (nodes)
      nodes.remove();
    if (links)
      links.remove();

    if (!selector && (patch.windowWidth != $(thatWin.window).width() || patch.windowHeight != $(thatWin.window).height()))
      thatWin.window.resizeTo(patch.windowWidth, patch.windowHeight);

    chart
      .attr('width', Math.max(patch.windowWidth, patch.boundingBox.width))
      .attr('height', Math.max(patch.windowHeight, patch.boundingBox.height))

    chart.selectAll('.background')
      .attr('width', Math.max(patch.windowWidth, patch.boundingBox.width))
      .attr('height', Math.max(patch.windowHeight, patch.boundingBox.height))

    var link_group = chart.append('svg:g')
      .attr('class', 'link-group');

    // NODES

    nodes = chart.selectAll('g.vvvv-node')
      .data(patch.nodeList)
      .enter().append('svg:g')
        .attr('class', function(d) {
          var c = 'vvvv-node';
          if (d.isIOBox)
            c += ' vvvv-iobox';
          if (selectedNodes.indexOf(d)>=0) {
            c += ' selected';
          }
          return c;
        })
        .attr('id', function(d) { return 'vvvv-node-'+d.id})
        .attr('transform', function(d) { return 'translate('+d.x+','+d.y+')' })
        .attr('opacity', function(d) { return (focusedNodes.length>1 && focusedNodes.indexOf(d)<0) ? blurredOpacity : defaultOpacity })

    nodes.append('svg:rect')
      .attr('class', 'vvvv-node-background')
      .attr('height', function(d) { return node_scale_y; })  //return d.getHeight();
      .attr('width', function(d) { return d.getWidth() + 4; })
      .attr('x', 0)
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('fill', function(d) {
        if (d.isComment())
          return 'rgba(0,0,0,0)';
        else if (d.not_implemented)
          return 'rgba(255,0,0,1)';
        else if (d.isIOBox)
          return '#ddd';
        //else if (d.inCluster)
          //return 'rgba(255, 255, 0, 1)';
        else
          return '#999';
      })
      .attr('stroke', function(d) { return d.isIOBox ? '#ff8300' : 'none'})
      .attr('stroke-width', 1)

    nodes.append('svg:rect')
      .attr('class', 'resize-handle')
      .attr('height', function(d) { return d.getHeight() - 4; })
      .attr('x', function(d) { return d.getWidth(); })
      .attr('y', 2)
      .attr('width', 4)
      .attr('fill', 'rgba(0,0,0,0)')
      .attr('cursor', 'e-resize')

    /*nodes.append('svg:rect')
      .attr('class', 'vvvv-node-pinbar')
      .attr('height', function (d) { return d.isIOBox? 2 : 4 })
      .attr('fill', function(d) { return d.isIOBox? "#dddddd" : "#9a9a9a"; })
      .attr('width', function(d) { return d.getWidth(); })

    nodes.append('svg:rect')
      .attr('class', 'vvvv-node-pinbar')
      .attr('y',function(d) { return d.isIOBox? d.getHeight() -2 : d.getHeight()-4; })
      .attr('height', function (d) { return d.isIOBox? 2 : 4 })
      .attr('fill', function(d) { return d.isIOBox? "#dddddd" : "#9a9a9a"; })
      .attr('width', function(d) { return d.getWidth(); })*/

    nodes.append('svg:g')
      .attr('class', 'descriptive-name-bg')

    nodes.append('svg:text')
      .text(function(d) { return (d.invisiblePins["Descriptive Name"]) ? d.invisiblePins["Descriptive Name"].getValue(0) : null })
      .attr('class', 'vvvv-node-descriptive-name')
      .attr('shape-rendering', 'crispEdges')
      .attr('dy', function(d) { return d.getHeight()+12 })
      .attr('dx', 2)
      .attr('font-size', 10)
      .attr('font-family', "'Lucida Sans Unicode', sans-serif")
      .attr('fill', 'white')

    nodes.append('svg:text')
      .text(function(d) {
        if (d.invisiblePins["Node Name"] && d.nodename=="DefineNode (System)")
          return d.invisiblePins["Node Name"].getValue(0);
        if (d.invisiblePins["Effect Descriptor"] && d.nodename=="DefineEffect (DX9)")
          return d.invisiblePins["Effect Descriptor"].getValue(0);
        return null;
      })
      .attr('class', 'vvvv-node-descriptive-name')
      .attr('shape-rendering', 'crispEdges')
      .attr('dy', function(d) { return d.getHeight()+12 })
      .attr('dx', 2)
      .attr('font-size', 10)
      .attr('font-family', "'Lucida Sans Unicode', sans-serif")
      .attr('fill', 'blue')

    nodes.selectAll('g.descriptive-name-bg')
      .append('svg:rect')
        .attr('fill', function(d) {
          if (d.invisiblePins["Descriptive Name"]==undefined || d.invisiblePins["Descriptive Name"].getValue(0)=="")
            return 'rgba(0,0,0,0)';
          return 'rgba(0,0,0,1)';
        })
        .attr('y', function(d) { return d.getHeight() })
        .attr('width', 5)
        .attr('height', 14)

    nodes.each(function(d) {
      if (d.isIOBox && VVVV.PinTypes[d.IOBoxInputPin().typeName].makeLabel) {
        VVVV.PinTypes[d.IOBoxInputPin().typeName].makeLabel(this, d);
        var rowCount = d.IOBoxRows();
        var sliceCount = d.IOBoxInputPin().getSliceCount();
        var element = this;
        for (var i=0; i<rowCount; i++) {
          (function(j) {
            var l = d3.select(element)
            .append('svg:rect')
              .attr('width', d.getWidth() +2)
              .attr('height', d.getHeight()/rowCount - 4)
              .attr('y', j*12 + 2)
              .attr('fill', 'rgba(0,0,0,0)');

            if (!selector) {
              l.on('contextmenu', function(d) {
                if (d.IOBoxInputPin().getValue(0)!=undefined && !d.IOBoxInputPin().isConnected()) {
                  $('.resettable', thatWin.window.document).remove();
                  var $inputbox = $("<input type='text'/>");
                  $('body', thatWin.window.document).append($inputbox);
                  $inputbox.css('position', 'absolute');
                  $inputbox.css('left', $(this).offset().left);
                  $inputbox.css('top', $(this).offset().top + 2);
                  $inputbox.css('width', d.getWidth());
                  $inputbox.css('height', d.getHeight()/rowCount-4);
                  VVVV.PinTypes[d.IOBoxInputPin().typeName].openInputBox(thatWin.window, $inputbox, d.IOBoxInputPin(), j);
                }
                d3.event.stopPropagation();
                d3.event.preventDefault();
                return false;
              })
            }
          })(i);
        }
      }
      else {
        d3.select(this)
          .append('svg:text')
            .text(function(d) { return d.label(); })
            .attr('class', 'vvvv-node-label')
            .attr('shape-rendering', 'crispEdges')
            .attr('dy', function(d, i) {
              return i*12+12;
            })
            .attr('dx', 4)
            .attr('dy', node_label_offset)
            .attr('font-size', 10)
            .attr('font-family', "'Lucida Sans Unicode', sans-serif")
      }
    });

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
          d.y = -1;
          d.x = i*pinOffset;
          //if (d.node.isIOBox)
          //  d.x = d.node.getWidth() - d.x - 4;
          return 'translate('+d.x+', '+d.y+')';
        })

    inputPins.append('svg:rect')
      .attr('width', pin_scale_x)
      .attr('height', pin_scale_y)
      .attr('ry', 1)
      .attr('rx', 1)
      .attr('fill', function(d) { return d.node.isComment() ? 'rgba(0,0,0,0)' : (d.clusterEdge ? '#FFFF00' : '#666666') })
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
              //Truncate preview string to avoid crashes with big strings
              var LabelContent = ""+d.getValue(0);
              if(LabelContent.length > 30)
                LabelContent = LabelContent.substring(0,30)+'...';
              if (d.getSliceCount()>1)
                return d.pinname+"("+d.getSliceCount()+"): "+LabelContent;
              else
                return d.pinname+": "+LabelContent;
            })
            .attr('dy', 30)
            .attr('font-size', 10)
            .attr('font-family', "'Lucida Sans Unicode', sans-serif")
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
          d.y = node_scale_y-pin_scale_y/2 -2;
          d.x = i*pinOffset;
          //if (d.node.isIOBox)
          //  d.x = d.node.getWidth() - d.x - 4;
          return 'translate('+d.x+', '+d.y+')';
        });

    outputPins.append('svg:rect')
      .attr('width', pin_scale_x)
      .attr('height', pin_scale_y)
      .attr('ry', 1)
      .attr('rx', 1)
      .attr('fill', function(d) { return d.node.isComment() ? 'rgba(0,0,0,0)' : (d.clusterEdge ? '#FFFF00' : '#666666') })
      .on('mouseover', function(d, i) {
        chart.selectAll('#vvvv-node-'+d.node.id+' g.vvvv-output-pin').filter(function(d, j) { return j==i }).each(function() {
          d3.select(this).append('svg:rect')
            .attr('class', 'vvvv-output-pin-highlight')
            .attr('width', pin_scale_x)
            .attr('height', pin_scale_y)
            .attr('fill', 'rgba(255,0,0,1)')
            .attr('y', pin_scale_y)

          if (d.values.code) {
            var f = new Function("patch", d.generateStaticCode(false));
            f(d.node.parentPatch);
          }

          d3.select(this).append('svg:text')
            .text(function(d) {
              //Truncate preview string to avoid crashes with big strings
              var LabelContent = ""+d.getValue(0);
              if(LabelContent.length > 30)
                LabelContent = LabelContent.substring(0,30)+'...';
              if (d.getSliceCount()>1)
                return d.pinname+"("+d.getSliceCount()+"): "+LabelContent;
              else
                return d.pinname+": "+LabelContent;
            })
            .attr('dy', 30)
            .attr('font-size', 10)
            .attr('font-family', "'Lucida Sans Unicode', sans-serif")
            .attr('fill', 'rgba(0,0,0,1)');
        });
      })
      .on('mouseout', function(d, i) {
        chart.selectAll('#vvvv-node-'+d.node.id+' g.vvvv-output-pin text').remove();
        chart.selectAll('#vvvv-node-'+d.node.id+' g.vvvv-output-pin rect.vvvv-output-pin-highlight').remove();
      })


    links = link_group.selectAll('g.vvvv-link')
      .data(patch.linkList)
      .enter().append('svg:g')
        .attr('class', 'vvvv-link')
        .attr('opacity', function(d) { return (focusedNodes.length>0 && (focusedNodes.indexOf(d.fromPin.node)<0 || focusedNodes.indexOf(d.toPin.node)<0)) ? blurredOpacity : 1.0 })

    links.append('svg:path')
      .attr('stroke', 'rgba(0, 0, 0, 0)')
      .attr('fill', 'none')
      .attr('stroke-width', 4)
      .attr('d', function(d) {
        var deltaY = d.toPin.node.y - d.fromPin.node.y - d.fromPin.node.getHeight();
        var cy = Math.min(Math.max(deltaY * 0.2, 6), 30);
        if (deltaY<12 && deltaY>3)
          cy = deltaY * 0.5;
        var smooth = Math.max(0, Math.min(7, (deltaY - 2*cy)/2));
        return 'M'+(d.fromPin.x + d.fromPin.node.x + 2 + .5)+','+(d.fromPin.y + d.fromPin.node.y+ 4 + .5)
              +' L'+(d.fromPin.x + d.fromPin.node.x + 2 + .5)+','+(d.fromPin.y + d.fromPin.node.y + 4 + cy)
              +' C'+(d.fromPin.x + d.fromPin.node.x + 2 + .5)+','+(d.fromPin.y + d.fromPin.node.y + 4 + cy + smooth)
              +' '+(d.toPin.x + d.toPin.node.x + 2 + .5)+','+(d.toPin.y + d.toPin.node.y - (cy + smooth))
              +' '+(d.toPin.x + d.toPin.node.x + 2 + .5)+','+(d.toPin.y + d.toPin.node.y + .5 - cy)
              +' L'+(d.toPin.x + d.toPin.node.x + 2 + .5)+','+(d.toPin.y + d.toPin.node.y + .5)
      })
      .on('mouseenter', function() {
        d3.select(this)
          .attr('stroke-width', 4)
          .attr('stroke', 'rgba(0, 0, 0, 0.35)')
      })
      .on('mouseleave', function() {
        d3.select(this)
          .attr('stroke-width', 4)
          .attr('stroke', 'rgba(0, 0, 0, 0)')
      })

    links.append('svg:path')
      .attr('stroke', '#000')
      .attr('fill', 'none')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', function(d) { return (d.fromPin.node.inCluster ? !d.toPin.node.inCluster : d.toPin.node.inCluster) ? '2,2' : 'none' })
      .attr('d', function(d) {
        var deltaY = d.toPin.node.y - d.fromPin.node.y - d.fromPin.node.getHeight();
        var cy = Math.min(Math.max(deltaY * 0.2, 6), 30);
        if (deltaY<12 && deltaY>3)
          cy = deltaY * 0.5;
        var smooth = Math.max(0, Math.min(7, (deltaY - 2*cy)/2));
        return 'M'+(d.fromPin.x + d.fromPin.node.x + 2 + .5)+','+(d.fromPin.y + d.fromPin.node.y+ 4 + .5)
              +' L'+(d.fromPin.x + d.fromPin.node.x + 2 + .5)+','+(d.fromPin.y + d.fromPin.node.y + 4 + cy)
              +' C'+(d.fromPin.x + d.fromPin.node.x + 2 + .5)+','+(d.fromPin.y + d.fromPin.node.y + 4 + cy + smooth)
              +' '+(d.toPin.x + d.toPin.node.x + 2 + .5)+','+(d.toPin.y + d.toPin.node.y - (cy + smooth))
              +' '+(d.toPin.x + d.toPin.node.x + 2 + .5)+','+(d.toPin.y + d.toPin.node.y + .5 - cy)
              +' L'+(d.toPin.x + d.toPin.node.x + 2 + .5)+','+(d.toPin.y + d.toPin.node.y + .5)
      })

    // set descriptive name widths after rendering
    $('.descriptive-name-bg rect', thatWin.window.document).each(function() {
      $(this, thatWin.window.document).attr('width', $(this, thatWin.window.document).parent().next().get(0).getBBox().width+4);
    })

    // Editing Functionality starts here ...

    if (!selector) {
      chart.selectAll('g.vvvv-input-pin')
        .on('contextmenu', function(d, i) {
          if (VVVV.PinTypes[d.typeName].openInputBox) {
            if (d.getValue(0)!=undefined && !d.isConnected()) {
              $('.resettable', thatWin.window.document).remove();
              var $inputbox = $("<input type='text'/>");
              $('body', thatWin.window.document).append($inputbox);
              $inputbox.css('position', 'absolute');
              $inputbox.css('left', $(this).offset().left);
              $inputbox.css('top', $(this).offset().top - 3);
              $inputbox.css('width', 50);
              $inputbox.css('height', 14);
              VVVV.PinTypes[d.typeName].openInputBox(thatWin, $inputbox, d, 0);
            }
          }

          d3.event.stopPropagation();
          d3.event.preventDefault();
          return false;
        })

      chart.selectAll('g.vvvv-input-pin, g.vvvv-output-pin')
      .on('click', function(d, i) {
        if (thatWin.state!=UIState.Connecting) {
          unfocusSubGraph();
          linkStart = d;
          thatWin.state = UIState.Connecting;
          var that = this;
          chart.append('svg:line')
            .attr('class', 'vvvv-link current-link resettable')
            .attr('stroke', connection_new_color)
            .attr('stroke-width', 1)
            .attr('x1', d.x + d.node.x + 2 + .5)
            .attr('y1', d.y + d.node.y + 2 + .5)
            .attr('x2', d.x + d.node.x + 2 + .5)
            .attr('y2', d.y + d.node.y + 2 + .5)

          if (linkStart.direction==VVVV.PinDirection.Output)
            var targetDir = 'input';
          else
            var targetDir = 'output';

          var upnodes = [];
          if (!linkStart.node.delays_output)
            upnodes = getAllUpstreamNodes(linkStart.node);

          chart.selectAll('g.vvvv-'+targetDir+'-pin rect')
            .filter(function(d) {
              if (!(d.typeName==linkStart.typeName || (linkStart.typeName=="Node" && !VVVV.PinTypes[d.typeName].primitive) || (d.typeName=="Node" && !VVVV.PinTypes[linkStart.typeName].privimive)))
                return false;
              var browserOnly = linkStart.node.environments && linkStart.node.environments.indexOf('browser')>=0;
              if (!VVVV.PinTypes[d.typeName].primitive && d.node.inCluster && browserOnly)
                return false;
              browserOnly = d.node.environments && d.node.environments.indexOf('browser')>=0;
              if (!VVVV.PinTypes[d.typeName].primitive && linkStart.node.inCluster && browserOnly)
                return false;
              if (upnodes.indexOf(d.node)>=0 || d.node==linkStart.node)
                return false;
              return true;
            })
            .attr('width', pin_scale_x)
            .attr('height', pin_scale_y)
            .attr('x', -1)
            .attr('y', function(d) { return d.direction==VVVV.PinDirection.Input ? -2 : 0})
            .attr('class', 'vvvv-connection-highlight')

        }
        else {

          if (linkStart.direction==VVVV.PinDirection.Input) {
            var srcPin = d;
            var dstPin = linkStart;
          }
          else {
            var srcPin = linkStart;
            var dstPin = d;
          }

          if ($(this).find('.vvvv-connection-highlight').length==1) {
            var cmd = {syncmode: 'diff', nodes: {}, links: []};
            _(dstPin.links).each(function(l) {
              cmd.links.push({delete: true, srcnodeid: l.fromPin.node.id, srcpinname: l.fromPin.pinname, dstnodeid: l.toPin.node.id, dstpinname: l.toPin.pinname});
            });
            cmd.links.push({srcnodeid: srcPin.node.id, srcpinname: srcPin.pinname, dstnodeid: dstPin.node.id, dstpinname: dstPin.pinname});

            editor.update(patch, cmd);

            chart.select('.vvvv-link.current-link').remove();
            chart.select('.vvvv-connection-highlight').remove();
            thatWin.state = UIState.Idle;
            patch.afterUpdate();
          }
        }
        d3.event.stopPropagation();
      })
      .on('mousedown', function() {
        d3.event.stopPropagation();
      })

      chart.selectAll('g.vvvv-link path')
        .on('mousedown', function(d) {
          if (thatWin.state == UIState.Idle && d3.event.which==3 || (d3.event.which==1 && d3.event.ctrlKey))
            editor.update(patch, {syncmode: 'diff', nodes: {}, links: [{delete: true, srcnodeid: d.fromPin.node.id, srcpinname: d.fromPin.pinname, dstnodeid: d.toPin.node.id, dstpinname: d.toPin.pinname}]});
          d3.event.preventDefault();
        })

      nodes
        // node selection
        .on('mousedown', function(d) {
          $('.resettable', thatWin.window.document).remove();
          thatWin.state = UIState.Moving;
          if (selectedNodes.indexOf(d)<0) {
            if (!modKeyPressed.SHIFT) {
              resetSelection();
            }
            d3.select(this).attr('class', 'vvvv-node selected');
            selectedNodes.push(d);
          }
          dragStart.x = d3.event.pageX;
          dragStart.y = d3.event.pageY;
          if (editor.inspector)
            editor.inspector.setNode(d);

          focusSubGraph(d);

          d3.event.preventDefault();
          d3.event.stopPropagation();
          return false;
        })
        // open subpatch or UI window
        .on('contextmenu', function(d) {
          if (d.isSubpatch) {
            editor.openPatch(d);
          }
          else if (d.openUIWindow) {
            d.openUIWindow();
          }
          d3.event.preventDefault();
          d3.event.stopPropagation();
          return false;
        })

      nodes.selectAll('.resize-handle')
        .on('mousedown', function(d) {
          $('.resettable', thatWin.window.document).remove();
          dragStart.x = d3.event.pageX;
          dragStart.y = d3.event.pageY;
          resetSelection();
          selectedNodes.push(d);
          thatWin.state = UIState.Resizing;
          d3.event.stopPropagation();
          return false;
        })
    }

  }

}

BrowserEditor.Inspector = function(VVVVRoot) {

  this.win = window.open(location.protocol+'//'+location.host+(VVVVContext.Root[0]=='/' ? '' : location.pathname.replace(/\/[^\/]*$/, '')+'/')+VVVVContext.Root+'/inspektor.html', 'inspektor', "location=no, width=250, height=600, toolbar=no" );
  var node;
  var pin;
  insw = this.win;

  var that = this;

  function showOverview() {
    pin = undefined;
    $(that.win.document).find('#pins, #values').empty()
    $(that.win.document).find('#pins').append('<div class="row heading">Configuration</div>')
    $(that.win.document).find('#values').append('<div class="row heading"></div>')
    _(node.invisiblePins).each(function(p) {
      addPin(p);
    })
    $(that.win.document).find('#pins').append('<div class="row heading">Input Pins</div>')
    $(that.win.document).find('#values').append('<div class="row heading"></div>')
    _(node.inputPins).each(function(p) {
      addPin(p);
    })
    $(that.win.document).find('#pins').append('<div class="row heading">Output Pins</div>')
    $(that.win.document).find('#values').append('<div class="row heading"></div>')
    _(node.outputPins).each(function(p) {
      addPin(p);
    })
  }

  function addPin(p) {
    var $pinlink = $('<a class="row pin" href="#">'+p.pinname+'</a>');
    $(that.win.document).find('#pins').append($pinlink);

    $pinlink.click(function(e) {
      $(that.win.document).find('a.pin.active').removeClass('active');
      $(this).addClass('active');
      if (VVVV.PinTypes[p.typeName].openInputBox)
        showAllSlices(p);
      e.preventDefault();
      return false;
    })

    if (VVVV.PinTypes[p.typeName].openInputBox && p.direction!=VVVV.PinDirection.Output && !p.isConnected() && p.getValue(0)!=undefined) {
      var $iobox = $('<div class="row value"><div style="height:100%">'+p.getValue(0).toString().replace(/</g, '&lt;').replace(/>/g, '&gt;')+'</div></div>');
      $iobox.find('div').click(function() {
        VVVV.PinTypes[p.typeName].openInputBox(that.win, $(this), p, 0);
      })
    }
    else
      var $iobox = $('<div class="row value readonlyvalue"><div style="height:100%">'+(p.getValue(0)==undefined ? "undefined" : p.getValue(0).toString().replace(/</g, '&lt;').replace(/>/g, '&gt;'))+'</div></div>');
    if (p.typeName=="Color") {
      $iobox.find('div').css('background-color', 'rgba('+_(p.getValue(0).rgba).map(function(c) { return parseInt(c*255) }).join(',')+')');
    }
    $(that.win.document).find('#values').append($iobox);
  }

  function showAllSlices(p) {
    var pinChanged = (pin!=p);
    pin = p;

    var sliceCount = p.getSliceCount();
    var $sliceCountBox = $('<div class="row heading"><input type="text" value="'+sliceCount+'"/ size="3"/> Slices</div>');
    if (p.direction!=VVVV.PinDirection.Input)
      $sliceCountBox.find('input').attr('disabled', true);
    var e = $(that.win.document).find('#values .row').first();
    if (e.length>0)
      e.replaceWith($sliceCountBox);
    else
      $(that.win.document).find('#values').append($sliceCountBox);
    $sliceCountBox.find('input').change(function(e) {
      var newSliceCount = Math.max(1, parseInt($(this).val()));
      for (var i=pin.getSliceCount(); i<newSliceCount; i++) {
        pin.setValue(i, VVVV.PinTypes[pin.typeName].defaultValue());
      }
      pin.setSliceCount(newSliceCount);
      pin.node.parentPatch.afterUpdate();

      e.preventDefault();
      return false;
    })

    var i = 0;
    for (i=0; i<sliceCount; i++) {
      var $currentElement = $(that.win.document).find('#values .row').eq(i+1);
      if (!pinChanged && $currentElement.children().first().hasClass('pininputbox')) // leave open iobox alone ...
        continue;
      if (VVVV.PinTypes[p.typeName].openInputBox && p.direction!=VVVV.PinDirection.Output && !p.isConnected() && p.getValue(0)!=undefined) {
        var $iobox = $('<div class="row value"><div style="height:100%">'+p.getValue(i).toString().replace(/</g, '&lt;').replace(/>/g, '&gt;')+'</div></div>');
        (function(sliceIdx) {
          $iobox.find('div').click(function() {
            VVVV.PinTypes[p.typeName].openInputBox(that.win, $(this), p, sliceIdx);
          })
        })(i);
      }
      else
        var $iobox = $('<div class="row value readonlyvalue"><div style="height:100%">'+p.getValue(i).toString().replace(/</g, '&lt;').replace(/>/g, '&gt;')+'</div></div>');
      if ($currentElement.length>0) {
        $currentElement.replaceWith($iobox);
      }
      else {
        $(that.win.document).find('#values').append($iobox);
      }
      if (p.typeName=="Color") {
        $iobox.find('div').css('background-color', 'rgba('+_(p.getValue(i).rgba).map(function(c) { return parseInt(c*255) }).join(',')+')');
      }
    }
    i++;
    var e = $(that.win.document).find('#values .row');
    for (; i<e.length; i++) {
      e.eq(i).remove();
    }
  }

  this.update = function() {
    if (!node)
      return;
    if (pin)
      showAllSlices(pin);
    else
      showOverview();
  }

  this.setNode = function(n) {
    node = n;
    showOverview();
  }

  this.close = function() {
    this.win.close();
  }

}

BrowserEditor.Interface = function() {

  var patchWindows = [];
  var patches = {};
  this.inspector = undefined;

  function confirmLeave() {
    return "Are you sure you want to leave? Unsaved changes in your patches will be lost.";
  }

  this.enable = function(p, opts) {
    opts = opts || {}
    this.addPatch(p);
    this.openPatch(p, opts.selector);
    if (!opts.selector) {
      var that = this;
      $(window).bind('beforeunload', confirmLeave);

      $(window).unload(function() {
        that.disable();
      })

      this.openInspector(VVVVContext.Root);

      if (patchWindows[0].window) {
        if (opts && opts.success)
          opts.success();
      }
      else {
        if (opts && opts.error)
          opts.error();
      }
    }

    if (!p.serverSync.isConnected()) {
      p.serverSync.connect();
    }
  }

  this.openInspector = function(VVVVRoot, node) {
    if (this.inspector)
      return;
    this.inspector = new BrowserEditor.Inspector(VVVVRoot);
    var that = this;
    $(this.inspector.win).bind('beforeunload', function() {
      console.log('closing inspektor');
      that.inspector = undefined;
    })
  }

  var patch_signatures = [];
  this.addPatch = function(p) {
    var patch_signature = p.id;
    var pp = p;
    while ((pp = pp.parentPatch)!=undefined) {
      patch_signature += '-'+pp.id;
    }
    if (patch_signatures.indexOf(patch_signature)>=0)
      return;
    patch_signatures.push(patch_signature);
    p.editor = this;
    var path = VVVV.Helpers.prepareFilePath(p.nodename, p.parentPatch);
    if (patches[path]==undefined)
      patches[path] = [];
    patches[path].push(p);
    var subpatches = p.getSubPatches();
    for (var i=0; i<subpatches.length; i++) {
      this.addPatch(subpatches[i]);
    }
  }

  this.removePatch = function(p) {
    var subpatches = p.getSubPatches();
    for (var i=0; i<subpatches.length; i++) {
      this.removePatch(subpatches[i]);
    }
    var path = VVVV.Helpers.prepareFilePath(p.nodename, p.parentPatch);
    patches[path].splice(patches[path].indexOf(p), 1);
    if (patches[path].length == 0)
      delete patches[path];
    console.log(patches);
  }

  this.openPatch = function(p, selector) {
    patchWindows.push(new BrowserEditor.PatchWindow(p, this, selector));
  }

  this.update = function(node, cmd) {
    var path = VVVV.Helpers.prepareFilePath(node.nodename, node.parentPatch)
    var n = patches[path].length;
    for (var i=0; i<n; i++) {
      patches[path][i].doLoad(cmd);
      patches[path][i].afterUpdate();
    }
    if (patches[path][0].serverSync.isConnected()) {
      if (typeof cmd == 'object')
        cmd = JSON.stringify(cmd);
      patches[path][0].serverSync.sendPatchUpdate(patches[path][0], cmd);
    }
  }

  this.disable = function() {
    for (var i=0; i<patchWindows.length; i++) {
      patchWindows[i].close();
    }
    if (this.inspector)
      this.inspector.close();
    $(window).unbind('beforeunload', confirmLeave);
  }

  this.save = function(node) {
    var path = VVVV.Helpers.prepareFilePath(node.nodename, node.parentPatch)
    if (patches[path][0].serverSync.isConnected()) {
      if (!patches[path][0].isPersisted && window.confirm("Do you want to save the patch "+node.nodename+"?")) {
        patches[path][0].serverSync.sendPatchSave(patches[path][0]);
        for (var i=0; i<patches[path].length; i++) {
          patches[path][i].isPersisted = true;
        }
      }
      var i = patches[path][0].nodeList.length;
      while (i--) {
        if (patches[path][0].nodeList[i].isSubpatch)
          this.save(patches[path][0].nodeList[i]);
      }
    }
    else {
      var $dl = $("<a>save</a>");
      $('body').append($dl);
      $dl.attr('href', "data:application/octet-stream;charset=utf-8,"+encodeURIComponent(node.toXML()));
      $dl.attr('download', node.nodename.replace( /.*\//, ''));
      $dl[0].click();
      $dl.remove();
    }
  }

  this.sendUndo = function() {

  }


};

// Convinience function to easily inject a patch into the page
VVVV.VVVViewer = function(patch, selector) {
  var editor = new BrowserEditor.Interface();
  editor.enable(patch, {selector: selector});
}

return BrowserEditor;

});
