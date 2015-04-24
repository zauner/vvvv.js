// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

(function($) {

/** A hash table of {@VVVV.Types.ShaderCodeResource} objects, indexed with the name/path of the shader code resource */
VVVV.ShaderCodeResources = {
  "%VVVV%/effects/PhongDirectional.vvvvjs.fx": undefined,
  "%VVVV%/effects/GouraudDirectional.vvvvjs.fx": undefined,
  "%VVVV%/effects/Constant.vvvvjs.fx": undefined,
};

/**
 * Stores and caches shader code, which comes from loaded .vvvvjs.fx files or a DefineEffect node
 * @class
 * @constructor
 */
VVVV.Types.ShaderCodeResource = function() {
  var sourceCode = '';
  /** An array of all nodes which utilize this shader code */
  this.relatedNodes = [];
  /** the DefineNode node which defines this shader code; undefined if the shader code comes from a .vvvvjs.fx file */
  this.definingNode = undefined;

  /**
   * Sets the source code
   * @param {String} str the shader code as string
   */
  this.setSourceCode = function(src) {
    sourceCode = src;
    for (var i=0; i<this.relatedNodes.length; i++) {
      this.relatedNodes[i].shaderSourceUpdated(sourceCode);
    }
  }

  /**
   * registers a shader node with this shader code resource
   * @param {VVVV.Core.Node} the shader node
   */
  this.addRelatedNode = function(node) {
    this.relatedNodes.push(node);
    if (sourceCode!='')
      node.shaderSourceUpdated(sourceCode);
  }
}


var identity = mat4.identity(mat4.create());

/**
 * A data structure which contains all render state attributes that can be set in VVVV.js
 * This is the data object which flows between WebGlRenderState pins
 * @class
 * @constructor
 */
VVVV.Types.WebGlRenderState = function() {
  /** @member */
  this.alphaBlending = true;
  /** @member */
  this.srcBlendMode = "SRC_ALPHA";
  /** @member */
  this.destBlendMode = "ONE_MINUS_SRC_ALPHA";

  /** @member */
  this.enableZWrite = true;
  /** @member */
  this.depthFunc = "LEQUAL";
  /** @member */
  this.depthOffset = 0.0;

  /** @member */
  this.cullFace = undefined;

  /** @member */
  this.polygonDrawMode = "TRIANGLES";

  /**
   * Used to create a copy of a WebGlRenderState object. Heavily used by the (EX9.RenderState) nodes to create altered versions
   * of the incoming render state
   * @param {VVVV.Types.WebGlRenderState} other the source render state
   */
  this.copy_attributes = function(other) {
    this.alphaBlending = other.alphaBlending;
    this.alphaFunc = other.alphaFunc;
    this.srcBlendMode = other.srcBlendMode;
    this.destBlendMode = other.destBlendMode;
    this.enableZwrite = other.enableZWrite;
    this.depthFunc = other.depthFunc;
    this.depthOffset = other.depthOffset;
    this.cullFace = other.cullFace;
    this.polygonDrawMode = other.polygonDrawMode;
  }

  /**
   * makes the WebGL calls to establish the render state
   * @param {WebGlContext} gl the WebGL context
   */
  this.apply = function(gl) {
    if (this.alphaBlending)
      gl.enable(gl.BLEND);
    else
      gl.disable(gl.BLEND);
    gl.blendFunc(gl[this.srcBlendMode], gl[this.destBlendMode]);

    if (this.cullFace!==undefined) {
      gl.enable(gl.CULL_FACE);
      gl.frontFace(gl[this.cullFace]);
      gl.cullFace(gl.BACK);
    }
    else
      gl.disable(gl.CULL_FACE);

    gl.depthMask(this.enableZWrite);
    //gl.depthFunc(gl[this.depthFunc]);
  }
}

/**
 * The VertexBuffer class holds vertex data and provides methods to create vertex buffer objects in a given WebGL context;
 * VVVV.Types.VertexBuffer objects mainly are used in (EX9.Geometry) nodes, and
 * ultimately are parts of a {@link VVVV.Types.Mesh} object
 * @class
 * @constructor
 * @param {WebGlContext} gl the WebGL context
 * @param {Array} p an array of vertex positions
 */
VVVV.Types.VertexBuffer = function(gl, p) {

  /** the WebGL Vertex Buffer Object */
  this.vbo = undefined;
  /** @member */
  this.subBuffers = {};
  /** total buffer length */
  this.length = 0;

  /**
   * sets sub buffer data
   * @param {String} u the buffer usage (e.g. POSITION, NORMAL, TEXCOORD0, TEXCOORD1, ...)
   * @param {Integer} s the sub buffer size
   * @param {Array} d the sub buffer data
   */
  this.setSubBuffer = function(u, s, d) {
    this.subBuffers[u] = {
      usage: u,
      data: new Float32Array(d),
      size: s,
      offset: this.length
    };
    this.length += this.subBuffers[u].data.byteLength;
  }

  //this.setSubBuffer('POSITION', 3, p);

  this.updateSubBuffer = function(u,d) {
    this.subBuffers[u].data = new Float32Array(d);
  }

  /**
   * Creates the VBO in the WebGL context and stores the vertex data
   */
  this.create = function() {
    this.vbo = gl.createBuffer();
  }

  this.update = function() {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.length, gl.DYNAMIC_DRAW);

    _(this.subBuffers).each(function(b) {
      gl.bufferSubData(gl.ARRAY_BUFFER, b.offset, b.data);
    });
  }

}

/**
 * A Mesh consists of a {@link VVVV.Types.VertexBuffer} object and a list of indices. It creates a new index buffer
 * in the given WebGL context. Mesh objects are usually created by (EX9.Geometry) nodes and flow into a shader node's
 * Mesh input pin
 * @class
 * @constructor
 * @param {WebGlContext} gl the WebGL context
 * @param {VVVV.Core.VertexBuffer} the vertex data
 * @param {Array} indices the list of indices
 */
VVVV.Types.Mesh = function(gl, vertexBuffer, indices) {
  /** @member */
  this.vertexBuffer = vertexBuffer;
  /** @member */
  this.indexBuffer = gl.createBuffer();

  this.update =function(indices) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.DYNAMIC_DRAW);
    /** @member */
    this.numIndices = indices.length;
  }
}

/**
 * A Layer is the sum of a mesh, textures, render state, shaders and it parameters. Usually, a Layer object is the output
 * of a shader node and flows into a Renderer (EX9) or Group (EX9) node.
 * @class
 * @constructor
 */
VVVV.Types.Layer = function() {
  /** @member */
  this.mesh = null;
  /** An array of WebGlTexture objects */
  this.textures = [];
  /** @type VVVV.Types.ShaderProgram */
  this.shader = null;
  /** @member */
  this.uniforms = {};
  /** @member */
  this.uniformNames = []; // to help iterate through this.uniforms
  /** @type VVVV.Types.WebGlRenderState */
  this.renderState = defaultWebGlRenderState;

  /** returns "Layer" */
  this.toString = function() {
    return "Layer";
  }

}

/**
 * The WebGlResource Pin Type. Its connectionChangedHandler finds a downstream Renderer (EX9) node, gets its WebGL context, and
 * sets it to all upstream WebGL nodes' renderContext members.
 * @mixin
 * @property {String} typeName "WebGlResource"
 * @property {Boolean} reset_on_disconnect true
 * @property {Object} connectionChangedHandlers "webglresource" => function
 */
