// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

/**
 * The Transform Pin Type
 * @mixin
 * @property {String} typeName "Transform"
 * @property {Boolean} reset_on_disconnect true
 * @property {Function} defaultValue Function returning an identity matrix
 */
VVVV.PinTypes.Transform = {
  typeName: "Transform",
  reset_on_disconnect: true,
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
  
  this.trIn = this.addInputPin("Transform In", [], VVVV.PinTypes.Transform);
  this.xIn = this.addInputPin("X", [0.0], VVVV.PinTypes.Value);
  this.yIn = this.addInputPin("Y", [0.0], VVVV.PinTypes.Value);
  this.zIn = this.addInputPin("Z", [0.0], VVVV.PinTypes.Value);
  
  this.trOut = this.addOutputPin("Transform Out", [], VVVV.PinTypes.Transform);

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
  
  this.trIn = this.addInputPin("Transform In", [], VVVV.PinTypes.Transform);
  this.xIn = this.addInputPin("X", [0.0], VVVV.PinTypes.Value);
  this.yIn = this.addInputPin("Y", [0.0], VVVV.PinTypes.Value);
  this.zIn = this.addInputPin("Z", [0.0], VVVV.PinTypes.Value);
  
  this.trOut = this.addOutputPin("Transform Out", [], VVVV.PinTypes.Transform);
  
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
  
  this.trIn = this.addInputPin("Transform In", [], VVVV.PinTypes.Transform);
  this.xIn = this.addInputPin("X", [1.0], VVVV.PinTypes.Value);
  this.yIn = this.addInputPin("Y", [1.0], VVVV.PinTypes.Value);
  this.zIn = this.addInputPin("Z", [1.0], VVVV.PinTypes.Value);
  
  this.trOut = this.addOutputPin("Transform Out", [], VVVV.PinTypes.Transform);

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
 NODE: UniformScale (Transform)
 Author(s): woei
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.UniformScale = function(id, graph) {
  this.constructor(id, "UniformScale (Transform)", graph);
  
  this.meta = {
    authors: ['woei'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var ident = mat4.identity(mat4.create());
  
  this.trIn = this.addInputPin("Transform In", [], VVVV.PinTypes.Transform);
  this.xyzIn = this.addInputPin("XYZ", [1.0], VVVV.PinTypes.Value);
  
  this.trOut = this.addOutputPin("Transform Out", [], VVVV.PinTypes.Transform);

  this.evaluate = function() {
		
	var maxSize = this.trIn.isConnected() ? this.getMaxInputSliceCount() : this.xyzIn.getSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      var u = parseFloat(this.inputPins["XYZ"].getValue(i));
      
      var t = mat4.create();
      mat4.identity(t);
      
      mat4.scale(t, [u,u,u]);
	
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
VVVV.Nodes.UniformScale.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Trapeze (Transform)
 Author(s): woei
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Trapeze = function(id, graph) {
  this.constructor(id, "Trapeze (Transform)", graph);
  
  this.meta = {
    authors: ['woei'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var ident = mat4.identity(mat4.create());
  
  this.trIn = this.addInputPin("Transform In", [], VVVV.PinTypes.Transform);
  this.xIn = this.addInputPin("X", [0.0], VVVV.PinTypes.Value);
  this.yIn = this.addInputPin("Y", [0.0], VVVV.PinTypes.Value);
  this.zIn = this.addInputPin("Z", [0.0], VVVV.PinTypes.Value);
  
  this.trOut = this.addOutputPin("Transform Out", [], VVVV.PinTypes.Transform);

  this.evaluate = function() {
    
    var maxSize = this.trIn.isConnected() ? this.getMaxInputSliceCount() : Math.max(this.xIn.getSliceCount(),this.yIn.getSliceCount(),this.zIn.getSliceCount());
    
    for (var i=0; i<maxSize; i++) {
      var x = 2.0 * parseFloat(this.inputPins["X"].getValue(i));
      var y = 2.0 * parseFloat(this.inputPins["Y"].getValue(i));
      var z = 2.0 * parseFloat(this.inputPins["Z"].getValue(i));
      
      var mat = [ 1.0,0.0,0.0,x,
                  0.0,1.0,0.0,y,
                  0.0,0.0,1.0,z,
                  0.0,0.0,0.0,1.0];

      var t = mat4.create(mat);
     
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
VVVV.Nodes.Trapeze.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Transform (Transform 2d)
 Author(s): woei
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Transform2d = function(id, graph) {
  this.constructor(id, "Transform (Transform 2d)", graph);
  
  this.meta = {
    authors: ['woei'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var ident = mat4.identity(mat4.create());
  
  this.trIn = this.addInputPin("Transform In", [], VVVV.PinTypes.Transform);
  this.txIn = this.addInputPin("TranslateX", [0.0], VVVV.PinTypes.Value);
  this.tyIn = this.addInputPin("TranslateY", [0.0], VVVV.PinTypes.Value);
  this.sxIn = this.addInputPin("ScaleX", [1.0], VVVV.PinTypes.Value);
  this.syIn = this.addInputPin("ScaleY", [1.0], VVVV.PinTypes.Value);
  this.rIn  = this.addInputPin("Rotate", [0.0], VVVV.PinTypes.Value);
  this.cxIn = this.addInputPin("CenterX", [0.0], VVVV.PinTypes.Value);
  this.cyIn = this.addInputPin("CenterY", [0.0], VVVV.PinTypes.Value);

  
  this.trOut = this.addOutputPin("Transform Out", [], VVVV.PinTypes.Transform);

  this.evaluate = function() {
    
    var maxSize = this.trIn.isConnected() ? this.getMaxInputSliceCount() : Math.max(this.txIn.getSliceCount(),this.tyIn.getSliceCount(),
      this.sxIn.getSliceCount(),this.syIn.getSliceCount(),
      this.rIn.getSliceCount(),
      this.cxIn.getSliceCount(),this.cyIn.getSliceCount());
    
    for (var i=0; i<maxSize; i++) {
      var tx = parseFloat(this.inputPins["TranslateX"].getValue(i));
      var ty = parseFloat(this.inputPins["TranslateY"].getValue(i));
      var sx = parseFloat(this.inputPins["ScaleX"].getValue(i));
      var sy = parseFloat(this.inputPins["ScaleY"].getValue(i));
      var r  = parseFloat(this.inputPins["Rotate"].getValue(i));
      var cx = parseFloat(this.inputPins["CenterX"].getValue(i));
      var cy = parseFloat(this.inputPins["CenterY"].getValue(i));

      var t = mat4.create();
      mat4.identity(t);
      
      mat4.translate(t, [tx, ty, 0]);
      mat4.rotate(t, r*Math.PI*2, [0, 0, 1]);
      mat4.scale(t, [sx, sy, 1]);
      mat4.translate(t, [-cx, -cy, 0]);
  
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
VVVV.Nodes.Transform2d.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: AspectRatio (Transform)
 Author(s): woei
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AspectRatio = function(id, graph) {
  this.constructor(id, "AspectRatio (Transform)", graph);
  
  this.meta = {
    authors: ['woei'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var ident = mat4.identity(mat4.create());
  
  this.trIn = this.addInputPin("Transform In", [], VVVV.PinTypes.Transform);
  this.wIn = this.addInputPin("Aspect Width", [1.0], VVVV.PinTypes.Value);
  this.hIn = this.addInputPin("Aspect Height", [1.0], VVVV.PinTypes.Value);
  this.sIn = this.addInputPin("Uniform Scale", [1.0], VVVV.PinTypes.Value);
  this.alignmentIn = this.addInputPin("Alignment", ["FitIn"], VVVV.PinTypes.Enum);
  this.alignmentIn.enumOptions = ['FitIn', 'FitWidth', 'FitHeight', 'FitOut'];
  
  this.trOut = this.addOutputPin("Transform Out", [], VVVV.PinTypes.Transform);

  this.evaluate = function() {
    
    var maxSize = this.trIn.isConnected() ? this.getMaxInputSliceCount() : Math.max(this.wIn.getSliceCount(),this.hIn.getSliceCount(),this.sIn.getSliceCount(),this.alignmentIn.getSliceCount());
    
    for (var i=0; i<maxSize; i++) {
      var w = parseFloat(this.inputPins["Aspect Width"].getValue(i));
      var h = parseFloat(this.inputPins["Aspect Height"].getValue(i));
      var s = parseFloat(this.inputPins["Uniform Scale"].getValue(i));
      
      var x = s;
      var y = s;

      switch (this.alignmentIn.getValue(i)) {
        case 'FitIn':
          if (w>h) 
            y *= h/w;
          else
            x *= w/h;
          break;
        case 'FitWidth':
          y *= h/w;
          break;
        case 'FitHeight':
          x *= w/h;
          break;
        case 'FitOut':
          if (w<h) 
            y *= h/w;
          else
            x *= w/h;
      }
      var t = mat4.create();
      mat4.identity(t);
      
      mat4.scale(t, [x, y, s]);
  
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
VVVV.Nodes.AspectRatio.prototype = new VVVV.Core.Node();

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
  

  this.addInputPin("Transform In", [], VVVV.PinTypes.Transform);
  this.addInputPin("FOV", [0.25], VVVV.PinTypes.Value);
  this.addInputPin("Near Plane", [0.05], VVVV.PinTypes.Value);
  this.addInputPin("Far Plane", [100.0], VVVV.PinTypes.Value);
  
  this.addOutputPin("Transform Out", [], VVVV.PinTypes.Transform);

  this.evaluate = function() {
    
    var fov = parseFloat(this.inputPins["FOV"].getValue(0));
    var near = parseFloat(this.inputPins["Near Plane"].getValue(0));
    var far = parseFloat(this.inputPins["Far Plane"].getValue(0));
    
    var t = mat4.create();
    mat4.identity(t);   
    mat4.perspective(fov*360, 1, near, far, t);
  
    if (this.inputPins["Transform In"].isConnected())
    {
     	var transformin = this.inputPins["Transform In"].getValue(0);
     	mat4.multiply(transformin, t, t);
    }

    this.outputPins["Transform Out"].setValue(0, t);
  }

}
VVVV.Nodes.Perspective.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Inverse (Transform)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.InverseTransform = function(id, graph) {
  this.constructor(id, "Inverse (Transform)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var trIn = this.addInputPin("Transform In", [], VVVV.PinTypes.Transform);
  var sourceIn = this.addInputPin("Source", [], VVVV.PinTypes.Transform);
  
  var trOut = this.addOutputPin("Transform Out", [], VVVV.PinTypes.Transform);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
      var s = mat4.create();
      mat4.set(sourceIn.getValue(i), s);
      mat4.multiply(trIn.getValue(i), mat4.inverse(s, s), s);
      trOut.setValue(i, s);
    }
    trOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.InverseTransform.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: LookAt (Transform Vector)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.LookAtTransformVector = function(id, graph) {
  this.constructor(id, "LookAt (Transform Vector)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  var transformIn = this.addInputPin('Transform In', [], VVVV.PinTypes.Transform);
  var positionxyzIn = this.addInputPin('Position XYZ', [0, 0, 0], VVVV.PinTypes.Value);
  var lookatxyzIn = this.addInputPin('LookAt XYZ', [0, 0, 1], VVVV.PinTypes.Value);
  var upvectorxyzIn = this.addInputPin('UpVector XYZ', [0, 1, 0], VVVV.PinTypes.Value);

  var transformoutOut = this.addOutputPin('Transform Out', [], VVVV.PinTypes.Transform);
  
  var mirror = mat4.create();
  mat4.identity(mirror);
  mat4.scale(mirror, [-1, 1, -1]);

  this.evaluate = function() {
    var spreadCount = Math.max(transformIn.getSliceCount(), Math.max(positionxyzIn.getSliceCount()/3, Math.max(lookatxyzIn.getSliceCount()/3, upvectorxyzIn.getSliceCount()/3)));
    spreadCount = Math.ceil(spreadCount);
    
    for (var i=0; i<spreadCount; i++) {
      var pos = positionxyzIn.getValue(i, 3);
      var lookat = lookatxyzIn.getValue(i, 3);
      var up = upvectorxyzIn.getValue(i, 3);

      var t = mat4.create();
      mat4.identity(t);   
      mat4.lookAt(vec3.create(pos), vec3.create(lookat), vec3.create(up), t);
      mat4.multiply(mirror, t, t);
    
      if (transformIn.isConnected())
      {
        mat4.multiply(transformIn.getValue(i), t, t);
      }
      
      transformoutOut.setValue(i, t);
    }
    
    transformoutOut.setSliceCount(spreadCount);
  }

}
VVVV.Nodes.LookAtTransformVector.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: LookAt (Transform)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.LookAtTransform = function(id, graph) {
  this.constructor(id, "LookAt (Transform)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  // input pins
  var transformIn = this.addInputPin('Transform In', [], VVVV.PinTypes.Transform);
  var positionxIn = this.addInputPin('Position X', [0], VVVV.PinTypes.Value);
  var positionyIn = this.addInputPin('Position Y', [0], VVVV.PinTypes.Value);
  var positionzIn = this.addInputPin('Position Z', [0], VVVV.PinTypes.Value);
  var lookatxIn = this.addInputPin('LookAt X', [0], VVVV.PinTypes.Value);
  var lookatyIn = this.addInputPin('LookAt Y', [0], VVVV.PinTypes.Value);
  var lookatzIn = this.addInputPin('LookAt Z', [1], VVVV.PinTypes.Value);
  var upvectorxIn = this.addInputPin('UpVector X', [0], VVVV.PinTypes.Value);
  var upvectoryIn = this.addInputPin('UpVector Y', [1], VVVV.PinTypes.Value);
  var upvectorzIn = this.addInputPin('UpVector Z', [0], VVVV.PinTypes.Value);

  var transformoutOut = this.addOutputPin('Transform Out', [], VVVV.PinTypes.Transform);

  var mirror = mat4.create();
  mat4.identity(mirror);
  mat4.scale(mirror, [-1, 1, -1]);

  this.evaluate = function() {
    var spreadCount = this.getMaxInputSliceCount();
    
    for (var i=0; i<spreadCount; i++) {
      var t = mat4.create();
      mat4.identity(t);
      mat4.lookAt(vec3.create([positionxIn.getValue(i), positionyIn.getValue(i), positionzIn.getValue(i)]), vec3.create([lookatxIn.getValue(i), lookatyIn.getValue(i), lookatzIn.getValue(i)]), vec3.create([upvectorxIn.getValue(i), upvectoryIn.getValue(i), upvectorzIn.getValue(i)]), t);
      mat4.multiply(mirror, t, t);
    
      if (transformIn.isConnected())
      {
        mat4.multiply(transformIn.getValue(i), t, t);
      }
      
      transformoutOut.setValue(i, t);
    }
    
    transformoutOut.setSliceCount(spreadCount);
  }

}
VVVV.Nodes.LookAtTransform.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: MultiplyTransform (Transform)
 Author(s): woei
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.MultiplyTransform = function(id, graph) {
  this.constructor(id, "Multiply (Transform)", graph);
  
  this.meta = {
    authors: ['woei'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var t = mat4.create();
  var inputCount = 2;

  this.trOut = this.addOutputPin("Transform Out", [], VVVV.PinTypes.Transform);

  // invisible pins
  var inputcountIn = this.addInvisiblePin('Transform In Count', [2], VVVV.PinTypes.Value);

  var inputPins = [];
  
  this.initialize = function() {
   	inputCount = Math.max(2, inputcountIn.getValue(0));
    VVVV.Helpers.dynamicPins(this, inputPins, inputCount, function(i) {
      return this.addInputPin('Transform In '+(i+1), [], VVVV.PinTypes.Transform);
    })
  }

  this.evaluate = function() {
  	if (inputcountIn.pinIsChanged())
      this.initialize();

	var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
    	t = mat4.identity(t);
    	for (var p=inputCount-1; p>=0; p--) {
    		if (inputPins[p].isConnected()) {
    			var tm = inputPins[p].getValue(i);
    			mat4.multiply(t,tm,t);
    		}
    	}
    	this.trOut.setValue(i, t);
    }
    this.trOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.MultiplyTransform.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: ApplyTransform (Transform)
 Author(s): 'woei'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.ApplyTransform = function(id, graph) {
  this.constructor(id, "ApplyTransform (Transform)", graph);
  
  this.meta = {
    authors: ['woei'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = false;
  
  // input pins
  var transformIn = this.addInputPin('Transform', [], VVVV.PinTypes.Transform);
  var xIn = this.addInputPin('X UnTransformed', [0.0], VVVV.PinTypes.Value);
  var yIn = this.addInputPin('Y UnTransformed', [0.0], VVVV.PinTypes.Value);
  var zIn = this.addInputPin('Z UnTransformed', [0.0], VVVV.PinTypes.Value);

  // output pins
  var xOut = this.addOutputPin('X Transformed', [0.0], VVVV.PinTypes.Value);
  var yOut = this.addOutputPin('Y Transformed', [0.0], VVVV.PinTypes.Value);
  var zOut = this.addOutputPin('Z Transformed', [0.0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    for (var i=0; i<maxSize; i++) {
    	var t = transformIn.getValue(i);
     	var xyz = [];
	 	xyz[0] = xIn.getValue(i);
	 	xyz[1] = yIn.getValue(i);
	 	xyz[2] = zIn.getValue(i);
	  
		mat4.multiplyVec3(t, xyz);
		xOut.setValue(i, xyz[0]);
		yOut.setValue(i, xyz[1]);
		zOut.setValue(i, xyz[2]);
    }
    xOut.setSliceCount(maxSize);
    yOut.setSliceCount(maxSize);
    zOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.ApplyTransform.prototype = new VVVV.Core.Node();