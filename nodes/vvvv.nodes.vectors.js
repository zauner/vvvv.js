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
	  xyOut.setSliceCount(maxSize * 2);
      
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
	  xyzOut.setSliceCount(maxSize * 3);
      
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
	  xyzwOut.setSliceCount(maxSize * 4);
      
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


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Vector (2d Split)
 Author(s): Julien Vulliet
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Split2dVector = function(id, graph) {
  this.constructor(id, "Vector (2d Split)", graph);
  
  this.meta = {
    authors: ['Julien Vulliet'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['']
  };
  
  var xyIn = this.addInputPin("XY", [0.0], this);
  
  var xOut = this.addOutputPin("X", [0.0], this);
  var yOut = this.addOutputPin("Y", [0.0], this);
  
  this.evaluate = function() 
  {  
      var maxSize = this.getMaxInputSliceCount();
	      
	  var id = 0;
      for (var i=0; i<maxSize; i+=2) 
	  {
		xOut.setValue(id,xyIn.getValue(i));
		yOut.setValue(id,xyIn.getValue(i+1));	
		id ++;
      }
      
      xOut.setSliceCount(id);
      yOut.setSliceCount(id);
  }

}
VVVV.Nodes.Split2dVector.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Vector (3d Split)
 Author(s): Julien Vulliet
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Split3dVector = function(id, graph) {
  this.constructor(id, "Vector (3d Split)", graph);
  
  this.meta = {
    authors: ['Julien Vulliet'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['']
  };
  
  var xyzIn = this.addInputPin("XYZ", [0.0], this);
  
  var xOut = this.addOutputPin("X", [0.0], this);
  var yOut = this.addOutputPin("Y", [0.0], this);
  var zOut = this.addOutputPin("Z", [0.0], this);
  
  this.evaluate = function() 
  {  
      var maxSize = this.getMaxInputSliceCount();
      
	  var id = 0;
      for (var i=0; i<maxSize; i+=3) 
	  {
		xOut.setValue(id,xyzIn.getValue(i));
		yOut.setValue(id,xyzIn.getValue(i+1));	
		zOut.setValue(id,xyzIn.getValue(i+2));	
		id ++;
      }
      
      xOut.setSliceCount(id);
      yOut.setSliceCount(id);
      zOut.setSliceCount(id);
  }

}
VVVV.Nodes.Split3dVector.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Vector (4d Split)
 Author(s): Julien Vulliet
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Split4dVector = function(id, graph) {
  this.constructor(id, "Vector (4d Split)", graph);
  
  this.meta = {
    authors: ['Julien Vulliet'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['']
  };
  
  var xyzwIn = this.addInputPin("XYZW", [0.0,0.0,0.0,1.0], this);
  
  var xOut = this.addOutputPin("X", [0.0], this);
  var yOut = this.addOutputPin("Y", [0.0], this);
  var zOut = this.addOutputPin("Z", [0.0], this);
  var wOut = this.addOutputPin("W", [0.0], this);
  
  this.evaluate = function() 
  {  
      var maxSize = this.getMaxInputSliceCount();
      
	  var id = 0;
      for (var i=0; i<maxSize; i+=4) 
	  {
		xOut.setValue(id,xyzwIn.getValue(i));
		yOut.setValue(id,xyzwIn.getValue(i+1));	
		zOut.setValue(id,xyzwIn.getValue(i+2));	
		wOut.setValue(id,xyzwIn.getValue(i+3));	
		id ++;
      }
      
      xOut.setSliceCount(id);
      yOut.setSliceCount(id);
      zOut.setSliceCount(id);
      wOut.setSliceCount(id);
  }

}
VVVV.Nodes.Split4dVector.prototype = new VVVV.Core.Node();


