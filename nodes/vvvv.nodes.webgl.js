// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }

define(function(require,exports) {


var $ = require('jquery');
var _ = require('underscore');
var glMatrix = require('glMatrix');
var VVVV = require('core/vvvv.core.defines');
var Node = require('core/vvvv.core.node');

/** A hash table of {@VVVV.Types.ShaderCodeResource} objects, indexed with the name/path of the shader code resource */
VVVV.ShaderCodeResources = {
  "%VVVV%/effects/PhongDirectional.vvvvjs.fx": undefined,
  "%VVVV%/effects/GouraudDirectional.vvvvjs.fx": undefined,
  "%VVVV%/effects/Constant.vvvvjs.fx": undefined,
  "%VVVV%/effects/PhongDirectionalInstanced.vvvvjs.fx": undefined,
  "%VVVV%/effects/PhongDisplacement.vvvvjs.fx": undefined,
  "%VVVV%/effects/CookTorrance.vvvvjs.fx": undefined,
  "%VVVV%/effects/PhongInstancedAnimation.vvvvjs.fx": undefined,
  "%VVVV%/effects/BillBoards.vvvvjs.fx": undefined,
  "%VVVV%/effects/BotanyInstanced.vvvvjs.fx": undefined
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


var identity = glMatrix.mat4.identity(glMatrix.mat4.create());

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

  // in case of dealing already with typed arrays
  this.setSubBufferTyped = function(u, s, d) {
    this.subBuffers[u] = {
      usage: u,
      data: d,
      size: s,
      offset: this.length
    };
    this.length += this.subBuffers[u].data.byteLength;
  }

  //this.setSubBuffer('POSITION', 3, p);

  this.updateSubBuffer = function(u,d) {
    this.subBuffers[u].data = new Float32Array(d);
  }

  this.updateSubBufferTyped = function(u,d) {
    this.subBuffers[u].data = d;
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

  //this.instancedBuffer = gl.createBuffer();
   this.instanceBuffers = [];
      this.semantics = [];
   this.VectorSize = [];
   this.Divisor = [];

  this.update =function(indices) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.DYNAMIC_DRAW);
    /** @member */
    this.numIndices = indices.length;
  }

   this.addInstanceBuffers =function(count) {
    for (var i=0; i<count; i++) {
      this.instanceBuffers[i] = gl.createBuffer();
    }
  }

  this.removeInstanceBuffers =function() {
    for (var i=0; i<this.instanceBuffers.length; i++) {
        gl.removeBuffer(this.instanceBuffers[i]);
    }
  }

   this.addSemantics =function(semanticsIn) {
    for (var i=0; i<semanticsIn.length; i++) {
      this.semantics[i] = semanticsIn[i];
    }
  }

  this.addVectorSize =function(VectorSizeIn) {
    for (var i=0; i<VectorSizeIn.length; i++) {
      this.VectorSize[i] = VectorSizeIn[i];
    }
  }

  this.addDivisor =function(DivisorIn) {
    for (var i=0; i<DivisorIn.length; i++) {
      this.Divisor[i] = DivisorIn[i];
    }
  }

  this.updateInstanced =function(bufferData, index) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffers[index]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bufferData), gl.STATIC_DRAW);
  }

  this.updateInstancedArray =function(Buffer) {
    for (var i=0; i<Buffer.length; i++) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffers[i]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Buffer[i].data), gl.STATIC_DRAW);
    }
  }


  /** @member */
  this.instanced = false;

  /** @member */
  this.instanceCount = 1.0;

  this.instancedBufferChanged = false;

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
  this.environments = ['browser'];

  var filenamePin = this.addInputPin("Filename", [""], VVVV.PinTypes.String);
  var outputPin = this.addOutputPin("Texture Out", [], VVVV.PinTypes.WebGlTexture);

  var typeIn = this.addInputPin("Type", ["Texture"], VVVV.PinTypes.Enum);
  typeIn.enumOptions = ["Texture", "Cube Texture"];

  var textures = [];
  var prevFilenames = [];//only load new files

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
      var filenames = [];
      for (var i=0; i<maxSize; i++) {
        var filename = VVVV.Helpers.prepareFilePath(filenamePin.getValue(i), this.parentPatch);
        if (filename.indexOf('http://')===0 && VVVV.ImageProxyPrefix!==undefined)
          filename = VVVV.ImageProxyPrefix+encodeURI(filename);
        filenames.push(filename);            //only load new files
        if(prevFilenames[i]!=filenames[i]){  //by loading only when filename actualy changes performance increase and dynamic texture loading possible
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
      }
      prevFilenames = filenames;
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
VVVV.Nodes.FileTexture.prototype = new Node();


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
  this.environments = ['browser'];

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
VVVV.Nodes.DX9Texture.prototype = new Node();


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
  this.environments = ['browser'];

  var sourceIn = this.addInputPin("Source", [], VVVV.PinTypes.HTMLLayer);
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
      var source = sourceIn.getValue(0).element.get(0);
      if (!source || source.tagName!='CANVAS')
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
VVVV.Nodes.CanvasTextureWebGl.prototype = new Node();

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
  this.environments = ['browser'];

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
VVVV.Nodes.VideoTexture.prototype = new Node();


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
  this.environments = ['browser'];

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
VVVV.Nodes.VertexBufferJoin.prototype = new Node();


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
  this.environments = ['browser'];

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
VVVV.Nodes.MeshJoin.prototype = new Node();

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
  this.environments = ['browser'];

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
VVVV.Nodes.Grid.prototype = new Node();



/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Box (EX9.Geometry)
 Author(s): David Gann
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Box = function(id, graph) {
  this.constructor(id, "Box (EX9.Geometry)", graph);

  this.auto_nil = false;

  this.meta = {
    authors: ['David Gann'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var meshOut = this.addOutputPin("Mesh", [], VVVV.PinTypes.WebGlResource);

  var mesh = null;

  this.evaluate = function() {

    if (!this.renderContexts) return;
    var gl = this.renderContexts[0];
    if (!gl)
      return;


    var vertices = [-0.5,-0.5,-0.5,-0.5,-0.5,0.5,-0.5,0.5,0.5,-0.5,0.5,-0.5,-0.5,0.5,-0.5,-0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,-0.5,0.5,0.5,-0.5,0.5,0.5,0.5,0.5,-0.5,0.5,0.5,-0.5,-0.5,-0.5,-0.5,0.5,-0.5,-0.5,-0.5,0.5,-0.5,-0.5,0.5,-0.5,0.5,-0.5,-0.5,0.5,0.5,-0.5,0.5,0.5,0.5,0.5,-0.5,0.5,0.5,-0.5,-0.5,-0.5,-0.5,0.5,-0.5,0.5,0.5,-0.5,0.5,-0.5,-0.5];
    var normals = [-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0];
    var texCoords = [1.0,1.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,1.0,1.0,0.0,0.0,1.0,0.0,1.0,1.0,0.0,1.0,0.0,1.0,0.0,0.0,1.0,0.0,1.0,1.0,1.0,1.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,1.0,1.0];
    var indices = [0,1,2,2,3,0,4,5,6,6,7,4,8,9,10,10,11,8,12,13,14,14,15,12,16,17,18,18,19,16,20,21,22,22,23,20];

    var vertexBuffer = new VVVV.Types.VertexBuffer(gl, vertices);
    vertexBuffer.create();
    vertexBuffer.setSubBuffer('POSITION', 3, vertices);
    vertexBuffer.setSubBuffer('TEXCOORD0', 2, texCoords);
    vertexBuffer.setSubBuffer('NORMAL', 3, normals);
    vertexBuffer.update();

    mesh = new VVVV.Types.Mesh(gl, vertexBuffer, indices);
    mesh.update(indices);

    meshOut.setValue(0, mesh);
    }
  }

VVVV.Nodes.Box.prototype = new Node();

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
  this.environments = ['browser'];

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
VVVV.Nodes.Sphere.prototype = new Node();


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
  this.environments = ['browser'];

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
VVVV.Nodes.Cylinder.prototype = new Node();


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
  this.environments = ['browser'];

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
VVVV.Nodes.BlendWebGLAdvanced.prototype = new Node();


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
  this.environments = ['browser'];

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
VVVV.Nodes.BlendWebGL.prototype = new Node();


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
  this.environments = ['browser'];

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
VVVV.Nodes.FillWebGL.prototype = new Node();


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
  this.environments = ['browser'];

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
VVVV.Nodes.ZWriteEnableWebGL.prototype = new Node();


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
  this.environments = ['browser'];

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
VVVV.Nodes.CullWebGL.prototype = new Node();


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
  this.environments = ['browser'];

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

  var configured_once = false;

  this.configure = function() {
    // add the pins which have already been added (by the patch XML) to the shaderPins array
    var defaultPins = ["Render State", "Mesh", "Transform", "Technique"];
    _(thatNode.inputPins).each(function(p) {
      if (shaderPins.indexOf(p)<0 && defaultPins.indexOf(p.pinname)<0) {
        p.unvalidated = true;
        shaderPins.push(p);
      }
    })

    if (configured_once)
      return;

    if (thatNode.parentPatch.executionContext.ShaderCodeResources[thatNode.shaderFile]==undefined) {
      thatNode.parentPatch.executionContext.ShaderCodeResources[thatNode.shaderFile] = new VVVV.Types.ShaderCodeResource();
      thatNode.parentPatch.executionContext.ShaderCodeResources[thatNode.shaderFile].addRelatedNode(thatNode);
      VVVVContext.loadFile(VVVV.Helpers.prepareFilePath(thatNode.shaderFile, thatNode.parentPatch), {
        success: function(response) {
          thatNode.parentPatch.executionContext.ShaderCodeResources[thatNode.shaderFile].setSourceCode(response);
        },
        error: function() {
          console.log('ERROR: Could not load shader file '+thatNode.shaderFile.replace('%VVVV%', VVVVContext.Root));
          VVVVContext.onNotImplemented('Could not load shader file '+thatNode.shaderFile.replace('%VVVV%', VVVVContext.Root));
        }
      });
    }
    else {
      thatNode.parentPatch.executionContext.ShaderCodeResources[thatNode.shaderFile].addRelatedNode(thatNode);
    }
    configured_once = true;

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
        if (thatNode.parentPatch.executionContext.ShaderCodeResources[thatNode.shaderFile].definingNode)
          thatNode.parentPatch.executionContext.ShaderCodeResources[thatNode.shaderFile].definingNode.showStatus('success', "Successfully compiled");
      }
      else {
        if (thatNode.parentPatch.executionContext.ShaderCodeResources[thatNode.shaderFile].definingNode)
          thatNode.parentPatch.executionContext.ShaderCodeResources[thatNode.shaderFile].definingNode.showStatus('error', shader.log);
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
      layers[j].mesh = meshIn.getValue(j);
      layers[j].shader = shader;
      _(shader.uniformSpecs).each(function(u) {
        layers[j].uniformNames.push(u.varname);
        layers[j].uniforms[u.varname] = { uniformSpec: u, value: undefined };
      });
    }
    if (meshIn.pinIsChanged()) {
      for (var j=0; j<maxSize; j++) {
      	layers[j].mesh = meshIn.getValue(j);
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
    if (thatNode.parentPatch.executionContext.ShaderCodeResources[thatNode.shaderFile].definingNode)
      thatNode.parentPatch.executionContext.ShaderCodeResources[thatNode.shaderFile].definingNode.openUIWindow();
  }


}
VVVV.Nodes.GenericShader.prototype = new Node();


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
  this.environments = ['browser'];

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
VVVV.Nodes.Quad.prototype = new Node();


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
  this.environments = ['browser'];

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
VVVV.Nodes.GridSegment.prototype = new Node();

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
  this.environments = ['browser'];

  var layerIns = [];
  var enableIn = this.addInputPin("Enabled", [1], VVVV.PinTypes.Value);
  var layerCountIn = this.addInvisiblePin("Layer Template Count", [2], VVVV.PinTypes.Value);

  var layerOut = this.addOutputPin("Layer", [], VVVV.PinTypes.WebGlResource);

  this.configure = function() {
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
VVVV.Nodes.Group.prototype = new Node();


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
  this.environments = ['browser'];

  this.addInputPin("Layers", [], VVVV.PinTypes.WebGlResource);
  var clearIn = this.addInputPin("Clear", [1], VVVV.PinTypes.Value);
  var antialiasIn = this.addInputPin("Antialiasing", [0], VVVV.PinTypes.Value);
  var bgColIn = this.addInputPin("Background Color", [new VVVV.Types.Color("0.0, 0.0, 0.0, 1.0")], VVVV.PinTypes.Color);
  var bufferWidthIn = this.addInputPin("Backbuffer Width", [0], VVVV.PinTypes.Value);
  var bufferHeightIn = this.addInputPin("Backbuffer Height", [0], VVVV.PinTypes.Value);
  var parentIn = this.addInputPin("Parent Element", [], VVVV.PinTypes.HTMLLayer);
  var viewIn = this.addInputPin("View", [], VVVV.PinTypes.Transform);
  var projIn = this.addInputPin("Projection", [], VVVV.PinTypes.Transform);

  var enableDepthBufIn = this.addInvisiblePin("Windowed Depthbuffer Format", ['NONE'], VVVV.PinTypes.Enum);
  enableDepthBufIn.enumOptions = ['NONE', 'DX16'];

  var bufferWidthOut = this.addOutputPin("Actual Backbuffer Width", [0.0], VVVV.PinTypes.Value);
  var bufferHeightOut = this.addOutputPin("Actual Backbuffer Height", [0.0], VVVV.PinTypes.Value);
  var ex9Out = this.addOutputPin("EX9 Out", [], VVVV.PinTypes.WebGlResource);
  var layerOut = this.addOutputPin("Element Out", [], VVVV.PinTypes.HTMLLayer);
  var antialiasOut = this.addOutputPin("Antialias", ["?"], VVVV.PinTypes.String);
  //var outputDepth = this.addOutputPin("Depth Texture", [], VVVV.PinTypes.WebGlTexture);


  var width = 0.0;
  var height = 0.0;

  var pMatrix;
  var vMatrix;
  var vpMatrix;
  var wvMatrix = glMatrix.mat4.create();
  var wvpMatrix = glMatrix.mat4.create();

  var canvas;
  this.ctxt = undefined;              // the renderer's active context. might be the canvas context, or the context of a connected downstream renderer
  var canvasCtxt = undefined;         // the context of the canvas which is connected to the renderer
  var gl;                             // just a convenience variable for keeping the lines short
  var targetElement;
  var htmlLayer;
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
    targetElement = $(selector).get(0);
    if (!targetElement || targetElement.nodeName!='CANVAS') {
      var w = parseInt(bufferWidthIn.getValue(0));
      var h = parseInt(bufferHeightIn.getValue(0));
      w = w > 0 ? w : 512;
      h = h > 0 ? h : 512;
      id = 'vvvv-js-generated-renderer-'+(new Date().getTime());
      htmlLayer = new VVVV.Types.HTMLLayer('canvas');
      htmlLayer.setAttribute('width', w);
      htmlLayer.setAttribute('height', h);
      htmlLayer.setAttribute('id', id);
      htmlLayer.setAttribute('class', 'vvvv-js-generated-renderer');
      if (!targetElement) {
        if (parentIn.isConnected() && parentIn.getValue(0))
          targetElement = parentIn.getValue(0).element;
        else
          targetElement = 'body';
      }
      $(targetElement).append(htmlLayer.element);
      canvas = htmlLayer.element;
    }
    else
      canvas = $(targetElement);

    if (!canvas)
      return;

    layerOut.setValue(0, htmlLayer);

    attachMouseEvents();

    try {
      canvasCtxt = canvas.get(0).getContext("experimental-webgl", {preserveDrawingBuffer: true,antialias: true});
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
    antialiasIn.markPinAsChanged();
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

    if (this.invisiblePins["Descriptive Name"].pinIsChanged() || (parentIn.pinIsChanged() && parentIn.getValue(0).element!=targetElement) || this.contextChanged) {
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
      //ANTIALIASING STATUS
      var antialiasstatus = gl.getContextAttributes().antialias;
    antialiasOut.setValue(0, antialiasstatus);
    }
    else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    if (this.contextChanged || bgColIn.pinIsChanged()) {
      var col = bgColIn.getValue(0);
      gl.clearColor(col.rgba[0], col.rgba[1], col.rgba[2], col.rgba[3]);
    }

    if (this.contextChanged || antialiasIn.pinIsChanged()) {
      var aa = antialiasIn.getValue(0);
      if (aa==0)
        var antialiasb = false
      else
        var antialiasb = true

        $(canvasCtxt.canvas).attr('antialias', antialiasb)
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
        pMatrix = glMatrix.mat4.create();
        glMatrix.mat4.set(projIn.getValue(0), pMatrix);
        glMatrix.mat4.scale(pMatrix, [1, 1, -1]);
      }
      else {
        pMatrix = glMatrix.mat4.create();
        glMatrix.mat4.ortho(-1, 1, -1, 1, -100, 100, pMatrix);
        glMatrix.mat4.scale(pMatrix, [1, 1, -1]);
      }
      if (this.renderContexts && this.renderContexts[0]) // flip the output texture, if connected to downstream renderer
        glMatrix.mat4.scale(pMatrix, [1, -1, 1]);
      vpMatrix = glMatrix.mat4.create();
    }
    if (viewIn.pinIsChanged()) {
      vMatrix = viewIn.getValue(0);
    }
    if (viewIn.pinIsChanged() || projIn.pinIsChanged()) {
      glMatrix.mat4.multiply(pMatrix, vMatrix, vpMatrix);
    }

    if (this.contextChanged) { // don't render anything, if the context changed in this frame. will only give warnings...
      this.contextChanged = false;
      return
    }

    function getExtension(gl, name){
            var vendorPrefixes = ["", "WEBKIT_", "MOZ_"];
            var i, ext;
            for(i in vendorPrefixes) {
                ext = gl.getExtension(vendorPrefixes[i] + name);
                if (ext) {
                    return ext;

                }
            }
            return null;

        }

    gl.getExtension('OES_standard_derivatives');
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

        if(layer.mesh.instanced == false){
          gl.bindBuffer(gl.ARRAY_BUFFER, layer.mesh.vertexBuffer.vbo);
          _(layer.mesh.vertexBuffer.subBuffers).each(function(b) {
            if (!layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]] || layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]].position==-1)
              return;
            gl.enableVertexAttribArray(layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]].position);
            gl.vertexAttribPointer(layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]].position, b.size, gl.FLOAT, false, 0, b.offset);
          });

          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, layer.mesh.indexBuffer);
        }
        if(layer.mesh.instanced == true){ //Instancing
           //console.log("entering instancing, VertexCount: " + layer.mesh.Buffer1.length);

            gl.bindBuffer(gl.ARRAY_BUFFER, layer.mesh.vertexBuffer.vbo);
          _(layer.mesh.vertexBuffer.subBuffers).each(function(b) {
            if (!layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]] || layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]].position==-1)
              return;
            gl.enableVertexAttribArray(layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]].position);
            gl.vertexAttribPointer(layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]].position, b.size, gl.FLOAT, false, 0, b.offset);
          });
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, layer.mesh.indexBuffer);
          //getExtension and instancing by Brandon Jones http://blog.tojicode.com/2013/07/webgl-instancing-with.html



           this.instanceExt = getExtension(gl, "ANGLE_instanced_arrays");
                    if(!this.instanceExt) {
                        var customControls = document.getElementById("body");
                        customControls.classList.add("error");
                        customControls.innerHTML = "ANGLE_instanced_arrays not supported by this browser";
                        this.instanceCheck = null;
                    } else {
                        this.instanceCheck = document.getElementById("hardwareInstancing");
                    }

             //console.log(JSON.stringify(layer.mesh.semantics));
           //console.log(JSON.stringify(layer.shader.attributeSpecs));