VVVV.PinTypes.WebGlResource = {
  typeName: "WebGlResource",
  reset_on_disconnect: true,
  connectionChangedHandlers: {
    "webglresource": function() {
      if (this.direction==VVVV.PinDirection.Input)
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

/**
 * The WebGLTexture Pin Type, has the same connectionChangedHandler as {@link VVVV.PinTypes.WebGlResource}.
 * @mixin
 * @property {String} typeName "WebGlTexture"
 * @property {Boolean} reset_on_disconnect true
 * @property {Object} connectionChangedHandlers "webglresource" => function
 * @property {Function} defaultValue a function returning {@link VVVV.DefaultTexture}
 */
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
/**
 * The WebGlRenderState Pin Type
 * @mixin
 * @property {String} typeName "WebGlRenderState"
 * @property {Boolean} reset_on_disconnect true
 * @property {Function} defaultValue a function returning the default {@link VVVV.Types.WebGlRenderState} object
 */
VVVV.PinTypes.WebGlRenderState = {
  typeName: "WebGlRenderState",
  reset_on_disconnect: true,
  defaultValue: function() {
    return defaultWebGlRenderState;
  }
}

/**
 * Constant representing a WebGl context's default texture
 * @const
 */
VVVV.DefaultTexture = "Empty Texture";

/**
 * The ShaderProgram class holds vertex shader and fragment shader code and provides methods to extract uniform/attribute positions
 * and to create the shader program in the WebGl context
 */
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
  this.log = '';

  var thatShader = this;

  this.extractSemantics = function(code) {
    thatShader.attributeSpecs = {};
    thatShader.attribSemanticMap = {};
    thatShader.uniformSpecs = {};
    thatShader.uniformSemanticMap = {};
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
      else if (match[1]=='uniform' && !thatShader.uniformSpecs[match[4]]) {
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
    this.log = '';
    vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderCode.replace(/((uniform|attribute) [a-zA-Z0-9]+ [a-zA-Z0-9_]+)[^;]*/g, '$1'));
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      this.log = gl.getShaderInfoLog(vertexShader);
      console.log(this.log);
    }

    fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderCode.replace(/((uniform|attribute) [a-zA-Z0-9]+ [a-zA-Z0-9_]+)[^;]*/g, '$1'));
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      this.log = gl.getShaderInfoLog(fragmentShader);
      console.log(this.log);
    }

    this.shaderProgram = gl.createProgram();
    gl.attachShader(this.shaderProgram, vertexShader);
    gl.attachShader(this.shaderProgram, fragmentShader);
    gl.linkProgram(this.shaderProgram);

    if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
      console.log("Could not initialise shaders");
    }

    _(this.attributeSpecs).each(function(aSpec) {
      aSpec.position = gl.getAttribLocation(thatShader.shaderProgram, aSpec.varname);
    });

    _(this.uniformSpecs).each(function(uSpec) {
      uSpec.position = gl.getUniformLocation(thatShader.shaderProgram, uSpec.varname);
    });

    this.isSetup = true;

    return this.log=='';
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

  this.auto_nil = false;

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Always loads in background', 'No reload pin', 'No preload pin (preloading handled by browser)', 'No up and running pin', 'No texture info outputs']
  };

  this.auto_evaluate = false;

  var filenamePin = this.addInputPin("Filename", [""], VVVV.PinTypes.String);
  var outputPin = this.addOutputPin("Texture Out", [], VVVV.PinTypes.WebGlTexture);

  var typeIn = this.addInvisiblePin("Type", ["Texture"], VVVV.PinTypes.Enum);
  typeIn.enumOptions = ["Texture", "Cube Texture"];

  var textures = [];

  this.evaluate = function() {

    if (!this.renderContexts) return;
    var gl = this.renderContexts[0];

    if (!gl)
      return;

    if (this.contextChanged) {
      for (var i=0; i<textures.length; i++) {
        textures[i].context.deleteTexture(textures[i]);
      }
      textures = [];
    }

    if (filenamePin.pinIsChanged() || typeIn.pinIsChanged() || this.contextChanged) {
      var type = typeIn.getValue(0);
      var maxSize = this.getMaxInputSliceCount();
      for (var i=0; i<maxSize; i++) {
        var filename = VVVV.Helpers.prepareFilePath(filenamePin.getValue(i), this.parentPatch);
        if (filename.indexOf('http://')===0 && VVVV.ImageProxyPrefix!==undefined)
          filename = VVVV.ImageProxyPrefix+encodeURI(filename);
        textures[i] = gl.createTexture();
        textures[i].context = gl;
        if (type=="Texture") {
          textures[i].image = new Image();
          textures[i].image.onload = (function(j) {
            return function() {  // this is to create a new scope within the loop. see "javascript closure in for loops" http://www.mennovanslooten.nl/blog/post/62
              gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
              gl.bindTexture(gl.TEXTURE_2D, textures[j]);
              //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textures[j].image);
              gl.generateMipmap(gl.TEXTURE_2D);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
              gl.bindTexture(gl.TEXTURE_2D, null);
              outputPin.setValue(j, textures[j]);
            }
          })(i);
          textures[i].image.src = filename;
        }
        else if (type=="Cube Texture") {
          textures[i].image = new Image();
          textures[i].image.onload = (function(j) {
            return function() {
              var faces = [
                {face: gl.TEXTURE_CUBE_MAP_POSITIVE_X, offset: [2, 1]},
                {face: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, offset: [0, 1]},
                {face: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, offset: [1, 0]},
                {face: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, offset: [1, 2]},
                {face: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, offset: [1, 1]},
                {face: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, offset: [3, 1]}];
              gl.bindTexture(gl.TEXTURE_CUBE_MAP, textures[j]);

              var $texcanvas = $('<canvas style="display:none" width="'+(this.width/4)+'" height="'+(this.height/3)+'"></canvas>');
              $('body').append($texcanvas);
              var ctx = $texcanvas.get(0).getContext("2d");

              for (var k=0; k<6; k++) {
                ctx.save();
                ctx.translate(-this.width/4 * faces[k].offset[0], -this.height/3 * faces[k].offset[1]);
                ctx.drawImage(this, 0, 0);
                gl.texImage2D(faces[k].face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, $texcanvas.get(0));
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                ctx.restore();
              }
              gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
              $texcanvas.remove();
              outputPin.setValue(j, textures[j]);
            }
          })(i);
          textures[i].image.src = filename;
        }

        outputPin.setValue(i, VVVV.defaultTexture);
      }
      outputPin.setSliceCount(maxSize);
    }
    this.contextChanged = false;

  }

  this.destroy = function() {
    for (var i=0; i<textures.length; i++) {
      textures[i].context.deleteTexture(textures[i]);
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

  this.auto_nil = false;

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var sourceIn = this.addInputPin("Source", [], VVVV.PinTypes.WebGlResource);
  var outputOut = this.addOutputPin("Texture Out", [], VVVV.PinTypes.WebGlTexture);

  var texture;
  var warningIssued = false;

  this.evaluate = function() {
    if (!this.renderContexts) return;
    var gl = this.renderContexts[0];
    if (!gl)
      return;

    if (this.contextChanged && texture) {
      texture.context.deleteTexture(texture);
      texture = undefined;
    }

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
        if (!warningIssued)
          console.warn("Using DX9Texture with Canvas Renderer input is deprecated and will be removed. Use CanvasTexture (EX9.Texture) instead.");
        warningIssued = true;
        if (texture==undefined) {
          texture = gl.createTexture();
          texture.context = gl;
        }
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

    this.contextChanged = false;

  }

  this.destroy = function() {
    if (texture)
      texture.context.deleteTexture(texture);
  }

}
VVVV.Nodes.DX9Texture.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: CanvasTexture (EX9.Texture)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.CanvasTextureWebGl = function(id, graph) {
  this.constructor(id, "CanvasTexture (EX9.Texture)", graph);

  this.auto_nil = false;

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  var sourceIn = this.addInputPin("Source", [], VVVV.PinTypes.CanvasGraphics);
  var outputOut = this.addOutputPin("Texture Out", [], VVVV.PinTypes.WebGlTexture);

  var texture;

  this.evaluate = function() {
    if (!this.renderContexts) return;
    var gl = this.renderContexts[0];
    if (!gl)
      return;

    if (this.contextChanged && texture) {
      texture.context.deleteTexture(texture);
      texture = undefined;
    }

    if (sourceIn.isConnected()) {
      var source = sourceIn.getValue(0);
      if (!source)
        return;
      if ( (source.width & (source.width-1)) != 0 || (source.height & (source.height-1)) != 0)
        console.log("Warning: Source renderer's width/height is not a power of 2. DX9Texture will most likely not work.");
      if (texture==undefined) {
        texture = gl.createTexture();
        texture.context = gl;
      }
      gl.bindTexture(gl.TEXTURE_2D, texture);
      //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.bindTexture(gl.TEXTURE_2D, null);

      outputOut.setValue(0, texture);
    }
    else {
      delete texture;
      gl.deleteTexture(texture);
      outputOut.setValue(0, undefined);
    }

    this.contextChanged = false;

  }

  this.destroy = function() {
    if (texture)
      texture.context.deleteTexture(texture);
  }

}
VVVV.Nodes.CanvasTextureWebGl.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: VideoTexture (EX9.Texture VMR9)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.VideoTexture = function(id, graph) {
  this.constructor(id, "VideoTexture (EX9.Texture VMR9)", graph);

  this.auto_nil = false;

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Only supports power-of-2 sized videos', 'Has no output pins for meta data']
  };

  var sourceIn = this.addInputPin("Video", [], this);
  var outputOut = this.addOutputPin("Texture Out", [], VVVV.PinTypes.WebGlTexture);

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

  this.auto_nil = false;

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var posIn = this.addInputPin("Position XYZ", [0.0, 0.0, 0.0], VVVV.PinTypes.Value);
  var normalIn = this.addInputPin("Normal XYZ", [0.0, 0.0, 0.0], VVVV.PinTypes.Value);
  var texCoord0In = this.addInputPin("Texture Coordinate 0 XY", [0.0, 0.0], VVVV.PinTypes.Value);
  var applyIn = this.addInputPin("Apply", [1], VVVV.PinTypes.Value);

  var vbOut = this.addOutputPin("Vertex Buffer", [], VVVV.PinTypes.WebGlResource);

  var vertexBuffer = null;

  var positions = [];
  var texCoords0 = [];
  var normals = [];
  var n;

  this.evaluate = function() {

    var gl = this.renderContexts[0];
    if (!gl)
      return;

    if (applyIn.getValue(0)>=.5) {
      n = this.getMaxInputSliceCount();
      for (var i=0; i<n; i++) { // this is most likely wrong, because texcoord only has 2 elements, which might cause some shift glitch
        positions[i] = posIn.getValue(i);
        texCoords0[i] = texCoord0In.getValue(i);
        normals[i] = normalIn.getValue(i);
      }
      positions.length = texCoords0.length = normals.length = n;
      if (!vertexBuffer) {
        vertexBuffer = new VVVV.Types.VertexBuffer(gl, positions);
        vertexBuffer.create();
      }
      vertexBuffer.setSubBuffer('POSITION', 3, positions);
      vertexBuffer.setSubBuffer('TEXCOORD0', 2, texCoords0);
      vertexBuffer.setSubBuffer('NORMAL', 3, normals);
      vertexBuffer.update();

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

  this.auto_nil = false;

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var vbIn = this.addInputPin("Vertex Buffer", [], VVVV.PinTypes.WebGlResource);
  var indicesIn = this.addInputPin("Indices", [0], VVVV.PinTypes.Value);
  var applyIn = this.addInputPin("Apply", [1], VVVV.PinTypes.Value);

  var meshOut = this.addOutputPin("Mesh", [], VVVV.PinTypes.WebGlResource);

  var mesh = null;

  this.evaluate = function() {

    var gl = this.renderContexts[0];
    if (!gl)
      return;

    if (applyIn.getValue(0)>=.5) {
      if (vbIn.isConnected()) {
        if (!mesh)
          mesh = new VVVV.Types.Mesh(gl, vbIn.getValue(0), indicesIn.values);
        if (indicesIn.pinIsChanged() || this.contextChanged)
          mesh.update(indicesIn.values);
        if (indicesIn.pinIsChanged() || vbIn.pinIsChanged() || this.contextChanged)
          meshOut.setValue(0, mesh);
      }
      else {
        meshOut.setValue(0, undefined);
        delete mesh;
      }
    }

    this.contextChanged = false;

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

  this.auto_nil = false;

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var xIn = this.addInputPin("Resolution X", [2], VVVV.PinTypes.Value);
  var yIn = this.addInputPin("Resolution Y", [2], VVVV.PinTypes.Value);

  var meshOut = this.addOutputPin("Mesh", [], VVVV.PinTypes.WebGlResource);

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
    vertexBuffer.create();
    vertexBuffer.setSubBuffer('POSITION', 3, vertices);
    vertexBuffer.setSubBuffer('TEXCOORD0', 2, texCoords);
    vertexBuffer.setSubBuffer('NORMAL', 3, normals);
    vertexBuffer.update();

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
    mesh.update(indices);

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

  this.auto_nil = false;

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var rIn = this.addInputPin("Radius", [0.5], VVVV.PinTypes.Value);
  var xIn = this.addInputPin("Resolution X", [15], VVVV.PinTypes.Value);
  var yIn = this.addInputPin("Resolution Y", [15], VVVV.PinTypes.Value);

  var meshOut = this.addOutputPin("Mesh", [], VVVV.PinTypes.WebGlResource);

  var mesh = null;

  this.evaluate = function() {

    if (!this.renderContexts) return;
    var gl = this.renderContexts[0];
    if (!gl)
      return;

    var xRes = parseInt(xIn.getValue(0));
    var yRes = parseInt(yIn.getValue(0));
    var radius = rIn.getValue(0);

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
    vertexBuffer.create();
    vertexBuffer.setSubBuffer('POSITION', 3, vertices);
    vertexBuffer.setSubBuffer('TEXCOORD0', 2, texCoords);
    vertexBuffer.setSubBuffer('NORMAL', 3, normals);
    vertexBuffer.update();

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
    mesh.update(indices);

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

  this.auto_nil = false;

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var r1In = this.addInputPin("Radius 1", [0.5], VVVV.PinTypes.Value);
  var r2In = this.addInputPin("Radius 2", [0.5], VVVV.PinTypes.Value);
  var lIn = this.addInputPin("Length", [1.0], VVVV.PinTypes.Value);
  var cyclesIn = this.addInputPin("Cycles", [1.0], VVVV.PinTypes.Value);
  var capsIn = this.addInputPin("Caps", [1], VVVV.PinTypes.Value);
  var xIn = this.addInputPin("Resolution X", [15], VVVV.PinTypes.Value);
  var yIn = this.addInputPin("Resolution Y", [1], VVVV.PinTypes.Value);

  var meshOut = this.addOutputPin("Mesh", [], VVVV.PinTypes.WebGlResource);

  var mesh = null;

  this.evaluate = function() {

    if (!this.renderContexts) return;
    var gl = this.renderContexts[0];
    if (!gl)
      return;

    var xRes = parseInt(xIn.getValue(0));
    var yRes = parseInt(yIn.getValue(0));
    var radius1 = r1In.getValue(0);
    var radius2 = r2In.getValue(0);
    var length = lIn.getValue(0);
    var cycles = cyclesIn.getValue(0);

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
    vertexBuffer.create();
    vertexBuffer.setSubBuffer('POSITION', 3, vertices);
    vertexBuffer.setSubBuffer('TEXCOORD0', 2, texCoords);
    vertexBuffer.setSubBuffer('NORMAL', 3, normals);
    vertexBuffer.update();

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
        var refP = x+(xRes+1)*y + 2;
        indices.push(refP);
        indices.push(refP+1);
        indices.push(refP+xRes+2);

        indices.push(refP+xRes+2);
        indices.push(refP+xRes+1);
        indices.push(refP);
      }
    }

    mesh = new VVVV.Types.Mesh(gl, vertexBuffer, indices);
    mesh.update(indices);

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

  var renderStateIn = this.addInputPin("Render State In", [], VVVV.PinTypes.WebGlRenderState);
  var alphaBlendingIn = this.addInputPin("Alpha Blending", [1], VVVV.PinTypes.Value);
  var srcModeIn = this.addInputPin("Source Blend Mode", ['SrcAlpha'], VVVV.PinTypes.Enum);
  var destModeIn = this.addInputPin("Destination Blend Mode", ['SrcAlpha'], VVVV.PinTypes.Enum);
  srcModeIn.enumOptions = destModeIn.enumOptions = ['One', 'Zero', 'SrcAlpha', 'InvSrcAlpha', 'DestAlpha', 'InvDestAlpha', 'SrcColor', 'InvSrcColor', 'DestColor', 'InvDestColor'];

  var renderStateOut = this.addOutputPin("Render State Out", [], VVVV.PinTypes.WebGlRenderState);

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
      renderStates[i].alphaBlending = alphaBlendingIn.getValue(i)>.5;
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
 Author(s): Matthias Zauner, woei
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.BlendWebGL = function(id, graph) {
  this.constructor(id, "Blend (EX9.RenderState)", graph);

  this.meta = {
    authors: ['Matthias Zauner, woei'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var renderStateIn = this.addInputPin("Render State In", [], VVVV.PinTypes.WebGlRenderState);
  var drawModeIn = this.addInputPin("Draw Mode", ["Blend"], VVVV.PinTypes.Enum);
  drawModeIn.enumOptions = ['Add', 'Blend', 'ColorAsAlphaAdd', 'ColorAsAlphaBlend', 'Multiply'];

  var renderStateOut = this.addOutputPin("Render State Out", [], VVVV.PinTypes.WebGlRenderState);

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
        case "Multiply":
          renderStates[i].srcBlendMode = "ZERO";
          renderStates[i].destBlendMode = "SRC_COLOR";
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

  var renderStateIn = this.addInputPin("Render State In", [], VVVV.PinTypes.WebGlRenderState);
  var fillModeIn = this.addInputPin("Fill Mode", ["Solid"], VVVV.PinTypes.Enum);
  fillModeIn.enumOptions = ['Point', 'Solid', 'WireFrame'];

  var renderStateOut = this.addOutputPin("Render State Out", [], VVVV.PinTypes.WebGlRenderState);

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

  var renderStateIn = this.addInputPin("Render State In", [], VVVV.PinTypes.WebGlRenderState);
  var enableZWriteIn = this.addInputPin("ZWrite Enable", [1], VVVV.PinTypes.Value);
  var depthFuncIn = this.addInputPin("Compare Function", ['Always'], VVVV.PinTypes.Enum);
  depthFuncIn.enumOptions = ['Never', 'Less', 'LessEqual', 'Equal', 'NotEqual', 'Greater', 'GreaterEqual', 'Always'];
  var biasIn = this.addInputPin("Depth Bias", [0.0], VVVV.PinTypes.Value);

  var renderStateOut = this.addOutputPin("Render State Out", [], VVVV.PinTypes.WebGlRenderState);

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
      renderStates[i].enableZWrite = enableZWriteIn.getValue(i)>.5;
      renderStates[i].depthFunc = convertToWebGLDepthFunc(depthFuncIn.getValue(i));
      renderStates[i].depthOffset = biasIn.getValue(0);
      renderStateOut.setValue(i, renderStates[i]);
    }
    renderStateOut.setSliceCount(maxSpreadSize);

  }

}
VVVV.Nodes.ZWriteEnableWebGL.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Cull (EX9.RenderState)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.CullWebGL = function(id, graph) {
  this.constructor(id, "Cull (EX9.RenderState)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var renderStateIn = this.addInputPin("Render State In", [], VVVV.PinTypes.WebGlRenderState);
  var cullingIn = this.addInputPin("Culling", ["None"], VVVV.PinTypes.Enum);
  cullingIn.enumOptions = ["None", "Clockwise", "Counterclockwise"];

  var renderStateOut = this.addOutputPin("Render State Out", [], VVVV.PinTypes.WebGlRenderState);

  var renderStates = [];

  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSpreadSize; i++) {
      if (renderStates[i]==undefined) {
        renderStates[i] = new VVVV.Types.WebGlRenderState();
      }
      renderStates[i].copy_attributes(renderStateIn.getValue(i));
      if (cullingIn.getValue(i)=="Clockwise")
        renderStates[i].cullFace = 'CW';
      else if (cullingIn.getValue(i)=="Counterclockwise")
        renderStates[i].cullFace = 'CCW';
      else
        renderStates[i].cullFace = undefined;
      renderStateOut.setValue(i, renderStates[i]);
    }
    renderStateOut.setSliceCount(maxSpreadSize);

  }

}
VVVV.Nodes.CullWebGL.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: GenericShader (EX9.Effect)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GenericShader = function(id, graph) {
  this.constructor(id, "GenericShader (EX9.Effect)", graph);

  this.auto_nil = false;

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.shaderFile = '';

  var renderStateIn = this.addInputPin("Render State", [], VVVV.PinTypes.WebGlRenderState);
  var meshIn = this.addInputPin("Mesh", [], VVVV.PinTypes.WebGlResource);
  var transformIn = this.addInputPin("Transform", [], VVVV.PinTypes.Transform);
  var techniqueIn = this.addInputPin("Technique", [''], VVVV.PinTypes.Enum);
  techniqueIn.enumOptions = [''];

  var layerOut = this.addOutputPin("Layer", [], VVVV.PinTypes.WebGlResource);

  var layers = [];
  var mesh = null;
  var shader = null;
  var shaderCode;
  var shaderCodeChanged = false;

  var shaderPins = [];

  var initialized = false;

  var thatNode = this;

  this.initialize = function() {

    // add the pins which have already been added (by the patch XML) to the shaderPins array
    var defaultPins = ["Render State", "Mesh", "Transform", "Technique"];
    _(thatNode.inputPins).each(function(p) {
      if (defaultPins.indexOf(p.pinname)<0) {
        p.unvalidated = true;
        shaderPins.push(p);
      }
    })

    if (VVVV.ShaderCodeResources[thatNode.shaderFile]==undefined) {
      VVVV.ShaderCodeResources[thatNode.shaderFile] = new VVVV.Types.ShaderCodeResource();
      VVVV.ShaderCodeResources[thatNode.shaderFile].addRelatedNode(thatNode);
      $.ajax({
        url: VVVV.Helpers.prepareFilePath(thatNode.shaderFile, thatNode.parentPatch),
        async: false,
        dataType: 'text',
        success: function(response) {
          VVVV.ShaderCodeResources[thatNode.shaderFile].setSourceCode(response);
        },
        error: function() {
          console.log('ERROR: Could not load shader file '+thatNode.shaderFile.replace('%VVVV%', VVVV.Root));
          VVVV.onNotImplemented('Could not load shader file '+thatNode.shaderFile.replace('%VVVV%', VVVV.Root));
        }
      });
    }
    else {
      VVVV.ShaderCodeResources[thatNode.shaderFile].addRelatedNode(thatNode);
    }


  }

  this.shaderSourceUpdated = function(sc) {
    shaderCode = sc;
    if (!shader)
      shader = new VVVV.Types.ShaderProgram();
    thatNode.addUniformPins();
    thatNode.setupShader();
    _(thatNode.inputPins).each(function(p) {
      p.markPinAsChanged();
    })
    shaderCodeChanged = true;
    shader.isSetup = false;
    this.parentPatch.afterUpdate();
  }

  this.addUniformPins = function() {
    shader.extractSemantics(shaderCode);

    // delete pins which have been removed from shader code or where the type changed
    var deletables = [];
    for (var i=0; i<shaderPins.length; i++) {
      if (!shader.uniformSpecs[shaderPins[i].pinname.replace(/ /g, '_')]) {
        thatNode.removeInputPin(shaderPins[i].pinname);
        deletables.push(i);
      }
    }
    for (var i=0; i<deletables.length; i++) {
      shaderPins.splice(deletables[i], 1);
    }

    // add pins
    _(shader.uniformSpecs).each(function(u) {
      if (u.semantic=="VIEW" || u.semantic=="PROJECTION" || u.semantic=="WORLD" || u.semantic=="VIEWPROJECTION" || u.semantic=="WORLDVIEW" || u.semantic=="WORLDVIEWPROJECTION")
        return;
      var pinType = VVVV.PinTypes.Value;
      var defaultValue = [];
      switch (u.type) {
        case 'mat':
          pinType = VVVV.PinTypes.Transform;
          break;
        case 'samplerCube':
        case 'sampler':
          pinType = VVVV.PinTypes.WebGlTexture;
          break;
        default:
          if (u.semantic == 'COLOR') {
            pinType = VVVV.PinTypes.Color;
            defaultValue = [new VVVV.Types.Color('1.0, 1.0, 1.0, 1.0')];
          }
          else
            defaultValue = [0.0];
          if (u.defaultValue) {
            if (u.semantic != 'COLOR')
              defaultValue = _(u.defaultValue.split(',')).map(function(e) { return parseFloat(e); });
            else
              defaultValue = [new VVVV.Types.Color(u.defaultValue)];
          }

      }
      for (var i=0; i<shaderPins.length; i++) {
        if (shaderPins[i].pinname==u.varname.replace(/_/g,' ')) {
          shaderPins[i].dimensions = u.dimension;
          if (shaderPins[i].unvalidated && !shaderPins[i].isConnected())
            if (pinType.typeName=='Color')
              shaderPins[i].values = thatNode.defaultPinValues[shaderPins[i].pinname] ? _(thatNode.defaultPinValues[shaderPins[i].pinname]).map(function(v) { return new VVVV.Types.Color(v) }) : defaultValue;
            else
              shaderPins[i].values = thatNode.defaultPinValues[shaderPins[i].pinname] ? thatNode.defaultPinValues[shaderPins[i].pinname].slice() : defaultValue;
          // pin type change
          if (shaderPins[i].typeName!=pinType.typeName) {
            var values = shaderPins[i].values.slice();
            var sliceCount = shaderPins[i].getSliceCount();
            shaderPins[i].setType(pinType);
            // restore values, as setType reset it to default
            if (shaderPins[i].unvalidated && pinType.primitive && !shaderPins[i].isConnected()) {
              shaderPins[i].values = values;
              shaderPins[i].setSliceCount(sliceCount);
            }
            if (shaderPins[i].isConnected() && !shaderPins[i].unvalidated) {
              shaderPins[i].connectionChanged();
              shaderPins[i].links[0].destroy();
            }
          }
          shaderPins[i].unvalidated = false;
          return;
        }
      }

      var pin = thatNode.addInputPin(u.varname.replace(/_/g,' '), defaultValue, pinType);
      pin.dimensions = u.dimension;
      shaderPins.push(pin);
    });
  }

  this.setupShader = function() {
    var technique = techniqueIn.getValue(0);
    technique = technique.replace(/^\s*/, '').replace(/\s*$/, '');
    var rx = new RegExp(/(vertex_shader|fragment_shader)\{([^\}]+)\}/g);
    techniqueIn.enumOptions = [];
    var match;
    while ((match = rx.exec(shaderCode))!=null) {
      techniqueIn.enumOptions = techniqueIn.enumOptions.concat(match[2].replace(/\s/g, '').split(','));
    }
    techniqueIn.enumOptions = techniqueIn.enumOptions.filter(function(e, index, self) { return self.indexOf(e)===index })
    if (techniqueIn.enumOptions.length==0)
      techniqueIn.enumOptions.push('');
    if (technique=="" || techniqueIn.enumOptions.indexOf(technique)<0) {
      technique = techniqueIn.enumOptions[0];
      techniqueIn.setValue(0, technique);
    }
    var vsRegEx = new RegExp('vertex_shader(\\{([a-zA-Z0-9]+,\\s*)*'+technique+'(,\\s*[a-zA-Z0-9]+)*\\})?:([\\s\\S]*?)(vertex_shader|fragment_shader)');
    var psRegEx = new RegExp('fragment_shader(\\{([a-zA-Z0-9]+,\\s*)*'+technique+'(,\\s*[a-zA-Z0-9]+)*\\})?:([\\s\\S]*?)(vertex_shader|fragment_shader)');

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
    if (!gl || !shader)
      return;
    if (!shader.isSetup || this.contextChanged || techniqueIn.pinIsChanged()) {
      this.setupShader();
      if (shader.setup(gl)) {
        if (VVVV.ShaderCodeResources[thatNode.shaderFile].definingNode)
          VVVV.ShaderCodeResources[thatNode.shaderFile].definingNode.showStatus('success', "Successfully compiled");
      }
      else {
        if (VVVV.ShaderCodeResources[thatNode.shaderFile].definingNode)
          VVVV.ShaderCodeResources[thatNode.shaderFile].definingNode.showStatus('error', shader.log);
      }
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
    if (this.contextChanged || shaderCodeChanged)
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
    for (var j=0; j<maxSize; j++) {
      layers[j].shader = shader;
    }

    for (var i=0; i<shaderPins.length; i++) {
      var pinname = shaderPins[i].pinname.replace(/ /g, '_');
      if (shaderPins[i].pinIsChanged() || currentLayerCount<maxSize) {
        for (var j=0; j<maxSize; j++) {
          if (shader.uniformSpecs[pinname].type=='vec') {
            if (shader.uniformSpecs[pinname].semantic=='COLOR') {
              layers[j].uniforms[pinname].value = shaderPins[i].getValue(j).rgba;
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
    shaderCodeChanged = false;

  }

  this.openUIWindow = function() {
    if (VVVV.ShaderCodeResources[thatNode.shaderFile].definingNode)
      VVVV.ShaderCodeResources[thatNode.shaderFile].definingNode.openUIWindow();
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

  this.auto_nil = false;

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['No Sampler States', 'No texture coord mapping', 'No enable pin', 'Transprent pixels are discarded by default']
  };

  this.auto_evaluate = false;

  var renderStateIn = this.addInputPin("Render State", [], VVVV.PinTypes.WebGlRenderState);
  this.addInputPin("Transform", [], VVVV.PinTypes.Transform);
  this.addInputPin("Texture", [], VVVV.PinTypes.WebGlTexture);
  this.addInputPin("Texture Transform", [], VVVV.PinTypes.Transform);
  this.addInputPin("Color", [], VVVV.PinTypes.Color);

  var layerOut = this.addOutputPin("Layer", [], VVVV.PinTypes.WebGlResource);

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
      vertexBuffer.create();
      vertexBuffer.setSubBuffer('POSITION', 3, vertices);
      vertexBuffer.setSubBuffer('TEXCOORD0', 2, texCoords);
      vertexBuffer.update();
      mesh = new VVVV.Types.Mesh(gl, vertexBuffer, [ 0, 1, 2, 1, 3, 2 ]);
      mesh.update([ 0, 1, 2, 1, 3, 2 ]);

      // shaders

      var fragmentShaderCode = "#ifdef GL_ES\n";
      fragmentShaderCode += "precision mediump float;\n";
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
        //var rgba = _(color.split(',')).map(function(x) { return parseFloat(x) });
        layers[i].uniforms['col'].value = color.rgba;
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
 NODE: GridSegment (DX9)
 Author(s): woei
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GridSegment = function(id, graph) {
  this.constructor(id, "GridSegment (DX9)", graph);

  this.auto_nil = false;

  this.meta = {
    authors: ['woei'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var renderStateIn = this.addInputPin("Render State", [], VVVV.PinTypes.WebGlRenderState);
  this.addInputPin("Transform", [], VVVV.PinTypes.Transform);
  this.addInputPin("Texture", [], VVVV.PinTypes.WebGlTexture);
  this.addInputPin("Texture Transform", [], VVVV.PinTypes.Transform);
  this.addInputPin("Color", [], VVVV.PinTypes.Color);

  var cyclesIn = this.addInputPin("Cycles", [1], VVVV.PinTypes.Value);
  var radiusIn = this.addInputPin("Inner Radius", [0], VVVV.PinTypes.Value);

  var xIn = this.addInputPin("Resolution X", [6], VVVV.PinTypes.Value);
  var yIn = this.addInputPin("Resolution Y", [2], VVVV.PinTypes.Value);

  var layerOut = this.addOutputPin("Layer", [], VVVV.PinTypes.WebGlResource);

  var initialized = false;
  var layers = [];
  var shader = null;

  this.evaluate = function() {

    if (!this.renderContexts) return;
    var gl = this.renderContexts[0];

    if (!gl)
      return;

    if (this.contextChanged) {
	    var fragmentShaderCode = "#ifdef GL_ES\n";
	    fragmentShaderCode += "precision mediump float;\n";
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
    if (this.contextChanged || xIn.pinIsChanged() || yIn.pinIsChanged() || cyclesIn.pinIsChanged() || radiusIn.pinIsChanged())
      currentLayerCount = 0;
    // shorten layers array, if input slice count decreases
    if (maxSize<currentLayerCount) {
      layers.splice(maxSize, currentLayerCount-maxSize);
    }

    for (var j=currentLayerCount; j<maxSize; j++) {
      layers[j] = new VVVV.Types.Layer();

      //create mesh here
      var xRes = parseInt(xIn.getValue(j));
      var yRes = parseInt(yIn.getValue(j));
      var cycles = cyclesIn.getValue(j);
      var radius = radiusIn.getValue(j);

      var vertices = [];
      var normals = [];
      var texCoords = [];
      var index = 0;
      for (var y=0; y<yRes; y++) {
        for (var x=0; x<xRes; x++) {
          var phi = parseFloat(x)/(xRes-1);
          phi = 0.25 - phi*cycles;
          phi = phi * 2 * 3.14159265359;

          var r = parseFloat(y)/(yRes-1);
          r = radius*(1.0-r)+r;

          vertices.push(Math.sin(phi)*r*0.5);
          vertices.push(Math.cos(phi)*r*0.5);
          // vertices.push(phi);
          // vertices.push(r);
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
      vertexBuffer.create();
      vertexBuffer.setSubBuffer('POSITION', 3, vertices);
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

      layers[j].mesh = new VVVV.Types.Mesh(gl, vertexBuffer, indices);
      layers[j].mesh.update(indices);
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
        layers[i].uniforms['col'].value = color.rgba;
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
VVVV.Nodes.GridSegment.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Group (EX9)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Group = function(id, graph) {
  this.constructor(id, "Group (EX9)", graph);

  this.auto_nil = false;

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var layerIns = [];
  var enableIn = this.addInputPin("Enabled", [1], VVVV.PinTypes.Value);
  var layerCountIn = this.addInvisiblePin("Layer Template Count", [2], VVVV.PinTypes.Value);

  var layerOut = this.addOutputPin("Layer", [], VVVV.PinTypes.WebGlResource);

  this.initialize = function() {
  	var layerCount = Math.max(2, layerCountIn.getValue(0));
  	VVVV.Helpers.dynamicPins(this, layerIns, layerCount, function(i) {
      return this.addInputPin("Layer "+(i+1), [], VVVV.PinTypes.WebGlResource);
    });
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

  this.auto_nil = false;

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Disabling Clear doesn\'t work in Chrome', 'No Fullscreen', 'No Enable Pin', 'No Aspect Ration and Viewport transform', 'No mouse output']
  };

  this.addInputPin("Layers", [], VVVV.PinTypes.WebGlResource);
  var clearIn = this.addInputPin("Clear", [1], VVVV.PinTypes.Value);
  var bgColIn = this.addInputPin("Background Color", [new VVVV.Types.Color("0.0, 0.0, 0.0, 1.0")], VVVV.PinTypes.Color);
  var bufferWidthIn = this.addInputPin("Backbuffer Width", [0], VVVV.PinTypes.Value);
  var bufferHeightIn = this.addInputPin("Backbuffer Height", [0], VVVV.PinTypes.Value);
  var viewIn = this.addInputPin("View", [], VVVV.PinTypes.Transform);
  var projIn = this.addInputPin("Projection", [], VVVV.PinTypes.Transform);

  var enableDepthBufIn = this.addInvisiblePin("Windowed Depthbuffer Format", ['NONE'], VVVV.PinTypes.Enum);
  enableDepthBufIn.enumOptions = ['NONE', 'DX16'];

  var bufferWidthOut = this.addOutputPin("Actual Backbuffer Width", [0.0], VVVV.PinTypes.Value);
  var bufferHeightOut = this.addOutputPin("Actual Backbuffer Height", [0.0], VVVV.PinTypes.Value);
  var ex9Out = this.addOutputPin("EX9 Out", [], VVVV.PinTypes.WebGlResource);

  var width = 0.0;
  var height = 0.0;

  var pMatrix;
  var vMatrix;
  var vpMatrix;
  var wvMatrix = mat4.create();
  var wvpMatrix = mat4.create();

  var canvas;
  this.ctxt = undefined;              // the renderer's active context. might be the canvas context, or the context of a connected downstream renderer
  var canvasCtxt = undefined;         // the context of the canvas which is connected to the renderer
  var gl;                             // just a convenience variable for keeping the lines short
  var id;

  var bbufFramebuffer;
  var bbufTexture;

  function attachMouseEvents() {
    $(canvas).detach('mousemove');
    $(canvas).detach('mousedown');
    $(canvas).detach('mouseup');
    VVVV.MousePositions[id] = {'x': [0.0], 'y': [0.0], 'wheel': [0.0], 'lb': [0.0], 'mb': [0.0], 'rb': [0.0]};
    $(canvas).mousemove(function(e) {
      var x = (e.pageX - $(this).offset().left) * 2 / $(this).width() - 1;
      var y = -((e.pageY - $(this).offset().top) * 2 / $(this).height() - 1);
      VVVV.MousePositions['_all'].x[0] = x;
      VVVV.MousePositions['_all'].y[0] = y;
      VVVV.MousePositions[id].x[0] = x;
      VVVV.MousePositions[id].y[0] = y;
    });
    $(canvas).bind('mousewheel', function(e) {
      var delta = e.originalEvent.wheelDelta/120;
      VVVV.MousePositions[id].wheel[0] += delta;
      VVVV.MousePositions['_all'].wheel[0] += delta;
    });
    $(canvas).bind('DOMMouseScroll', function(e) {
      var delta = -e.originalEvent.detail/3;
      VVVV.MousePositions[id].wheel[0] += delta;
      VVVV.MousePositions['_all'].wheel[0] += delta;
    })
    function mouseup(e) {
      switch (e.which) {
        case 1: VVVV.MousePositions['_all'].lb[0] = 0; VVVV.MousePositions[id].lb[0] = 0; break;
        case 2: VVVV.MousePositions['_all'].mb[0] = 0; VVVV.MousePositions[id].mb[0] = 0; break;
        case 3: VVVV.MousePositions['_all'].rb[0] = 0; VVVV.MousePositions[id].rb[0] = 0; break;
      }
    }
    $(canvas).mousedown(function(e) {
      switch (e.which) {
        case 1: VVVV.MousePositions['_all'].lb[0] = 1; VVVV.MousePositions[id].lb[0] = 1; break;
        case 2: VVVV.MousePositions['_all'].mb[0] = 1; VVVV.MousePositions[id].mb[0] = 1; break;
        case 3: VVVV.MousePositions['_all'].rb[0] = 1; VVVV.MousePositions[id].rb[0] = 1; break;
      }
      $(document).unbind('mouseup', mouseup);
      $(document).mouseup(mouseup);
    });

    function setTouchPositions(e, element) {
      var i = e.originalEvent.changedTouches.length;
      while (i--) {
        var x = (e.originalEvent.changedTouches[i].pageX - $(element).offset().left) * 2 / $(element).width() - 1;
        var y = -((e.originalEvent.changedTouches[i].pageY - $(element).offset().top) * 2 / $(element).height() - 1);
        VVVV.MousePositions['_all'].x[e.originalEvent.changedTouches[i].identifier] = VVVV.MousePositions[element.id].x[e.originalEvent.changedTouches[i].identifier] = x;
        VVVV.MousePositions['_all'].y[e.originalEvent.changedTouches[i].identifier] = VVVV.MousePositions[element.id].y[e.originalEvent.changedTouches[i].identifier] = y;
      }
    }

    $(canvas).bind('touchstart', function(e) {
      var i = e.originalEvent.changedTouches.length;
      while (i--) {
        VVVV.MousePositions['_all'].lb[e.originalEvent.changedTouches[i].identifier] = VVVV.MousePositions[id].lb[e.originalEvent.changedTouches[i].identifier] = 1;
      }
      setTouchPositions(e, this);
    })

    $(canvas).bind('touchend', function(e) {
      var i = e.originalEvent.changedTouches.length;
      while (i--) {
        VVVV.MousePositions['_all'].lb[e.originalEvent.changedTouches[i].identifier] = VVVV.MousePositions[id].lb[e.originalEvent.changedTouches[i].identifier] = 0;
      }
    })

    $(canvas).bind('touchmove', function(e) {
      setTouchPositions(e, this);
      e.preventDefault();
    })
  }

  this.getContexts = function() {
    if (!this.invisiblePins["Descriptive Name"])
      return;
    var selector = this.invisiblePins["Descriptive Name"].getValue(0);
    var targetElement = $(selector).get(0);
    if (!targetElement || targetElement.nodeName!='CANVAS') {
      var w = parseInt(bufferWidthIn.getValue(0));
      var h = parseInt(bufferHeightIn.getValue(0));
      w = w > 0 ? w : 512;
      h = h > 0 ? h : 512;
      id = 'vvvv-js-generated-renderer-'+(new Date().getTime());
      canvas = $('<canvas width="'+w+'" height="'+h+'" id="'+id+'" class="vvvv-js-generated-renderer"></canvas>');
      if (!targetElement) targetElement = 'body';
      $(targetElement).append(canvas);
    }
    else
      canvas = $(targetElement);

    if (!canvas)
      return;

    attachMouseEvents();

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

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, bbufFramebuffer.width, bbufFramebuffer.height, 0, gl.RGBA, gl.UNSIGNED_SHORT_4_4_4_4, null);
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
    gl.DefaultTexture = {};
    gl.DefaultTexture['2D'] = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, gl.DefaultTexture['2D']);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, pixels);
    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.DefaultTexture['CUBE'] = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, gl.DefaultTexture['CUBE']);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, pixels);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, pixels);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, pixels);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, pixels);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, pixels);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, pixels);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

    // this is to ensure that all the input pins get evaluated, if the gl context has been set after the node creation
    this.inputPins["Layers"].markPinAsChanged();
    clearIn.markPinAsChanged();
    bgColIn.markPinAsChanged();
    viewIn.markPinAsChanged();
    projIn.markPinAsChanged();

  }

  this.destroy = function() {
    $(canvas).remove();
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

    if (this.contextChanged || bgColIn.pinIsChanged()) {
      var col = bgColIn.getValue(0);
      gl.clearColor(col.rgba[0], col.rgba[1], col.rgba[2], col.rgba[3]);
    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (this.contextChanged || enableDepthBufIn.pinIsChanged()) {
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
      vpMatrix = mat4.create();
    }
    if (viewIn.pinIsChanged()) {
      vMatrix = viewIn.getValue(0);
    }
    if (viewIn.pinIsChanged() || projIn.pinIsChanged()) {
      mat4.multiply(pMatrix, vMatrix, vpMatrix);
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
          if (layer.shader.uniformSemanticMap["PROJECTION"] && layer.shader.uniformSpecs[layer.shader.uniformSemanticMap["PROJECTION"]].position!=0)
            gl.uniformMatrix4fv(layer.shader.uniformSpecs[layer.shader.uniformSemanticMap["PROJECTION"]].position, false, pMatrix);
          if (layer.shader.uniformSemanticMap["VIEW"] && layer.shader.uniformSpecs[layer.shader.uniformSemanticMap["VIEW"]].position!=0)
            gl.uniformMatrix4fv(layer.shader.uniformSpecs[layer.shader.uniformSemanticMap["VIEW"]].position, false, vMatrix);
          if (layer.shader.uniformSemanticMap["VIEWPROJECTION"] && layer.shader.uniformSpecs[layer.shader.uniformSemanticMap["VIEWPROJECTION"]].position!=0)
            gl.uniformMatrix4fv(layer.shader.uniformSpecs[layer.shader.uniformSemanticMap["VIEWPROJECTION"]].position, false, vpMatrix);
        }

        var renderState = layer.renderState;
        if (!renderState)
          renderState = defaultWebGlRenderState;
        if (renderState!=currentRenderState)
          renderState.apply(gl);

        if (layer.mesh != currentMesh || layer.shader.shaderProgram != currentShaderProgram) {
          gl.bindBuffer(gl.ARRAY_BUFFER, layer.mesh.vertexBuffer.vbo);
          _(layer.mesh.vertexBuffer.subBuffers).each(function(b) {
            if (!layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]] || layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]].position==-1)
              return;
            gl.enableVertexAttribArray(layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]].position);
            gl.vertexAttribPointer(layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]].position, b.size, gl.FLOAT, false, 0, b.offset);
          });

          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, layer.mesh.indexBuffer);
        }

        /*if (layer.shader.uniformSemanticMap["WORLDVIEWPROJECTION"]) {
          mat4.multiply(vpMatrix, layer.uniforms[layer.shader.uniformSemanticMap["WORLDVIEWPROJECTION"]].value, wvpMatrix);
          gl.uniformMatrix4fv(layer.shader.uniformSpecs[layer.shader.uniformSemanticMap["WORLDVIEWPROJECTION"]].position, false, wvpMatrix);
        } */

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
                tex = gl.DefaultTexture['2D'];
              gl.activeTexture(gl['TEXTURE'+textureIdx]);
              gl.bindTexture(gl['TEXTURE_'+u.uniformSpec.dimension], tex);
              gl.uniform1i(u.uniformSpec.position, textureIdx);
              textureIdx++;
              break;
            case "samplerCube":
              var tex = u.value;
              if (tex==VVVV.DefaultTexture)
                tex = gl.DefaultTexture['CUBE'];
              gl.activeTexture(gl['TEXTURE'+textureIdx]);
              gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
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

      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

    }

    if (this.renderContexts && this.renderContexts[0]) {
      gl.bindTexture(gl.TEXTURE_2D, bbufTexture);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(this.renderContexts[0].TEXTURE_2D, null);
    }

    ex9Out.setValue(0, bbufTexture);

    this.contextChanged = false;
  }

}
VVVV.Nodes.RendererWebGL.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: DefineEffect (DX9)
 Author(s): Matthias Zauner
 Original Node Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.DefineEffect = function(id, graph) {
  this.constructor(id, "DefineEffect (DX9)", graph);

  this.auto_nil = false;

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['Matthias Zauner'],
    credits: [],
    compatibility_issues: ['Not available in classic VVVV']
  };

  this.auto_evaluate = false;

  var nameIn = this.addInputPin("Effect Descriptor", [''], VVVV.PinTypes.String);
  var sourceCodeIn = this.addInvisiblePin("Source Code", ['#ifdef GL_ES\nprecision mediump float;\n#endif\n\nuniform mat4 tW : WORLD;\nuniform mat4 tV : VIEW;\nuniform mat4 tP : PROJECTION;\n\nuniform vec4 Color : COLOR = {1.0, 1.0, 1.0, 1.0};\nuniform sampler2D Texture;\nuniform mat4 Texture_Transform;\nuniform float Alpha = 1.0;\n\nvarying vec2 vs2psTexCd;\n\nvertex_shader:\n\nattribute vec3 PosO : POSITION;\nattribute vec2 TexCd : TEXCOORD0;\n\nvoid main(void) {\n  gl_Position = tP * tV * tW * vec4(PosO, 1.0);\n  vs2psTexCd = (Texture_Transform * vec4(TexCd, 0, 1)).xy;\n}\n\n\nfragment_shader:\n\nvoid main(void) {\n  gl_FragColor = Color * texture2D(Texture, vs2psTexCd) * vec4(1.0, 1.0, 1.0, Alpha);\n}'], VVVV.PinTypes.String);

  var currentName = '';
  var w; // the UI window

  this.evaluate = function() {
    if (nameIn.getValue(0)!='') {
      if (nameIn.pinIsChanged()) {
        var descriptor = nameIn.getValue(0);
        if (descriptor=='')
          return;
        if (currentName=='') { // if is set for the first time
          if (VVVV.ShaderCodeResources["./"+descriptor+'.vvvvjs.fx']==undefined)
            VVVV.ShaderCodeResources["./"+descriptor+'.vvvvjs.fx'] = new VVVV.Types.ShaderCodeResource();
        }
        else
          VVVV.ShaderCodeResources["./"+descriptor+'.vvvvjs.fx'] = VVVV.ShaderCodeResources[currentName];
        currentName = "./"+descriptor+'.vvvvjs.fx';
        VVVV.ShaderCodeResources[currentName].definingNode = this;
        VVVV.ShaderCodeResources[currentName].setSourceCode(sourceCodeIn.getValue(0));
        if (w)
          $('#path', w.document).text((this.parentPatch.nodename || 'root')+' / '+(currentName!='' ? currentName : 'Untitled'));
      }

      if (sourceCodeIn.pinIsChanged()) {
        if (VVVV.ShaderCodeResources[currentName])
          VVVV.ShaderCodeResources[currentName].setSourceCode(sourceCodeIn.getValue(0));
      }
    }
  }

  this.openUIWindow = function() {
    w = window.open(location.protocol+'//'+location.host+(VVVV.Root[0]=='/' ? '' : location.pathname.replace(/\/[^\/]*$/, '')+'/')+VVVV.Root+"/code_editor.html", currentName+" / VVVV.js Effect Editor", "location=no, width=800, height=800, toolbar=no");
    var thatNode = this;
    window.setTimeout(function() {
      w.document.title = currentName+" / VVVV.js Effect Editor";
      var definingNodeName = thatNode.parentPatch.nodename || 'root';
      var shaderName = currentName!='' ? currentName : 'Untitled';
      $('#path', w.document).text(definingNodeName+' / '+shaderName);
      $('textarea', w.document).text(sourceCodeIn.getValue(0));
      $('#compile_button', w.document).click(function() {
        if (currentName=='') {
          thatNode.showStatus('error', 'Please provide a name for this shader first');
          return;
        }
        sourceCodeIn.setValue(0, $('textarea', w.document).val());
        if (VVVV.ShaderCodeResources[currentName].relatedNodes.length>0) {
          thatNode.showStatus('notice', 'Compiling ...');
          thatNode.evaluate();
        }
        else
          thatNode.showStatus('notice', 'No instance of this shader found. Create a node (./'+currentName+') and connect it to a Renderer (EX9) to compile.');
      });
      w.focus();
    }, 500);
  }

  this.showStatus = function(type, message) {
    if (w) {
      $('#status', w.document).text(message);
      $('#status', w.document).attr('class', type);
    }
  }

}
VVVV.Nodes.DefineEffect.prototype = new VVVV.Core.Node();

}(vvvvjs_jquery));
