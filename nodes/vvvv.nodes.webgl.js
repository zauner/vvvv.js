
var gl;
var defaultShaderAttributes = [ "PosO", "TexCd" ];
var defaultShaderUniforms = [ "tP", "tV" ];

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
  this.shaderProgram = null;
  this.uniforms = {};
  this.attributePositions = {};
  this.transform = mat4.create();
  mat4.identity(this.transform);
  
  this.toString = function() {
    return "Layer";
  }
}

VVVV.Nodes.FileTexture = function(id, graph) {
  this.constructor(id, "FileTexture (EX9.Texture)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Always loads in background', 'No reload pin', 'No preload pin (preloading handled by browser)', 'No up and running pin', 'No texture info outputs']
  };

  var filenamePin = this.addInputPin("Filename", [""], this);
  
  var outputPin = this.addOutputPin("Texture Out", [], this);
  
  var textures = [];
  
  this.evaluate = function() {
    if (!gl)
      return;
  
    if (filenamePin.pinIsChanged()) {
      var maxSize = this.getMaxInputSliceCount();
      for (var i=0; i<maxSize; i++) {
        var filename = filenamePin.getValue(i);
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
      
        outputPin.setValue(i, textures[i]);
      }
    }
  
  }

}
VVVV.Nodes.FileTexture.prototype = new VVVV.Core.Node();

VVVV.Nodes.Quad = function(id, graph) {
  this.constructor(id, "Quad (DX9)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['No Sampler States and Render States', 'No texture transform', 'No texture coord mapping', 'No enable pin']
  };
  
  this.addInputPin("Transform", [], this);
  this.addInputPin("Texture", [], this);
  this.addInputPin("Color", ["1.0, 1.0, 1.0, 1.0"], this);
  
  this.addOutputPin("Layer", [], this);
  
  var initialized = false;
  var layers = [];
  var mesh = null;
  var shaderProgram = null;
  
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
      fragmentShaderCode += "uniform vec4 col; uniform int useTexture; varying vec2 vs2psTexCd; uniform sampler2D Samp0; void main(void) { gl_FragColor = col; if (useTexture>0) gl_FragColor = gl_FragColor*texture2D(Samp0, vs2psTexCd);  }";
      var vertexShaderCode = "attribute vec3 PosO; attribute vec2 TexCd; uniform mat4 tW; uniform mat4 tV; uniform mat4 tP; varying vec2 vs2psTexCd; void main(void) { gl_Position = tP * tV * tW * vec4(PosO, 1.0); vs2psTexCd = TexCd; }";
      var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, fragmentShaderCode);
      gl.compileShader(fragmentShader);

      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(fragmentShader));
      }
      var vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, vertexShaderCode);
      gl.compileShader(vertexShader);

      if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(vertexShader));
      }

      shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, vertexShader);
      gl.attachShader(shaderProgram, fragmentShader);
      gl.linkProgram(shaderProgram);

      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
      }
      
      var maxSize = this.getMaxInputSliceCount();
      for (var j=0; j<maxSize; j++) {
        layers[j] = new VVVV.Types.Layer();
        layers[j].mesh = mesh;
        layers[j].shaderProgram = shaderProgram;
        
        for (var i=0; i<defaultShaderAttributes.length; i++) {
          layers[j].attributePositions[defaultShaderAttributes[i]] = gl.getAttribLocation(shaderProgram, defaultShaderAttributes[i]);
        }
        
        for (var i=0; i<defaultShaderUniforms.length; i++) {
          layers[j].uniforms[defaultShaderUniforms[i]] = { position: gl.getUniformLocation(shaderProgram, defaultShaderUniforms[i]), value: undefined };
        }
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
        layers[i].uniforms['col'] = { position: gl.getUniformLocation(shaderProgram, 'col'), value: new Float32Array(rgba), setter: 'gl.uniform4fv' };
      }
    }
    
    if (true) {
      for (var i=0; i<maxSize; i++) {
        var transform = this.inputPins["Transform"].getValue(i);
        if (transform!=undefined)
          layers[i].transform = transform;
        else
          mat4.identity(layers[i].transform);
        layers[i].uniforms['tW'] = { position: gl.getUniformLocation(shaderProgram, 'tW'), value: layers[i].transform, setter: 'gl.uniformMatrix4fv' };
      }
    }
    
    if (textureChanged) {
      for (var i=0; i<maxSize; i++) {
        console.log('setting texture for layer '+i);
        tex = this.inputPins["Texture"].getValue(i);
        if (tex!=undefined) {
          layers[i].textures[0] = { position: gl.getUniformLocation(shaderProgram, "Samp0"), texture: tex };
          layers[i].uniforms["useTexture"] = { position: gl.getUniformLocation(shaderProgram, 'useTexture'), value: 1, setter: 'gl.uniform1i' };
        }
        else
          layers[i].uniforms["useTexture"] = { position: gl.getUniformLocation(shaderProgram, 'useTexture'), value: 0, setter: 'gl.uniform1i' };
      }
    }
    
    for (var i=0; i<maxSize; i++) {
      this.outputPins["Layer"].setValue(i, layers[i]);
    }
    
    initialized = true;
  }

}
VVVV.Nodes.Quad.prototype = new VVVV.Core.Node();


VVVV.Nodes.RendererWebGL = function(id, graph) {
  this.constructor(id, "Renderer (EX9)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['No Clear Pin', 'No Background color pin', 'Backbuffer width and height defined by canvas size', 'No Fullscreen', 'No Enable Pin', 'No Aspect Ration and Viewport transform', 'No mouse output', 'No backbuffer dimesions output', 'No WebGL (EX9) Output Pin']
  };
  
  this.addInputPin("Layers", [], this);
  this.addInputPin("View Transform", [], this);
  this.addInputPin("Projection Transform", [], this);
  
  this.initialize = function() {
    if (!this.inputPins["Descriptive Name"])
      return;
  
    var selector = this.inputPins["Descriptive Name"].getValue(0);
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
      if (currentShaderProgram!=layer.shaderProgram) {
        gl.useProgram(layer.shaderProgram);
        currentShaderProgram = layer.shaderProgram;
      }
      
      gl.enableVertexAttribArray(layer.attributePositions["PosO"]);
      gl.bindBuffer(gl.ARRAY_BUFFER, layer.mesh.vertexBuffer.positionBuffer);
      gl.vertexAttribPointer(layer.attributePositions["PosO"], 3, gl.FLOAT, false, 0, 0);
      
      gl.enableVertexAttribArray(layer.attributePositions["TexCd"]);
      gl.bindBuffer(gl.ARRAY_BUFFER, layer.mesh.vertexBuffer.texCoordBuffer);
      gl.vertexAttribPointer(layer.attributePositions["TexCd"], 2, gl.FLOAT, false, 0, 0);
      
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, layer.mesh.indexBuffer);
      gl.uniformMatrix4fv(layer.uniforms["tP"].position, false, pMatrix);
      gl.uniformMatrix4fv(layer.uniforms["tV"].position, false, vMatrix);
      _(layer.uniforms).each(function(u) {
        if (u.value==undefined)
          return;
        switch (u.setter) {
          case "gl.uniformMatrix4fv": gl.uniformMatrix4fv(u.position, false, u.value); break;
          case "gl.uniform4fv": gl.uniform4fv(u.position, u.value); break;
          case "gl.uniform1i": gl.uniform1i(u.position, u.value); break;
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