//           console.log(JSON.stringify(layer.shader.uniformSpecs));
           //console.log(JSON.stringify(layer.shader.attribSemanticMap));
//           console.log(JSON.stringify(layer.shader.uniformSemanticMap));
//           console.log(JSON.stringify(layer.mesh.Buffer1));
//           console.log(JSON.stringify(layer.mesh.Buffer2));
//           console.log(JSON.stringify(layer.mesh.instanceCount));

//           var OffsetBuffer;
//           OffsetBuffer = gl.createBuffer();
//                    gl.bindBuffer(gl.ARRAY_BUFFER, OffsetBuffer);
//                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(layer.mesh.Buffer1), gl.STATIC_DRAW);
         for (var i=0; i<layer.mesh.semantics.length; i++) {
           var semantic = layer.mesh.semantics[i];
           gl.bindBuffer(gl.ARRAY_BUFFER, layer.mesh.instanceBuffers[i]);
           gl.enableVertexAttribArray(layer.shader.attributeSpecs[semantic].position);
           gl.vertexAttribPointer(layer.shader.attributeSpecs[semantic].position, layer.mesh.VectorSize[i], gl.FLOAT, false, 0, 0);  //stride can be 12 or 0
           this.instanceExt.vertexAttribDivisorANGLE(layer.shader.attributeSpecs[semantic].position, layer.mesh.Divisor[i]);
        }

            } //end if case of instanced

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
        if(layer.mesh.instanced == true){
            this.instanceExt.drawElementsInstancedANGLE(gl[renderState.polygonDrawMode], layer.mesh.numIndices, gl.UNSIGNED_SHORT, 0, layer.mesh.instanceCount);
        }
        else{
            gl.drawElements(gl[renderState.polygonDrawMode], layer.mesh.numIndices, gl.UNSIGNED_SHORT, 0);
        }

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


