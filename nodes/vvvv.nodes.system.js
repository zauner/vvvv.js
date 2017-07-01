// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }
define(function(require,exports) {

var Node = require('core/vvvv.core.node');
var VVVV = require('core/vvvv.core.defines');
var $ = require('jquery');


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Mouse (System Global)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.MouseGlobal = function(id, graph) {
  this.constructor(id, "Mouse (System Global)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Cyclic mode not supported']
  };

  this.auto_evaluate = true;

  var maxTouchPointsIn = this.addInputPin("Maximum Touch Points", [1], VVVV.PinTypes.Value);
  var spaceIn = this.addInputPin("Space", ["Document [-1, +1]"], VVVV.PinTypes.Enum);
  spaceIn.enumOptions = ["Document Pixels", "Document [-1, +1]"];

  var xOut = this.addOutputPin("X", [0], VVVV.PinTypes.Value);
  var yOut = this.addOutputPin("Y", [0], VVVV.PinTypes.Value);
  var wheelOut = this.addOutputPin("Mouse Wheel", [0], VVVV.PinTypes.Value);
  var lbOut = this.addOutputPin("Left Button", [0], VVVV.PinTypes.Value);
  var mbOut = this.addOutputPin("Middle Button", [0], VVVV.PinTypes.Value);
  var rbOut = this.addOutputPin("Right Button", [0], VVVV.PinTypes.Value);

  var x = [0];
  var y = [0];
  var wheel = [0];
  var lb = [0];
  var mb = [0];
  var rb = [0];
  var touchCount = 1;

  $(document).mousemove(function(e) {
    x[0] = convertXToTargetSpace(e.pageX);
    y[0] = convertYToTargetSpace(e.pageY);
  });

  $(document).bind('mousewheel', function(e) {
    wheel[0] += e.originalEvent.wheelDelta/120;
  });
  $(document).bind('DOMMouseScroll', function(e) {
    wheel[0] += -e.originalEvent.detail/3;
  });

  $(document).mousedown(function(e) {
    switch (e.which) {
      case 1: lb[0] = 1; break;
      case 2: mb[0] = 1; break;
      case 3: rb[0] = 1; break;
    }
  });

  $(document).mouseup(function(e) {
    switch (e.which) {
      case 1: lb[0] = 0; break;
      case 2: mb[0] = 0; break;
      case 3: rb[0] = 0; break;
    }
  });

  function convertXToTargetSpace(x) {
    if (spaceIn.getValue(0)=="Document Pixels")
      return x;
    return x * 2/parseInt($('body').css('width')) - 1;
  }

  function convertYToTargetSpace(y) {
    if (spaceIn.getValue(0)=="Document Pixels")
      return y;
    return -(y * 2/parseInt($('body').css('width')) - 1);
  }

  function setTouchPositions(e) {
    var i = e.originalEvent.changedTouches.length;
    while (i--) {
      x[e.originalEvent.changedTouches[i].identifier] = convertXToTargetSpace(e.originalEvent.changedTouches[i].pageX);
      y[e.originalEvent.changedTouches[i].identifier] = convertYToTargetSpace(e.originalEvent.changedTouches[i].pageY);
    }
  }

  $(document).bind('touchstart', function(e) {
    var i = e.originalEvent.changedTouches.length;
    while (i--) {
      lb[e.originalEvent.changedTouches[i].identifier] = 1;
    }
    setTouchPositions(e);
  })

  $(document).bind('touchend', function(e) {
    var i = e.originalEvent.changedTouches.length;
    while (i--) {
      lb[e.originalEvent.changedTouches[i].identifier] = 0;
    }
  })

  $(document).bind('touchmove', setTouchPositions)

  this.evaluate = function() {
    var sliceCount = Math.max(1, maxTouchPointsIn.getValue(0));

    var i = sliceCount;
    while (i--) {
      xOut.setValue(i, x[i] || 0.0);
      yOut.setValue(i, y[i] || 0.0);
      wheelOut.setValue(i, wheel[i] || 0.0);
      lbOut.setValue(i, lb[i] || 0.0);
      mbOut.setValue(i, mb[i] || 0.0);
      rbOut.setValue(i, rb[i] || 0.0);
    }

    if (maxTouchPointsIn.pinIsChanged()) {
      [xOut, yOut, wheelOut, lbOut, mbOut, rbOut].forEach(function(pin) {
        pin.setSliceCount(sliceCount);
      })
    }

  }

}
VVVV.Nodes.MouseGlobal.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Mouse (System Global)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.MouseWindow = function(id, graph) {
  this.constructor(id, "Mouse (System Window)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Cyclic mode not supported', 'No Mouse Wheel pin', 'No Left Button Pin', 'No Right Button Pin', 'No Middle Button Pin']
  };

  this.auto_evaluate = true;

  var maxTouchPointsIn = this.addInputPin("Maximum Touch Points", [1], VVVV.PinTypes.Value);

  var xOut = this.addOutputPin("X", [0], VVVV.PinTypes.Value);
  var yOut = this.addOutputPin("Y", [0], VVVV.PinTypes.Value);
  var wheelOut = this.addOutputPin("Mouse Wheel", [0], VVVV.PinTypes.Value);
  var lbOut = this.addOutputPin("Left Button", [0], VVVV.PinTypes.Value);
  var mbOut = this.addOutputPin("Middle Button", [0], VVVV.PinTypes.Value);
  var rbOut = this.addOutputPin("Right Button", [0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    var sliceCount = Math.max(1, maxTouchPointsIn.getValue(0));

    var i = sliceCount;
    while (i--) {
      xOut.setValue(i, VVVV.MousePositions['_all'].x[i] || 0.0);
      yOut.setValue(i, VVVV.MousePositions['_all'].y[i] || 0.0);
      wheelOut.setValue(i, VVVV.MousePositions['_all'].wheel[i] || 0.0);
      lbOut.setValue(i, VVVV.MousePositions['_all'].lb[i] || 0.0);
      mbOut.setValue(i, VVVV.MousePositions['_all'].mb[i] || 0.0);
      rbOut.setValue(i, VVVV.MousePositions['_all'].rb[i] || 0.0);
    }

    if (maxTouchPointsIn.pinIsChanged()) {
      [xOut, yOut, wheelOut, lbOut, mbOut, rbOut].forEach(function(pin) {
        pin.setSliceCount(sliceCount);
      })
    }
  }

}
VVVV.Nodes.MouseWindow.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: ShellExecute (Windows)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.ShellExecute = function(id, graph) {
  this.constructor(id, "ShellExecute (Windows)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['This actually does something completely different from the original node: the origin node executes a shell command, this node evals javascript code']
  };

  var fileIn = this.addInputPin("File", [0], VVVV.PinTypes.String);
  var doExecuteIn = this.addInputPin("Do Execute", [0], VVVV.PinTypes.Value);

  var resultOut = this.addOutputPin("Result", [''], VVVV.PinTypes.String);

  this.evaluate = function() {

    if (Math.round(doExecuteIn.getValue(0))>=1) {
      var result = eval(fileIn.getValue(0));
      if (!(result instanceof Array) && !(result instanceof Object))
        result = [ result ];
      if (result==undefined)
        return;
      for (var j=0; j<result.length; j++) {
        resultOut.setValue(j, result[j]);
      }
    }

  }

}
VVVV.Nodes.ShellExecute.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: ScreenInfo (Windows)
 Author(s): David Mórász (micro.D)
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.ScreenInfo = function(id, graph) {
  this.constructor(id, "ScreenInfo (Windows)", graph);

  this.meta = {
    authors: ['David Mórász (micro.D)'],
    original_authors: ['VVVV Group'],
    credits: ['Matthias Zauner'],
    compatibility_issues: ['Outputs the window size (ResolutionXY) and the document size (Working AreaXY) only','no Bits per pixel']
  };

  this.auto_evaluate = true;


  var windowResOut = this.addOutputPin("ResolutionXY", [0], VVVV.PinTypes.Value);
  var docResOut = this.addOutputPin("Working AreaXY", [0], VVVV.PinTypes.Value);

  var wx = 0;
  var wy = 0;
  var dx = 0;
  var dy = 0;

  $(document).ready(function() {
    wy = $(window).innerHeight();
    wx = $(window).innerWidth();
    dy = $(document).height();
    dx = $(document).width();
  });

  $(window).resize(function() {
    wy = $(window).innerHeight();
    wx = $(window).innerWidth();
    dy = $(document).height();
    dx = $(document).width();
  });

  this.evaluate = function() {

    if ((windowResOut.getValue(0)!=wx) || (windowResOut.getValue(1)!=wy)) {
      windowResOut.setValue(0, wx);
      windowResOut.setValue(1, wy);
    }
    if ((docResOut.getValue(0)!=dx) || (docResOut.getValue(1)!=dy)) {
      docResOut.setValue(0, dx);
      docResOut.setValue(1, dy);
    }
  }
}
VVVV.Nodes.ScreenInfo.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Location (Browser)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Location = function(id, graph) {
  this.constructor(id, "Location (Browser)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    compatibility_issues: []
  };

  var hrefIn = this.addInputPin("HREF", ['#'], VVVV.PinTypes.String);
  var doSetIn = this.addInputPin("Set", [0], VVVV.PinTypes.Value);

  var protocolOut = this.addOutputPin("Protocol", [''], VVVV.PinTypes.String);
  var hostnameOut = this.addOutputPin("Hostname", [''], VVVV.PinTypes.String);
  var pathnameOut = this.addOutputPin("Path", [''], VVVV.PinTypes.String);
  var portOut = this.addOutputPin("Port", [''], VVVV.PinTypes.String);
  var hashOut = this.addOutputPin("Hash", [''], VVVV.PinTypes.String);

  this.initialize = function() {
    var thatNode = this;
    window.addEventListener('hashchange', function() {
      hashOut.setValue(0, location.hash);
      thatNode.dirty = true;
      if (thatNode.parentPatch.mainLoop)
        thatNode.parentPatch.mainLoop.requestEvaluate();
    })
  }

  this.evaluate = function() {
    protocolOut.setValue(0, location.protocol);
    hostnameOut.setValue(0, location.hostname);
    pathnameOut.setValue(0, location.pathname);
    portOut.setValue(0, location.port);
    hashOut.setValue(0, location.hash);

    if (doSetIn.getValue(0)>=0.5) {
      location.href = hrefIn.getValue(0);
    }
  }
}
VVVV.Nodes.Location.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: DefineNode (System)
 Author(s): Matthias Zauner
 Original Node Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.DefineNode = function(id, graph) {
  this.constructor(id, "DefineNode (System)", graph);

  this.auto_nil = false;

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['Matthias Zauner'],
    credits: [],
    compatibility_issues: ['Not available in classic VVVV']
  };

  this.auto_evaluate = false;

  var nameIn = this.addInvisiblePin("Node Name", [''], VVVV.PinTypes.String);
  var sourceCodeIn = this.addInvisiblePin("Source Code", ['var valueIn = this.addInputPin("Value In", [0], VVVV.PinTypes.Value);\nvar stringIn = this.addInputPin("String In", ["text"], VVVV.PinTypes.String);\nvar colorIn = this.addInputPin("Color In", [], VVVV.PinTypes.Color);\n\nvar valueOut = this.addOutputPin("Value Out", [0], VVVV.PinTypes.Value);\nvar stringOut = this.addOutputPin("String Out", ["text"], VVVV.PinTypes.String);\nvar colorOut = this.addOutputPin("Color Out", [], VVVV.PinTypes.Color);\n\nthis.initialize = function() {\n\n//Put node configuration code here ...\n}\n\nthis.evaluate = function() {\n  var maxSize = this.getMaxInputSliceCount();\n\n  for (var i=0; i<maxSize; i++) {\n\n    valueOut.setValue(i, valueIn.getValue(i));\n    stringOut.setValue(i, stringIn.getValue(i));\n    colorOut.setValue(i, colorIn.getValue(i));\n  }\n\n  valueOut.setSliceCount(maxSize);\n  stringOut.setSliceCount(maxSize);\n  colorOut.setSliceCount(maxSize);\n}\n\nthis.destroy = function() {\n  // This is called when the node is deleted\n}'], VVVV.PinTypes.String);

  var currentName = '';
  var f = undefined;
  var w; // the UI window

  this.relatedNodes = [];

  this.configure = function() {
    if (nameIn.getValue(0)!='') {
      if (nameIn.pinIsChanged()) {
        var descriptor = nameIn.getValue(0);
        if (descriptor=='')
          return;
        if (VVVV.NodeLibrary[descriptor.toLowerCase()] && VVVV.NodeLibrary[descriptor.toLowerCase()].definingNode!=this) {
          console.warn("The node '"+descriptor+"' has already been defined.");
          this.not_implemented = true;
        }
        if (currentName!='') { // if the name has been already set, but is changed now
          VVVV.NodeLibrary[descriptor.toLowerCase()] = VVVV.NodeLibrary[currentName.toLowerCase()];
          delete VVVV.NodeLibrary[currentName.toLowerCase()];
        }
        currentName = descriptor;
        this.not_implemented = false;
        if (w)
          $('#path', w.document).text((this.parentPatch.nodename || 'root')+' / '+(currentName!='' ? currentName : 'Untitled'));
      }

      if (sourceCodeIn.pinIsChanged() || nameIn.pinIsChanged()) {
        try {
          if (VVVVContext.name=='browser')
            f = new Function("id", "graph", 'var VVVV = require("core/vvvv.core"); this.constructor(id, "'+currentName+'", graph); '+sourceCodeIn.getValue(0));
          else
            f = new Function("id", "graph", 'var VVVV = window.server_req("./core/vvvv.core"); this.constructor(id, "'+currentName+'", graph); '+sourceCodeIn.getValue(0));
          f.prototype = new Node();
          f.definingNode = this;
          VVVV.NodeLibrary[currentName.toLowerCase()] = f;
          for (var i=0; i<this.relatedNodes.length; i++) {
            var n = this.relatedNodes[i];
            var cmd = {syncmode: 'diff', nodes: {}, links: []};
            cmd.nodes[n.id] = {create: true, nodename: currentName, x: n.x*15, y: n.y*15}
            n.parentPatch.doLoad(cmd, function() { n.parentPatch.afterUpdate(); });
          }
          if (VVVV.NodeNames.indexOf(currentName)>=0)
            VVVV.NodeNames.splice(VVVV.NodeNames.indexOf(currentName), 1);
          VVVV.NodeNames.push(currentName);
          this.showStatus('success', 'Successfully updated.');
          this.not_implemented = false;
        }
        catch (e) {
          if (VVVVContext.name=="browser")
            this.showStatus('error', e.message);
          else
            console.log("DefineNode parsing error:\n", e.message);
          this.not_implemented = true;
        }

      }
    }
  }

  this.evaluate = function() {
    // nix
  }

  this.openUIWindow = function() {
    w = window.open(location.protocol+'//'+location.host+(VVVVContext.Root[0]=='/' ? '' : location.pathname.replace(/\/[^\/]*$/, '')+'/')+VVVVContext.Root+"/code_editor.html", currentName+" / VVVV.js Effect Editor", "location=no, width=800, height=800, toolbar=no");
    if (!w) {
      alert('The code editor window seems to be blocked by your browser. Please check for any blocked-popup-messages in the main window and allow popups for this page.')
      return;
    }
    var thatNode = this;
    window.setTimeout(function() {
      w.document.title = currentName+" / VVVV.js Node Editor";
      var definingNodeName = thatNode.parentPatch.nodename || 'root';
      var nodeName = currentName!='' ? currentName : 'Untitled';
      $('#path', w.document).text(definingNodeName+' / '+nodeName);
      $('textarea', w.document).text(sourceCodeIn.getValue(0));
      $('#compile_button', w.document).click(function() {
        if ($('textarea', w.document).val()==sourceCodeIn.values[0])
          return;
        if (currentName=='') {
          thatNode.showStatus('error', 'Please provide a name for this node first');
          return;
        }
        thatNode.showStatus('notice', 'Compiling ...');
        //sourceCodeIn.setValue(0, $('textarea', w.document).val()); // setValue implicitly calls configure
        var cmd = {syncmode: 'diff', nodes: {}, links: []};
        cmd.nodes[thatNode.id] = {pins: {}};
        cmd.nodes[thatNode.id].pins['Source Code'] = {values: [$('textarea', w.document).val()]};
        thatNode.parentPatch.editor.update(thatNode.parentPatch, cmd);
      });
      w.focus();
    }, 500);
  }

  this.showStatus = function(type, message) {
    if (w) {
      $('#status', w.document).text(message);
      $('#status', w.document).attr('class', type);
    }
  }

}
VVVV.Nodes.DefineNode.prototype = new Node();

});
