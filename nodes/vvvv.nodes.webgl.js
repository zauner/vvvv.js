// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.


var identity = mat4.identity(mat4.create());

VVVV.Types.WebGlRenderState = function() {
  this.alphaBlending = true;
  this.srcBlendMode = "SRC_ALPHA";
  this.destBlendMode = "ONE_MINUS_SRC_ALPHA";
  
  this.enableZWrite = true;
  this.depthFunc = "LEQUAL";
  this.depthOffset = 0.0;
  
  this.polygonDrawMode = "TRIANGLES";
  
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
  
  this.apply = function(gl) {
    if (this.alphaBlending)
      gl.enable(gl.BLEND);
    else
      gl.disable(gl.BLEND);
    gl.blendFunc(gl[this.srcBlendMode], gl[this.destBlendMode]);
    
    gl.depthMask(this.enableZWrite);
    //gl.depthFunc(gl[this.depthFunc]);
  }
}

VVVV.Types.VertexBuffer = function(gl, p) {
  
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

VVVV.Types.Mesh = function(gl, vertexBuffer, indices) {
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
  this.uniformNames = []; // to help iterate through this.uniforms
  this.renderState = defaultWebGlRenderState;
  
  this.toString = function() {
    return "Layer";
  }
  
}

VVVV.PinTypes.WebGlResource = {
  typeName: "WebGlResource",
  reset_on_disconnect: true,
  connectionChangedHandlers: {
    "webglresource": function() {
      if (this.direction==PinDirection.Input)
        return;
      var that = this.node
      var renderers = that.findDownstreamNodes('Renderer (EX9)');
      if (!that.renderContexts)
        that.renderContexts = []; // this 'public property' should actually go to the top, right above this.setAsWebGlResourcePin. However, that doesnt work, values got overwritte by nodes of the same type.
      if (that.contextChanged==undefined)
        that.contextChanged = false;
      for (var i=0; i<renderers.length; i++) {
        that.contextChanged |= (!that.renderContexts[i] || that.renderContexts[i].canvas.id!=renderers[i].ctxt.id)
        that.renderContexts[i] = renderers[i].ctxt;
        that.dirty = true;
      }
      if (that.renderContexts.length!=renderers.length) {
        that.renderContexts.length = renderers.length;
        that.contextChanged = true;
        that.dirty = true;
      }
      
      function isWebGlPinType(typeName) {
        return typeName=="WebGlResource" || typeName=="WebGlTexture";
      }
      
      if (!that.isSubpatch) {
        _(that.inputPins).each(function(p) {
          var fromPin;
          p.markPinAsChanged();
          if (that.nodename!="Renderer (EX9)") {
            if (p.isConnected()) {
              if (p.links.length>0)
                fromPin = p.links[0].fromPin
              else if (p.masterPin.links[0].fromPin.links.length>0)
                fromPin = p.masterPin.links[0].fromPin;
              if (fromPin && isWebGlPinType(fromPin.typeName))
                fromPin.connectionChanged();
            }
          }
        });
      }
      
      if (this.masterPin && isWebGlPinType(this.masterPin.typeName))
        this.masterPin.connectionChanged();
    }
  },
  defaultValue: function() {
    return new VVVV.Types.Layer();
  }
}

VVVV.PinTypes.WebGlTexture = {
  typeName: "WebGlTexture",
  reset_on_disconnect: true,
  connectionChangedHandlers: {
    "webglresource": VVVV.PinTypes.WebGlResource.connectionChangedHandlers["webglresource"]
  },
  defaultValue: function() {
    return VVVV.DefaultTexture;
  }
}

var defaultWebGlRenderState = new VVVV.Types.WebGlRenderState();
VVVV.PinTypes.WebGlRenderState = {
  typeName: "WebGlRenderState",
  reset_on_disconnect: true,
  defaultValue: function() {
    return defaultWebGlRenderState;
  }
}

VVVV.DefaultTexture = "Empty Texture";

VVVV.Types.ShaderProgram = function() {

  this.uniformSpecs = {};
  this.attributeSpecs = {};
  
  this.attribSemanticMap = {};
  this.uniformSemanticMap = {};
  
  var vertexShaderCode = '';
  var fragmentShaderCode = '';
  
  var vertexShader;
  var fragmentShader;
  
  this.isSetup = false;
  
  this.shaderProgram = undefined;
  
  var thatShader = this;
  
  this.extractSemantics = function(code) {
    var pattern = /(uniform|attribute) ([a-zA-Z]+)([0-9xD]*) ([a-zA-Z0-9_]+)( : ([A-Z0-9]+))?( = \{?([^;\}]+)\}?)?;/g;
    var match;
    while ((match = pattern.exec(code))) {
      if (match[1]=='attribute' && !(thatShader.attributeSpecs[match[4]])) {
        thatShader.attributeSpecs[match[4]] = {
          varname: match[4],
          semantic: match[6],
          position: 0
        };
        if (match[6]!=undefined)
          thatShader.attribSemanticMap[match[6]] = match[4];
      }
      else if (!thatShader.uniformSpecs[match[4]]) {
        var dimension = match[3]=='' ? 1 : match[3];
        var uniformSpec = {
          varname: match[4],
          semantic: match[6],
          position: 0,
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
    //extractSemantics(code);
  }
  
  this.setFragmentShader =function(code) {
    fragmentShaderCode = code;
    //extractSemantics(code);
  }
  
  this.setup = function(gl) {
    vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderCode.replace(/((uniform|attribute) [a-zA-Z0-9]+ [a-zA-Z0-9_]+)[^;]*/g, '$1'));
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(vertexShader));
    }
    
    fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderCode.replace(/((uniform|attribute) [a-zA-Z0-9]+ [a-zA-Z0-9_]+)[^;]*/g, '$1'));
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(fragmentShader));
    }
    
    this.shaderProgram = gl.createProgram();
    gl.attachShader(this.shaderProgram, vertexShader);
    gl.attachShader(this.shaderProgram, fragmentShader);
    gl.linkProgram(this.shaderProgram);

    if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
    }
    
    _(this.attributeSpecs).each(function(aSpec) {
      aSpec.position = gl.getAttribLocation(thatShader.shaderProgram, aSpec.varname);
    }); 
    
    _(this.uniformSpecs).each(function(uSpec) {
      uSpec.position = gl.getUniformLocation(thatShader.shaderProgram, uSpec.varname);
    }); 
    
    this.isSetup = true;
    
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
  
  this.auto_evaluate = false;

  var filenamePin = this.addInputPin("Filename", [""], this);
  var outputPin = this.addOutputPin("Texture Out", [], this, VVVV.PinTypes.WebGlTexture);
  
  var textures = [];
  
  this.evaluate = function() {

    if (!this.renderContexts) return;
    var gl = this.renderContexts[0];
    
    if (!gl)
      return;
  
    if (filenamePin.pinIsChanged() || this.contextChanged) {
      var maxSize = this.getMaxInputSliceCount();
      for (var i=0; i<maxSize; i++) {
        var filename = filenamePin.getValue(i);
        if (filename.indexOf('http://')===0 && VVVV.ImageProxyPrefix!==undefined)
          filename = VVVV.ImageProxyPrefix+encodeURI(filename);
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
            outputPin.markPinAsChanged();
          }
        })(i);
        textures[i].image.src = filename;
      
        outputPin.setValue(i, textures[i]);
      }
      outputPin.setSliceCount(maxSize);
    }
    this.contextChanged = false;
  
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
    compatibility_issues: ['Using WebGL renderer as source doesnt work correctly in Chrome.']
  };

  var sourceIn = this.addInputPin("Source", [], this, true);
  var outputOut = this.addOutputPin("Texture Out", [], this, VVVV.PinTypes.WebGlTexture);
  
  var texture;
  
  this.evaluate = function() {
    if (!this.renderContexts) return;
    var gl = this.renderContexts[0];
    if (!gl)
      return;

    if (sourceIn.isConnected()) {
      var source = sourceIn.getValue(0);
      if (!source)
        return;
      if ( (source.width & (source.width-1)) != 0 || (source.height & (source.height-1)) != 0)
        console.log("Warning: Source renderer's width/height is not a power of 2. DX9Texture will most likely not work.");
      if (source instanceof WebGLTexture) {
        outputOut.setValue(0, source);
      }
      else {
        if (texture==undefined)
          texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.bindTexture(gl.TEXTURE_2D, null);
      
        outputOut.setValue(0, texture);
      }
    }
    else {
      delete texture;
      gl.deleteTexture(texture);
      outputOut.setValue(0, undefined);
    }
  
  }

}
VVVV.Nodes.DX9Texture.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: VideoTexture (EX9.Texture VMR9)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.VideoTexture = function(id, graph) {
  this.constructor(id, "VideoTexture (EX9.Texture VMR9)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Only supports power-of-2 sized videos', 'Has no output pins for meta data']
  };

  var sourceIn = this.addInputPin("Video", [], this, true);
  var outputOut = this.addOutputPin("Texture Out", [], this, VVVV.PinTypes.WebGlTexture);
  
  var texture;
  
  this.evaluate = function() {
    if (!this.renderContexts) return;
    var gl = this.renderContexts[0];
    if (!gl)
      return;

    if (sourceIn.isConnected()) {
      var source = sourceIn.getValue(0);
      if ( (source.videoWidth & (source.videoWidth-1)) != 0 || (source.videoHeight & (source.videoHeight-1)) != 0)
        console.log("Warning: Video width/height is not a power of 2. VideoTexture will most likely not work.");
      if (texture==undefined || this.contextChanged)
        texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.bindTexture(gl.TEXTURE_2D, null);
    
      outputOut.setValue(0, texture);
      this.contextChanged = false;
    }
    else {
      delete texture;
      gl.deleteTexture(texture);
      outputOut.setValue(0, undefined);
    }
  
  }

}
VVVV.Nodes.VideoTexture.prototype = new VVVV.Core.Node();


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
  
  var vbOut = this.addOutputPin("Vertex Buffer", [], this, VVVV.PinTypes.WebGlResource);
  
  var vertexBuffer = null;
  
  this.evaluate = function() {
  
    var gl = this.renderContexts[0];
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
      vertexBuffer = new VVVV.Types.VertexBuffer(gl, positions);
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
  
  var meshOut = this.addOutputPin("Mesh", [], this, VVVV.PinTypes.WebGlResource);
  
  var mesh = null;
  
  this.evaluate = function() {
  
    var gl = this.renderContexts[0];
    if (!gl)
      return;
    
    if (applyIn.getValue(0)>=.5) {
      if (vbIn.isConnected()) {
        mesh = new VVVV.Types.Mesh(gl, vbIn.getValue(0), indicesIn.values);
        meshOut.setValue(0, mesh);
      }
      else {
        meshOut.setValue(0, undefined);
        delete mesh;
      }
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
  
  var meshOut = this.addOutputPin("Mesh", [], this, VVVV.PinTypes.WebGlResource);
  
  var mesh = null;
  
  this.evaluate = function() {

    if (!this.renderContexts) return;
    var gl = this.renderContexts[0];
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
    
    var vertexBuffer = new VVVV.Types.VertexBuffer(gl, vertices);
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
    mesh = new VVVV.Types.Mesh(gl, vertexBuffer, indices);
      
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
  
  var meshOut = this.addOutputPin("Mesh", [], this, VVVV.PinTypes.WebGlResource);
  
  var mesh = null;
  
  this.evaluate = function() {
  
    if (!this.renderContexts) return;
    var gl = this.renderContexts[0];
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
    
    var vertexBuffer = new VVVV.Types.VertexBuffer(gl, vertices);
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
    mesh = new VVVV.Types.Mesh(gl, vertexBuffer, indices);
      
    meshOut.setValue(0, mesh);
    
  }

}
VVVV.Nodes.Sphere.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Cylinder (EX9.Geometry)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Cylinder = function(id, graph) {
  this.constructor(id, "Cylinder (EX9.Geometry)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var r1In = this.addInputPin("Radius 1", [0.5], this);
  var r2In = this.addInputPin("Radius 2", [0.5], this);
  var lIn = this.addInputPin("Length", [1.0], this);
  var cyclesIn = this.addInputPin("Cycles", [1.0], this);
  var capsIn = this.addInputPin("Caps", [1], this);
  var xIn = this.addInputPin("Resolution X", [15], this);
  var yIn = this.addInputPin("Resolution Y", [1], this);
  
  var meshOut = this.addOutputPin("Mesh", [], this, VVVV.PinTypes.WebGlResource);
  
  var mesh = null;
  
  this.evaluate = function() {
  
    if (!this.renderContexts) return;
    var gl = this.renderContexts[0];
    if (!gl)
      return;
  
    var xRes = parseInt(xIn.getValue(0));
    var yRes = parseInt(yIn.getValue(0));
    var radius1 = parseFloat(r1In.getValue(0));
    var radius2 = parseFloat(r2In.getValue(0));
    var length = parseFloat(lIn.getValue(0));
    var cycles = parseFloat(cyclesIn.getValue(0));
      
    var vertices = [];
    var normals = [];
    var texCoords = [];
    
    // cap vertices ...
    vertices.push(0.0);
    vertices.push(length/2);
    vertices.push(0.0);
    
    normals.push(0.0);
    normals.push(1.0);
    normals.push(0.0);
    
    texCoords.push(0.0);
    texCoords.push(0.0);
    
    vertices.push(0.0);
    vertices.push(-length/2);
    vertices.push(0.0);
    
    normals.push(0.0);
    normals.push(-1.0);
    normals.push(0.0);
    
    texCoords.push(0.0);
    texCoords.push(0.0);
    
    // other vertices ...
    for (var y=0; y<yRes+1; y++) {
      var n = parseFloat(y)/yRes
      var yPos = (n - 0.5) * -length;
      for (var x=0; x<xRes+1; x++) {
        var xPos = Math.cos((parseFloat(x)/xRes*2*Math.PI * cycles  - Math.PI*cycles -Math.PI/2));
        var zPos = Math.sin((parseFloat(x)/xRes*2*Math.PI * cycles  - Math.PI*cycles -Math.PI/2));
        var r = n*radius2 + (1-n)*radius1;
        vertices.push(xPos*r);
        vertices.push(yPos);
        vertices.push(zPos*r);
        
        normals.push(xPos);
        normals.push(0.0);
        normals.push(zPos);
        
        texCoords.push(parseFloat(x)/(xRes));
        texCoords.push(parseFloat(y)/(yRes));
      }
    }
    
    var vertexBuffer = new VVVV.Types.VertexBuffer(gl, vertices);
    vertexBuffer.setSubBuffer('TEXCOORD0', 2, texCoords);
    vertexBuffer.setSubBuffer('NORMAL', 3, normals);
    vertexBuffer.create();
    
    var indices = [];
    
    // caps indices ...
    if (capsIn.getValue(0)>.5) {
      for (var n=0; n<2; n++) {
        for (var x=0; x<xRes; x++) {
          indices.push(n);
          indices.push(2+x+n+(n*yRes*(xRes+1)));
          indices.push(2+x+(1-n)+(n*yRes*(xRes+1)));
        }
      }
    }
    
    // other indices ...
    for (var y=0; y<yRes; y++) {
      for (var x=0; x<xRes; x++) {
        var refP = x+xRes*y + 2;
        indices.push(refP);
        indices.push(refP+1);
        indices.push(refP+xRes+2);
        
        indices.push(refP+xRes+2);
        indices.push(refP+xRes+1);
        indices.push(refP);
      }
    }
    
    mesh = new VVVV.Types.Mesh(gl, vertexBuffer, indices);
      
    meshOut.setValue(0, mesh);
    
  }

}
VVVV.Nodes.Cylinder.prototype = new VVVV.Core.Node();


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
  
  var renderStateIn = this.addInputPin("Render State In", [], this, true, VVVV.PinTypes.WebGlRenderState);
  var alphaBlendingIn = this.addInputPin("Alpha Blending", [1], this);
  var srcModeIn = this.addInputPin("Source Blend Mode", ['SrcAlpha'], this); 
  var destModeIn = this.addInputPin("Destination Blend Mode", ['SrcAlpha'], this); 
  
  var renderStateOut = this.addOutputPin("Render State Out", [], this, VVVV.PinTypes.WebGlRenderState);
  
  var renderStates = [];
  
  function convertToWebGLBlendFactor(VVVVFactor) {
    switch (VVVVFactor) {
      case 'One': return "ONE";
      case 'Zero': return "ZERO";
      case 'SrcAlpha': return "SRC_ALPHA";
      case 'InvSrcAlpha': return "ONE_MINUS_SRC_ALPHA";
      case 'DestAlpha': return "DST_ALPHA";
      case 'InvDestAlpha': return "ONE_MINUS_DST_ALPHA";
      case 'SrcColor': return "SRC_COLOR";
      case 'InvSrcColor': return "ONE_MINUS_SRC_COLOR";
      case 'DestColor': return "DST_COLOR";
      case 'InvDestColor': return "ONE_MINUS_DST_COLOR";
    }
    return null;
  }
  
  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();
  
    for (var i=0; i<maxSpreadSize; i++) {
      if (renderStates[i]==undefined) {
        renderStates[i] = new VVVV.Types.WebGlRenderState();
      }
      renderStates[i].copy_attributes(renderStateIn.getValue(i));
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
  
  var renderStateIn = this.addInputPin("Render State In", [], this, true, VVVV.PinTypes.WebGlRenderState);
  var drawModeIn = this.addInputPin("Draw Mode", ["Blend"], this);
  
  var renderStateOut = this.addOutputPin("Render State Out", [], this, VVVV.PinTypes.WebGlRenderState);
  
  var renderStates = [];
  
  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();
  
    for (var i=0; i<maxSpreadSize; i++) {
      if (renderStates[i]==undefined) {
        renderStates[i] = new VVVV.Types.WebGlRenderState();
      }
      renderStates[i].copy_attributes(renderStateIn.getValue(i));
      switch (drawModeIn.getValue(i)) {
        case "Add":
          renderStates[i].srcBlendMode = "SRC_ALPHA";
          renderStates[i].destBlendMode = "ONE";
          break;
        case "Multiply":
          console.log("Multiply Blend Mode not supported (or we just missed it)");
        case "Blend":
          renderStates[i].srcBlendMode = "SRC_ALPHA";
          renderStates[i].destBlendMode = "ONE_MINUS_SRC_ALPHA";
          break;
        case "ColorAsAlphaAdd":
          renderStates[i].srcBlendMode = "SRC_COLOR";
          renderStates[i].destBlendMode = "ONE";
          break;
        case "ColorAsAlphaBlend":
          renderStates[i].srcBlendMode = "SRC_COLOR";
          renderStates[i].destBlendMode = "ONE_MINUS_SRC_COLOR";
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
  
  var renderStateIn = this.addInputPin("Render State In", [], this, true, VVVV.PinTypes.WebGlRenderState);
  var fillModeIn = this.addInputPin("Fill Mode", ["Blend"], this);
  
  var renderStateOut = this.addOutputPin("Render State Out", [], this, VVVV.PinTypes.WebGlRenderState);
  
  var renderStates = [];
  
  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();
  
    for (var i=0; i<maxSpreadSize; i++) {
      if (renderStates[i]==undefined) {
        renderStates[i] = new VVVV.Types.WebGlRenderState();
      }
      renderStates[i].copy_attributes(renderStateIn.getValue(i));
      switch (fillModeIn.getValue(i)) {
        case 'Point':
          renderStates[i].polygonDrawMode = "POINTS";
          break;
        case 'Solid':
          renderStates[i].polygonDrawMode = "TRIANGLES";
          break;
        case 'WireFrame':
          renderStates[i].polygonDrawMode = "LINES";
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
  
  var renderStateIn = this.addInputPin("Render State In", [], this, true, VVVV.PinTypes.WebGlRenderState);
  var enableZWriteIn = this.addInputPin("ZWrite Enable", [1], this);
  var depthFuncIn = this.addInputPin("Compare Function", ['Always'], this); 
  var biasIn = this.addInputPin("Depth Bias", [0.0], this); 
  
  var renderStateOut = this.addOutputPin("Render State Out", [], this, VVVV.PinTypes.WebGlRenderState);
  
  var renderStates = [];
  
  function convertToWebGLDepthFunc(VVVVFunc) {
    switch (VVVVFunc) {
      case 'Never': return "NEVER";
      case 'Less': return "LESS";
      case 'LessEqual': return "LEQUAL";
      case 'Equal': return "EQUAL";
      case 'NotEqual': return "NOTEQUAL";
      case 'Greater': return "GREATER";
      case 'GreaterEqual': return "GEQUAL";
      case 'Always': return "ALWAYS";
    }
    return null;
  }
  
  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();
  
    for (var i=0; i<maxSpreadSize; i++) {
      if (renderStates[i]==undefined) {
        renderStates[i] = new VVVV.Types.WebGlRenderState();
      }
      renderStates[i].copy_attributes(renderStateIn.getValue(i));
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
  
  var renderStateIn = this.addInputPin("Render State", [], this, true, VVVV.PinTypes.WebGlRenderState);
  var meshIn = this.addInputPin("Mesh", [], this, true);
  var transformIn = this.addInputPin("Transform", [], this, true, VVVV.PinTypes.Transform);
  var techniqueIn = this.addInputPin("Technique", [''], this);
  
  var layerOut = this.addOutputPin("Layer", [], this, VVVV.PinTypes.WebGlResource);
  
  var layers = [];
  var mesh = null;
  var shader = null;
  var shaderCode;
  
  var shaderPins = [];
  
  var initialized = false;
  
  var thatNode = this;
  
  this.initialize = function() {
    
    $.ajax({
      url: thatNode.shaderFile.replace('%VVVV%', VVVV.Root),
      async: false,
      success: function(response) {
        shaderCode = response;
        shader = new VVVV.Types.ShaderProgram();
        thatNode.addUniformPins();
        thatNode.setupShader();
        transformIn.markPinAsChanged(); // just set any pin as changed, so that node evaluates
      },
      error: function() {
        console.log('ERROR: Could not load shader file '+thatNode.shaderFile.replace('%VVVV%', VVVV.Root));
        VVVV.onNotImplemented('Could not load shader file '+thatNode.shaderFile.replace('%VVVV%', VVVV.Root));
      }
    });
    
 
  }
  
  this.addUniformPins = function() {
    shader.extractSemantics(shaderCode);
    thatNode = this;
    _(shader.uniformSpecs).each(function(u) {
      if (u.semantic=="VIEW" || u.semantic=="PROJECTION" || u.semantic=="WORLD")
        return;
      var reset_on_disconnect = false;
      var pinType = VVVV.PinTypes.Generic;
      var defaultValue = [];
      switch (u.type) {
        case 'mat':
          pinType = VVVV.PinTypes.Transform;
          reset_on_disconnect = true;
          break;
        case 'sampler':
          pinType = VVVV.PinTypes.WebGlTexture;
          reset_on_disconnect = true;
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
        
      var pin = thatNode.addInputPin(u.varname.replace(/_/g,' '), defaultValue, thatNode, reset_on_disconnect, pinType);
      pin.dimensions = u.dimension;
      shaderPins.push(pin);
    });
  }
  
  this.setupShader = function() {
    var technique = techniqueIn.getValue(0);
    technique = technique.replace(/^\s*/, '').replace(/\s*$/, '');
    if (technique=="") {
      var match = /(vertex_shader|fragment_shader)\{([a-zA-Z0-9]*?)[,\}]/.exec(shaderCode);
      if (match)
        technique = match[2];
    }
    var vsRegEx = new RegExp('vertex_shader(\{([a-zA-Z0-9]+,\s*)*'+technique+'(,\s*[a-zA-Z0-9]+)*\})?:((\r?\n|.)*?)(vertex_shader|fragment_shader)');
    var psRegEx = new RegExp('fragment_shader(\{([a-zA-Z0-9]+,\s*)*'+technique+'(,\s*[a-zA-Z0-9]+)*\})?:((\r?\n|.)*?)(vertex_shader|fragment_shader)');
    
    var match;
    
    match = /STARTOFSTRING((\r?\n|.)*?)(vertex_shader|fragment_shader)/.exec('STARTOFSTRING'+shaderCode);
    var varDefs = match[1];
    
    if ((match = vsRegEx.exec(shaderCode+'\nfragment_shader'))==undefined) {
      console.log('ERROR: No vertex shader code for technique '+technique+' found');
      return;
    }
    var vertexShaderCode = match[4];
    
    if ((match = psRegEx.exec(shaderCode+'\nfragment_shader'))==undefined) {
      console.log('ERROR: No fragment shader code for technique '+technique+' found');
      return;
    }
    var fragmentShaderCode = match[4];
    
    shader.setFragmentShader(varDefs+fragmentShaderCode);
    shader.setVertexShader(varDefs+vertexShaderCode);
    
  }
  
  this.evaluate = function() {
    if (!this.renderContexts) return;
    var gl = this.renderContexts[0];
    if (!gl)
      return;
    if (!shader.isSetup || this.contextChanged || techniqueIn.pinIsChanged()) {
      this.setupShader();
      shader.setup(gl);
    }

    // find out input slice count with respect to the input pin dimension, defined by the shader code  
    var maxSize = 0;
    _(this.inputPins).each(function(p) {
      var sliceCount = p.getSliceCount();
      var pinname = p.pinname.replace(/ /g,'_')
      if (shader.uniformSpecs[pinname] && shader.uniformSpecs[pinname].type=='vec' && shader.uniformSpecs[pinname].semantic!='COLOR') {
        sliceCount = parseInt(sliceCount/shader.uniformSpecs[pinname].dimension);
      }
      if (sliceCount > maxSize)
        maxSize = sliceCount;
    });
    if (!meshIn.isConnected() || meshIn.getValue(0)==undefined)
      maxSize = 0;
    
    var currentLayerCount = layers.length;
    if (this.contextChanged)
      currentLayerCount = 0;
    // shorten layers array, if input slice count decreases
    if (maxSize<currentLayerCount) {
      layers.splice(maxSize, currentLayerCount-maxSize);
    }
    for (var j=currentLayerCount; j<maxSize; j++) {
      layers[j] = new VVVV.Types.Layer();
      layers[j].mesh = meshIn.getValue(0);
      layers[j].shader = shader;
      _(shader.uniformSpecs).each(function(u) {
        layers[j].uniformNames.push(u.varname);
        layers[j].uniforms[u.varname] = { uniformSpec: u, value: undefined };
      });
    }
    if (meshIn.pinIsChanged()) {
      for (var j=0; j<maxSize; j++) {
      	layers[j].mesh = meshIn.getValue(0);
      }
    }
    
    for (var i=0; i<shaderPins.length; i++) {
      var pinname = shaderPins[i].pinname.replace(/ /g, '_');
      if (shaderPins[i].pinIsChanged() || currentLayerCount<maxSize) {
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
            var v = shaderPins[i].getValue(j);
            layers[j].uniforms[pinname].value = v;
          }
        }
      }
    }
    
    if (renderStateIn.pinIsChanged() || currentLayerCount<maxSize) {
      for (var i=0; i<maxSize; i++) {
        if (renderStateIn.isConnected())
          layers[i].renderState = renderStateIn.getValue(i);
        else
          layers[i].renderState = VVVV.DefaultRenderState;
      }
    }
    
    if (transformIn.pinIsChanged() || currentLayerCount<maxSize) {
      for (var i=0; i<maxSize; i++) {
        var transform = this.inputPins["Transform"].getValue(i);
        layers[i].uniforms[layers[i].shader.uniformSemanticMap['WORLD']].value = transform;
      }
    }
    
    this.outputPins["Layer"].setSliceCount(maxSize);
    for (var i=0; i<maxSize; i++) {
      this.outputPins["Layer"].setValue(i, layers[i]);
    }
    
    this.contextChanged = false;
        
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
    compatibility_issues: ['No Sampler States', 'No texture coord mapping', 'No enable pin', 'Transprent pixels are discarded by default']
  };
  
  this.auto_evaluate = false;
  
  var renderStateIn = this.addInputPin("Render State", [], this, true, VVVV.PinTypes.WebGlRenderState);
  this.addInputPin("Transform", [], this, true, VVVV.PinTypes.Transform);
  this.addInputPin("Texture", [], this, true, VVVV.PinTypes.WebGlTexture);
  this.addInputPin("Texture Transform", [], this, true, VVVV.PinTypes.Transform);
  this.addInputPin("Color", ["1.0, 1.0, 1.0, 1.0"], this);
  
  var layerOut = this.addOutputPin("Layer", [], this, VVVV.PinTypes.WebGlResource);
  
  var initialized = false;
  var layers = [];
  var mesh = null;
  var shader = null;
  
  this.evaluate = function() {
  	
    if (!this.renderContexts) return;
    var gl = this.renderContexts[0];
  	
    if (!gl)
      return;
  
    if (this.contextChanged) {
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
      
      var vertexBuffer = new VVVV.Types.VertexBuffer(gl, vertices);
      vertexBuffer.setSubBuffer('TEXCOORD0', 2, texCoords);
      vertexBuffer.create();
      mesh = new VVVV.Types.Mesh(gl, vertexBuffer, [ 0, 1, 2, 1, 3, 2 ]);
      
      // shaders
  
      var fragmentShaderCode = "#ifdef GL_ES\n";
      fragmentShaderCode += "precision highp float;\n";
      fragmentShaderCode += "#endif\n";
      fragmentShaderCode += "uniform vec4 col : COLOR = {1.0, 1.0, 1.0, 1.0}; varying vec2 vs2psTexCd; uniform sampler2D Samp0; void main(void) { gl_FragColor = col*texture2D(Samp0, vs2psTexCd); if (gl_FragColor.a==0.0) discard;  }";
      var vertexShaderCode = "attribute vec3 PosO : POSITION; attribute vec2 TexCd : TEXCOORD0; uniform mat4 tW : WORLD; uniform mat4 tV : VIEW; uniform mat4 tP : PROJECTION; uniform mat4 tTex; varying vec2 vs2psTexCd; void main(void) { gl_Position = tP * tV * tW * vec4(PosO, 1.0); vs2psTexCd = (tTex * vec4(TexCd.xy-.5, 0.0, 1.0)).xy+.5; }";
      
      shader = new VVVV.Types.ShaderProgram();
      shader.extractSemantics(fragmentShaderCode + vertexShaderCode);
      shader.setFragmentShader(fragmentShaderCode);
      shader.setVertexShader(vertexShaderCode);
      shader.setup(gl);
          
    }
    
    var maxSize = this.getMaxInputSliceCount();
    var currentLayerCount = layers.length;
    if (this.contextChanged)
      currentLayerCount = 0;
    // shorten layers array, if input slice count decreases
    if (maxSize<currentLayerCount) {
      layers.splice(maxSize, currentLayerCount-maxSize);
    }
    for (var j=currentLayerCount; j<maxSize; j++) {
      layers[j] = new VVVV.Types.Layer();
      layers[j].mesh = mesh;
      layers[j].shader = shader;
      
      _(shader.uniformSpecs).each(function(u) {
        layers[j].uniformNames.push(u.varname);
        layers[j].uniforms[u.varname] = { uniformSpec: u, value: undefined };
      });
    }
    
    var colorChanged = this.inputPins["Color"].pinIsChanged();
    var transformChanged = this.inputPins["Transform"].pinIsChanged();
    var textureChanged = this.inputPins["Texture"].pinIsChanged();
    var textureTransformChanged = this.inputPins["Texture Transform"].pinIsChanged();
    
    if (colorChanged || currentLayerCount<maxSize) {
      for (var i=0; i<maxSize; i++) {
        var color = this.inputPins["Color"].getValue(i);
        var rgba = _(color.split(',')).map(function(x) { return parseFloat(x) });
        layers[i].uniforms['col'].value = new Float32Array(rgba);
      }
    }
    
    if (renderStateIn.pinIsChanged() || currentLayerCount<maxSize) {
      for (var i=0; i<maxSize; i++) {
        if (renderStateIn.isConnected())
          layers[i].renderState = renderStateIn.getValue(i);
        else
          layers[i].renderState = VVVV.DefaultRenderState;
      }
    }
    
    if (transformChanged || currentLayerCount<maxSize) {
      for (var i=0; i<maxSize; i++) {
        var transform = this.inputPins["Transform"].getValue(i);
        layers[i].uniforms[layers[i].shader.uniformSemanticMap['WORLD']].value = transform;
      }
    }
    
    if (textureChanged || currentLayerCount<maxSize) {
      for (var i=0; i<maxSize; i++) {
        layers[i].uniforms["Samp0"].value = this.inputPins["Texture"].getValue(i);
      }
    }
    
    if (textureTransformChanged || currentLayerCount<maxSize) {
      for (var i=0; i<maxSize; i++) {
        var transform = this.inputPins["Texture Transform"].getValue(i);
        layers[i].uniforms["tTex"].value = transform;
      }
    }
    
    this.outputPins["Layer"].setSliceCount(maxSize);
    for (var i=0; i<maxSize; i++) {
      this.outputPins["Layer"].setValue(i, layers[i]);
    }
    
    this.contextChanged = false;
    
  }

}
VVVV.Nodes.Quad.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Group (EX9)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Group = function(id, graph) {
  this.constructor(id, "Group (EX9)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  var layerIns = [];
  var enableIn = this.addInputPin("Enabled", [1], this);
  var layerCountIn = this.addInvisiblePin("Layer Template Count", [2], this);
  
  var layerOut = this.addOutputPin("Layer", [], this, VVVV.PinTypes.WebGlResource);
  
  this.initialize = function() {
  	var layerCount = layerCountIn.getValue(0);
    for (var i=layerIns.length; i<layerCount; i++) {
      layerIns[i] = this.addInputPin("Layer "+(i+1), [], this, true, VVVV.PinTypes.WebGlResource);
    }
    layerIns.length = layerCount;
  }
  
  this.evaluate = function() {
  	if (layerCountIn.pinIsChanged()) {
      this.initialize();
  	}
  	
  	var outSliceIdx = 0;
    if(enableIn.getValue(0) > .5) {
      for(var i = 0; i < layerIns.length; i++) {
        for(var j = 0; j < layerIns[i].getSliceCount(); j++) {
          layerOut.setValue(outSliceIdx++, layerIns[i].getValue(j));
        }
      }
    }
    layerOut.setSliceCount(outSliceIdx);
  }

}
VVVV.Nodes.Group.prototype = new VVVV.Core.Node();


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
  
  this.addInputPin("Layers", [], this, true, VVVV.PinTypes.WebGlResource);
  var clearIn = this.addInputPin("Clear", [1], this);
  var bgColIn = this.addInputPin("Background Color", ['0.0, 0.0, 0.0, 1.0'], this);
  var bufferWidthIn = this.addInputPin("Backbuffer Width", [0], this);
  var bufferHeightIn = this.addInputPin("Backbuffer Height", [0], this);
  var viewIn = this.addInputPin("View", [], this, true, VVVV.PinTypes.Transform);
  var projIn = this.addInputPin("Projection", [], VVVV.PinTypes.Transform);
  
  var enableDepthBufIn = this.addInvisiblePin("Windowed Depthbuffer Format", ['NONE'], this);
  
  var bufferWidthOut = this.addOutputPin("Actual Backbuffer Width", [0.0], this);
  var bufferHeightOut = this.addOutputPin("Actual Backbuffer Height", [0.0], this);
  var ex9Out = this.addOutputPin("EX9 Out", [], this, VVVV.PinTypes.WebGlResource);
  
  var width = 0.0;
  var height = 0.0;
  
  var pMatrix;
  var vMatrix;
  
  this.ctxt = undefined;              // the renderer's active context. might be the canvas context, or the context of a connected downstream renderer
  var canvasCtxt = undefined;         // the context of the canvas which is connected to the renderer
  var gl;                             // just a convenience variable for keeping the lines short 
  
  var bbufFramebuffer;
  var bbufTexture;
  
  function attachMouseEvents(canvas) {
    $(canvas).detach('mousemove');
    $(canvas).detach('mousedown');
    $(canvas).detach('mouseup');
    VVVV.MousePositions[canvas.id] = {'x': 0.0, 'y': 0.0, 'wheel': 0.0, 'lb': 0.0, 'mb': 0.0, 'rb': 0.0};
    $(canvas).mousemove(function(e) {
      var x = (e.pageX - $(this).offset().left) * 2 / $(this).width() - 1;
      var y = -((e.pageY - $(this).offset().top) * 2 / $(this).height() - 1);
      VVVV.MousePositions['_all'].x = x;
      VVVV.MousePositions['_all'].y = y;
      VVVV.MousePositions[canvas.id].x = x;
      VVVV.MousePositions[canvas.id].y = y;
    });
    $(canvas).bind('mousewheel', function(e) {
      var delta = e.originalEvent.wheelDelta/120;
      VVVV.MousePositions[canvas.id].wheel += delta;
      VVVV.MousePositions['_all'].wheel += delta;
    });
    $(canvas).bind('DOMMouseScroll', function(e) {
      var delta = -e.originalEvent.detail/3;
      VVVV.MousePositions[canvas.id].wheel += delta;
      VVVV.MousePositions['_all'].wheel += delta;
    })
    $(canvas).mousedown(function(e) {
      switch (e.which) {
        case 1: VVVV.MousePositions['_all'].lb = 1; VVVV.MousePositions[canvas.id].lb = 1; break;
        case 2: VVVV.MousePositions['_all'].mb = 1; VVVV.MousePositions[canvas.id].mb = 1; break;
        case 3: VVVV.MousePositions['_all'].rb = 1; VVVV.MousePositions[canvas.id].rb = 1; break;
      }
    });
    $(canvas).mouseup(function(e) {
      switch (e.which) {
        case 1: VVVV.MousePositions['_all'].lb = 0; VVVV.MousePositions[canvas.id].lb = 0; break;
        case 2: VVVV.MousePositions['_all'].mb = 0; VVVV.MousePositions[canvas.id].mb = 0; break;
        case 3: VVVV.MousePositions['_all'].rb = 0; VVVV.MousePositions[canvas.id].rb = 0; break;
      }
    });
  }
  
  this.getContexts = function() {
    if (!this.invisiblePins["Descriptive Name"])
      return;
    var selector = this.invisiblePins["Descriptive Name"].getValue(0);
    var targetElement = $(selector).get(0);
    var canvas;
    if (!targetElement || targetElement.nodeName!='CANVAS') {
      var w = parseInt(bufferWidthIn.getValue(0));
      var h = parseInt(bufferHeightIn.getValue(0));
      w = w > 0 ? w : 512;
      h = h > 0 ? h : 512;
      canvas = $('<canvas width="'+w+'" height="'+h+'" id="vvvv-js-generated-renderer-'+(new Date().getTime())+'" class="vvvv-js-generated-renderer"></canvas>');
      if (!targetElement) targetElement = 'body';
      $(targetElement).append(canvas);
    }
    else
      canvas = $(targetElement);
    
    if (!canvas)
      return;
      
    attachMouseEvents(canvas);

    try {
      canvasCtxt = canvas.get(0).getContext("experimental-webgl", {preserveDrawingBuffer: true});
      canvasCtxt.viewportWidth = parseInt(canvas.get(0).width);
      canvasCtxt.viewportHeight = parseInt(canvas.get(0).height);
    } catch (e) {
      console.log(e);
    }
    this.ctxt = canvasCtxt;

    if (ex9Out.isConnected() && this.renderContexts && this.renderContexts[0]) {
      this.ctxt = this.renderContexts[0];
      
      gl = this.ctxt;
      
      bbufFramebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, bbufFramebuffer);
      bbufFramebuffer.width = canvas.get(0).width;
      bbufFramebuffer.height = canvas.get(0).height;

      bbufTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, bbufTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, bbufFramebuffer.width, bbufFramebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.generateMipmap(gl.TEXTURE_2D);

      var renderbuffer = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, bbufFramebuffer.width, bbufFramebuffer.height);

      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, bbufTexture, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindRenderbuffer(gl.RENDERBUFFER, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    }
    else {
      if (this.renderContexts && this.renderContexts[0]) {
        this.renderContexts[0].deleteTexture(bbufTexture);
        bbufTexture = undefined;
        // TODO: destroy framebuffer resources ...
      }
    }
    
    if (!this.ctxt)
      return;
      
    // doing this afterwards, so we can use these values in the patch for checking, if webgl context was set up correctly
    width = parseInt(canvas.get(0).width);
    height = parseInt(canvas.get(0).height);
    
    // create default white texture
    
    gl = this.ctxt;
 
    var pixels = new Uint8Array([255, 255, 255]);
    gl.DefaultTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, gl.DefaultTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, pixels);
    gl.bindTexture(gl.TEXTURE_2D, null);
    
    // this is to ensure that all the input pins get evaluated, if the gl context has been set after the node creation
    this.inputPins["Layers"].markPinAsChanged();
    clearIn.markPinAsChanged();
    bgColIn.markPinAsChanged();
    viewIn.markPinAsChanged();
    projIn.markPinAsChanged();
    
  }
  
  var initialized = false;

  this.evaluate = function() {
    gl = this.ctxt;
    
    if (this.invisiblePins["Descriptive Name"].pinIsChanged() || this.contextChanged) {
      if (canvasCtxt && $(canvasCtxt.canvas).hasClass('vvvv-js-generated-renderer'))
        $(canvasCtxt.canvas).remove();
      this.getContexts();
      if (this.inputPins["Layers"].isConnected())
        this.inputPins["Layers"].links[0].fromPin.connectionChanged();
    }
    
    if (!initialized) {
      bufferWidthOut.setValue(0, width);
      bufferHeightOut.setValue(0, height);
      initialized = true;
    }
    
    if (gl==undefined)
      return;
    
    if (bufferWidthIn.pinIsChanged() && !(this.renderContexts && this.renderContexts[0])) {
      var w = parseInt(bufferWidthIn.getValue(0));
      if (w>0) {
        width = w;
        $(canvasCtxt.canvas).attr('width', width);
        bufferWidthOut.setValue(0, width);
      }
    }
    if (bufferHeightIn.pinIsChanged() && !(this.renderContexts && this.renderContexts[0])) {
      var h = parseInt(bufferHeightIn.getValue(0));
      if (h>0) {
        height = h;
        $(canvasCtxt.canvas).attr('height', height);
        bufferHeightOut.setValue(0, height);
      }
    }
    
    if (this.renderContexts && this.renderContexts[0] && gl==this.renderContexts[0]) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, bbufFramebuffer);
    }
    else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    
    if (true) {//bgColIn.pinIsChanged()) {
      var col = _(bgColIn.getValue(0).split(',')).map(function(e) {
        return parseFloat(e);
      });
      gl.clearColor(col[0], col[1], col[2], col[3]);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }
    
    if (true) {//enableDepthBufIn.pinIsChanged()) {
      if (enableDepthBufIn.getValue(0)=='NONE')
        gl.disable(gl.DEPTH_TEST);
      else
        gl.enable(gl.DEPTH_TEST);
    }
  
    if (projIn.pinIsChanged()) {
      if (projIn.isConnected()) {
        pMatrix = mat4.create();
        mat4.set(projIn.getValue(0), pMatrix);
        mat4.scale(pMatrix, [1, 1, -1]);
      }
      else {
        pMatrix = mat4.create();
        mat4.ortho(-1, 1, -1, 1, -100, 100, pMatrix);
        mat4.scale(pMatrix, [1, 1, -1]);
      }
      if (this.renderContexts && this.renderContexts[0]) // flip the output texture, if connected to downstream renderer
        mat4.scale(pMatrix, [1, -1, 1]);
    }
    if (viewIn.pinIsChanged()) {
      vMatrix = viewIn.getValue(0);
    }
    
    if (this.contextChanged) { // don't render anything, if the context changed in this frame. will only give warnings...
      this.contextChanged = false;
      return
    }
    
    gl.viewport(0, 0, width, height);
      
    var currentShaderProgram = null;
    var currentRenderState = null;
    var currentMesh = null;
    
    if (this.inputPins["Layers"].isConnected()) {
      var layers = this.inputPins["Layers"].values;
      for (var i=0; i<layers.length; i++) {
        layer = layers[i];
        
        if (layer.shader==undefined) // if it's an empty layer (e.g. created by IOBox (Node))
          continue;
        
        if (currentShaderProgram!=layer.shader.shaderProgram) {
          gl.useProgram(layer.shader.shaderProgram);
          gl.uniformMatrix4fv(layer.shader.uniformSpecs[layer.shader.uniformSemanticMap["PROJECTION"]].position, false, pMatrix);
          gl.uniformMatrix4fv(layer.shader.uniformSpecs[layer.shader.uniformSemanticMap["VIEW"]].position, false, vMatrix);
          
        }
        
        var renderState = layer.renderState;
        if (!renderState)
          renderState = defaultWebGlRenderState;
        if (renderState!=currentRenderState)
          renderState.apply(gl);
        
        if (layer.mesh != currentMesh || layer.shader.shaderProgram != currentShaderProgram) {
          gl.bindBuffer(gl.ARRAY_BUFFER, layer.mesh.vertexBuffer.vbo);
          _(layer.mesh.vertexBuffer.subBuffers).each(function(b) {
            if (!layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]])
              return;
            gl.enableVertexAttribArray(layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]].position);
            gl.vertexAttribPointer(layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]].position, b.size, gl.FLOAT, false, 0, b.offset);
          });
          
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, layer.mesh.indexBuffer);
        }
        
        var uniformCount = layer.uniformNames.length;
        var textureIdx = 0;
        for (var j=0; j<uniformCount; j++) {
          var u = layer.uniforms[layer.uniformNames[j]];

          if (u.value==undefined)
            continue;
          if (i>0 && layer.shader.shaderProgram==currentShaderProgram && layers[i-1].uniforms[layer.uniformNames[j]] && u.value==layers[i-1].uniforms[layer.uniformNames[j]].value)
            continue;
          start = new Date().getTime(); 
          switch (u.uniformSpec.type) {
            case "mat": gl['uniformMatrix'+u.uniformSpec.dimension+'fv'](u.uniformSpec.position, false, u.value); break;
            case "vec": gl['uniform'+u.uniformSpec.dimension+'fv'](u.uniformSpec.position, u.value); break;
            case "int": gl['uniform'+u.uniformSpec.dimension+'i'](u.uniformSpec.position, u.value); break;
            case "float": gl['uniform'+u.uniformSpec.dimension+'f'](u.uniformSpec.position, u.value); break;
            case "sampler":
              var tex = u.value;
              if (tex==VVVV.DefaultTexture)
                tex = gl.DefaultTexture;
              gl.activeTexture(gl['TEXTURE'+textureIdx]);
              gl.bindTexture(gl['TEXTURE_'+u.uniformSpec.dimension], tex);
              gl.uniform1i(u.uniformSpec.position, textureIdx);
              textureIdx++;
              break;
          }
          loopstart = new Date().getTime();
        }
        
        gl.drawElements(gl[renderState.polygonDrawMode], layer.mesh.numIndices, gl.UNSIGNED_SHORT, 0);
        
        // save current states
        currentShaderProgram = layer.shader.shaderProgram;
        currentRenderState = renderState;
        currentMesh = layer.mesh;
      }
      
    }
    
    if (this.renderContexts && this.renderContexts[0]) {
      gl.bindTexture(gl.TEXTURE_2D, bbufTexture);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(this.renderContexts[0].TEXTURE_2D, null);
    }
    
    ex9Out.setValue(0, bbufTexture);
  }

}
VVVV.Nodes.RendererWebGL.prototype = new VVVV.Core.Node();