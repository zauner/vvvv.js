// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Vector (2d Join)
 Author(s): Julien Vulliet
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Join2dVector = function(id, graph) {
  this.constructor(id, "Vector (2d Join)", graph);
  
  this.meta = {
    authors: ['Julien Vulliet'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['']
  };
  
  var xIn = this.addInputPin("X", [0.0], this);
  var yIn = this.addInputPin("Y", [0.0], this);
  
  var xyOut = this.addOutputPin("XY", [0.0,0.0], this);

  this.evaluate = function() 
  {  
      var maxSize = this.getMaxInputSliceCount();
      
      for (var i=0; i<maxSize; i++) 
	  {
		xyOut.setValue(i*2,xIn.getValue(i));
		xyOut.setValue(i*2 + 1,yIn.getValue(i));
      }
  }

}
VVVV.Nodes.Join2dVector.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Vector (3d Join)
 Author(s): Julien Vulliet
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Join3dVector = function(id, graph) {
  this.constructor(id, "Vector (3d Join)", graph);
  
  this.meta = {
    authors: ['Julien Vulliet'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['']
  };
  
  var xIn = this.addInputPin("X", [0.0], this);
  var yIn = this.addInputPin("Y", [0.0], this);
  var zIn = this.addInputPin("Z", [0.0], this);
  
  var xyzOut = this.addOutputPin("XYZ", [0.0,0.0,0.0], this);

  this.evaluate = function() 
  {  
      var maxSize = this.getMaxInputSliceCount();
      
      for (var i=0; i<maxSize; i++) 
	  {
		xyzOut.setValue(i*3,xIn.getValue(i));
		xyzOut.setValue(i*3 + 1,yIn.getValue(i));
		xyzOut.setValue(i*3 + 2,zIn.getValue(i));
      }
  }

}
VVVV.Nodes.Join3dVector.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Vector (4d Join)
 Author(s): Julien Vulliet
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Join4dVector = function(id, graph) {
  this.constructor(id, "Vector (4d Join)", graph);
  
  this.meta = {
    authors: ['Julien Vulliet'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['']
  };
  
  var xIn = this.addInputPin("X", [0.0], this);
  var yIn = this.addInputPin("Y", [0.0], this);
  var zIn = this.addInputPin("Z", [0.0], this);
  var wIn = this.addInputPin("W", [0.0], this);
  
  var xyzwOut = this.addOutputPin("XYZW", [0.0,0.0,0.0,1.0], this);

  this.evaluate = function() 
  {  
      var maxSize = this.getMaxInputSliceCount();
      
      for (var i=0; i<maxSize; i++) 
	  {
		xyzwOut.setValue(i*4,xIn.getValue(i));
		xyzwOut.setValue(i*4 + 1,yIn.getValue(i));
		xyzwOut.setValue(i*4 + 2,zIn.getValue(i));
		xyzwOut.setValue(i*4 + 3,wIn.getValue(i));
      }
  }

}
VVVV.Nodes.Join4dVector.prototype = new VVVV.Core.Node();

