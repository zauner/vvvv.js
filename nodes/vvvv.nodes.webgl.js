// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.


var gl;

VVVV.Types.VertexBuffer = function(position, texCoords) {

  this.positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(position), gl.STATIC_DRAW);
  
  this.texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
  
}

VVVV.Types.Mesh = function() {
  this.vertexBuffer = null;
  this.indexBuffer = null;
  this.numIndices = 0;
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
    var pattern = /(uniform|attribute) ([a-zA-Z0-9_]+) ([a-zA-Z0-9_]+)( <([^> ]+)>)?/g;
    var match;
    while ((match = pattern.exec(code))) {
      if (match[1]=='attribute') {
        thatShader.attributeSpecs[match[3]] = {
          varname: match[3],
          semantic: match[5],
          position: gl.getAttribLocation(thatShader.shaderProgram, match[3])
        };
        if (match[5]!=undefined)
          thatShader.attribSemanticMap[match[5]] = match[3];
      }
      else {
        thatShader.uniformSpecs[match[3]] = {
          varname: match[3],
          semantic: match[5],
          position: gl.getUniformLocation(thatShader.shaderProgram, match[3]),
          type: match[2]
        }
        if (match[5]!=undefined)
          thatShader.uniformSemanticMap[match[5]] = match[3];
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
    
    vertexBuffer = new VVVV.Types.VertexBuffer(vertices, texCoords);
    mesh = new VVVV.Types.Mesh();
    mesh.vertexBuffer = vertexBuffer;
    mesh.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array([ 0, 1, 2, 1, 3, 2 ]), gl.STATIC_DRAW);
    mesh.numIndices = 6;
      
    meshOut.setValue(0, mesh);
    
  }

}
VVVV.Nodes.Grid.prototype = new VVVV.Core.Node();


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
        if ((match = /vertex_shader:((\n|.)+)fragment_shader:/.exec(response))==false) {
          console.log('ERROR: No vertex shader code found');
          return;
        }
        var vertexShaderCode = match[1];
        
        if ((match = /fragment_shader:((\n|.)+)$/.exec(response))==false) {
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
          if (u.semantic == 'COLOR' && u.type=='vec4')
            defaultValue = ['1.0, 1.0, 1.0, 1.0'];
          if (u.type=='mat4')
            defaultValue = [mat4.identity(mat4.create())];
          if (u.type=='sampler2D')
            defaultValue = [VVVV.DefaultTexture];
          var pin = thatNode.addInputPin(u.varname.replace('_',' '), defaultValue, thatNode);
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
      
    var maxSize = this.getMaxInputSliceCount();

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
        var pinname = shaderPins[i].pinname.replace(' ', '_');
        if (shaderPins[i].pinIsChanged()) {
          for (var j=0; j<maxSize; j++) {
            var value = shaderPins[i].getValue(j);
            if (shader.uniformSpecs[pinname].type=='vec4' && shader.uniformSpecs[pinname].semantic=='COLOR') {
              var rgba = _(value.split(',')).map(function(x) { return parseFloat(x) });
              layers[j].uniforms[pinname].value = new Float32Array(rgba);
            }
            else {
              layers[j].uniforms[pinname].value = value;
            }
          }
        }
    }
    
    if (transformIn.pinIsChanged()) {
      for (var i=0; i<maxSize; i++) {
        var transform = this.inputPins["Transform"].getValue(i);
        if (transform==undefined)
          mat4.identity(transform);
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
      
      vertexBuffer = new VVVV.Types.VertexBuffer(vertices, texCoords);
      mesh = new VVVV.Types.Mesh();
      mesh.vertexBuffer = vertexBuffer;
      mesh.indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array([ 0, 1, 2, 1, 3, 2 ]), gl.STATIC_DRAW);
      mesh.numIndices = 6;
      
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
  
  this.auto_evaluate = true;
  
  this.addInputPin("Layers", [], this);
  this.addInputPin("View Transform", [], this);
  this.addInputPin("Projection Transform", [], this);
  
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
    //gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  this.evaluate = function() {
    if (gl==undefined)
      return;
  
    var layers = this.inputPins["Layers"].values;
    var pMatrix = this.inputPins["Projection Transform"].getValue(0);
    var vMatrix = this.inputPins["View Transform"].getValue(0);
    
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
      
      gl.enableVertexAttribArray(layer.shader.attributeSpecs[layer.shader.attribSemanticMap["POSITION"]].position);
      gl.bindBuffer(gl.ARRAY_BUFFER, layer.mesh.vertexBuffer.positionBuffer);
      gl.vertexAttribPointer(layer.shader.attributeSpecs[layer.shader.attribSemanticMap["POSITION"]].position, 3, gl.FLOAT, false, 0, 0);
      
      gl.enableVertexAttribArray(layer.shader.attributeSpecs[layer.shader.attribSemanticMap["TEXCOORD0"]].position);
      gl.bindBuffer(gl.ARRAY_BUFFER, layer.mesh.vertexBuffer.texCoordBuffer);
      gl.vertexAttribPointer(layer.shader.attributeSpecs[layer.shader.attribSemanticMap["TEXCOORD0"]].position, 2, gl.FLOAT, false, 0, 0);
      
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, layer.mesh.indexBuffer);
      gl.uniformMatrix4fv(layer.shader.uniformSpecs[layer.shader.uniformSemanticMap["PROJECTION"]].position, false, pMatrix);
      gl.uniformMatrix4fv(layer.shader.uniformSpecs[layer.shader.uniformSemanticMap["VIEW"]].position, false, vMatrix);
      
      var textureIdx = 0;
      
      _(layer.uniforms).each(function(u) {
        if (u.value==undefined)
          return;
        switch (u.uniformSpec.type) {
          case "mat4": gl.uniformMatrix4fv(u.uniformSpec.position, false, u.value); break;
          case "vec4": gl.uniform4fv(u.uniformSpec.position, u.value); break;
          case "int": gl.uniform1i(u.uniformSpec.position, u.value); break;
          case "sampler2D":
            gl.activeTexture(gl['TEXTURE'+textureIdx]);
            gl.bindTexture(gl.TEXTURE_2D, u.value);
            gl.uniform1i(u.uniformSpec.position, textureIdx);
            textureIdx++;
            break;
        }
      });
      
      gl.drawElements(gl.TRIANGLES, layer.mesh.numIndices, gl.UNSIGNED_BYTE, 0);
    });
    
  }

}
VVVV.Nodes.RendererWebGL.prototype = new VVVV.Core.Node();