//    this.depthExt = getExtension(gl, "WEBGL_depth_texture");
//                    if(!this.depthExt) {
//                        var customControls = document.getElementById("customControls");
//                        customControls.classList.add("error");
//                        customControls.innerHTML = "WEBGL_depth_texture not supported by this browser";
//                    }
//
//
//
//    outputDepth.setValue(0, null);


    this.contextChanged = false;
  }

}
VVVV.Nodes.RendererWebGL.prototype = new Node();


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
  this.environments = ['browser'];

  this.auto_evaluate = false;

  var nameIn = this.addInvisiblePin("Effect Descriptor", [''], VVVV.PinTypes.String);
  var sourceCodeIn = this.addInvisiblePin("Source Code", ['#ifdef GL_ES\nprecision mediump float;\n#endif\n\nuniform mat4 tW : WORLD;\nuniform mat4 tV : VIEW;\nuniform mat4 tP : PROJECTION;\n\nuniform vec4 Color : COLOR = {1.0, 1.0, 1.0, 1.0};\nuniform sampler2D Texture;\nuniform mat4 Texture_Transform;\nuniform float Alpha = 1.0;\n\nvarying vec2 vs2psTexCd;\n\nvertex_shader:\n\nattribute vec3 PosO : POSITION;\nattribute vec2 TexCd : TEXCOORD0;\n\nvoid main(void) {\n  gl_Position = tP * tV * tW * vec4(PosO, 1.0);\n  vs2psTexCd = (Texture_Transform * vec4(TexCd, 0, 1)).xy;\n}\n\n\nfragment_shader:\n\nvoid main(void) {\n  gl_FragColor = Color * texture2D(Texture, vs2psTexCd) * vec4(1.0, 1.0, 1.0, Alpha);\n}'], VVVV.PinTypes.String);

  var currentName = '';
  var w; // the UI window
  var thatNode = this;

  this.configure = function() {
    if (nameIn.getValue(0)!='') {
      if (nameIn.pinIsChanged()) {
        var descriptor = nameIn.getValue(0);
        if (descriptor=='')
          return;
        if (currentName=='') { // if is set for the first time
          if (thatNode.parentPatch.executionContext.ShaderCodeResources["./"+descriptor+'.vvvvjs.fx']==undefined)
            thatNode.parentPatch.executionContext.ShaderCodeResources["./"+descriptor+'.vvvvjs.fx'] = new VVVV.Types.ShaderCodeResource();
        }
        else
          thatNode.parentPatch.executionContext.ShaderCodeResources["./"+descriptor+'.vvvvjs.fx'] = thatNode.parentPatch.executionContext.ShaderCodeResources[currentName];
        currentName = "./"+descriptor+'.vvvvjs.fx';
        thatNode.parentPatch.executionContext.ShaderCodeResources[currentName].definingNode = this;
        thatNode.parentPatch.executionContext.ShaderCodeResources[currentName].setSourceCode(sourceCodeIn.getValue(0));
        if (w)
          $('#path', w.document).text((this.parentPatch.nodename || 'root')+' / '+(currentName!='' ? currentName : 'Untitled'));
      }

      if (sourceCodeIn.pinIsChanged()) {
        if (thatNode.parentPatch.executionContext.ShaderCodeResources[currentName])
          thatNode.parentPatch.executionContext.ShaderCodeResources[currentName].setSourceCode(sourceCodeIn.getValue(0));
      }
    }
  }

  this.evaluate = function() {
    // nix
  }

  this.openUIWindow = function() {
    w = window.open(location.protocol+'//'+location.host+(VVVVContext.Root[0]=='/' ? '' : location.pathname.replace(/\/[^\/]*$/, '')+'/')+VVVVContext.Root+"/code_editor.html", currentName+" / VVVV.js Effect Editor", "location=no, width=800, height=800, toolbar=no");
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
        //sourceCodeIn.setValue(0, $('textarea', w.document).val());
        var cmd = {syncmode: 'diff', nodes: {}, links: []};
        cmd.nodes[thatNode.id] = {pins: {}};
        cmd.nodes[thatNode.id].pins['Source Code'] = {values: [$('textarea', w.document).val()]};
        thatNode.parentPatch.editor.update(thatNode.parentPatch, cmd);
        if (thatNode.parentPatch.executionContext.ShaderCodeResources[currentName].relatedNodes.length>0) {
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
VVVV.Nodes.DefineEffect.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: GeometryFile (WebGl Geometry)
 Author(s): David Gann

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GeometryFile = function(id, graph) {
  this.constructor(id, "GeometryFile (WebGl Geometry)", graph);

  this.auto_nil = false;

  this.meta = {
    authors: ['David Gann'],
    original_authors: ['David Gann'],
    credits: [],
    compatibility_issues: []
  };


  var filenamePin = this.addInputPin("FileName", ["http://localhost"], VVVV.PinTypes.String);
  var ScaleIn = this.addInputPin("Scale", [1.0], VVVV.PinTypes.Value);

  var meshOut = this.addOutputPin("Mesh", [], VVVV.PinTypes.WebGlResource);
  var LoadedOut = this.addOutputPin("Has Loaded", [0.0], VVVV.PinTypes.Value);

  var mesh = null;
  var vertexBuffer = null;

  //temp
  var generateNormals = (function() {
    var a = glMatrix.vec3.create();
    var b = glMatrix.vec3.create();
    var c = glMatrix.vec3.create();

    var ab = glMatrix.vec3.create();
    var ac = glMatrix.vec3.create();
    var n = glMatrix.vec3.create();

    function getVec3FromIndex(out, vecArray, stride, offset, index) {
      out[0] = vecArray[(index*stride)+offset];
      out[1] = vecArray[(index*stride)+offset+1];
      out[2] = vecArray[(index*stride)+offset+2];
    }

    function setVec3AtIndex(v, vecArray, stride, offset, index) {
      vecArray[(index*stride)+offset] = v[0];
      vecArray[(index*stride)+offset+1] = v[1];
      vecArray[(index*stride)+offset+2] = v[2];
    }

    return function(vertexArray, stride, offset, count, indexArray) {
      var normalArray = new Float32Array(3 * count);

      var i, j;
      var idx0, idx1, idx2;
      var indexCount = indexArray.length;
      for(i = 0; i < indexCount; i+=3) {
        idx0 = indexArray[i];
        idx1 = indexArray[i+1];
        idx2 = indexArray[i+2];

        getVec3FromIndex(a, vertexArray, stride, offset, idx0);
        getVec3FromIndex(b, vertexArray, stride, offset, idx1);
        getVec3FromIndex(c, vertexArray, stride, offset, idx2);

        // Generate the normal
        glMatrix.vec3.subtract(b, a, ab);
        glMatrix.vec3.subtract(c, a, ac);
        glMatrix.vec3.cross(ab, ac, n);

        normalArray[(idx0 * 3)] += n[0];
        normalArray[(idx0 * 3)+1] += n[1];
        normalArray[(idx0 * 3)+2] += n[2];

        normalArray[(idx1 * 3)] += n[0];
        normalArray[(idx1 * 3)+1] += n[1];
        normalArray[(idx1 * 3)+2] += n[2];

        normalArray[(idx2 * 3)] += n[0];
        normalArray[(idx2 * 3)+1] += n[1];
        normalArray[(idx2 * 3)+2] += n[2];
      }

      for(i = 0; i < count; ++i) {
        getVec3FromIndex(n, normalArray, 3, 0, i);
        glMatrix.vec3.normalize(n, n);
        setVec3AtIndex(n, normalArray, 3, 0, i);
      }

      return normalArray;
    };
  })();

  var HasLoaded = 0;
   var prevFilenames = [];
   var filename = [];
   var xhr = [];

  this.evaluate = function() {
    var scale = ScaleIn.getValue(0);

    if (filenamePin.pinIsChanged() | ScaleIn.pinIsChanged()){
      this.initialize();}

    if (!this.renderContexts) return;
       var gl = this.renderContexts[0];
    if (!gl)
      return;

      for (var i=0; i<filenamePin.getSliceCount(); i++) {
            if (prevFilenames[i] != filenamePin.getValue(i) | HasLoaded[i] == 0 | ScaleIn.pinIsChanged()) {
                filename[i] = VVVV.Helpers.prepareFilePath(filenamePin.getValue(i), this.parentPatch);

                LoadedOut.setValue(i, 0);
                (function(i) {
                  xhr[i] = new XMLHttpRequest();
                  //xhr[i].responseType = 'arraybuffer';
                  xhr[i].open("GET", filename[i], true);
                  xhr[i].onreadystatechange = function (oEvent) {
                     if (xhr[i].readyState === 4) {
                        if (xhr[i].status === 200) {
                          var data = JSON.parse(xhr[i].responseText);
                            var positionData = data.buffer;
                            var posMapped = positionData.map(function(x) { return x * scale; });
                            var texCoords0 = [0,0];  //missing texturecoordinates
                            var indexData = data.indices;

                            var PosTyped = new Float32Array(posMapped);
                            var normalData = generateNormals(PosTyped, 3, 0, positionData.length/3, indexData);

                              vertexBuffer = new VVVV.Types.VertexBuffer(gl, posMapped);
                              vertexBuffer.create();
                              vertexBuffer.setSubBuffer('POSITION', 3, posMapped);
                              vertexBuffer.setSubBuffer('TEXCOORD0', 2, texCoords0);
                              vertexBuffer.setSubBufferTyped('NORMAL', 3, normalData);
                              vertexBuffer.update();

                              mesh = new VVVV.Types.Mesh(gl, vertexBuffer, indexData);
                              mesh.update(indexData);
                              meshOut.setValue(i, mesh);
                              HasLoaded[i]=1;
                              LoadedOut.setValue(i, 1);
                        } else {
                          console.log("Error", xhr[i].status);
                                meshOut.setValue(i, undefined);
                                delete mesh;
                        }
                     }
                  };
                  xhr[i].send(null);
               })(i);
             }
             prevFilenames[i] = filenamePin.getValue(i);

        }   //end of inner for loop

    this.contextChanged = false;
     }
  }



VVVV.Nodes.GeometryFile.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Instancer (WebGl Geometry Dynamic)
 Author(s): David Gann

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.InstancerDynamic = function(id, graph) {
  this.constructor(id, "Instancer (WebGl Geometry Dynamic)", graph);

  this.auto_nil = false;

  this.meta = {
    authors: ['David Gann'],
    original_authors: ['David Gann'],
    credits: [],
    compatibility_issues: []
  };

  var meshIn = this.addInputPin("Geometry", [], VVVV.PinTypes.WebGlResource);
  var BufferIn = [];
  var CountIn = this.addInputPin("Count", [1.0], VVVV.PinTypes.Value);
  var ApplyIn = this.addInputPin("Apply", [0.0], VVVV.PinTypes.Value);
  var SemanticIn = this.addInputPin("Semantic", ["offset"], VVVV.PinTypes.String);
  var DivisorIn = this.addInputPin("InstanceDivisor", [1.0], VVVV.PinTypes.Value);
  var cntCfg = this.addInvisiblePin("Input Count",[1],VVVV.PinTypes.Value);

  this.configure = function() {
    var inputCount = Math.max(1, cntCfg.getValue(0));
    VVVV.Helpers.dynamicPins(this, BufferIn, inputCount, function(i) {
      return this.addInputPin('Buffer '+(i+1), [], VVVV.PinTypes.SceneBuffer);
    })
  }


  var meshOut = this.addOutputPin("Mesh", [], VVVV.PinTypes.WebGlResource);

    var Geometry = null;
    var Buffers = [];
    var MeshWasConnected = 0;
    var vecSize = [];
    var semanticsArray = [];
    var divisorArray = [];


  this.evaluate = function() {

    var geometryCount = meshIn.getSliceCount();
    var bufferCount = BufferIn.length;
    if (!this.renderContexts) return;
       var gl = this.renderContexts[0];
    if (!gl)
      return;

    if (cntCfg.pinIsChanged()){
        this.initialize();
      }

    if(MeshWasConnected == false && meshIn.isConnected()){
    var MeshNewlyConnected = true;
    }

    if (cntCfg.pinIsChanged() || MeshNewlyConnected || meshIn.pinIsChanged()){
        this.initialize();

    for(var j=0; j<geometryCount; j++){
            Geometry = meshIn.getValue(j%geometryCount);
            Geometry.addInstanceBuffers(bufferCount);
        }
      }

  //var maxCount = Math.max(geometryCount, bufferCount);

  if(ApplyIn.getValue(0)==1 && meshIn.isConnected()){

  for (var j=0; j<BufferIn.length; j++) {
                 vecSize[j] = BufferIn[j].getValue(j).VectorSize;
                 semanticsArray[j] = SemanticIn.getValue(j%SemanticIn.getSliceCount());
                 Buffers[j] = BufferIn[j].getValue(j);
                 divisorArray[j] = DivisorIn.getValue(j%DivisorIn.getSliceCount());

                }
    //
  for(var i=0; i<geometryCount; i++){
                    Geometry = meshIn.getValue(i%geometryCount);
                    Geometry.instanced = true;
                    Geometry.instanceCount = CountIn.getValue(i%CountIn.getSliceCount());
                    //Geometry.Buffer1 = objectBuffer.data; //new Float32Array(offsetData);
                    Geometry.updateInstancedArray(Buffers);
                    Geometry.addSemantics(semanticsArray);
                    Geometry.addVectorSize(vecSize);
                    Geometry.addDivisor(divisorArray);
                    //console.log("updatedBuffer");
                    Geometry.instancedBufferChanged = true;
        meshOut.setValue(i, Geometry);
        }   //end of inner for loop
    }
    MeshWasConnected = meshIn.isConnected();
    this.contextChanged = false;
     }
  }
VVVV.Nodes.InstancerDynamic.prototype = new Node();


});
