// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.


var gl;

VVVV.Types.VertexBuffer = function(p) {
  
  this.vbo = undefined;
  this.subBuffers = {};
  this.length = 0;
  
  this.setSubBuffer = function(u, s, d) {
    this.subBuffers[u] = {
      usage: u,
      data: new Float32Array(d),
      size: s,
      offset: this.length
    };
    this.length += this.subBuffers[u].data.byteLength;
  }
  this.setSubBuffer('POSITION', 3, p);
  
  this.create = function() {
    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.length, gl.STATIC_DRAW);
    
    _(this.subBuffers).each(function(b) {
      gl.bufferSubData(gl.ARRAY_BUFFER, b.offset, b.data);
    });
  }
  
}

VVVV.Types.Mesh = function(vertexBuffer, indices) {
  this.vertexBuffer = vertexBuffer;
  this.indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  this.numIndices = indices.length;
}

VVVV.Types.Layer = function() {
  this.mesh = null;
  this.textures = [];
  this.shader = null;
  this.uniforms = {};
  
  this.toString = function() {
    return "Layer";
  }
  
}

VVVV.DefaultTexture = undefined;

VVVV.Types.ShaderProgram = function() {

  this.uniformSpecs = {};
  this.attributeSpecs = {};
  
  this.attribSemanticMap = {};
  this.uniformSemanticMap = {};
  
  var vertexShaderCode = '';
  var fragmentShaderCode = '';
  
  var vertexShader;
  var fragmentShader;
  
  this.shaderProgram;
  
  var thatShader = this;
  
  function extractSemantics(code) {
    var pattern = /(uniform|attribute) ([a-zA-Z]+)([0-9xD]*) ([a-zA-Z0-9_]+)( <([^> ]+)>)?/g;
    var match;
    while ((match = pattern.exec(code))) {
      if (match[1]=='attribute') {
        thatShader.attributeSpecs[match[4]] = {
          varname: match[4],
          semantic: match[6],
          position: gl.getAttribLocation(thatShader.shaderProgram, match[4])
        };
        if (match[6]!=undefined)
          thatShader.attribSemanticMap[match[6]] = match[4];
      }
      else {
        var dimension = match[3]=='' ? 1 : match[3];
        thatShader.uniformSpecs[match[4]] = {
          varname: match[4],
          semantic: match[6],
          position: gl.getUniformLocation(thatShader.shaderProgram, match[4]),
          type: match[2],
          dimension: dimension
        }
        if (match[6]!=undefined)
          thatShader.uniformSemanticMap[match[6]] = match[4];
      }
    }
  }
  
  this.setVertexShader = function(code) {
    vertexShaderCode = code;
  
    vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, code.replace(/<[^>]+>/g, ''));
    gl.compileShader(vertexShader);
    
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(vertexShader));
    }
  }
  
  this.setFragmentShader =function(code) {
    fragmentShaderCode = code;
    
    fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, code.replace(/<[^>]+>/g, ''));
    gl.compileShader(fragmentShader);
    
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(fragmentShader));
    }
  }
  
  this.setup = function() {
    this.shaderProgram = gl.createProgram();
    gl.attachShader(this.shaderProgram, vertexShader);
    gl.attachShader(this.shaderProgram, fragmentShader);
    gl.linkProgram(this.shaderProgram);

    if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
    }
    
    extractSemantics(fragmentShaderCode);
    extractSemantics(vertexShaderCode);
  }

}

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: FileTexture (EX9.Texture)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.FileTexture = function(id, graph) {
  this.constructor(id, "FileTexture (EX9.Texture)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Always loads in background', 'No reload pin', 'No preload pin (preloading handled by browser)', 'No up and running pin', 'No texture info outputs']
  };
  
  this.auto_evaluate = true;

  this.filenamePin = this.addInputPin("Filename", [""], this);
  this.outputPin = this.addOutputPin("Texture Out", [], this);
  
  var textures = [];
  
  this.evaluate = function() {
    if (!gl)
      return;
  
    if (this.filenamePin.pinIsChanged()) {
      var maxSize = this.getMaxInputSliceCount();
      for (var i=0; i<maxSize; i++) {
        var filename = this.filenamePin.getValue(i);
        textures[i] = gl.createTexture();
        textures[i].image = new Image();
        textures[i].image.onload = (function(j) {
          return function() {  // this is to create a new scope within the loop. see "javascript closure in for loops" http://www.mennovanslooten.nl/blog/post/62
            gl.bindTexture(gl.TEXTURE_2D, textures[j]);
            //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textures[j].image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.bindTexture(gl.TEXTURE_2D, null);
          }
        })(i);
        textures[i].image.src = filename;
      
        this.outputPin.setValue(i, textures[i]);
      }
    }
  
  }

}
VVVV.Nodes.FileTexture.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: VertexBuffer(EX9.Geometry Join)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.VertexBufferJoin = function(id, graph) {
  this.constructor(id, "VertexBuffer (EX9.Geometry Join)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var posIn = this.addInputPin("Position XYZ", [0.0, 0.0, 0.0], this);
  var normalIn = this.addInputPin("Normal XYZ", [0.0, 0.0, 0.0], this);
  var texCoord0In = this.addInputPin("Texture Coordinate 0 XY", [0.0, 0.0], this);
  var applyIn = this.addInputPin("Apply", [1], this);
  
  var vbOut = this.addOutputPin("Vertex Buffer", [], this);
  
  var vertexBuffer = null;
  
  this.evaluate = function() {
  
    if (!gl)
      return;
    
    if (applyIn.getValue(0)>=.5) {
      var positions = [];
      var texCoords0 = [];
      var normals = [];
      for (var i=0; i<this.getMaxInputSliceCount(); i++) { // this is most likely wrong, because texcoord only has 2 elements, which might cause some shift glitch
        positions[i] = parseFloat(posIn.getValue(i));
        texCoords0[i] = parseFloat(texCoord0In.getValue(i));
        normals[i] = parseFloat(normalIn.getValue(i));
      }
      console.log(positions);
      console.log(texCoords0);
      console.log(normals);
      vertexBuffer = new VVVV.Types.VertexBuffer(positions);
      vertexBuffer.setSubBuffer('TEXCOORD0', 2, texCoords0);
      vertexBuffer.setSubBuffer('NORMAL', 3, normals);
      vertexBuffer.create();
      
      vbOut.setValue(0, vertexBuffer);
    }
    
  }

}
VVVV.Nodes.VertexBufferJoin.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Mesh (EX9.Geometry Join)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.MeshJoin = function(id, graph) {
  this.constructor(id, "Mesh (EX9.Geometry Join)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var vbIn = this.addInputPin("Vertex Buffer", [], this);
  var indicesIn = this.addInputPin("Indices", [0], this);
  var applyIn = this.addInputPin("Apply", [1], this);
  
  var meshOut = this.addOutputPin("Mesh", [], this);
  
  var mesh = null;
  
  this.evaluate = function() {
  
    if (!gl)
      return;
    
    if (applyIn.getValue(0)>=.5) {
      if (vbIn.getValue(0))
      mesh = new VVVV.Types.Mesh(vbIn.getValue(0), indicesIn.values);
      meshOut.setValue(0, mesh);
    }
    
  }

}
VVVV.Nodes.MeshJoin.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Grid (EX9.Geometry)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Grid = function(id, graph) {
  this.constructor(id, "Grid (EX9.Geometry)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var xIn = this.addInputPin("Resolution X", [2], this);
  var yIn = this.addInputPin("Resolution Y", [2], this);
  
  var meshOut = this.addOutputPin("Mesh", [], this);
  
  var mesh = null;
  
  this.evaluate = function() {
  
    if (!gl)
      return;
  
    var xRes = parseInt(xIn.getValue(0));
    var yRes = parseInt(yIn.getValue(0));
      
    var vertices = [];
    var normals = [];
    var texCoords = [];
    var index = 0;
    for (var y=0; y<yRes; y++) {
      for (var x=0; x<xRes; x++) {
        vertices.push(parseFloat(x)/(xRes-1)-0.5);
        vertices.push(0.5-parseFloat(y)/(yRes-1));
        vertices.push(0.0);
        index++;
        
        normals.push(0);
        normals.push(0);
        normals.push(1);
        
        texCoords.push(parseFloat(x)/(xRes-1));
        texCoords.push(parseFloat(y)/(yRes-1));
      }
    }
    
    vertexBuffer = new VVVV.Types.VertexBuffer(vertices);
    vertexBuffer.setSubBuffer('TEXCOORD0', 2, texCoords);
    vertexBuffer.setSubBuffer('NORMAL', 3, normals);
    vertexBuffer.create();
    
    var indices = [];
    for (var y=0; y<yRes-1; y++) {
      for (var x=0; x<xRes-1; x++) {
        var refP = x+xRes*y;
        indices.push(refP);
        indices.push(refP+1);
        indices.push(refP+xRes+1);
        
        indices.push(refP+xRes+1);
        indices.push(refP+xRes);
        indices.push(refP);
      }
    }
    mesh = new VVVV.Types.Mesh(vertexBuffer, indices);
      
    meshOut.setValue(0, mesh);
    
  }

}
VVVV.Nodes.Grid.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Sphere (EX9.Geometry)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Sphere = function(id, graph) {
  this.constructor(id, "Sphere (EX9.Geometry)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var rIn = this.addInputPin("Radius", [0.5], this);
  var xIn = this.addInputPin("Resolution X", [15], this);
  var yIn = this.addInputPin("Resolution Y", [15], this);
  
  var meshOut = this.addOutputPin("Mesh", [], this);
  
  var mesh = null;
  
  this.evaluate = function() {
  
    if (!gl)
      return;
  
    var xRes = parseInt(xIn.getValue(0));
    var yRes = parseInt(yIn.getValue(0));
    var radius = parseFloat(rIn.getValue(0));
      
    var vertices = [];
    var normals = [];
    var texCoords = [];
    for (var y=0; y<yRes+1; y++) {
      var yPos = Math.cos(-parseFloat(y)/yRes*Math.PI);
      for (var x=0; x<xRes; x++) {
        var xPos = Math.cos(parseFloat(x)/xRes*2*Math.PI)*Math.cos(Math.asin(yPos));
        var zPos = Math.sin(parseFloat(x)/xRes*2*Math.PI)*Math.cos(Math.asin(yPos));
        vertices.push(xPos*radius);
        vertices.push(yPos*radius);
        vertices.push(zPos*radius);
        
        normals.push(xPos);
        normals.push(yPos);
        normals.push(zPos);
        
        texCoords.push(parseFloat(x)/(xRes));
        texCoords.push(parseFloat(y)/(yRes));
      }
    }
    
    vertexBuffer = new VVVV.Types.VertexBuffer(vertices);
    vertexBuffer.setSubBuffer('TEXCOORD0', 2, texCoords);
    vertexBuffer.setSubBuffer('NORMAL', 3, normals);
    vertexBuffer.create();
    
    var indices = [];
    for (var y=0; y<yRes; y++) {
      for (var x=0; x<xRes; x++) {
        var yOff = xRes*y;
        var refP = x+yOff;
        indices.push(refP);
        indices.push((refP+1)%xRes+yOff);
        indices.push((refP+1)%xRes+xRes+yOff);
        
        indices.push((refP+1)%xRes+xRes+yOff);
        indices.push(refP+xRes);
        indices.push(refP);
      }
    }
    mesh = new VVVV.Types.Mesh(vertexBuffer, indices);
      
    meshOut.setValue(0, mesh);
    
  }

}
VVVV.Nodes.Sphere.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: GenericShader (EX9.Effect)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GenericShader = function(id, graph) {
  this.constructor(id, "GenericShader (EX9.Effect)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.shaderFile = '';
  
  var meshIn = this.addInputPin("Mesh", [], this);
  var transformIn = this.addInputPin("Transform", [], this);
  
  var layerOut = this.addOutputPin("Layer", [], this);
  
  var layers = [];
  var mesh = null;
  var shader = null;
  
  var shaderPins = [];
  
  var initialized = false;
  
  this.initialize = function() {
    
    var thatNode = this;
    
    $.ajax({
      url: thatNode.shaderFile.replace('%VVVV%', VVVV.Root),
      async: false,
      success: function(response) {
        var match;
        if ((match = /vertex_shader:((\r?\n|.)+)fragment_shader:/.exec(response))==undefined) {
          console.log('ERROR: No vertex shader code found');
          return;
        }
        var vertexShaderCode = match[1];
        
        if ((match = /fragment_shader:((\r?\n|.)+)$/.exec(response))==undefined) {
          console.log('ERROR: No fragment shader code found');
          return;
        }
        var fragmentShaderCode = match[1];
        
        shader = new VVVV.Types.ShaderProgram();
        shader.setFragmentShader(fragmentShaderCode);
        shader.setVertexShader(vertexShaderCode);
        shader.setup();
        
        _(shader.uniformSpecs).each(function(u) {
          if (u.semantic=="VIEW" || u.semantic=="PROJECTION" || u.semantic=="WORLD")
            return;
          var defaultValue = [0.0];
          if (u.semantic == 'COLOR' && u.type=='vec')
            defaultValue = ['1.0, 1.0, 1.0, 1.0'];
          if (u.type=='mat')
            defaultValue = [mat4.identity(mat4.create())];
          if (u.type=='sampler')
            defaultValue = [VVVV.DefaultTexture];
          var pin = thatNode.addInputPin(u.varname.replace(/_/g,' '), defaultValue, thatNode);
          shaderPins.push(pin);
        });
        
      },
      error: function() {
        console.log('ERROR: Could not load shader file '+thatNode.shaderFile.replace('%VVVV%', VVVV.Root));
      }
    });
    
 
  }
  
  this.evaluate = function() {
  
    if (!gl)
      return;
    
    // find out input slice count with respect to the input pin dimension, defined by the shader code  
    var maxSize = 0;
    _(this.inputPins).each(function(p) {
      var sliceCount = p.getSliceCount();
      if (shader.uniformSpecs[p.pinname] && shader.uniformSpecs[p.pinname].type=='vec')
        sliceCount = parseInt(sliceCount/shader.uniformSpecs[p.pinname].dimension);
      if (sliceCount > maxSize)
        maxSize = sliceCount;
    });

    if (!initialized) {
      for (var j=0; j<maxSize; j++) {
        layers[j] = new VVVV.Types.Layer();
        layers[j].mesh = meshIn.getValue(0);
        layers[j].shader = shader;
        _(shader.uniformSpecs).each(function(u) {
          layers[j].uniforms[u.varname] = { uniformSpec: u, value: undefined };
        });
        
      }
    }
    initialized = true;
    
    for (var i=0; i<shaderPins.length; i++) {
      var pinname = shaderPins[i].pinname.replace(/ /g, '_');
      if (shaderPins[i].pinIsChanged()) {
        for (var j=0; j<maxSize; j++) {
          if (shader.uniformSpecs[pinname].type=='vec') {
            if (shader.uniformSpecs[pinname].semantic=='COLOR') {
              var rgba = _(shaderPins[i].getValue(j).split(',')).map(function(x) { return parseFloat(x) });
              layers[j].uniforms[pinname].value = new Float32Array(rgba);
            }
            else {
              var arr = [];
              for (var d=0; d<shader.uniformSpecs[pinname].dimension; d++) {
                arr[d] = shaderPins[i].getValue(i*shader.uniformSpecs[pinname].dimension+d)
              }
              layers[j].uniforms[pinname].value = new Float32Array(arr);
            }
          }
          else {
            layers[j].uniforms[pinname].value = shaderPins[i].getValue(j);
          }
        }
      }
    }
    
    if (transformIn.pinIsChanged()) {
      for (var i=0; i<maxSize; i++) {
        var transform = this.inputPins["Transform"].getValue(i);
        if (transform==undefined)
          mat4.identity(mat4.create());
        layers[i].uniforms[layers[i].shader.uniformSemanticMap['WORLD']].value = transform;
      }
    }
    
    
    for (var i=0; i<maxSize; i++) {
      this.outputPins["Layer"].setValue(i, layers[i]);
    }
    
        
  }
    

}
VVVV.Nodes.GenericShader.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Quad (DX9)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Quad = function(id, graph) {
  this.constructor(id, "Quad (DX9)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['No Sampler States and Render States', 'No texture transform', 'No texture coord mapping', 'No enable pin']
  };
  
  this.auto_evaluate = true;
  
  this.addInputPin("Transform", [], this);
  this.addInputPin("Texture", [], this);
  this.addInputPin("Color", ["1.0, 1.0, 1.0, 1.0"], this);
  
  this.addOutputPin("Layer", [], this);
  
  var initialized = false;
  var layers = [];
  var mesh = null;
  var shader = null;
  
  this.evaluate = function() {
  
    if (!gl)
      return;
  
    if (!initialized) {
      
      var vertices = [
         0.5,  0.5,  0.0,
        -0.5,  0.5,  0.0,
         0.5, -0.5,  0.0,
        -0.5, -0.5,  0.0
      ];
      
      var texCoords = [
        1.0, 0.0,
        0.0, 0.0,
        1.0, 1.0,
        0.0, 1.0
      ];
      
      vertexBuffer = new VVVV.Types.VertexBuffer(vertices);
      vertexBuffer.setSubBuffer('TEXCOORD0', 2, texCoords);
      vertexBuffer.create();
      mesh = new VVVV.Types.Mesh(vertexBuffer, [ 0, 1, 2, 1, 3, 2 ]);
      
      // shaders
  
      var fragmentShaderCode = "#ifdef GL_ES\n";
      fragmentShaderCode += "precision highp float;\n";
      fragmentShaderCode += "#endif\n";
      fragmentShaderCode += "uniform vec4 col; varying vec2 vs2psTexCd; uniform sampler2D Samp0; void main(void) { gl_FragColor = col*texture2D(Samp0, vs2psTexCd);  }";
      var vertexShaderCode = "attribute vec3 PosO <POSITION>; attribute vec2 TexCd <TEXCOORD0>; uniform mat4 tW <WORLD>; uniform mat4 tV <VIEW>; uniform mat4 tP <PROJECTION>; varying vec2 vs2psTexCd; void main(void) { gl_Position = tP * tV * tW * vec4(PosO, 1.0); vs2psTexCd = TexCd; }";
      
      shader = new VVVV.Types.ShaderProgram();
      shader.setFragmentShader(fragmentShaderCode);
      shader.setVertexShader(vertexShaderCode);
      shader.setup();
      
      var maxSize = this.getMaxInputSliceCount();
      for (var j=0; j<maxSize; j++) {
        layers[j] = new VVVV.Types.Layer();
        layers[j].mesh = mesh;
        layers[j].shader = shader;
        
        _(shader.uniformSpecs).each(function(u) {
          layers[j].uniforms[u.varname] = { uniformSpec: u, value: undefined };
        });
        
      }
      
          
    }
    
    var colorChanged = this.inputPins["Color"].pinIsChanged();
    var transformChanged = this.inputPins["Transform"].pinIsChanged();
    var textureChanged = this.inputPins["Texture"].pinIsChanged();
    
    var maxSize = this.getMaxInputSliceCount();
    
    if (colorChanged) {
      for (var i=0; i<maxSize; i++) {
        var color = this.inputPins["Color"].getValue(i);
        var rgba = _(color.split(',')).map(function(x) { return parseFloat(x) });
        layers[i].uniforms['col'].value = new Float32Array(rgba);
      }
    }
    
    if (true) {
      for (var i=0; i<maxSize; i++) {
        var transform = this.inputPins["Transform"].getValue(i);
        if (transform==undefined)
          mat4.identity(transform);
        layers[i].uniforms[layers[i].shader.uniformSemanticMap['WORLD']].value = transform;
      }
    }
    
    if (textureChanged) {
      for (var i=0; i<maxSize; i++) {
        console.log('setting texture for layer '+i);
        tex = this.inputPins["Texture"].getValue(i);
        layers[i].uniforms["Samp0"].value = tex;
      }
    }
    
    for (var i=0; i<maxSize; i++) {
      this.outputPins["Layer"].setValue(i, layers[i]);
    }
    
    initialized = true;
  }

}
VVVV.Nodes.Quad.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Renderer (EX9)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.RendererWebGL = function(id, graph) {
  this.constructor(id, "Renderer (EX9)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['No Clear Pin', 'No Background color pin', 'Backbuffer width and height defined by canvas size', 'No Fullscreen', 'No Enable Pin', 'No Aspect Ration and Viewport transform', 'No mouse output', 'No backbuffer dimesions output', 'No WebGL (EX9) Output Pin']
  };
  
  this.addInputPin("Layers", [], this);
  var viewIn = this.addInputPin("View", [], this);
  var projIn = this.addInputPin("Projection", [], this);
  
  var pMatrix;
  var vMatrix;
  
  this.initialize = function() {
    if (!this.invisiblePins["Descriptive Name"])
      return;
  
    var selector = this.invisiblePins["Descriptive Name"].getValue(0);
    if (selector==undefined || selector=="")
      return;
    var canvas = $(selector);
    
    if (!canvas)
      return;
    
    try {
      gl = canvas.get(0).getContext("experimental-webgl");
      gl.viewportWidth = parseInt(canvas.get(0).width);
      gl.viewportHeight = parseInt(canvas.get(0).height);
    } catch (e) {
      console.log(e);
    }
    if (!gl) {
        alert("Oh gosh, can't initialize WebGL. If you're on Chrome, try launching like this: chrome.exe --ignore-gpu-blacklist . If you're on Firefox 4, go to page about:config and try to set webgl-force-enable to true.");
        return;
    }
    
    // create default white texture
 
    var pixels = new Uint8Array([255, 255, 255]);
    VVVV.DefaultTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, VVVV.DefaultTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, pixels);
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  this.evaluate = function() {
    if (gl==undefined)
      return;
  
    var layers = this.inputPins["Layers"].values;
    if (projIn.pinIsChanged()) {
      pMatrix = projIn.getValue(0);
      if (pMatrix)
        mat4.scale(pMatrix, [1, 1, -1]);
    }
    if (viewIn.pinIsChanged()) 
      vMatrix = viewIn.getValue(0);
    
    if (pMatrix==undefined) {
      pMatrix = mat4.create();
      mat4.ortho(-1, 1, -1, 1, -100, 100, pMatrix);
    }
    
    if (vMatrix==undefined) {
      vMatrix = mat4.create();
      mat4.identity(vMatrix);
    }
    
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    var currentShaderProgram = null;

    _(layers).each(function(layer) {
      if (currentShaderProgram!=layer.shader.shaderProgram) {
        gl.useProgram(layer.shader.shaderProgram);
        currentShaderProgram = layer.shader.shaderProgram;
      }
      
      gl.bindBuffer(gl.ARRAY_BUFFER, layer.mesh.vertexBuffer.vbo);
      
      /*if (layer.shader.attribSemanticMap["POSITION"]) {
        gl.enableVertexAttribArray(layer.shader.attributeSpecs[layer.shader.attribSemanticMap["POSITION"]].position);
        gl.vertexAttribPointer(layer.shader.attributeSpecs[layer.shader.attribSemanticMap["POSITION"]].position, 3, gl.FLOAT, false, 0, 0);
      }
      
      if (layer.shader.attribSemanticMap["TEXCOORD0"]) {
        gl.enableVertexAttribArray(layer.shader.attributeSpecs[layer.shader.attribSemanticMap["TEXCOORD0"]].position);
        gl.vertexAttribPointer(layer.shader.attributeSpecs[layer.shader.attribSemanticMap["TEXCOORD0"]].position, 2, gl.FLOAT, false, 0, layer.mesh.vertexBuffer.offsets['texcoords']);
      }
      
      if (layer.shader.attribSemanticMap["NORMAL"]) {
        gl.enableVertexAttribArray(layer.shader.attributeSpecs[layer.shader.attribSemanticMap["NORMAL"]].position);
        gl.vertexAttribPointer(layer.shader.attributeSpecs[layer.shader.attribSemanticMap["NORMAL"]].position, 3, gl.FLOAT, false, 0, layer.mesh.vertexBuffer.offsets['normals']);
      }*/
      _(layer.mesh.vertexBuffer.subBuffers).each(function(b) {
        gl.enableVertexAttribArray(layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]].position);
        gl.vertexAttribPointer(layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]].position, b.size, gl.FLOAT, false, 0, b.offset);
      });
      
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, layer.mesh.indexBuffer);
      gl.uniformMatrix4fv(layer.shader.uniformSpecs[layer.shader.uniformSemanticMap["PROJECTION"]].position, false, pMatrix);
      gl.uniformMatrix4fv(layer.shader.uniformSpecs[layer.shader.uniformSemanticMap["VIEW"]].position, false, vMatrix);
      
      var textureIdx = 0;
      
      _(layer.uniforms).each(function(u) {
        if (u.value==undefined)
          return;
        switch (u.uniformSpec.type) {
          case "mat": gl['uniformMatrix'+u.uniformSpec.dimension+'fv'](u.uniformSpec.position, false, u.value); break;
          case "vec": gl['uniform'+u.uniformSpec.dimension+'fv'](u.uniformSpec.position, u.value); break;
          case "int": gl['uniform'+u.uniformSpec.dimension+'i'](u.uniformSpec.position, u.value); break;
          case "float": gl['uniform'+u.uniformSpec.dimension+'f'](u.uniformSpec.position, u.value); break;
          case "sampler":
            gl.activeTexture(gl['TEXTURE'+textureIdx]);
            gl.bindTexture(gl['TEXTURE_'+u.uniformSpec.dimension], u.value);
            gl.uniform1i(u.uniformSpec.position, textureIdx);
            textureIdx++;
            break;
        }
      });
      
      gl.drawElements(gl.TRIANGLES, layer.mesh.numIndices, gl.UNSIGNED_SHORT, 0);
    });
    
  }

}
VVVV.Nodes.RendererWebGL.prototype = new VVVV.Core.Node();