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
  
  var xOut = this.addOutputPin("X", [0], this);
  var yOut = this.addOutputPin("Y", [0], this);
  
  var x = 0;
  var y = 0;
  
  $(document).mousemove(function(e) {
    x = e.pageX*2/parseInt($('body').css('width')) - 1;
    y = e.pageY*2/parseInt($('body').css('height'))*-1 -1;
  });

  this.evaluate = function() {
    
    if (xOut.getValue(0)!=x)
      xOut.setValue(0, x);
    if (yOut.getValue(0)!=y)
      yOut.setValue(0, y);
  }

}
VVVV.Nodes.MouseGlobal.prototype = new VVVV.Core.Node();


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
  
  var fileIn = this.addInputPin("File", [0], this);
  var doExecuteIn = this.addInputPin("Do Execute", [0], this);
  
  var resultOut = this.addOutputPin("Result", [''], this);

  this.evaluate = function() {
    
    if (Math.round(doExecuteIn.getValue(0))>=1) {
      console.log('executing...'+fileIn.getValue(0));
      var result = eval(fileIn.getValue(0));
      if (!result instanceof Array)
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
  
  
  var windowResOut = this.addOutputPin("ResolutionXY", [0], this);
  var docResOut = this.addOutputPin("Working AreaXY", [0], this);
  
  var wx = 0;
  var wy = 0;
  var dx = 0;
  var dy = 0;
  
  $(document).ready(function() {
    wy = $(window).height();
    wx = $(window).width();
    dy = $(document).height();
    dx = $(document).width();
  });
  
  $(window).resize(function() {
    wy = $(window).height();
    wx = $(window).width();
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
VVVV.Nodes.ScreenInfo.prototype = new VVVV.Core.Node();