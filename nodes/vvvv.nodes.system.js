// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.


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
    compatibility_issues: ['Cyclic mode not supported', 'No Mouse Wheel pin', 'No Left Button Pin', 'No Right Button Pin', 'No Middle Button Pin']
  };
  
  this.auto_evaluate = true;
  
  var xOut = this.addOutputPin("X", [0], VVVV.PinTypes.Value);
  var yOut = this.addOutputPin("Y", [0], VVVV.PinTypes.Value);
  var wheelOut = this.addOutputPin("Mouse Wheel", [0], VVVV.PinTypes.Value);
  var lbOut = this.addOutputPin("Left Button", [0], VVVV.PinTypes.Value);
  var mbOut = this.addOutputPin("Middle Button", [0], VVVV.PinTypes.Value);
  var rbOut = this.addOutputPin("Right Button", [0], VVVV.PinTypes.Value);
  
  var x = 0;
  var y = 0;
  var wheel = 0;
  var lb = 0;
  var mb = 0;
  var rb = 0;
  
  $(document).mousemove(function(e) {
    x = e.pageX*2/parseInt($('body').css('width')) - 1;
    y = -(e.pageY*2/parseInt($('body').css('height')) - 1);
  });
  
  $(document).bind('mousewheel', function(e) {
    wheel += e.originalEvent.wheelDelta/120;
  });
  $(document).bind('DOMMouseScroll', function(e) {
    wheel += -e.originalEvent.detail/3;
  });
  
  $(document).mousedown(function(e) {
    switch (e.which) {
      case 1: lb = 1; break;
      case 2: mb = 1; break;
      case 3: rb = 1; break;
    }
  });
  
  $(document).mouseup(function(e) {
    switch (e.which) {
      case 1: lb = 0; break;
      case 2: mb = 0; break;
      case 3: rb = 0; break;
    }
  });

  this.evaluate = function() {
    
    if (xOut.getValue(0)!=x)
      xOut.setValue(0, x);
    if (yOut.getValue(0)!=y)
      yOut.setValue(0, y);
    if (wheelOut.getValue(0)!=wheel)
      wheelOut.setValue(0, wheel);
    if (lbOut.getValue(0)!=lb)
      lbOut.setValue(0, lb);
    if (mbOut.getValue(0)!=mb)
      mbOut.setValue(0, mb);
    if (rbOut.getValue(0)!=rb)
      rbOut.setValue(0, rb);
  }

}
VVVV.Nodes.MouseGlobal.prototype = new VVVV.Core.Node();


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
  
  var xOut = this.addOutputPin("X", [0], VVVV.PinTypes.Value);
  var yOut = this.addOutputPin("Y", [0], VVVV.PinTypes.Value);
  var wheelOut = this.addOutputPin("Mouse Wheel", [0], VVVV.PinTypes.Value);
  var lbOut = this.addOutputPin("Left Button", [0], VVVV.PinTypes.Value);
  var mbOut = this.addOutputPin("Middle Button", [0], VVVV.PinTypes.Value);
  var rbOut = this.addOutputPin("Right Button", [0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    
    if (xOut.getValue(0)!=VVVV.MousePositions['_all'].x)
      xOut.setValue(0, VVVV.MousePositions['_all'].x);
    if (yOut.getValue(0)!=VVVV.MousePositions['_all'].y)
      yOut.setValue(0, VVVV.MousePositions['_all'].y);
    if (wheelOut.getValue(0)!=VVVV.MousePositions['_all'].wheel)
      wheelOut.setValue(0, VVVV.MousePositions['_all'].wheel);
    if (lbOut.getValue(0)!=VVVV.MousePositions['_all'].lb)
      lbOut.setValue(0, VVVV.MousePositions['_all'].lb);
    if (mbOut.getValue(0)!=VVVV.MousePositions['_all'].mb)
      mbOut.setValue(0, VVVV.MousePositions['_all'].mb);
    if (rbOut.getValue(0)!=VVVV.MousePositions['_all'].rb)
      rbOut.setValue(0, VVVV.MousePositions['_all'].rb);
  }

}
VVVV.Nodes.MouseWindow.prototype = new VVVV.Core.Node();


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
VVVV.Nodes.ShellExecute.prototype = new VVVV.Core.Node();


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
  
  var windowResOut = this.addOutputPin("ResolutionXY", [0], VVVV.PinTypes.Value);
  var docResOut = this.addOutputPin("Working AreaXY", [0], VVVV.PinTypes.Value);
  var ScreenInfo = this;
  
  var wx = 0;
  var wy = 0;
  var dx = 0;
  var dy = 0;
  
  $(document).ready(function() {
    wy = $(window).height();
    wx = $(window).width();
    dy = $(document).height();
    dx = $(document).width();
	ScreenInfo.evaluate();
  });
  
  $(window).resize(function() {
    wy = $(window).height();
    wx = $(window).width();
    dy = $(document).height();
    dx = $(document).width();
	ScreenInfo.evaluate();
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
VVVV.Nodes.ScreenInfo.prototype = new VVVV.Core.Node();