// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

VVVV.PinTypes.Transform = {
  typeName: "Transform",
  defaultValue: function() {
    return mat4.identity(mat4.create());
  }
}

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Rotate (Transform)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Rotate = function(id, graph) {
  this.constructor(id, "Rotate (Transform)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var ident = mat4.identity(mat4.create());
  
  this.trIn = this.addInputPin("Transform In", [], this, true, VVVV.PinTypes.Transform);
  this.xIn = this.addInputPin("X", [0.0], this);
  this.yIn = this.addInputPin("Y", [0.0], this);
  this.zIn = this.addInputPin("Z", [0.0], this);
  
  this.trOut = this.addOutputPin("Transform Out", [], this, VVVV.PinTypes.Transform);

  this.evaluate = function() 
  { 
		
	  var maxSize = this.trIn.isConnected() ? this.getMaxInputSliceCount() : Math.max(this.xIn.getSliceCount(),this.yIn.getSliceCount(),this.zIn.getSliceCount());
    
    for (var i=0; i<maxSize; i++) {
    
      var transformin = this.inputPins["Transform In"].getValue(i);
      var x = parseFloat(this.inputPins["X"].getValue(i));
      var y = parseFloat(this.inputPins["Y"].getValue(i));
      var z = parseFloat(this.inputPins["Z"].getValue(i));
      
      var t = mat4.create();
      mat4.identity(t);
      
      mat4.rotate(t, y*Math.PI*2, [0, 1, 0]);
      mat4.rotate(t, x*Math.PI*2, [1, 0, 0]);
      mat4.rotate(t, z*Math.PI*2, [0, 0, 1]);
      
      if (this.trIn.isConnected())
        mat4.multiply(transformin, t, t);
      
      this.trOut.setValue(i, t);
    }
    this.trOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.Rotate.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Translate (Transform)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Translate = function(id, graph) {
  this.constructor(id, "Translate (Transform)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var ident = mat4.identity(mat4.create());
  
  this.trIn = this.addInputPin("Transform In", [], this, true, VVVV.PinTypes.Transform);
  this.xIn = this.addInputPin("X", [0.0], this);
  this.yIn = this.addInputPin("Y", [0.0], this);
  this.zIn = this.addInputPin("Z", [0.0], this);
  
  this.trOut = this.addOutputPin("Transform Out", [], this, VVVV.PinTypes.Transform);
  
  this.evaluate = function() {
		
	  var maxSize = this.trIn.isConnected() ? this.getMaxInputSliceCount() : Math.max(this.xIn.getSliceCount(),this.yIn.getSliceCount(),this.zIn.getSliceCount());
	  
	  for (var i=0; i<maxSize; i++) {
		
		  var x = parseFloat(this.xIn.getValue(i));
			var y = parseFloat(this.yIn.getValue(i));
			var z = parseFloat(this.zIn.getValue(i));
			
			var t = mat4.create();
			mat4.identity(t);
			
			mat4.translate(t, [x, y, z]);
			if (this.trIn.isConnected())
			{
				var transformin = this.trIn.getValue(i);
				mat4.multiply(transformin, t, t);
			}
			
			this.trOut.setValue(i, t);
	  }
	  this.trOut.setSliceCount(maxSize);
  }
 
}
VVVV.Nodes.Translate.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Scale (Transform)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Scale = function(id, graph) {
  this.constructor(id, "Scale (Transform)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var ident = mat4.identity(mat4.create());
  
  this.trIn = this.addInputPin("Transform In", [], this, true, VVVV.PinTypes.Transform);
  this.xIn = this.addInputPin("X", [1.0], this);
  this.yIn = this.addInputPin("Y", [1.0], this);
  this.zIn = this.addInputPin("Z", [1.0], this);
  
  this.trOut = this.addOutputPin("Transform Out", [], this, VVVV.PinTypes.Transform);

  this.evaluate = function() {
		
		var maxSize = this.trIn.isConnected() ? this.getMaxInputSliceCount() : Math.max(this.xIn.getSliceCount(),this.yIn.getSliceCount(),this.zIn.getSliceCount());
    
    for (var i=0; i<maxSize; i++) {
      var x = parseFloat(this.inputPins["X"].getValue(i));
      var y = parseFloat(this.inputPins["Y"].getValue(i));
      var z = parseFloat(this.inputPins["Z"].getValue(i));
      
      var t = mat4.create();
      mat4.identity(t);
      
      mat4.scale(t, [x, y, z]);
	
  		if (this.inputPins["Transform In"].isConnected())
  		{
  			var transformin = this.inputPins["Transform In"].getValue(i);
  			mat4.multiply(transformin, t, t);
  		}
	    
      this.trOut.setValue(i, t);
    }
    this.trOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.Scale.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Perspective (Transform)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Perspective = function(id, graph) {
  this.constructor(id, "Perspective (Transform)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Not spreadable']
  };
  
  var ident = mat4.identity(mat4.create());
  

  this.addInputPin("Transform In", [], this, true, VVVV.PinTypes.Transform);
  this.addInputPin("FOV", [0.25], this);
  this.addInputPin("Near Plane", [0.05], this);
  this.addInputPin("Far Plane", [100.0], this);
  
  this.addOutputPin("Transform Out", [], this, VVVV.PinTypes.Transform);

  this.evaluate = function() {
    
    var fov = parseFloat(this.inputPins["FOV"].getValue(0));
    var near = parseFloat(this.inputPins["Near Plane"].getValue(0));
    var far = parseFloat(this.inputPins["Far Plane"].getValue(0));
    
    var t = mat4.create();
    mat4.identity(t);   
    mat4.perspective(fov*360, 1, near, far, t);
  
    if (this.inputPins["Transform In"].isConnected())
    {
     	var transformin = this.inputPins["Transform In"].getValue(i);
     	mat4.multiply(transformin, t, t);
    }

    this.outputPins["Transform Out"].setValue(0, t);
  }

}
VVVV.Nodes.Perspective.prototype = new VVVV.Core.Node();