// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.


var gl;

VVVV.Types.WebGlRenderState = function() {
  this.alphaBlending = true;
  this.srcBlendMode = gl.SRC_ALPHA;
  this.destBlendMode = gl.ONE_MINUS_SRC_ALPHA;
  
  this.enableZWrite = true;
  this.depthFunc = gl.LEQUAL;
  this.depthOffset = 0.0;
  
  this.polygonDrawMode = gl.TRIANGLES;
  
  this.copy_attributes = function(other) {
    this.alphaBlending = other.alphaBlending;
    this.alphaFunc = other.alphaFunc;
    this.srcBlendMode = other.srcBlendMode;
    this.destBlendMode = other.destBlendMode;
    this.enableZwrite = other.enableZWrite;
    this.depthFunc = other.depthFunc;
    this.depthOffset = other.depthOffset;
    this.polygonDrawMode = other.polygonDrawMode;
  }
  
  this.apply = function(ctx) {
    if (this.alphaBlending)
      gl.enable(gl.BLEND);
    else
      gl.disable(gl.BLEND);
    gl.blendFunc(this.srcBlendMode, this.destBlendMode);
    
    gl.depthMask(this.enableZWrite);
    gl.depthFunc(this.depthFunc);
  }
}

var defaultWebGlRenderState = undefined;

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
  this.renderState = defaultWebGlRenderState;
  
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
    var pattern = /(uniform|attribute) ([a-zA-Z]+)([0-9xD]*) ([a-zA-Z0-9_]+)( : ([A-Z0-9]+))?( = \{?([^;\}]+)\}?)?;/g;
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
        var uniformSpec = {
          varname: match[4],
          semantic: match[6],
          position: gl.getUniformLocation(thatShader.shaderProgram, match[4]),
          type: match[2],
          defaultValue: match[8],
          dimension: dimension
        }
        thatShader.uniformSpecs[match[4]] = uniformSpec;
        if (match[6]!=undefined)
          thatShader.uniformSemanticMap[match[6]] = match[4];
      }
    }
  }
  
  this.setVertexShader = function(code) {
    vertexShaderCode = code;
    vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, code.replace(/((uniform|attribute) [a-zA-Z0-9]+ [a-zA-Z0-9_]+)[^;]*/g, '$1'));
    gl.compileShader(vertexShader);
    
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(vertexShader));
    }
  }
  
  this.setFragmentShader =function(code) {
    fragmentShaderCode = code;
    
    fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, code.replace(/((uniform|attribute) [a-zA-Z0-9]+ [a-zA-Z0-9_]+)[^;]*/g, '$1'));
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
 NODE: DX9Texture (EX9.Texture)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.DX9Texture = function(id, graph) {
  this.constructor(id, "DX9Texture (EX9.Texture)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var sourceIn = this.addInputPin("Source", [""], this);
  var outputOut = this.addOutputPin("Texture Out", [], this);
  
  var texture;
  
  this.initialize = function() {
    if (!gl)
      return;
    texture = gl.createTexture(); 
  }
  
  this.evaluate = function() {
    if (!gl)
      return;
  
    if (sourceIn.isConnected()) {
      var source = sourceIn.getValue(0);
      if ( (source.width & (source.width-1)) != 0 || (source.height & (source.height-1)) != 0)
        console.log("Warning: Source renderer's width/height is not a power of 2. DX9Texture will most likely not work.");
      gl.bindTexture(gl.TEXTURE_2D, texture);
      //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.bindTexture(gl.TEXTURE_2D, null);
    
      outputOut.setValue(0, texture);
    }
  
  }

}
VVVV.Nodes.DX9Texture.prototype = new VVVV.Core.Node();


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
 NODE: Blend (EX9.RenderState Advanced)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.BlendWebGLAdvanced = function(id, graph) {
  this.constructor(id, "Blend (EX9.RenderState Advanced)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var renderStateIn = this.addInputPin("Render State In", [], this);
  var alphaBlendingIn = this.addInputPin("Alpha Blending", [1], this);
  var srcModeIn = this.addInputPin("Source Blend Mode", ['SrcAlpha'], this); 
  var destModeIn = this.addInputPin("Destination Blend Mode", ['SrcAlpha'], this); 
  
  var renderStateOut = this.addOutputPin("Render State Out", [], this);
  
  var renderStates = [];
  
  function convertToWebGLBlendFactor(VVVVFactor) {
    switch (VVVVFactor) {
      case 'One': return gl.ONE;
      case 'Zero': return gl.ZERO;
      case 'SrcAlpha': return gl.SRC_ALPHA;
      case 'InvSrcAlpha': return gl.ONE_MINUS_SRC_ALPHA;
      case 'DestAlpha': return gl.DST_ALPHA;
      case 'InvDestAlpha': return gl.ONE_MINUS_DST_ALPHA;
      case 'SrcColor': return gl.SRC_COLOR;
      case 'InvSrcColor': return gl.ONE_MINUS_SRC_COLOR;
      case 'DestColor': return gl.DST_COLOR;
      case 'InvDestColor': return gl.ONE_MINUS_DST_COLOR;
    }
    return null;
  }
  
  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();
  
    for (var i=0; i<maxSpreadSize; i++) {
      if (renderStates[i]==undefined) {
        renderStates[i] = new VVVV.Types.WebGlRenderState();
      }
      if (renderStateIn.isConnected())
        renderStates[i].copy_attributes(renderStateIn.getValue(i));
      else
        renderStates[i].copy_attributes(defaultWebGlRenderState);
      renderStates[i].alphaBlending = parseFloat(alphaBlendingIn.getValue(i))>.5;
      renderStates[i].srcBlendMode = convertToWebGLBlendFactor(srcModeIn.getValue(i));
      renderStates[i].destBlendMode = convertToWebGLBlendFactor(destModeIn.getValue(i));
      renderStateOut.setValue(i, renderStates[i]);
    }
    renderStateOut.setSliceCount(maxSpreadSize);
    
  }

}
VVVV.Nodes.BlendWebGLAdvanced.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Blend (EX9.RenderState)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.BlendWebGL = function(id, graph) {
  this.constructor(id, "Blend (EX9.RenderState)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['results differ from VVVV', 'Multiply mode not supported']
  };
  
  var renderStateIn = this.addInputPin("Render State In", [], this);
  var drawModeIn = this.addInputPin("Draw Mode", ["Blend"], this);
  
  var renderStateOut = this.addOutputPin("Render State Out", [], this);
  
  var renderStates = [];
  
  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();
  
    for (var i=0; i<maxSpreadSize; i++) {
      if (renderStates[i]==undefined) {
        renderStates[i] = new VVVV.Types.WebGlRenderState();
      }
      if (renderStateIn.isConnected())
        renderStates[i].copy_attributes(renderStateIn.getValue(i));
      else
        renderStates[i].copy_attributes(defaultWebGlRenderState);
      switch (drawModeIn.getValue(i)) {
        case "Add":
          renderStates[i].srcBlendMode = gl.SRC_ALPHA;
          renderStates[i].destBlendMode = gl.ONE;
          break;
        case "Multiply":
          console.log("Multiply Blend Mode not supported (or we just missed it)");
        case "Blend":
          renderStates[i].srcBlendMode = gl.SRC_ALPHA;
          renderStates[i].destBlendMode = gl.ONE_MINUS_SRC_ALPHA;
          break;
        case "ColorAsAlphaAdd":
          renderStates[i].srcBlendMode = gl.SRC_COLOR;
          renderStates[i].destBlendMode = gl.ONE;
          break;
        case "ColorAsAlphaBlend":
          renderStates[i].srcBlendMode = gl.SRC_COLOR;
          renderStates[i].destBlendMode = gl.ONE_MINUS_SRC_COLOR;
          break;
      }
      renderStateOut.setValue(i, renderStates[i]);
    }
    renderStateOut.setSliceCount(maxSpreadSize);
    
  }

}
VVVV.Nodes.BlendWebGL.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Fill (EX9.RenderState)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.FillWebGL = function(id, graph) {
  this.constructor(id, "Fill (EX9.RenderState)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['does not actually draw wireframe, because this is not supported in WebGL, but makes renderer use gl.LINE instead of gl.TRIANGLES when drawing']
  };
  
  var renderStateIn = this.addInputPin("Render State In", [], this);
  var fillModeIn = this.addInputPin("Fill Mode", ["Blend"], this);
  
  var renderStateOut = this.addOutputPin("Render State Out", [], this);
  
  var renderStates = [];
  
  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();
  
    for (var i=0; i<maxSpreadSize; i++) {
      if (renderStates[i]==undefined) {
        renderStates[i] = new VVVV.Types.WebGlRenderState();
      }
      if (renderStateIn.isConnected())
        renderStates[i].copy_attributes(renderStateIn.getValue(i));
      else
        renderStates[i].copy_attributes(defaultWebGlRenderState);
      switch (fillModeIn.getValue(i)) {
        case 'Point':
        case 'Solid':
          renderStates[i].polygonDrawMode = gl.TRIANGLES;
          break;
        case 'WireFrame':
          renderStates[i].polygonDrawMode = gl.LINES;
      }
      renderStateOut.setValue(i, renderStates[i]);
    }
    renderStateOut.setSliceCount(maxSpreadSize);
    
  }

}
VVVV.Nodes.FillWebGL.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: ZWriteEnable (EX9.RenderState)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.ZWriteEnableWebGL = function(id, graph) {
  this.constructor(id, "ZWriteEnable (EX9.RenderState)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var renderStateIn = this.addInputPin("Render State In", [], this);
  var enableZWriteIn = this.addInputPin("ZWrite Enable", [1], this);
  var depthFuncIn = this.addInputPin("Compare Function", ['Always'], this); 
  var biasIn = this.addInputPin("Depth Bias", [0.0], this); 
  
  var renderStateOut = this.addOutputPin("Render State Out", [], this);
  
  var renderStates = [];
  
  function convertToWebGLDepthFunc(VVVVFunc) {
    switch (VVVVFunc) {
      case 'Never': return gl.NEVER;
      case 'Less': return gl.LESS;
      case 'LessEqual': return gl.LEQUAL;
      case 'Equal': return gl.EQUAL;
      case 'NotEqual': return gl.NOTEQUAL;
      case 'Greater': return gl.GREATER;
      case 'GreaterEqual': return gl.GEQUAL;
      case 'Always': return gl.ALWAYS;
    }
    return null;
  }
  
  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();
  
    for (var i=0; i<maxSpreadSize; i++) {
      if (renderStates[i]==undefined) {
        renderStates[i] = new VVVV.Types.WebGlRenderState();
      }
      if (renderStateIn.isConnected())
        renderStates[i].copy_attributes(renderStateIn.getValue(i));
      else
        renderStates[i].copy_attributes(defaultWebGlRenderState);
      renderStates[i].enableZWrite = parseFloat(enableZWriteIn.getValue(i))>.5;
      renderStates[i].depthFunc = convertToWebGLDepthFunc(depthFuncIn.getValue(i));
      renderStates[i].depthOffset = parseFloat(biasIn.getValue(0));
      renderStateOut.setValue(i, renderStates[i]);
    }
    renderStateOut.setSliceCount(maxSpreadSize);
    
  }

}
VVVV.Nodes.ZWriteEnableWebGL.prototype = new VVVV.Core.Node();


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
  
  var renderStateIn = this.addInputPin("Render State", [], this);
  var meshIn = this.addInputPin("Mesh", [], this);
  var transformIn = this.addInputPin("Transform", [], this);
  
  var layerOut = this.addOutputPin("Layer", [], this);
  
  var layers = [];
  var mesh = null;
  var shader = null;
  
  var shaderPins = [];
  
  var initialized = false;
  
  this.initialize = function() {
    
    if (!gl) {
      console.log('ARGH! Sorry, due to some weirdness, it is necessary to create the Renderer _before_ the shader nodes :(');
      return;
    }
    
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
          switch (u.type) {
            case 'mat':
              defaultValue = [mat4.identity(mat4.create())];
              break;
            case 'sampler':
              defaultValue = [VVVV.DefaultTexture];
              break;
            default:
              if (u.semantic == 'COLOR')
                defaultValue = ['1.0, 1.0, 1.0, 1.0'];
              else
                defaultValue = [0.0];
              if (u.defaultValue) {
                if (u.semantic != 'COLOR')
                  defaultValue = _(u.defaultValue.split(',')).map(function(e) { return parseFloat(e); });
                else
                  defaultValue = [u.defaultValue];
              }
              
          }
            
          var pin = thatNode.addInputPin(u.varname.replace(/_/g,' '), defaultValue, thatNode);
          pin.dimensions = u.dimension;
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
      var pinname = p.pinname.replace(/ /g,'_')
      if (shader.uniformSpecs[pinname] && shader.uniformSpecs[pinname].type=='vec') {
        sliceCount = parseInt(sliceCount/shader.uniformSpecs[pinname].dimension);
      }
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
              var arr = shaderPins[i].getValue(j, shaderPins[i].dimensions);
              layers[j].uniforms[pinname].value = new Float32Array(arr);
            }
          }
          else {
            layers[j].uniforms[pinname].value = shaderPins[i].getValue(j);
          }
        }
      }
    }
    
    if (renderStateIn.pinIsChanged()) {
      for (var i=0; i<maxSize; i++) {
        layers[i].renderState = renderStateIn.getValue(i);
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
  
  var renderStateIn = this.addInputPin("Render State", [], this);
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
      fragmentShaderCode += "uniform vec4 col : COLOR = {1.0, 1.0, 1.0, 1.0}; varying vec2 vs2psTexCd; uniform sampler2D Samp0; void main(void) { gl_FragColor = col*texture2D(Samp0, vs2psTexCd);  }";
      var vertexShaderCode = "attribute vec3 PosO : POSITION; attribute vec2 TexCd : TEXCOORD0; uniform mat4 tW : WORLD; uniform mat4 tV : VIEW; uniform mat4 tP : PROJECTION; varying vec2 vs2psTexCd; void main(void) { gl_Position = tP * tV * tW * vec4(PosO, 1.0); vs2psTexCd = TexCd; }";
      
      shader = new VVVV.Types.ShaderProgram();
      shader.setFragmentShader(fragmentShaderCode);
      shader.setVertexShader(vertexShaderCode);
      shader.setup();
          
    }
    
    var maxSize = this.getMaxInputSliceCount();
    var currentLayerCount = layers.length;
    // shorten layers array, if input slice count decreases
    if (maxSize<currentLayerCount) {
      layers.splice(maxSize, currentLayerCount-maxSize);
    }
    for (var j=currentLayerCount; j<maxSize; j++) {
      layers[j] = new VVVV.Types.Layer();
      layers[j].mesh = mesh;
      layers[j].shader = shader;
      
      _(shader.uniformSpecs).each(function(u) {
        layers[j].uniforms[u.varname] = { uniformSpec: u, value: undefined };
      });
    }
    
    var colorChanged = this.inputPins["Color"].pinIsChanged();
    var transformChanged = this.inputPins["Transform"].pinIsChanged();
    var textureChanged = this.inputPins["Texture"].pinIsChanged();
    
    if (colorChanged) {
      for (var i=0; i<maxSize; i++) {
        var color = this.inputPins["Color"].getValue(i);
        var rgba = _(color.split(',')).map(function(x) { return parseFloat(x) });
        layers[i].uniforms['col'].value = new Float32Array(rgba);
      }
    }
    
    if (renderStateIn.pinIsChanged()) {
      for (var i=0; i<maxSize; i++) {
        layers[i].renderState = renderStateIn.getValue(i);
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
        if (this.inputPins["Texture"].isConnected())
          tex = this.inputPins["Texture"].getValue(i);
        else
          tex = VVVV.DefaultTexture;
        layers[i].uniforms["Samp0"].value = tex;
      }
    }
    
    this.outputPins["Layer"].setSliceCount(maxSize);
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
    compatibility_issues: ['Disabling Clear doesn\'t work in Chrome', 'Backbuffer width and height defined by canvas size', 'No Fullscreen', 'No Enable Pin', 'No Aspect Ration and Viewport transform', 'No mouse output', 'No backbuffer dimesions output', 'No WebGL (EX9) Output Pin']
  };
  
  this.addInputPin("Layers", [], this);
  var clearIn = this.addInputPin("Clear", [1], this);
  var bgColIn = this.addInputPin("Background Color", ['0.0, 0.0, 0.0, 1.0'], this);
  var viewIn = this.addInputPin("View", [], this);
  var projIn = this.addInputPin("Projection", [], this);
  
  var enableDepthBufIn = this.addInvisiblePin("Windowed Depthbuffer Format", ['NONE'], this);
  
  var bufferWidthOut = this.addOutputPin("Actual Backbuffer Width", [0.0], this);
  var bufferHeightOut = this.addOutputPin("Actual Backbuffer Height", [0.0], this);
  
  var width = 0.0;
  var height = 0.0;
  
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
    if (!gl)
      return;
      
    // doing this afterwards, so we can use these values in the patch for checking, if webgl context was set up correctly
    width = parseInt(canvas.get(0).width);
    height = parseInt(canvas.get(0).height);
    
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
    
    defaultWebGlRenderState = new VVVV.Types.WebGlRenderState();
  }
  
  var initialized = false;

  this.evaluate = function() {
    if (this.invisiblePins["Descriptive Name"].pinIsChanged()) {
      this.initialize();
    }
      
    if (!initialized) {
      bufferWidthOut.setValue(0, width);
      bufferHeightOut.setValue(0, height);
      initialized = true;
    }
    
    if (gl==undefined)
      return;
      
    if (bgColIn.pinIsChanged()) {
      var col = _(bgColIn.getValue(0).split(',')).map(function(e) {
        return parseFloat(e);
      });
      gl.clearColor(col[0], col[1], col[2], col[3]);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }
    
    if (enableDepthBufIn.pinIsChanged()) {
      if (enableDepthBufIn.getValue(0)=='NONE')
        gl.disable(gl.DEPTH);
      else
        gl.enable(gl.DEPTH_TEST);
    }
  
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
    
    if (clearIn.getValue(0)>.5)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    var currentShaderProgram = null;

    _(layers).each(function(layer) {
      if (currentShaderProgram!=layer.shader.shaderProgram) {
        gl.useProgram(layer.shader.shaderProgram);
        currentShaderProgram = layer.shader.shaderProgram;
      }
      
      var renderState = layer.renderState;
      if (!renderState)
        renderState = defaultWebGlRenderState;
      renderState.apply();
      
      gl.bindBuffer(gl.ARRAY_BUFFER, layer.mesh.vertexBuffer.vbo);
      _(layer.mesh.vertexBuffer.subBuffers).each(function(b) {
        if (!layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]])
          return;
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
      
      gl.drawElements(renderState.polygonDrawMode, layer.mesh.numIndices, gl.UNSIGNED_SHORT, 0);
    });
    
  }

}
VVVV.Nodes.RendererWebGL.prototype = new VVVV.Core.Node();