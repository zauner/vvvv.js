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
  this.transform = mat4.create();
  mat4.identity(this.transform);
  
  this.toString = function() {
    return "Layer";
  }
  
}

VVVV.Types.ShaderProgram = function() {

  this.uniformSpecs = {};
  this.attributeSpecs = {};
  
  var vertexShaderCode = '';
  var fragmentShaderCode = '';
  
  var vertexShader;
  var fragmentShader;
  
  this.shaderProgram;
  
  var thatShader = this;
  
  function extractSemantics(code) {
    var pattern = /(uniform|attribute) ([a-zA-Z0-9_]+) ([a-zA-Z0-9_]+) <([^> ]+)>/g;
    while ((match = pattern.exec(code))) {
      if (match[1]=='attribute') {
        thatShader.attributeSpecs[match[4]] = {
          varname: match[3],
          semantic: match[4],
          position: gl.getAttribLocation(thatShader.shaderProgram, match[3])
        };
      }
      else {
        thatShader.uniformSpecs[match[4]] = {
          varname: match[3],
          semantic: match[4],
          position: gl.getUniformLocation(thatShader.shaderProgram, match[3]),
          type: match[2]
        }
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
      fragmentShaderCode += "uniform vec4 col <COLOR>; uniform int useTexture <USE_TEXTURE>; varying vec2 vs2psTexCd; uniform sampler2D Samp0; void main(void) { gl_FragColor = col; if (useTexture>0) gl_FragColor = gl_FragColor*texture2D(Samp0, vs2psTexCd);  }";
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
          layers[j].uniforms[u.semantic] = { uniformSpec: u, value: undefined };
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
        layers[i].uniforms['COLOR'].value = new Float32Array(rgba);
      }
    }
    
    if (true) {
      for (var i=0; i<maxSize; i++) {
        var transform = this.inputPins["Transform"].getValue(i);
        if (transform!=undefined)
          layers[i].transform = transform;
        else
          mat4.identity(layers[i].transform);
        layers[i].uniforms['WORLD'].value = layers[i].transform;
      }
    }
    
    if (textureChanged) {
      for (var i=0; i<maxSize; i++) {
        console.log('setting texture for layer '+i);
        tex = this.inputPins["Texture"].getValue(i);
        if (tex!=undefined) {
          layers[i].textures[0] = { position: gl.getUniformLocation(layers[i].shader.shaderProgram, "Samp0"), texture: tex };
          layers[i].uniforms["USE_TEXTURE"].value = 1;
        }
        else
          layers[i].uniforms["USE_TEXTURE"].value = 0;
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
      
      gl.enableVertexAttribArray(layer.shader.attributeSpecs["POSITION"].position);
      gl.bindBuffer(gl.ARRAY_BUFFER, layer.mesh.vertexBuffer.positionBuffer);
      gl.vertexAttribPointer(layer.shader.attributeSpecs["POSITION"].position, 3, gl.FLOAT, false, 0, 0);
      
      gl.enableVertexAttribArray(layer.shader.attributeSpecs["TEXCOORD0"].position);
      gl.bindBuffer(gl.ARRAY_BUFFER, layer.mesh.vertexBuffer.texCoordBuffer);
      gl.vertexAttribPointer(layer.shader.attributeSpecs["TEXCOORD0"].position, 2, gl.FLOAT, false, 0, 0);
      
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, layer.mesh.indexBuffer);
      gl.uniformMatrix4fv(layer.shader.uniformSpecs["PROJECTION"].position, false, pMatrix);
      gl.uniformMatrix4fv(layer.shader.uniformSpecs["VIEW"].position, false, vMatrix);
      _(layer.uniforms).each(function(u) {
        if (u.value==undefined)
          return;
        switch (u.uniformSpec.type) {
          case "mat4": gl.uniformMatrix4fv(u.uniformSpec.position, false, u.value); break;
          case "vec4": gl.uniform4fv(u.uniformSpec.position, u.value); break;
          case "int": gl.uniform1i(u.uniformSpec.position, u.value); break;
        }
      });
      
      if (layer.textures.length>0) {
        var t = layer.textures[0];
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, t.texture);
        gl.uniform1i(t.position, 0);
      }
      
      gl.drawElements(gl.TRIANGLES, layer.mesh.numIndices, gl.UNSIGNED_BYTE, 0);
    });
    
  }

}
VVVV.Nodes.RendererWebGL.prototype = new VVVV.Core.Node();