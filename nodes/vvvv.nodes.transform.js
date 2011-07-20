


VVVV.Nodes.Rotate = function(id, graph) {
  this.constructor(id, "Rotate (Transform)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.addInputPin("Transform In", [], this);
  this.addInputPin("X", [0.0], this);
  this.addInputPin("Y", [0.0], this);
  this.addInputPin("Z", [0.0], this);
  
  this.addOutputPin("Transform Out", [], this);

  this.evaluate = function() {
  
    if (this.inputPins["Transform In"].pinIsChanged() || this.inputPins["X"].pinIsChanged() || this.inputPins["Y"].pinIsChanged() || this.inputPins["Z"].pinIsChanged()) {
      var maxSize = this.getMaxInputSliceCount();
      
      for (var i=0; i<maxSize; i++) {
      
        var transformin = this.inputPins["Transform In"].getValue(i);
        var x = -parseFloat(this.inputPins["X"].getValue(i));
        var y = -parseFloat(this.inputPins["Y"].getValue(i));
        var z = parseFloat(this.inputPins["Z"].getValue(i));
        
        var t = mat4.create();
        mat4.identity(t);
        
        mat4.rotate(t, x*Math.PI*2, [1, 0, 0]);
        mat4.rotate(t, y*Math.PI*2, [0, 1, 0]);
        mat4.rotate(t, z*Math.PI*2, [0, 0, 1]);
        
        if (transformin!=undefined)
          mat4.multiply(transformin, t, t);
        
        this.outputPins["Transform Out"].setValue(i, t);
      }
    }
  }

}
VVVV.Nodes.Rotate.prototype = new VVVV.Core.Node();



VVVV.Nodes.Translate = function(id, graph) {
  this.constructor(id, "Translate (Transform)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.addInputPin("Transform In", [], this);
  this.addInputPin("X", [0.0], this);
  this.addInputPin("Y", [0.0], this);
  this.addInputPin("Z", [0.0], this);
  
  this.addOutputPin("Transform Out", [], this);

  this.evaluate = function() {
    
    if (this.inputPins["Transform In"].pinIsChanged() || this.inputPins["X"].pinIsChanged() || this.inputPins["Y"].pinIsChanged() || this.inputPins["Z"].pinIsChanged()) {
    
      var maxSize = this.getMaxInputSliceCount();
      
      for (var i=0; i<maxSize; i++) {
        var transformin = this.inputPins["Transform In"].getValue(i);
        var x = parseFloat(this.inputPins["X"].getValue(i));
        var y = parseFloat(this.inputPins["Y"].getValue(i));
        var z = -parseFloat(this.inputPins["Z"].getValue(i));
        
        var t = mat4.create();
        mat4.identity(t);
        
        mat4.translate(t, [x, y, z]);
        if (transformin!=undefined)
          mat4.multiply(transformin, t, t);
        
        this.outputPins["Transform Out"].setValue(i, t);
      }
    }
  }

}
VVVV.Nodes.Translate.prototype = new VVVV.Core.Node();


VVVV.Nodes.Scale = function(id, graph) {
  this.constructor(id, "Scale (Transform)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.transform = mat4.create();
  mat4.identity(this.transform);
  
  this.addInputPin("Transform In", [this.transform], this);
  this.addInputPin("X", [1.0], this);
  this.addInputPin("Y", [1.0], this);
  this.addInputPin("Z", [1.0], this);
  
  this.addOutputPin("Transform Out", [], this);

  this.evaluate = function() {
    
    if (this.inputPins["Transform In"].pinIsChanged() || this.inputPins["X"].pinIsChanged() || this.inputPins["Y"].pinIsChanged() || this.inputPins["Z"].pinIsChanged()) {
    
      var maxSize = this.getMaxInputSliceCount();
      
      for (var i=0; i<maxSize; i++) {
        var transformin = this.inputPins["Transform In"].getValue(i);
        var x = parseFloat(this.inputPins["X"].getValue(i));
        var y = parseFloat(this.inputPins["Y"].getValue(i));
        var z = parseFloat(this.inputPins["Z"].getValue(i));
        
        var t = mat4.create();
        mat4.identity(t);
        
        mat4.scale(t, [x, y, z]);
        if (transformin!=undefined)
          mat4.multiply(transformin, t, t);
        
        this.outputPins["Transform Out"].setValue(i, t);
      }
    }
  }

}
VVVV.Nodes.Scale.prototype = new VVVV.Core.Node();



VVVV.Nodes.Perspective = function(id, graph) {
  this.constructor(id, "Perspective (Transform)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Not spreadable']
  };
  
  this.transform = mat4.create();
  mat4.identity(this.transform);
  
  this.addInputPin("Transform In", [this.transform], this);
  this.addInputPin("FOV", [0.25], this);
  this.addInputPin("Near Plane", [0.05], this);
  this.addInputPin("Far Plane", [100.0], this);
  
  this.addOutputPin("Transform Out", [], this);

  this.evaluate = function() {
    if (this.inputPins["Transform In"].pinIsChanged() || this.inputPins["FOV"].pinIsChanged() || this.inputPins["Near Plane"].pinIsChanged() || this.inputPins["Far Plane"].pinIsChanged()) {
      var transformin = this.inputPins["Transform In"].getValue(0);
      var fov = parseFloat(this.inputPins["FOV"].getValue(0));
      var near = parseFloat(this.inputPins["Near Plane"].getValue(0));
      var far = parseFloat(this.inputPins["Far Plane"].getValue(0));
      
      var t = mat4.create();
      mat4.identity(t);
      mat4.identity(this.transform);
      
      mat4.perspective(fov*360, 1, near, far, t);
      mat4.multiply(transformin, t, this.transform);
      
      this.outputPins["Transform Out"].setValue(0, this.transform);
    }
  }

}
VVVV.Nodes.Perspective.prototype = new VVVV.Core.Node();