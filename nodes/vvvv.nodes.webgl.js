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
  "%VVVV%/effects/BillBoard_Particles.vvvvjs.fx": undefined,
  "%VVVV%/effects/BotanyInstanced.vvvvjs.fx": undefined,
  "%VVVV%/effects/ParallaxOcclusionMapping.vvvvjs.fx": undefined,
  "%VVVV%/effects/SSAO.vvvvjs.fx": undefined,
  "%VVVV%/effects/PCF_Shadow.vvvvjs.fx": undefined,
  "%VVVV%/effects/CookTorrance_AO.vvvvjs.fx": undefined,
  "%VVVV%/effects/FXAA.vvvvjs.fx": undefined,
  "%VVVV%/effects/CookTorrance_Displacement_TriplanarFBM.vvvvjs.fx": undefined,
  "%VVVV%/effects/PBR_POM_FBM_MultiTex.vvvvjs.fx": undefined,
  "%VVVV%/effects/Skybox.vvvvjs.fx": undefined,
  "%VVVV%/effects/PhysicalBased_Atlas_MultiTex.vvvvjs.fx": undefined,
  "%VVVV%/effects/Constant_Instanced.vvvvjs.fx": undefined,
  "%VVVV%/effects/Deffered_FX.vvvvjs.fx": undefined,
  "%VVVV%/effects/PBR_glTF.vvvvjs.fx": undefined,
  "%VVVV%/effects/PBR_glTF_static.vvvvjs.fx": undefined,
  "%VVVV%/effects/BillBoard_Particles_Noise.vvvvjs.fx": undefined,
  "%VVVV%/effects/HBAO.vvvvjs.fx": undefined, 
  "%VVVV%/effects/SpriteSheet.vvvvjs.fx": undefined
  






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
VVVV.Types.VertexBuffer = function(gl) {

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
  this.setSubBufferTypedStride = function(u, s, d, st ) {
    this.subBuffers[u] = {
      usage: u,
      data: d,
      size: s,
      offset: this.length,
      stride: st
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

  this.updateTyped =function(indices) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW);
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
  this.isUint32 = false;

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
    //console.log(JSON.stringify(thatShader.attributeSpecs));




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
    authors: ['Matthias Zauner, David Gann'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Always loads in background', 'No reload pin', 'No preload pin (preloading handled by browser)', 'No up and running pin', 'No texture info outputs']
  };

  this.auto_evaluate = false;
  this.environments = ['browser'];

  var filenamePin = this.addInputPin("Filename", [""], VVVV.PinTypes.String);
  var typeIn = this.addInputPin("Type", ["Texture"], VVVV.PinTypes.Enum);
  var Apply= this.addInputPin('Apply', [1], VVVV.PinTypes.Value);
  var outputPin = this.addOutputPin("Texture Out", [], VVVV.PinTypes.WebGlTexture);


  typeIn.enumOptions = ["Texture", "Cube Texture", "Cube Texture Flip Y"];

  var textures = [];
  var prevFilenames = [];//only load new files

    function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

  this.evaluate = function() {

    if (!this.renderContexts) return;
    var gl = this.renderContexts[0];

    if (!gl)
      return;

    //if (Apply.getValue(0) != 1)
    //  return;


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
        if(prevFilenames[i]!=filenames[i]){  //prevFilenames[i]!=filenames[i]//by loading only when filename actualy changes performance increase and dynamic texture loading possible
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
              //if (textures[i] =! undefined && isPowerOf2(textures[i].image.width) && isPowerOf2(textures[i].image.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
              //}else{
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
               //}
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
                //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); //test
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                ctx.restore();
              }
              gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
              $texcanvas.remove();
              outputPin.setValue(j, textures[j]);
            }
          })(i);
          textures[i].image.src = filename;
        }
        else if (type=="Cube Texture Flip Y") {
          textures[i].image = new Image();
          textures[i].image.onload = (function(j) {
            return function() {
              var faces = [
                {face: gl.TEXTURE_CUBE_MAP_POSITIVE_X, offset: [2, 1]},
                {face: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, offset: [0, 1]},
                {face: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, offset: [1, 0]},
                {face: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, offset: [1, 2]},
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
                //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); //test
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
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
 NODE: TextureLoader (WebGL)
 Author(s): David Gann
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.TextureLoader = function(id, graph) {
  this.constructor(id, "TextureLoader (WebGL)", graph);

  this.auto_nil = false;

  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: ['Always loads in background', 'No reload pin', 'No preload pin (preloading handled by browser)', 'No up and running pin', 'No texture info outputs']
  };

  this.auto_evaluate = false;
  this.environments = ['browser'];

  var filenamePin = this.addInputPin("Filename", [""], VVVV.PinTypes.String);
  var typeIn = this.addInputPin("Type", ["Texture"], VVVV.PinTypes.Enum);
  var Apply= this.addInputPin('Apply', [1], VVVV.PinTypes.Value);
  var outputPin = this.addOutputPin("Texture Out", [], VVVV.PinTypes.WebGlTexture);


  typeIn.enumOptions = ["Texture", "Cube Texture", "Cube Texture Flip Y"];



  var textures = [];


  this.evaluate = function() {

    if (!this.renderContexts){ console.log("context lost");return;}
    var gl = this.renderContexts[0];

    if (!gl){ console.log("no gl");return;}

  if (Apply.getValue(0) != 1.0) return;

  if (this.contextChanged) {
      for (var i=0; i<textures.length; i++) {
        textures[i].context.deleteTexture(textures[i]);
      }
      textures = [];
    }

  var filename = VVVV.Helpers.prepareFilePath(filenamePin.getValue(0), this.parentPatch);
        if (filename.indexOf('http://')===0 && VVVV.ImageProxyPrefix!==undefined)
          filename = VVVV.ImageProxyPrefix+encodeURI(filename);

// Create a texture.
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);

// Fill the texture with a 1x1 blue pixel.
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 0, 255, 255]));

// Asynchronously load an image
var image = new Image();
image.src = filename;
image.addEventListener('load', function() {
  // Now that the image has loaded make copy it to the texture.
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
});

  outputPin.setValue(0, texture);

  this.destroy = function() {
    for (var i=0; i<textures.length; i++) {
      textures[i].context.deleteTexture(textures[i]);
    }
  }


}
}
VVVV.Nodes.TextureLoader.prototype = new Node();

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
  var Update= this.addInputPin('Update', [1], VVVV.PinTypes.Value);
  var outputOut = this.addOutputPin("Texture Out", [], VVVV.PinTypes.WebGlTexture);



  var texture;
  var warningIssued = false;

  this.evaluate = function() {
    if (Update.getValue(0) != 1) return;
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
        vertexBuffer = new VVVV.Types.VertexBuffer(gl);
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

    var vertexBuffer = new VVVV.Types.VertexBuffer(gl);
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

    var vertexBuffer = new VVVV.Types.VertexBuffer(gl);
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

    var vertexBuffer = new VVVV.Types.VertexBuffer(gl);
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

    var vertexBuffer = new VVVV.Types.VertexBuffer(gl);
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
  var VSDefinesIn = this.addInputPin("VS Defines", [''], VVVV.PinTypes.String);
  var PSDefinesIn = this.addInputPin("PS Defines", [''], VVVV.PinTypes.String);
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
    var defaultPins = ["Render State", "Mesh", "Transform", "Technique", "VS Defines","PS Defines" ];
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
    vertexShaderCode = VSDefinesIn.getValue(0) + vertexShaderCode;
    if ((match = psRegEx.exec(shaderCode+'\nfragment_shader'))==undefined) {
      console.log('ERROR: No fragment shader code for technique '+technique+' found');
      return;
    }
    var fragmentShaderCode = match[4];
    fragmentShaderCode = VSDefinesIn.getValue(0) + fragmentShaderCode;
    shader.setFragmentShader(varDefs+fragmentShaderCode);
    shader.setVertexShader(varDefs+vertexShaderCode);
    //console.log(vertexShaderCode);
    //console.log(fragmentShaderCode);
    //console.log("shader " + shader.vertexShaderCode);
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

      var vertexBuffer = new VVVV.Types.VertexBuffer(gl);
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

      var vertexBuffer = new VVVV.Types.VertexBuffer(gl);
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
  var depthOut = this.addOutputPin("Depth Out", [], VVVV.PinTypes.WebGlResource);


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
  var depthTexture;

  function defined(value) {
    return value !== undefined && value !== null;
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

    this.depthExt = getExtension(gl, "WEBGL_depth_texture");
                    if(!this.depthExt) {
                        console.log("WEBGL_depth_texture not supported")
                    }

    this.floatExt = getExtension(gl, "OES_texture_float");
                    if(!this.depthExt) {
                        console.log("OES_texture_float not supported")
                    }
    this.floatExt = getExtension(gl, "OES_texture_float_linear");
                    if(!this.depthExt) {
                        console.log("OES_texture_float_linear not supported")
                    }
    this.floatExt = getExtension(gl, "OES_element_index_uint");
                    if(!this.depthExt) {
                        console.log("OES_element_index_uint not supported")
                    }



      bbufFramebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, bbufFramebuffer);
      bbufFramebuffer.width = canvas.get(0).width;
      bbufFramebuffer.height = canvas.get(0).height;

      bbufTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, bbufTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);

      //verify color attachements against https://www.khronos.org/registry/webgl/sdk/tests/extra/webgl-info.html
      // for mobile devices support

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, bbufFramebuffer.width, bbufFramebuffer.height, 0, gl.RGBA, gl.FLOAT, null);  //gl.UNSIGNED_SHORT_4_4_4_4
      gl.generateMipmap(gl.TEXTURE_2D);

//      var renderbuffer = gl.createRenderbuffer();
//      gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
//      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, bbufFramebuffer.width, bbufFramebuffer.height);

        // Create the depth texture / Replaces the above code for depth test
        depthTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, bbufFramebuffer.width, bbufFramebuffer.height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);



      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, bbufTexture, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
      //gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

      //gl.bindTexture(gl.TEXTURE_2D, null);
      //gl.bindRenderbuffer(gl.RENDERBUFFER, null);
      //gl.bindFramebuffer(gl.FRAMEBUFFER, null);





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

    gl.getExtension('OES_standard_derivatives');

    this.instanceExt = getExtension(gl, "ANGLE_instanced_arrays");
         if(!this.instanceExt) {
             var customControls = document.getElementById("body");
             customControls.classList.add("error");
             customControls.innerHTML = "ANGLE_instanced_arrays not supported by this browser";
             this.instanceCheck = null;
         } else {
             this.instanceCheck = document.getElementById("hardwareInstancing");
         }

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
        gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
    }

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
        var isInstanced = defined(layer.mesh.instanced) ? layer.mesh.instanced : false;

        if (layer.mesh != currentMesh || layer.shader.shaderProgram != currentShaderProgram) {
        if(isInstanced == false){
          gl.bindBuffer(gl.ARRAY_BUFFER, layer.mesh.vertexBuffer.vbo);
          _(layer.mesh.vertexBuffer.subBuffers).each(function(b) {
            if (!layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]] || layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]].position==-1)
              return;
            gl.enableVertexAttribArray(layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]].position);
            gl.vertexAttribPointer(layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]].position, b.size, gl.FLOAT, false, b.stride, b.offset);
          });
         gl.bindBuffer(gl.ARRAY_BUFFER, null);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, layer.mesh.indexBuffer);

        }
        if(isInstanced == true){ //Instancing

            gl.bindBuffer(gl.ARRAY_BUFFER, layer.mesh.vertexBuffer.vbo);
            _(layer.mesh.vertexBuffer.subBuffers).each(function(b) {
              if (!layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]] || layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]].position==-1)
                return;
              gl.enableVertexAttribArray(layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]].position);
              gl.vertexAttribPointer(layer.shader.attributeSpecs[layer.shader.attribSemanticMap[b.usage]].position, b.size, gl.FLOAT, false, b.stride, b.offset);
            });
            gl.bindBuffer(gl.ARRAY_BUFFER, null);


//quick access to shader attribute and uniform debugging
//           console.log(JSON.stringify(layer.mesh.semantics));
//           console.log(JSON.stringify(layer.shader.attributeSpecs));
//           console.log(JSON.stringify(layer.shader.uniformSpecs));
//           console.log(JSON.stringify(layer.shader.attribSemanticMap));
//           console.log(JSON.stringify(layer.shader.uniformSemanticMap));
//           console.log(JSON.stringify(layer.mesh.Buffer1));
//           console.log(JSON.stringify(layer.mesh.Buffer2));
//           console.log(JSON.stringify(layer.mesh.instanceCount));

            for (var i=0; i<layer.mesh.semantics.length; i++) {
               var semantic = layer.mesh.semantics[i];
               gl.bindBuffer(gl.ARRAY_BUFFER, layer.mesh.instanceBuffers[i]);
               gl.enableVertexAttribArray(layer.shader.attributeSpecs[semantic].position);
               gl.vertexAttribPointer(layer.shader.attributeSpecs[semantic].position, layer.mesh.VectorSize[i], gl.FLOAT, false, 0, 0);  //stride can be 12 or 0
               this.instanceExt.vertexAttribDivisorANGLE(layer.shader.attributeSpecs[semantic].position, layer.mesh.Divisor[i]);
                gl.bindBuffer(gl.ARRAY_BUFFER, null);
            }

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, layer.mesh.indexBuffer);

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
        if(isInstanced == true){
            this.instanceExt.drawElementsInstancedANGLE(gl[renderState.polygonDrawMode], layer.mesh.numIndices, gl.UNSIGNED_SHORT, 0, layer.mesh.instanceCount);
        }
        else{
            if(layer.mesh.isUint32 == true){

            var ext = gl.getExtension('OES_element_index_uint');
            gl.drawElements(gl[renderState.polygonDrawMode], layer.mesh.numIndices, gl.UNSIGNED_INT, 0);
            }else{
            gl.drawElements(gl[renderState.polygonDrawMode], layer.mesh.numIndices, gl.UNSIGNED_SHORT, 0);
            }
        }

        // save current states
        currentShaderProgram = layer.shader.shaderProgram;
        currentRenderState = renderState;
        currentMesh = layer.mesh;

        //gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
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
    depthOut.setValue(0, depthTexture);


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
  var typeIn = this.addInputPin("Type", ['vvvv json'], VVVV.PinTypes.Enum);
  typeIn.enumOptions = ['vvvv json', 'three.js json' ];
  var GenerateNormals = this.addInputPin("Generate Normals", [1.0], VVVV.PinTypes.Value);
  var Apply= this.addInputPin('Apply', [1], VVVV.PinTypes.Value);

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
    if (Apply.getValue(0) != 1)
      return;

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
                        if(typeIn.getValue(i)=='vvvv json'){
                            var positionData = data.buffer;
                            var posMapped = positionData.map(function(x) { return x * scale; });
                            var texCoords0 = [0,0];  //missing texturecoordinates
                            var indexData = data.indices;
                            var PosTyped = new Float32Array(posMapped);
                            var normalData = generateNormals(PosTyped, 3, 0, positionData.length/3, indexData);

                            vertexBuffer = new VVVV.Types.VertexBuffer(gl);
                            vertexBuffer.create();
                            vertexBuffer.setSubBuffer('POSITION', 3, posMapped);
                            vertexBuffer.setSubBuffer('TEXCOORD0', 2, texCoords0);
                            vertexBuffer.setSubBufferTyped('NORMAL', 3, normalData);
                    }
                    ///////////////////////////////Three.js json from blender exporter
                        if(typeIn.getValue(i)=='three.js json'){
                            var positionData = data.data.attributes.position.array;
                            var posMapped = positionData.map(function(x) { return x * scale; });
                            var texCoords0 = data.data.attributes.uv.array;  //missing texturecoordinates
                            var indexData = data.data.index.array;

                            var PosTyped = new Float32Array(posMapped);

                        if (GenerateNormals.getValue(0) == 1.0){
                            var normalData = generateNormals(PosTyped, 3, 0, positionData.length/3, indexData);
                        }else{
                            var normalData = data.data.attributes.normal.array;
                        }
                            normalData = new Float32Array(normalData);
                            if (data.metadata.hasOwnProperty('color')){
                                var VertexColorData = data.data.attributes.color.array;
                                //console.log('geometry has vertex color');
                            }

                            vertexBuffer = new VVVV.Types.VertexBuffer(gl);
                            vertexBuffer.create();
                            vertexBuffer.setSubBuffer('POSITION', 3, posMapped);
                            vertexBuffer.setSubBuffer('TEXCOORD0', 2, texCoords0);
                            vertexBuffer.setSubBufferTyped('NORMAL', 3, normalData);
                            vertexBuffer.setSubBuffer('VERTEXCOLOR', 3, VertexColorData);
                        }
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
                    Geometry.updateInstancedArray(Buffers);
                    Geometry.addSemantics(semanticsArray);
                    Geometry.addVectorSize(vecSize);
                    Geometry.addDivisor(divisorArray);
                    Geometry.instancedBufferChanged = true;
        meshOut.setValue(i, Geometry);
        }   //end of inner for loop
    }
    MeshWasConnected = meshIn.isConnected();
    this.contextChanged = false;
     }
  }
VVVV.Nodes.InstancerDynamic.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: HeightMap (Buffer Geometry)
 Author(s): David Gann

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.HeightMap = function(id, graph) {
  this.constructor(id, "HeightMap (Buffer Geometry)", graph);

  this.auto_nil = false;

  this.meta = {
    authors: ['David Gann'],
    original_authors: ['David Gann'],
    credits: [],
    compatibility_issues: []
  };



  var BufferIn = this.addInputPin("Buffer", [], VVVV.PinTypes.SceneBuffer);
  var ResolutionIn = this.addInputPin("Resolution", [128], VVVV.PinTypes.Value);
  var ScaleIn = this.addInputPin("Scale", [1.0], VVVV.PinTypes.Value);
  var UpdateIn = this.addInputPin("Update", [1.0], VVVV.PinTypes.Value);

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
   var Buffer = [];
   var update = [];
  this.evaluate = function() {
    var scale = ScaleIn.getValue(0);

    var Res = parseInt(ResolutionIn.getValue(0));


    if (BufferIn.pinIsChanged() | ScaleIn.pinIsChanged() | update == 1){
      this.initialize();}

    if (!this.renderContexts) return;
       var gl = this.renderContexts[0];
    if (!gl)
      return;



      for (var i=0; i<BufferIn.getSliceCount(); i++) {

            Buffer[i] = BufferIn.getValue(i);
            update[i] = UpdateIn.getValue(i);

            if (BufferIn.pinIsChanged() | ScaleIn.pinIsChanged()  | update[i] == 1) {
            var vertices = [];
            var normals = [];
            var texCoords = [];
            var index = 0;
            for (var y=0; y<Res; y++) {
              for (var x=0; x<Res; x++) {
                var b_index = x+y*Res;
                var displacement =  (Buffer[i].data[b_index]) * scale;
                vertices.push(parseFloat(x)/(Res-1)-0.5);
                vertices.push(displacement);
                vertices.push(0.5-parseFloat(y)/(Res-1));
                index++;
                texCoords.push(parseFloat(x)/(Res-1));
                texCoords.push(parseFloat(y)/(Res-1));
              }
            }

            var indices = [];
            for (var y=0; y<Res-1; y++) {
              for (var x=0; x<Res-1; x++) {
                var refP = x+Res*y;
                indices.push(refP);
                indices.push(refP+1);
                indices.push(refP+Res+1);
                indices.push(refP+Res+1);
                indices.push(refP+Res);
                indices.push(refP);
              }
            }

            var PosTyped = new Float32Array(vertices);
            var normalData = generateNormals(PosTyped, 3, 0, vertices.length/3, indices);

            var vertexBuffer = new VVVV.Types.VertexBuffer(gl);
            vertexBuffer.create();
            vertexBuffer.setSubBuffer('POSITION', 3, vertices);
            vertexBuffer.setSubBuffer('TEXCOORD0', 2, texCoords);
            vertexBuffer.setSubBuffer('NORMAL', 3, normalData);
            vertexBuffer.update();

            mesh = new VVVV.Types.Mesh(gl, vertexBuffer, indices);
            mesh.update(indices);
            meshOut.setValue(i, mesh);
            } //if update
        }   //end of inner for loop

    this.contextChanged = false;
     }
  }

VVVV.Nodes.HeightMap.prototype = new Node();
/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Primitives (EX9.Geometry)
 Author(s): David Gann
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Primitives = function(id, graph) {
  this.constructor(id, "Primitives (EX9.Geometry)", graph);

  this.auto_nil = false;

  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  var selectIn = this.addInputPin("Primitive Index", [0.0], VVVV.PinTypes.Value);

  var meshOut = this.addOutputPin("Mesh", [], VVVV.PinTypes.WebGlResource);

  var mesh = null;

  this.evaluate = function() {

    if (!this.renderContexts) return;
    var gl = this.renderContexts[0];
    if (!gl)
      return;
    var select = selectIn.getValue(0);

    if(select == 0){
    var vertices = [
         0.5,  0.5,  0.0,
        -0.5,  0.5,  0.0,
         0.5, -0.5,  0.0,
        -0.5, -0.5,  0.0
      ];

     var normals = [
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0, 0.0,  1.0,
        0.0, 0.0,  1.0
      ];

      var texCoords = [
        1.0, 0.0,
        0.0, 0.0,
        1.0, 1.0,
        0.0, 1.0
      ];

      var indices = [ 0, 1, 2, 1, 3, 2 ];
    }

    if(select == 1){
    var vertices = [-0.5,-0.5,-0.5,-0.5,-0.5,0.5,-0.5,0.5,0.5,-0.5,0.5,-0.5,-0.5,0.5,-0.5,-0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,-0.5,0.5,0.5,-0.5,0.5,0.5,0.5,0.5,-0.5,0.5,0.5,-0.5,-0.5,-0.5,-0.5,0.5,-0.5,-0.5,-0.5,0.5,-0.5,-0.5,0.5,-0.5,0.5,-0.5,-0.5,0.5,0.5,-0.5,0.5,0.5,0.5,0.5,-0.5,0.5,0.5,-0.5,-0.5,-0.5,-0.5,0.5,-0.5,0.5,0.5,-0.5,0.5,-0.5,-0.5];
    var normals = [-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0];
    var texCoords = [1.0,1.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,1.0,1.0,0.0,0.0,1.0,0.0,1.0,1.0,0.0,1.0,0.0,1.0,0.0,0.0,1.0,0.0,1.0,1.0,1.0,1.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,1.0,1.0];
    var indices = [0,1,2,2,3,0,4,5,6,6,7,4,8,9,10,10,11,8,12,13,14,14,15,12,16,17,18,18,19,16,20,21,22,22,23,20];
    }

    if(select == 2){
    var vertices = [-0.5,-0.5,-0.5,-0.5,-0.5,0.5,-0.5,0.5,0.5,-0.5,0.5,-0.5,-0.5,0.5,-0.5,-0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,-0.5,0.5,0.5,-0.5,0.5,0.5,0.5,0.5,-0.5,0.5,0.5,-0.5,-0.5,-0.5,-0.5,0.5,-0.5,-0.5,-0.5,0.5,-0.5,-0.5,0.5,-0.5,0.5,-0.5,-0.5,0.5,0.5,-0.5,0.5,0.5,0.5,0.5,-0.5,0.5,0.5,-0.5,-0.5,-0.5,-0.5,0.5,-0.5,0.5,0.5,-0.5,0.5,-0.5,-0.5];
    var normals = [-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0];
    var texCoords = [1.0,1.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,1.0,1.0,0.0,0.0,1.0,0.0,1.0,1.0,0.0,1.0,0.0,1.0,0.0,0.0,1.0,0.0,1.0,1.0,1.0,1.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,0.0,1.0,0.0,1.0,1.0];
    var indices = [0,1,2,2,3,0,4,5,6,6,7,4,8,9,10,10,11,8,12,13,14,14,15,12,16,17,18,18,19,16,20,21,22,22,23,20];
    }

    var vertexBuffer = new VVVV.Types.VertexBuffer(gl);
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

VVVV.Nodes.Primitives.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: DataTexture (WebGL Buffer)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.DataTexture = function(id, graph) {
  this.constructor(id, "DataTexture (WebGL Buffer)", graph);

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

  var BufferIn = this.addInputPin("Buffer", [], VVVV.PinTypes.SceneBuffer);
  var ResIn = this.addInputPin("Resolution", [64.0,64.0], VVVV.PinTypes.Value);
  var ApplyIn = this.addInputPin("Apply", [0.0], VVVV.PinTypes.Value);
  var outputPin = this.addOutputPin("Texture Out", [], VVVV.PinTypes.WebGlTexture);




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

    if (ApplyIn.getValue(0) == 1 || this.contextChanged) {
      var maxSize = BufferIn.getSliceCount();
      for (var i=0; i<maxSize; i++) {
        var Buffer = BufferIn.getValue(i);
        textures[i] = gl.createTexture();
        textures[i].context = gl;
         if (!gl.getExtension("OES_texture_float")) {
           throw("Requires OES_texture_float extension");
        }


        var float32 = new Float32Array(Buffer.data);
        var uint8 = new Uint8Array(Buffer.data);


              gl.bindTexture(gl.TEXTURE_2D, textures[i]);

              const alignment = 1;
              gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment); //is needed to unpack the data correctly
              const level = 0;
              const internalFormat = gl.RGBA;
              const width = ResIn.getValue(0);
              const height = ResIn.getValue(1);
              const border = 0;
              const format = gl.RGBA;
              const type = gl.FLOAT;

              gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border,
                            format, type, float32);
              gl.generateMipmap( gl.TEXTURE_2D );
              // set the filtering so we don't need mips and it's not filtered
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.bindTexture(gl.TEXTURE_2D, null);
        outputPin.setValue(i, textures[i]);


        //outputPin.setValue(i, VVVV.defaultTexture);

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
VVVV.Nodes.DataTexture.prototype = new Node();

/*
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   NODE: FileSelection (WebGL Texture HTML5 Input)
   Author(s): David Gann
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  */

  VVVV.Nodes.FileSelection = function(id, graph) {
    this.constructor(id, "FileSelection (WebGL Texture HTML5 Input)", graph);

    //this.environments = ['nodejs'];

    this.meta = {
      authors: ['David Gann'],
      original_authors: ['VVVV Group'],
      credits: [],
      compatibility_issues: []
    };

    var parentIn = this.addInputPin("Parent Element", [], VVVV.PinTypes.HTMLLayer);
    var CSS_ID_In = this.addInputPin('css id', ["file"], VVVV.PinTypes.String);
    var updateIn = this.addInputPin('Update', [0], VVVV.PinTypes.Value);
    var filenamePin = this.addInputPin("Filename", [""], VVVV.PinTypes.String);
    var outputPin = this.addOutputPin("Texture Out", [], VVVV.PinTypes.WebGlTexture);
    var WidthOut = this.addOutputPin("Width", [1], VVVV.PinTypes.Value);
    var HeightOut = this.addOutputPin("Height", [1], VVVV.PinTypes.Value);
    var shortFilenamesOut = this.addOutputPin('Short Filenames', [''], VVVV.PinTypes.String);

    var textures = [];
    var alignment = 1;
    var targetElement;
    var id;
    var id_list;
    var htmlLayer;
    var htmlLayer2;




    function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

    this.evaluate = function() {
        if (updateIn.getValue(0)>0.5) {
        if (!this.renderContexts){ return;}
        var gl = this.renderContexts[0];
        if (!gl){ return;}
        if (this.contextChanged) {
            for (var i=0; i<textures.length; i++) {
              textures[i].context.deleteTexture(textures[i]);
            }
            textures = [];

            var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Fill the texture with a 1x1 blue pixel.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,new Uint8Array([0, 0, 0, 255]));

         outputPin.setValue(0, texture);



        var filename = VVVV.Helpers.prepareFilePath(filenamePin.getValue(i), this.parentPatch);
        if (filename.indexOf('http://')===0 && VVVV.ImageProxyPrefix!==undefined)
          filename = VVVV.ImageProxyPrefix+encodeURI(filename);
        texture = gl.createTexture();
        texture.context = gl;
        var image = new Image();
        image.src = filename;
        image.onload = (function(j) {
            return function() {  // this is to create a new scope within the loop. see "javascript closure in for loops" http://www.mennovanslooten.nl/blog/post/62
              gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
              gl.bindTexture(gl.TEXTURE_2D, texture);
              //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
              gl.generateMipmap(gl.TEXTURE_2D);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
              gl.bindTexture(gl.TEXTURE_2D, null);
               outputPin.setValue(0, texture);
                    }
                 })(i);



                                 WidthOut.setValue(0, 1);
                                 HeightOut.setValue(0, 1);
                                 shortFilenamesOut.setValue(0, "empty");
          }

    if (CSS_ID_In.pinIsChanged() || this.contextChanged ){
          id = CSS_ID_In.getValue(0);
      id_list = "list_" + CSS_ID_In.getValue(0);
      htmlLayer = new VVVV.Types.HTMLLayer('input');
      htmlLayer.setAttribute('id', id);
      htmlLayer.setAttribute('type', 'file');
      htmlLayer.setAttribute('name', 'files[]');
      htmlLayer.setAttribute('multiple');
      if (!targetElement) {
        if (parentIn.isConnected() && parentIn.getValue(0))
          targetElement = parentIn.getValue(0).element;
        else
          targetElement = 'body';
      }
      if($ != undefined){
      $(targetElement).append(htmlLayer.element);
       }

      htmlLayer2 = new VVVV.Types.HTMLLayer('output');
      htmlLayer2.setAttribute('id', id_list);
      $(targetElement).append(htmlLayer2.element);

    }

                // Create a texture.

     		var fileInput = document.getElementById(id);
		//var fileDisplayArea = document.getElementById('body');
		fileInput.addEventListener('change', function(e) {
			var file = fileInput.files[0];
			var imageType = /image.*/;

			if (file.type.match(imageType)) {
				var reader = new FileReader();

				reader.onload = function(e) {
					//fileDisplayArea.innerHTML = "";

					var img = new Image();
					img.src = reader.result;
                                        img.addEventListener('load', function() {
                                        // Now that the image has loaded make copy it to the texture.
                                        gl.bindTexture(gl.TEXTURE_2D, texture);

                                        gl.texImage2D(gl.TEXTURE_2D,  0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, img);

                                        if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
                                            gl.generateMipmap(gl.TEXTURE_2D);
                                        } else {
                                            // No, it's not a power of 2. Turn off mips and set wrapping to clamp to edge
                                            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                                            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                                            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                                         }
                                        outputPin.setValue(0, texture);
                                        WidthOut.setValue(0, img.width);
                                        HeightOut.setValue(0, img.height);
                                        shortFilenamesOut.setValue(0, file.name);
                                      });
					//fileDisplayArea.appendChild(img);
				}
				reader.readAsDataURL(file);
			} else {

			}
		});

}


      }


  }
  VVVV.Nodes.FileSelection.prototype = new Node();



///*
//  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   NODE: glTF Loader (glTF)
//   Author(s): David Gann
//  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  */

  VVVV.Nodes.glTFLoader = function(id, graph) {
    this.constructor(id, "glTF Loader (glTF Scene)", graph);

    this.meta = {
      authors: ['David Gann'],
      original_authors: ['000.graphics'],
      credits: [],
      compatibility_issues: []
    };

    //input
    var filenamePin = this.addInputPin("Filename", [""], VVVV.PinTypes.String);
    var Update= this.addInputPin('Update', [0], VVVV.PinTypes.Value);
    //output
    var glTF_Out = this.addOutputPin("glTF", [], VVVV.PinTypes.glTF);
    var Success = this.addOutputPin("Success", [0.0], VVVV.PinTypes.Value);

   var prevFilenames = [];
   var filename = [];
   var glTF_array = [];

    function defined(value) {
           return value !== undefined && value !== null;
       }


   //callback functions for subsequent async loading of JSON and binary buffers
   function loadFile(url, timeout, callback) {
       var args = Array.prototype.slice.call(arguments, 3);
       var xhr = new XMLHttpRequest();
       xhr.ontimeout = function () {
           console.error("The request for " + url + " timed out.");
       };
       xhr.onload = function() {
           if (xhr.readyState === 4) {
               if (xhr.status === 200) {
                   callback.apply(xhr, args);
               } else {
                   console.error(xhr.statusText);
               }
           }
       };
       xhr.open("GET", url, true);
       xhr.timeout = timeout;
       xhr.send(null);
   }
   function loadBuffer(url, timeout, callback) {
       var args = Array.prototype.slice.call(arguments, 3);
       var xhr = new XMLHttpRequest();
       xhr.responseType = 'arraybuffer';
       xhr.ontimeout = function () {
           console.error("The request for " + url + " timed out.");
       };
       xhr.onload = function() {
           if (xhr.readyState === 4) {
               if (xhr.status === 200) {
                   callback.apply(xhr, args);
               } else {
                   console.error(xhr.statusText);
               }
           }
       };
       xhr.open("GET", url, true);
       xhr.timeout = timeout;
       xhr.send(null);
   }

   function attachBuffer(glTF, i) {
       glTF.buffer.push(this.response);
       //Write to the Pin
       glTF_Out.setValue(i, glTF);
   }

function getDefines(glTF, mesh_id, primitive_id){
    var defines = {
        HAS_NORMALS: true,
        HAS_TANGENTS: false,
        HAS_UV0: true,
        HAS_UV1: true,
        HAS_ANIMATION: false,
        USE_IBL: true,
        HAS_BASECOLORMAP: true,
        HAS_NORMALMAP: false,
        HAS_EMISSIVEMAP: false,
        HAS_METALROUGHNESSMAP: false,
        HAS_OCCLUSIONMAP: false,
        MANUAL_SRGB: false,
        SRGB_FAST_APPROXIMATION: false,
        NO_GAMMA_CORRECTION: false,
        HAS_MORPHTARGETS : false,
        HAS_JOINTS0 : false,
        HAS_WEIGHTS0 : false,
        HAS_WEIGHTS1 : false,
        USE_SPEC_GLOSS : false,
        HAS_DIFFUSEMAP : false,
        HAS_SPEC_GLOSS_MAP : false
    }

    var primitive = glTF.data.meshes[mesh_id].primitives[primitive_id];

    var atr = defined(primitive.attributes) ? primitive.attributes : {};

    var mat = defined(glTF.data.materials) ? glTF.data.materials[primitive.material] : {};


    var pbrMetRough = defined(mat.pbrMetallicRoughness) ? glTF.data.materials[primitive.material].pbrMetallicRoughness : {};


    defines.HAS_BASECOLORMAP = defined(pbrMetRough.baseColorTexture) ? true : false;


    defines.HAS_METALROUGHNESSMAP = defined(pbrMetRough.metallicRoughnessTexture) ? true : false;


    defines.HAS_NORMALMAP = defined(mat.normalTexture) ? true : false;

    defines.HAS_OCCLUSIONMAP = defined(mat.occlusionTexture) ? true : false;

    defines.HAS_EMISSIVEMAP = defined(mat.emissiveTexture) ? true : false;

    defines.HAS_NORMALS = defined(atr.NORMAL) ? true : false;

    defines.HAS_TANGENTS = defined(atr.TANGENT) ? true : false;

    defines.HAS_UV0 = defined(atr.TEXCOORD_0) ? true : false;

    defines.HAS_UV1 = defined(atr.TEXCOORD_1) ? true : false;

    defines.HAS_WEIGHTS0 = defined(atr.WEIGHTS_0) ? true : false;

    defines.HAS_WEIGHTS1 = defined(atr.WEIGHTS_1) ? true : false;

    defines.HAS_JOINTS0 = defined(atr.JOINTS_0) ? true : false;

    defines.HAS_MORPHTARGETS = defined(primitive.targets) ? true : false;

     var ext = defined(mat.extensions) ? mat.extensions : {};

    defines.USE_SPEC_GLOSS = defined(ext.KHR_materials_pbrSpecularGlossiness) ? true : false;

    var ext_spec_gloss = defined(ext.KHR_materials_pbrSpecularGlossiness) ? ext.KHR_materials_pbrSpecularGlossiness : {};

    defines.HAS_DIFFUSEMAP = defined(ext_spec_gloss.diffuseTexture) ? true : false;
    if(defines.HAS_DIFFUSEMAP){defines.HAS_BASECOLORMAP = true;}  //overwriting Basecolor with diffuse
    console.log(defines.HAS_BASECOLORMAP)
    defines.HAS_SPEC_GLOSS_MAP = defined(ext_spec_gloss.specularGlossinessTexture) ? true : false;
    if(defines.HAS_SPEC_GLOSS_MAP){defines.HAS_METALROUGHNESSMAP = true;} //overwriting spec_gloss with metallic_roughness


    return defines;
}

    var ScenePrimitves = function(glTF, node, mesh_primitive_array ) {
        if (defined(node.mesh)  ) {    //&& node.mesh < glTF.data.meshes.length
            //mesh_index_array.push(node.mesh);
            var Primitve_index = 0;

            var count = glTF.data.meshes[node.mesh].primitives.length;

            for (var i = 0; i < count; i++) {
                var defines = getDefines(glTF, node.mesh, Primitve_index);
                var element = {
                    mesh_id: node.mesh,
                    primitive_id: Primitve_index,
                    defines: defines
                }

                mesh_primitive_array.push(element);

                Primitve_index += 1;
            }
        }
        if (defined(node.children) && node.children.length > 0) {
            for (var i = 0; i < node.children.length; i++) {
                mesh_primitive_array = ScenePrimitves(glTF, glTF.data.nodes[node.children[i]], mesh_primitive_array);
            }
            return mesh_primitive_array;
        }else{
        return mesh_primitive_array;
        }
    }



   function attachJSON(glTF, i, filename) {
       glTF.data = JSON.parse(this.responseText);
       path = filename.substring(0, filename.lastIndexOf("/"));
       glTF.data.path = path;
       glTF.data.buffers.forEach(function(element) { //not yet tested against multiple buffers in glTF file
            uri = path + "/" + element.uri;
             loadBuffer(uri, 1000000, attachBuffer, glTF, i);

       });
       //traverse node graph for scene primitves
       var mesh_primitive_array = [];

       var scene_index = defined(glTF.data.scene) ? glTF.data.scene : 0;
       var scene = glTF.data.scenes[scene_index];
       var max_root_nodes = scene.nodes.length;

       for (var k=0; k<max_root_nodes ; k++) {
           var root_node_index = scene.nodes[k];
           mesh_primitive_array = ScenePrimitves(glTF, glTF.data.nodes[root_node_index], mesh_primitive_array);

       }
       glTF.data.mesh_primitives = mesh_primitive_array;

   }




    this.evaluate = function() {

    var maxCount = filenamePin.getSliceCount();
        for (var i=0; i<maxCount; i++) {

            if (prevFilenames[i] != filenamePin.getValue(i)  | Update.getValue(i) == 1) {

                filename[i] = VVVV.Helpers.prepareFilePath(filenamePin.getValue(i), this.parentPatch);
                var glTF = {data: {}, buffer: [], path: {}};
                        glTF_array[i] = glTF;
                (function(i) {
                loadFile(filename[i], 2000, attachJSON, glTF_array[i], i, filename[i]);
                })(i);




                prevFilenames[i] = filenamePin.getValue(i);
            }
        }
        glTF_Out.setSliceCount(maxCount);
    }
}
VVVV.Nodes.glTFLoader.prototype = new Node();


///*
//  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   NODE: Geometry (glTF)
//   Author(s): David Gann
//  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  */

  VVVV.Nodes.GeometryGLTF = function(id, graph) {
    this.constructor(id, "Geometry (glTF)", graph);

    this.meta = {
      authors: ['David Gann'],
      original_authors: ['000.graphics'],
      credits: [],
      compatibility_issues: []
    };

    //input
    var glTF_In = this.addInputPin("glTF", [], VVVV.PinTypes.glTF);
    var Update= this.addInputPin('Update', [0], VVVV.PinTypes.Value);
    //output
    var meshOut = this.addOutputPin("Mesh", [], VVVV.PinTypes.WebGlResource);
    var VsDefinesOut = this.addOutputPin("VS Defines", [""], VVVV.PinTypes.String);
    //var Success = this.addOutputPin("Success", [0.0], VVVV.PinTypes.Value);

function _arrayBuffer2TypedArray(buffer, byteOffset, countOfComponentType, componentType) {
    switch(componentType) {
        // @todo: finish
        case 5120: return new Int8Array(buffer, byteOffset, countOfComponentType);
        case 5121: return new Uint8Array(buffer, byteOffset, countOfComponentType);
        case 5122: return new Int16Array(buffer, byteOffset, countOfComponentType);
        case 5123: return new Uint16Array(buffer, byteOffset, countOfComponentType);
        case 5124: return new Int32Array(buffer, byteOffset, countOfComponentType);
        case 5125: return new Uint32Array(buffer, byteOffset, countOfComponentType);
        case 5126: return new Float32Array(buffer, byteOffset, countOfComponentType);
        default: return null;
    }
}

var Type2NumOfComponent = {
    'SCALAR': 1,
    'VEC2': 2,
    'VEC3': 3,
    'VEC4': 4,
    'MAT2': 4,
    'MAT3': 9,
    'MAT4': 16
};
 function defined(value) {
        return value !== undefined && value !== null;
    }


function Type2Num(glTF, accessor_index){
    var vec_type = glTF.data.accessors[accessor_index].type;
    return Type2NumOfComponent[vec_type];
}

function accessor(glTF, accessor_index, type){
    //accessor
    var bufferView_index = glTF.data.accessors[ accessor_index ].bufferView;


    //get buffer view
    var byteLength = glTF.data.bufferViews[bufferView_index].byteLength;
    var byteOffset_bufferview = defined(glTF.data.bufferViews[bufferView_index].byteOffset) ? glTF.data.bufferViews[bufferView_index].byteOffset : 0;
    //var buffer_data = glTF.buffer[glTF.data.bufferViews[bufferView_index].buffer];
    //var accessor_buffer_data = buffer_data.slice(byteOffset_bufferview, byteOffset_bufferview + byteLength);

    //get typed array by accessor from buffer view
    var componentType = glTF.data.accessors[ accessor_index ].componentType;
    var ComponentType_count = glTF.data.accessors[ accessor_index ].count;
    var byteOffset_accessor = defined(glTF.data.accessors[ accessor_index ].byteOffset) ? glTF.data.accessors[ accessor_index ].byteOffset : 0;

    var typedArray = _arrayBuffer2TypedArray(glTF.buffer[glTF.data.bufferViews[bufferView_index].buffer], byteOffset_bufferview + byteOffset_accessor,  type * ComponentType_count, componentType);
    //var typedArray = _arrayBuffer2TypedArray(glTF.buffer[glTF.data.bufferViews[bufferView_index].buffer], byteOffset,  type * ComponentType_count, componentType);
    return typedArray;
}

function getStride(glTF, accessor_index){
    var bufferView_index = glTF.data.accessors[ accessor_index ].bufferView;
    var byteStride = 0;
    if(glTF.data.bufferViews[bufferView_index].byteStride !== undefined){
    byteStride = glTF.data.bufferViews[bufferView_index].byteStride ;
    }
    return byteStride
}

function AttributeBuffer(glTF, index, attribute_semantic){
    var type = Type2Num(glTF, index);
    var stride = getStride(glTF, index);
    var typedBuffer = accessor(glTF, index, type);
    vertexBuffer.setSubBufferTypedStride(attribute_semantic, type, typedBuffer, stride);
}

function loadMesh(gl, glTF, output_index, mesh_primitive_idx) {


    var element = glTF.data.meshes[mesh_primitive_idx.mesh_id].primitives[mesh_primitive_idx.primitive_id];


    vertexBuffer = new VVVV.Types.VertexBuffer(gl);
    vertexBuffer.create();
    if ("POSITION" in element.attributes) {
        AttributeBuffer(glTF, element.attributes.POSITION, 'POSITION');
    }
    if ("NORMAL" in element.attributes) {
         AttributeBuffer(glTF, element.attributes.NORMAL, 'NORMAL');
    }
    if ("TANGENT" in element.attributes) {
        AttributeBuffer(glTF, element.attributes.TANGENT, 'TANGENT');
    }
    if ("TEXCOORD_0" in element.attributes) {
        AttributeBuffer(glTF, element.attributes.TEXCOORD_0, 'TEXCOORD0');
    }
    if ("TEXCOORD_1" in element.attributes) {
        AttributeBuffer(glTF, element.attributes.TEXCOORD_1, 'TEXCOORD_1');
    }
    if ("COLOR_0" in element.attributes) {
        AttributeBuffer(glTF, element.attributes.COLOR_0, 'COLOR_0'); //COLOR_0 can be either vec3 or vec4
    }
    if ("JOINTS_0" in element.attributes) {
        AttributeBuffer(glTF, element.attributes.JOINTS_0, 'JOINTS_0');
    }
    if ("WEIGHTS_0" in element.attributes) {
        AttributeBuffer(glTF, element.attributes.WEIGHTS_0, 'WEIGHTS_0');
    }
    if ("JOINTS_1" in element.attributes) {
        AttributeBuffer(glTF, element.attributes.JOINTS_1, 'JOINTS_1');
    }
    if ("WEIGHTS_1" in element.attributes) {
        AttributeBuffer(glTF, element.attributes.WEIGHTS_1, 'WEIGHTS_1');
    }

    //////////////index buffer///////////////////
    var type = Type2Num(glTF, element.indices);

    var indices = accessor(glTF, element.indices, type);
    var componentTypeIndex = glTF.data.accessors[ element.indices ].componentType;
    vertexBuffer.update();

    mesh = new VVVV.Types.Mesh(gl, vertexBuffer, indices);
    mesh.updateTyped(indices);
    if(componentTypeIndex == 5125 || componentTypeIndex == 5124){
        mesh.isUint32 = true;
    }

    meshOut.setValue(output_index, mesh);


}

    this.evaluate = function() {
    if (!this.renderContexts){ return;}
    var gl = this.renderContexts[0];
    if (!gl){ return;}

    var maxCount = glTF_In.getSliceCount();
    var index_offset=0;
    var output_count;
    var iterator = 0;

        for (var i=0; i<maxCount; i++) {
            if (  glTF_In.pinIsChanged() | Update.getValue(i) == 1) {
            var glTF = glTF_In.getValue(i);






                    var mesh_count = glTF.data.mesh_primitives.length;

                    index_offset = i *  mesh_count;

                    for (var j=0; j<mesh_count; j++) {

                        var mesh_primitive_idx = glTF.data.mesh_primitives[j];

                        var output_index = index_offset + j;

                        loadMesh(gl, glTF, output_index, mesh_primitive_idx);

                    }

            }
        }
        meshOut.setSliceCount(mesh_count);


    }
}
VVVV.Nodes.GeometryGLTF.prototype = new Node();


///*
//  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   NODE: Textures (glTF)
//   Author(s): David Gann
//  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  */

  VVVV.Nodes.TexturesGLTF = function(id, graph) {
    this.constructor(id, "Textures (glTF)", graph);

    this.meta = {
      authors: ['David Gann'],
      original_authors: ['000.graphics'],
      credits: [],
      compatibility_issues: []
    };

    //input
    var glTF_In = this.addInputPin("glTF", [], VVVV.PinTypes.glTF);
    var Update= this.addInputPin('Update', [0], VVVV.PinTypes.Value);
    //output

    var BaseColorOut = this.addOutputPin("Base Color Texture", [], VVVV.PinTypes.WebGlTexture);
    var NormalOut = this.addOutputPin("Normal Texture", [], VVVV.PinTypes.WebGlTexture);
    var EmissiveOut = this.addOutputPin("Emissive Texture", [], VVVV.PinTypes.WebGlTexture);
    var MetallicRoughnessOut = this.addOutputPin("Metallic Roughness Texture", [], VVVV.PinTypes.WebGlTexture);
    var OcclusionOut = this.addOutputPin("Occlusion Texture", [], VVVV.PinTypes.WebGlTexture);

    var BaseColorValueOut = this.addOutputPin("BaseColorValue", [1.0,1.0,1.0,1.0], VVVV.PinTypes.Value);
    var NormalScaleOut = this.addOutputPin("NormalScale", [1.0], VVVV.PinTypes.Value);
    var EmissiveFactorOut = this.addOutputPin("EmissiveFactor", [1.0,1.0,1.0], VVVV.PinTypes.Value);
    var OcclusionStrengthOut = this.addOutputPin("OcclusionStrength", [1.0], VVVV.PinTypes.Value);
    var MetallicRoughnessValueOut = this.addOutputPin("MetallicRoughness Value", [1.0,1.0], VVVV.PinTypes.Value);

    var specularFactorOut = this.addOutputPin("spec_gloss_specularFactor", [1.0,1.0,1.0,1.0], VVVV.PinTypes.Value);



function isPowerOf2(value) {
     return (value & (value - 1)) == 0;
}

var texture = [];
var source_path = [];

function RemoveFirstDir(the_url)
{
    var the_arr = the_url.split('/');
    the_arr.shift();
    return( the_arr.join('/') );
}

function defined(value) {
        return value !== undefined && value !== null;
    }

function requestTexture(gl, glTF, element, i, textureIndex, descriptor, IsValid){

        var texture;
        if (!gl){ return;}
        texture = gl.createTexture();
        texture.context = gl;

        var img1x1 = new Uint8Array([ 255, 255, 255, 255 ]);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, img1x1);

        if(descriptor == "BaseColor"){
            BaseColorOut.setValue(i, texture);
        }
        if(descriptor == "Normal"){
            NormalOut.setValue(i, texture);
        }
        if(descriptor == "MetallicRoughness"){
            MetallicRoughnessOut.setValue(i, texture);
        }
        if(descriptor == "Occlusion"){
            OcclusionOut.setValue(i, texture);
        }
        if(descriptor == "Emissive"){
            EmissiveOut.setValue(i, texture);
        }
        gl.bindTexture(gl.TEXTURE_2D, null);

        if(IsValid == 0){return; }

        var file = glTF.data.images[glTF.data.textures[textureIndex].source].uri;
        source_path[i] = glTF.data.path + "/" + file;
        console.log(source_path[i])
        var image = new Image();
        texture.image = new Image();
        texture.image.src = source_path[i];
        texture.image.onload = (function(j) {
            return function() {
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D,  0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, texture.image);
                if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                    gl.generateMipmap(gl.TEXTURE_2D);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                } else {
                    // No, it's not a power of 2. Turn off mips and set wrapping to clamp to edge
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                }

                if(descriptor == "BaseColor"){
                    BaseColorOut.setValue(j, texture);
                }
                if(descriptor == "Normal"){
                    NormalOut.setValue(j, texture);
                }
                if(descriptor == "MetallicRoughness"){
                    MetallicRoughnessOut.setValue(j, texture);
                }
                if(descriptor == "Occlusion"){
                    OcclusionOut.setValue(j, texture);
                }
                if(descriptor == "Emissive"){
                    EmissiveOut.setValue(j, texture);
                }

                gl.bindTexture(gl.TEXTURE_2D, null);
                    }

        })(i);
}

function loadTextures(gl, glTF, output_index, mesh_primitive_idx) {


    var element = glTF.data.meshes[mesh_primitive_idx.mesh_id].primitives[mesh_primitive_idx.primitive_id];

    var mat = defined(glTF.data.materials) ? glTF.data.materials[element.material] : {};
    var textureIndex = -1;
    var IsValid = 0;
    var defines = mesh_primitive_idx.defines;
    var pbr_met_rough =  defined(mat.pbrMetallicRoughness) ? mat.pbrMetallicRoughness : {};
    var ext = defined(mat.extensions) ? mat.extensions : {};
    var ext = defined(mat.extensions) ? mat.extensions : {};
    var ext_spec_gloss = defined(ext.KHR_materials_pbrSpecularGlossiness) ? ext.KHR_materials_pbrSpecularGlossiness : {};


    if(defines.HAS_BASECOLORMAP){
        if(defines.HAS_DIFFUSEMAP){
            console.log("loading diffuse map")
            var tex_index = mat.extensions.KHR_materials_pbrSpecularGlossiness.diffuseTexture.index;
        }else{
            var tex_index = pbr_met_rough.baseColorTexture.index;
        }
        requestTexture(gl, glTF, element, output_index,  tex_index, "BaseColor", 1);
    }else{
        BaseColorOut.setValue(output_index, null);
    }

    if(defines.HAS_METALROUGHNESSMAP || defines.HAS_SPEC_GLOSS_MAP){
        if(defines.HAS_SPEC_GLOSS_MAP){
            var tex_index = mat.extensions.KHR_materials_pbrSpecularGlossiness.specularGlossinessTexture.index;

        }else{
            var tex_index = pbr_met_rough.metallicRoughnessTexture.index;
        }
        requestTexture(gl, glTF, element, output_index,  tex_index, "MetallicRoughness", 1);
    }else{
        MetallicRoughnessOut.setValue(output_index, null);
    }

    if(defines.HAS_NORMALMAP){
        requestTexture(gl, glTF, element, output_index,  mat.normalTexture.index, "Normal", 1);
    }else{
        NormalOut.setValue(output_index, null);
    }

    if(defines.HAS_OCCLUSIONMAP){
        requestTexture(gl, glTF, element, output_index,  mat.occlusionTexture.index, "Occlusion", 1);
    }else{
        OcclusionOut.setValue(output_index, null);
    }

    if(defines.HAS_EMISSIVEMAP){
        requestTexture(gl, glTF, element, output_index,  mat.emissiveTexture.index, "Emissive", 1);
    }else{
        EmissiveOut.setValue(output_index, null);
    }



    if(defined(pbr_met_rough.baseColorFactor) || defined(ext_spec_gloss.diffuseFactor)){
        if(defined(ext_spec_gloss.diffuseFactor)){
            var baseColorFactor_arr = ext_spec_gloss.diffuseFactor;
        }else{
            var baseColorFactor_arr =  pbr_met_rough.baseColorFactor;
        }
        for (var i=0; i<4; i++) {
            BaseColorValueOut.setValue(output_index*4+i, baseColorFactor_arr[i]);
        }
    }else{
        for (var i=0; i<4; i++) {
        BaseColorValueOut.setValue(output_index*4+i, [1.0]);
        }
    }



    if(defined(pbr_met_rough.metallicFactor)){
            MetallicRoughnessValueOut.setValue(output_index*2, pbr_met_rough.metallicFactor);
    }else{
        MetallicRoughnessValueOut.setValue(output_index*2, [1.0]);
    }


    if(defined(pbr_met_rough.roughnessFactor)){
            MetallicRoughnessValueOut.setValue(output_index*2+1, pbr_met_rough.roughnessFactor);
    }else{
        MetallicRoughnessValueOut.setValue(output_index*2+1, [1.0]);
    }


    var norm = defined(mat.normalTexture) ? mat.normalTexture : {};
        if(defined(norm.scale)){
                NormalScaleOut.setValue(output_index, norm.scale);
            }else{NormalScaleOut.setValue(output_index, [0.0]);}



    var occ = defined(mat.occlusionTexture) ? mat.occlusionTexture : {};
        if(defined(occ.strength)){
                OcclusionStrengthOut.setValue(output_index, occ.strength);
            }else{OcclusionStrengthOut.setValue(output_index, [0.0]);}



    if(defined(mat.emissiveFactor)){
            for (var i=0; i<3; i++) {
                EmissiveFactorOut.setValue(output_index*3+i, mat.emissiveFactor[i]);
            }
        }else{
            EmissiveFactorOut.setValue(output_index*3, 0);
            EmissiveFactorOut.setValue(output_index*3+1, 0);
            EmissiveFactorOut.setValue(output_index*3+2, 0);
        }





    if(defined(ext_spec_gloss.specularFactor)){
            for (var i=0; i<3; i++) {
                specularFactorOut.setValue(output_index*4+i, ext_spec_gloss.specularFactor[i]);
            }

        }else{
            specularFactorOut.setValue(output_index*4, 1);
            specularFactorOut.setValue(output_index*4+1, 1);
            specularFactorOut.setValue(output_index*4+2, 1);

        }

    if(defined(ext_spec_gloss.glossinessFactor)){
                specularFactorOut.setValue(output_index*4+3, ext_spec_gloss.glossinessFactor);
        }else{
            specularFactorOut.setValue(output_index*4+3, 1);
        }




}

    var textures = [];
    var alignment = 1;


    this.evaluate = function() {

    if (!this.renderContexts){ return;}
    var gl = this.renderContexts[0];
    if (!gl){ return;}
    if (this.contextChanged) {
            for (var i=0; i<textures.length; i++) {
              textures[i].context.deleteTexture(textures[i]);
            }
            textures = [];
    }

    var maxCount = glTF_In.getSliceCount();
    var index_offset=0;
    var texture_count = 0;
        for (var i=0; i<maxCount; i++) {

            if ( glTF_In.pinIsChanged() | Update.pinIsChanged()) {
                var glTF = glTF_In.getValue(i);


                var mesh_count;

                    mesh_count = glTF.data.mesh_primitives.length

                    index_offset = i * mesh_count;

                    for (var j=0; j<mesh_count; j++) {

                        var mesh_primitive_idx = glTF.data.mesh_primitives[j];

                        var output_index = index_offset + j;

                        loadTextures(gl, glTF, output_index, mesh_primitive_idx);

                    }
            }
            texture_count += mesh_count;
        }

        if(texture_count== undefined){
            texture_count = 1;

        }
        BaseColorOut.setSliceCount(texture_count);
        NormalOut.setSliceCount(texture_count);
        EmissiveOut.setSliceCount(texture_count);
        MetallicRoughnessOut.setSliceCount(texture_count);
        OcclusionOut.setSliceCount(texture_count);

        NormalScaleOut.setSliceCount(texture_count);
        EmissiveFactorOut.setSliceCount(texture_count*3);
        OcclusionStrengthOut.setSliceCount(texture_count);
        MetallicRoughnessValueOut.setSliceCount(texture_count*2);
        BaseColorValueOut.setSliceCount(texture_count*4);
        specularFactorOut.setSliceCount(texture_count*4);
        //Success.setSliceCount(mesh_array.length);


    }
}
VVVV.Nodes.TexturesGLTF.prototype = new Node();

///*
//  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   NODE: Nodes (glTF)
//   Author(s): David Gann
//  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  */

  VVVV.Nodes.NodesGLTF = function(id, graph) {
    this.constructor(id, "Nodes (glTF Transform)", graph);

    this.meta = {
      authors: ['David Gann'],
      original_authors: ['000.graphics'],
      credits: [],
      compatibility_issues: []
    };

    //input
    var glTF_In = this.addInputPin("glTF", [], VVVV.PinTypes.glTF);

    var AnimationFrame_In = this.addInputPin("AnimationFrame", [ ], VVVV.PinTypes.AnimationFrame);
    var Update= this.addInputPin('Update', [0], VVVV.PinTypes.Value);
    var trIn = this.addInputPin("Transform In", [], VVVV.PinTypes.Transform);
    //output
    var TransformMeshOut = this.addOutputPin("Transform Mesh", [], VVVV.PinTypes.Transform);
    var JointMatrixArrayOut = this.addOutputPin("JointMatrixArray UniformBuffer", [], VVVV.PinTypes.JointMatrixArray);

    function defined(value) {
        return value !== undefined && value !== null;
    }

    //As a quick fix for outdated gl-matrix.js lib use the relevant parts from the new lib locally
    //copyright Brandon Jones, for details see lib/gl-matrix.js in this repo
    if(!GLMAT_ARRAY_TYPE) {
        var GLMAT_ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
    }

    clone = function(a) {
        var out = new GLMAT_ARRAY_TYPE(16);
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[3];
        out[4] = a[4];
        out[5] = a[5];
        out[6] = a[6];
        out[7] = a[7];
        out[8] = a[8];
        out[9] = a[9];
        out[10] = a[10];
        out[11] = a[11];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
        return out;
    };

    create2 = function() {
      let out = new GLMAT_ARRAY_TYPE(16);
      out[0] = 1;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = 1;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[10] = 1;
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
      out[15] = 1;
      return out;
    }

    create_conversion_mat4x4 = function() {
      let out = new GLMAT_ARRAY_TYPE(16);
      out[0] = 1;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = 1;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[10] = -1;
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
      out[15] = 1;
      return out;
    }

    fromRotationTranslationScale = function(out, q, v, s) {
      // Quaternion math
      let x = q[0], y = q[1], z = q[2], w = q[3];
      let x2 = x + x;
      let y2 = y + y;
      let z2 = z + z;

      let xx = x * x2;
      let xy = x * y2;
      let xz = x * z2;
      let yy = y * y2;
      let yz = y * z2;
      let zz = z * z2;
      let wx = w * x2;
      let wy = w * y2;
      let wz = w * z2;
      let sx = s[0];
      let sy = s[1];
      let sz = s[2];

      out[0] = (1 - (yy + zz)) * sx;
      out[1] = (xy + wz) * sx;
      out[2] = (xz - wy) * sx;
      out[3] = 0;
      out[4] = (xy - wz) * sy;
      out[5] = (1 - (xx + zz)) * sy;
      out[6] = (yz + wx) * sy;
      out[7] = 0;
      out[8] = (xz + wy) * sz;
      out[9] = (yz - wx) * sz;
      out[10] = (1 - (xx + yy)) * sz;
      out[11] = 0;
      out[12] = v[0];
      out[13] = v[1];
      out[14] = v[2];
      out[15] = 1;

      return out;
    }

    multiply2 = function(out, a, b) {
      let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
      let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
      let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
      let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

      // Cache only the current line of the second matrix
      let b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
      out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
      out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
      out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
      out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

      b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
      out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
      out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
      out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
      out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

      b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
      out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
      out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
      out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
      out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

      b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
      out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
      out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
      out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
      out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
      return out;
    }


var    vec3_fromValues = function(x, y, z) {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
};

var quat_rotateY = function (out, a, rad) {
    rad *= 0.5;

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        by = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw - az * by;
    out[1] = ay * bw + aw * by;
    out[2] = az * bw + ax * by;
    out[3] = aw * bw - ay * by;
    return out;
};

    var transform_array = [];
    var mesh_index_array = [];

    var drawNodeRecursive = function(glTF, node, parentTransform, currentIndex, animation, isRoot) {

        var frame_idx = defined(animation.node_list) ? animation.node_list.indexOf(currentIndex) : -1;
        var target = "none"

        if(frame_idx !== -1){
            var target = animation.data[frame_idx].target_transform;
        }

        var localTransform = create2();

        if (node.matrix) { //get the matrix property from the node if available

            localTransform = clone(node.matrix);

        } else {

            localTransform = create2();

            if(target == "scale"){
                var scale = animation.data[frame_idx].frame_value;
            }else{
                var scale = node.scale ? node.scale : [1.0, 1.0, 1.0];
            }

            if(target == "rotation"){
                var rotation = animation.data[frame_idx].frame_value;
            }else{
                var rotation = node.rotation ? node.rotation : [0.0, 0.0, 0.0, 1.0];
            }

            if(target == "translation"){
                var translate = animation.data[frame_idx].frame_value;
            }else{
                var translate = node.translation ? node.translation : [0.0, 0.0, 0.0];
            }

            fromRotationTranslationScale(localTransform, rotation, translate, scale);

        }

        multiply2(localTransform, parentTransform, localTransform);

        if (defined(node.mesh)  ) {    //&& node.mesh < glTF.data.meshes.length
            var count = glTF.data.meshes[node.mesh].primitives.length;
            for (var i = 0; i < count; i++) {
            transform_array.push(localTransform);
            }
        }
        if (defined(node.children) && node.children.length > 0) {
            for (var i = 0; i < node.children.length; i++) {
                drawNodeRecursive(glTF, glTF.data.nodes[node.children[i]], localTransform, node.children[i], animation, false);
            }
        }
    };

    this.evaluate = function() {
    var maxCount = glTF_In.getSliceCount();
    var index_offset=0;


        for (var i=0; i<maxCount; i++) {
            if ( glTF_In.pinIsChanged() | Update.getValue(i) == 1 | AnimationFrame_In.pinIsChanged() || trIn.pinIsChanged()) {
                transform_array = [];
                mesh_index_array = [];
                var glTF = glTF_In.getValue(i);
                var animation = AnimationFrame_In.getValue(i);
                var scene_index = defined(glTF.data.scene) ? glTF.data.scene : 0;
                var scene = glTF.data.scenes[scene_index]
                var max_root_nodes = scene.nodes.length;
                for (var k=0; k<max_root_nodes ; k++) {
                    var root_node_index = scene.nodes[k];
                    var ParentConversion = create_conversion_mat4x4();
                    drawNodeRecursive(glTF, glTF.data.nodes[root_node_index], trIn.getValue(i), root_node_index, animation, true);

                }
                if(transform_array.length !== 0 || transform_array.length !== undefined){
                    for (var j=0; j<transform_array.length; j++) {
                        var output_transform = Array.from(transform_array[j]);
                        TransformMeshOut.setValue(j, output_transform);
                    }
                    TransformMeshOut.setSliceCount(transform_array.length);
                }else{
                    TransformMeshOut.setValue(0, create2());
                }
            }


        }



    }
}
VVVV.Nodes.NodesGLTF.prototype = new Node();



///*
//  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   NODE: Animation (glTF)
//   Author(s): David Gann
//  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  */

  VVVV.Nodes.AnimationGLTF = function(id, graph) {
    this.constructor(id, "Animation (glTF)", graph);

    this.meta = {
      authors: ['David Gann'],
      original_authors: ['000.graphics'],
      credits: [],
      compatibility_issues: []
    };

    //input
    var glTF_In = this.addInputPin("glTF", [], VVVV.PinTypes.glTF);
    var Time_in = this.addInputPin("GlobalTime", [0.0], VVVV.PinTypes.Value);
    var AnimationIndex_In = this.addInputPin("Animation Index", [0], VVVV.PinTypes.Value);
    var Update = this.addInputPin("Update", [0], VVVV.PinTypes.Value);
    //output
    var AnimationFrame_Out = this.addOutputPin("Node Animation", [], VVVV.PinTypes.AnimationFrame)

    //As a quick fix for outdated gl-matrix.js lib use the relevant parts from the new lib locally
    //copyright Brandon Jones, for details see lib/gl-matrix.js in this repo
    if(!GLMAT_ARRAY_TYPE) {
        var GLMAT_ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
    }

/**
 * Creates a new, empty vec4
 *
 * @returns {vec4} a new 4D vector
 */
vec4_create = function() {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    return out;
};
/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */
vec3_create = function() {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    return out;
};
var quat_slerp = function (out, a, b, t) {
    var ax = a[3], ay = a[0], az = a[1], aw = a[2],
        bx = b[3], by = b[0], bz = b[1], bw = a[2];

    var cosHalfTheta = ax * bx + ay * by + az * bz + aw * bw,
        halfTheta,
        sinHalfTheta,
        ratioA,
        ratioB;

    if (Math.abs(cosHalfTheta) >= 1.0) {
        if (out !== a) {
            out[0] = ax;
            out[1] = ay;
            out[2] = az;
            out[3] = aw;
        }
        return out;
    }

    halfTheta = Math.acos(cosHalfTheta);
    sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);

    if (Math.abs(sinHalfTheta) < 0.001) {
        out[0] = (ax * 0.5 + bx * 0.5);
        out[1] = (ay * 0.5 + by * 0.5);
        out[2] = (az * 0.5 + bz * 0.5);
        out[3] = (aw * 0.5 + bw * 0.5);
        return out;
    }

    ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
    ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

    out[0] = (ax * ratioA + bx * ratioB);
    out[1] = (ay * ratioA + by * ratioB);
    out[2] = (az * ratioA + bz * ratioB);
    out[3] = (aw * ratioA + bw * ratioB);

    return out;
};

    function defined(value) {
        return value !== undefined && value !== null;
    }

var targetAnimation_array = []

function _arrayBuffer2TypedArray(buffer, byteOffset, countOfComponentType, componentType) {
    switch(componentType) {
        // @todo: finish
        case 5120: return new Int8Array(buffer, byteOffset, countOfComponentType);
        case 5121: return new Uint8Array(buffer, byteOffset, countOfComponentType);
        case 5122: return new Int16Array(buffer, byteOffset, countOfComponentType);
        case 5123: return new Uint16Array(buffer, byteOffset, countOfComponentType);
        case 5124: return new Int32Array(buffer, byteOffset, countOfComponentType);
        case 5125: return new Uint32Array(buffer, byteOffset, countOfComponentType);
        case 5126: return new Float32Array(buffer, byteOffset, countOfComponentType);
        default: return null;
    }
}

var Type2NumOfComponent = {
    'SCALAR': 1,
    'VEC2': 2,
    'VEC3': 3,
    'VEC4': 4,
    'MAT2': 4,
    'MAT3': 9,
    'MAT4': 16
};

function accessor(glTF, accessor_index){
    //accessor
    var bufferView_index = glTF.data.accessors[ accessor_index ].bufferView;
    var vec_type = glTF.data.accessors[accessor_index].type;
    var type = Type2NumOfComponent[vec_type];

    var byteLength = glTF.data.bufferViews[bufferView_index].byteLength;
    var byteOffset_bufferview = defined(glTF.data.bufferViews[bufferView_index].byteOffset) ? glTF.data.bufferViews[bufferView_index].byteOffset : 0;

    //var buffer_data = glTF.buffer[glTF.data.bufferViews[bufferView_index].buffer];
    //var accessor_buffer_data = buffer_data.slice(byteOffset_bufferview, byteOffset_bufferview + byteLength);

    var componentType = glTF.data.accessors[ accessor_index ].componentType;
    var ComponentType_count = glTF.data.accessors[ accessor_index ].count;
    var byteOffset_accessor = defined(glTF.data.accessors[ accessor_index ].byteOffset) ? glTF.data.accessors[ accessor_index ].byteOffset : 0;
    var typedArray = _arrayBuffer2TypedArray(glTF.buffer[glTF.data.bufferViews[bufferView_index].buffer], byteOffset_bufferview + byteOffset_accessor,  type * ComponentType_count, componentType);
    return typedArray;
}

function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function map_normalized(input, time_min, time_max){
    var output = ((time_max + (input - time_min) % time_max) % time_max)  / time_max;
    if (isNaN(output)){
        output = 0;
    }


    return output
}

/**
 * Performs a linear interpolation between two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec4} out
 */
var vec4_lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1],
        az = a[2],
        aw = a[3];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    out[3] = aw + t * (b[3] - aw);
    return out;
};
/**
 * Performs a linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec3} out
 */
var vec3_lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1],
        az = a[2];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    return out;
};


function getAnimationFrame(glTF, anim_index, t, AnimationFrame){

    var animation = glTF.data.animations[anim_index]

    var input_array = null;
    var output_array = null;

    for (var i=0; i<animation.channels.length; i++) {
        if(defined(animation.channels[i].target.node) == false) {
        continue;
        }
        var sampler_index = animation.channels[i].sampler;

        var input_index = animation.samplers[sampler_index].input;
        var output_index = animation.samplers[sampler_index].output;

        var input_array =  accessor(glTF, input_index);
        var output_array =  accessor(glTF, output_index);

        var t_max = glTF.data.accessors[input_index].max;
        var t_min = glTF.data.accessors[input_index].min;
        var rel_t_max = t_max - t_min;
        var count = glTF.data.accessors[input_index].count;

        var curIdx = 0;
        if (t > t_max) {
            t -= rel_t_max * Math.ceil((t - t_max) / rel_t_max);
            curIdx = 0;
        }

        while (curIdx <= count - 2 && t >= input_array[curIdx + 1]) {
            curIdx++;
        }

        if (curIdx >= count - 1) {
            // loop
            t -= rel_t_max;
            curIdx = 0;
        }

        var vec_type = glTF.data.accessors[output_index].type;
        var type_count = Type2NumOfComponent[vec_type];

        var o = i * type_count;
        var on = o + type_count;

        var u = Math.max(0, t - input_array[curIdx]) / ( input_array[curIdx + 1] - input_array[curIdx ])

        var target_transform = animation.channels[i].target.path;

        if(target_transform == "rotation"){

            var animationOutputValueVec4a = vec4_create();
            var animationOutputValueVec4b = vec4_create();
            for (var j = 0; j < type_count; j++ ) {
                animationOutputValueVec4a[j] = output_array[o + j];
                animationOutputValueVec4b[j] = output_array[on + j];
            }
            var output_value = vec4_create();
            //This quat_slerp has a w x y z layout, opposed to the original gl.matrix which has x y z w - adapting to the glTF specs here
            quat_slerp(output_value, animationOutputValueVec4a, animationOutputValueVec4b, u);

        }else{   //if "scale" or "translate"
            var animationOutputValueVec3a = vec3_create();
            var animationOutputValueVec3b = vec3_create();
            for (var j = 0; j < type_count; j++ ) {
                animationOutputValueVec3a[j] = output_array[o + j];
                animationOutputValueVec3b[j] = output_array[on + j];
            }
            var output_value = vec3_create();
            vec3_lerp(output_value, animationOutputValueVec3a, animationOutputValueVec3b, u);
        }



        var target_node = animation.channels[i].target.node;

        AnimationFrame.setTargetFrame(i, output_value, target_node, target_transform);
    }

}


    this.evaluate = function() {
    var maxCount = glTF_In.getSliceCount();

    var index_offset=0;
    var output_count;
    var iterator = 0;
        for (var i=0; i<maxCount; i++) {
            var glTF = glTF_In.getValue(i);
            var AnimationFrame = new VVVV.Types.AnimationFrame();
            if(defined(glTF.data.animations)){
                var anim_index = AnimationIndex_In.getValue(i);
                var time = Time_in.getValue(i);


                getAnimationFrame(glTF, anim_index, time, AnimationFrame);

            }

            AnimationFrame_Out.setValue(i, AnimationFrame);




        }

        //var default_AnimationFrame = new VVVV.Types.JointMatrixArray();

    }
}
VVVV.Nodes.AnimationGLTF.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: glTF_PBR_core (glTF webgl shader)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.glTF_PBR_core = function(id, graph) {
    this.constructor(id, "glTF_PBR_core (glTF webgl shader)", graph);

    this.auto_nil = false;

    this.meta = {
      authors: ['David Gann'],
      original_authors: ['000.graphics'],
      credits: [],
      compatibility_issues: ['No Sampler States', 'No texture coord mapping', 'No enable pin', 'Transprent pixels are discarded by default']
    };
    this.environments = ['browser'];

    this.auto_evaluate = false;

    var renderStateIn = this.addInputPin("Render State", [], VVVV.PinTypes.WebGlRenderState);
    var meshIn = this.addInputPin("Mesh", [], VVVV.PinTypes.WebGlResource);
    var VSDefinesIn = this.addInputPin("VS Defines", [''], VVVV.PinTypes.String);
    var PSDefinesIn = this.addInputPin("PS Defines", [''], VVVV.PinTypes.String);
    var definesIn = this.addInputPin("Defines", [], VVVV.PinTypes.Defines);
    this.addInputPin("Transform", [], VVVV.PinTypes.Transform);
    this.addInputPin("TextureTransform", [], VVVV.PinTypes.Transform);
    this.addInputPin("LightDirection", [1.0,1.0,1.0], VVVV.PinTypes.Value);
    this.addInputPin("LightColor", [1.0,1.0,1.0], VVVV.PinTypes.Value);

    this.addInputPin("Camera", [0.0,0.0,0.0], VVVV.PinTypes.Value);

    this.addInputPin("DiffuseEnvSampler", [], VVVV.PinTypes.WebGlTexture);
    this.addInputPin("SpecularEnvSampler", [], VVVV.PinTypes.WebGlTexture);
    this.addInputPin("brdfLUT", [], VVVV.PinTypes.WebGlTexture);
    this.addInputPin("BaseColorSampler", [], VVVV.PinTypes.WebGlTexture);
    this.addInputPin("NormalSampler", [], VVVV.PinTypes.WebGlTexture);
    this.addInputPin("EmissiveSampler", [], VVVV.PinTypes.WebGlTexture);
    this.addInputPin("MetallicRoughnessSampler", [], VVVV.PinTypes.WebGlTexture);
    this.addInputPin("OcclusionSampler", [], VVVV.PinTypes.WebGlTexture);

    this.addInputPin("BaseColorFactor", [1.0,1.0,1.0,1.0], VVVV.PinTypes.Value);
    this.addInputPin("NormalScale", [1.0,1.0,1.0], VVVV.PinTypes.Value);
    this.addInputPin("EmissiveFactor", [1.0,1.0,1.0], VVVV.PinTypes.Value);
    this.addInputPin("OcclusionStrength", [1.0], VVVV.PinTypes.Value);
    this.addInputPin("MetallicRoughnessValues", [1.0,1.0], VVVV.PinTypes.Value);

    this.addInputPin("spec_gloss_specularFactor", [1.0,1.0,1.0,1.0], VVVV.PinTypes.Value);


    this.addInputPin("Exposure", [0.0], VVVV.PinTypes.Value);
    this.addInputPin("Alpha", [1.0], VVVV.PinTypes.Value);


  var layerOut = this.addOutputPin("Layer", [], VVVV.PinTypes.WebGlResource);

  var initialized = false;
  var layers = [];
  var mesh = null;
  var shader = [];
      var shader_HasLoaded = 0;
  //shader[0] = null;


    function initShader(gl, vertexShaderCode, fragmentShaderCode){

        var  shader = new VVVV.Types.ShaderProgram();


        shader.attributeSpecs =  {
            "a_Position":{"varname":"a_Position","semantic":"POSITION","position":0},
            "a_Normal":{"varname":"a_Normal","semantic":"NORMAL","position":0},
            "a_Tangent":{"varname":"a_Tangent","semantic":"TANGENT","position":0},
            "a_UV":{"varname":"a_UV","semantic":"TEXCOORD0","position":0}
        };

        shader.attribSemanticMap = {
            "POSITION":"a_Position",
            "NORMAL":"a_Normal",
            "TANGENT":"a_Tangent",
            "TEXCOORD0":"a_UV"
        };

        shader.uniformSpecs = {
            "Texture_Transform":{"varname":"Texture_Transform","position":0,"type":"mat","dimension":"4"},
            "tW":{"varname":"tW","semantic":"WORLD","position":0,"type":"mat","dimension":"4"},
            "tV":{"varname":"tV","semantic":"VIEW","position":0,"type":"mat","dimension":"4"},
            "tP":{"varname":"tP","semantic":"PROJECTION","position":0,"type":"mat","dimension":"4"},
            "u_LightDirection":{"varname":"u_LightDirection","position":0,"type":"vec","dimension":"3"},
            "u_LightColor":{"varname":"u_LightColor","position":0,"type":"vec","dimension":"3"},
            "u_DiffuseEnvSampler":{"varname":"u_DiffuseEnvSampler","position":0,"type":"samplerCube","dimension":"1"},
            "u_SpecularEnvSampler":{"varname":"u_SpecularEnvSampler","position":0,"type":"samplerCube","dimension":"1"},
            "u_brdfLUT":{"varname":"u_brdfLUT","position":0,"type":"sampler","dimension":"2D"},
            "u_BaseColorSampler":{"varname":"u_BaseColorSampler","position":0,"type":"sampler","dimension":"2D"},
            "u_NormalSampler":{"varname":"u_NormalSampler","position":0,"type":"sampler","dimension":"2D"},
            "u_NormalScale":{"varname":"u_NormalScale","position":0,"type":"float","dimension":"1"},
            "u_EmissiveSampler":{"varname":"u_EmissiveSampler","position":0,"type":"sampler","dimension":"2D"},
            "u_EmissiveFactor":{"varname":"u_EmissiveFactor","position":0,"type":"vec","dimension":"3"},
            "u_MetallicRoughnessSampler":{"varname":"u_MetallicRoughnessSampler","position":0,"type":"sampler", "dimension":"2D"},
            "u_OcclusionSampler":{"varname":"u_OcclusionSampler","position":0,"type":"sampler","dimension":"2D"},
            "u_OcclusionStrength":{"varname":"u_OcclusionStrength","position":0,"type":"float","dimension":"1"},
            "u_MetallicRoughnessValues":{"varname":"u_MetallicRoughnessValues","position":0,"type":"vec","dimension":"2"},
            "u_BaseColorFactor":{"varname":"u_BaseColorFactor","position":0,"type":"vec","dimension":"4"},
            "u_Camera":{"varname":"u_Camera","position":0,"type":"vec","dimension":"3"},
            "exposure":{"varname":"exposure","position":0,"type":"float","defaultValue":"0.0","dimension":"1"},
            "alpha":{"varname":"alpha","position":0,"type":"float","defaultValue":"1.0","dimension":"1"},

            "spec_gloss_specularFactor":{"varname":"spec_gloss_specularFactor","position":0,"type":"vec","dimension":"4"},

        };

        shader.uniformSemanticMap = {
             "WORLD":"tW",
             "VIEW":"tV",
             "PROJECTION":"tP"
         };

        shader.setFragmentShader(fragmentShaderCode);
        shader.setVertexShader(vertexShaderCode);
        shader.setup(gl);
        return shader;
    }

function addDefines(code, defines){

    var define_string = "";

    Object.keys(defines.defines).forEach(function(key) { //not yet tested against multiple buffers in glTF file
       if(defines.defines[key]){
           define_string += "#define " + key + "\n";
       }
    });
    code = define_string + code;

    return code
}

  var load_uniforms = true;
  this.evaluate = function() {

    if (!this.renderContexts) return;
    var gl = this.renderContexts[0];

    if (!gl)
      return;
    if (this.contextChanged ) {
        shader_HasLoaded = 0;
    if(shader_HasLoaded == 0){
        $.ajax({ type: "GET",
                 //url: VVVVContext.Root + '/effects/test_shader.vvvvjs.fx',
                 url: VVVVContext.Root + '/effects/PBR_glTF_core.vvvvjs.fx',
                 async: true,
                 success : function(text)
                 {
                    shaderCode = text;
                    var technique = " ";
                    var vsRegEx = new RegExp('vertex_shader(\\{([a-zA-Z0-9]+,\\s*)*'+technique+'(,\\s*[a-zA-Z0-9]+)*\\})?:([\\s\\S]*?)(vertex_shader|fragment_shader)');
                    var psRegEx = new RegExp('fragment_shader(\\{([a-zA-Z0-9]+,\\s*)*'+technique+'(,\\s*[a-zA-Z0-9]+)*\\})?:([\\s\\S]*?)(vertex_shader|fragment_shader)');
                    var match;
                    match = /STARTOFSTRING((\r?\n|.)*?)(vertex_shader|fragment_shader)/.exec('STARTOFSTRING'+shaderCode);
                    if ((match = vsRegEx.exec(shaderCode+'\nfragment_shader'))==undefined) {
                      console.log('ERROR: No vertex shader code for technique '+technique+' found');
                      return;
                    }
                    vertexShaderCode = match[4];
                    vertexShaderCode = VSDefinesIn.getValue(0) + vertexShaderCode;
                    if ((match = psRegEx.exec(shaderCode+'\nfragment_shader'))==undefined) {
                      console.log('ERROR: No fragment shader code for technique '+technique+' found');
                      return;
                    }
                    fragmentShaderCode = match[4];
                    fragmentShaderCode = PSDefinesIn.getValue(0) + fragmentShaderCode;
                    shader_HasLoaded = 1;
                }
        });
    }
    }

     var maxSize = Math.max(meshIn.getSliceCount(), this.inputPins["Transform"].getSliceCount());//this.getMaxInputSliceCount();
    //layer management
    var currentLayerCount = layers.length;
    if (this.contextChanged)
        currentLayerCount = 0;
    // shorten layers array, if input slice count decreases
    if (!meshIn.isConnected() || meshIn.getValue(0)==undefined || shader_HasLoaded == 0){
        maxSize = 0;
    }
    if (maxSize<currentLayerCount) {
        layers.splice(maxSize, currentLayerCount-maxSize);
    }


    //here starts the trouble//


    var update = false;
    var uniforms_uploaded = false;
    if ( definesIn.pinIsChanged() ) {

        load_uniforms = true;
    }



    if(shader_HasLoaded == 1 && load_uniforms){
    for (var j=0; j<maxSize; j++) {
        console.log("updateing");
        //vertexShaderCode = VSDefinesIn.getValue(j) + vertexShaderCode;
        //fragmentShaderCode = PSDefinesIn.getValue(j) + fragmentShaderCode;

        var defines = definesIn.getValue(j);

        var vertexShaderCode_def = addDefines(vertexShaderCode, defines);
        var fragmentShaderCode_def = addDefines(fragmentShaderCode, defines);

        shader[j] = null;
        shader[j] = initShader(gl, vertexShaderCode_def, fragmentShaderCode_def)

        layers[j] = new VVVV.Types.Layer();
        layers[j].mesh = meshIn.getValue(j);
        layers[j].shader = shader[j];

        _(shader[j].uniformSpecs).each(function(u) {
            layers[j].uniformNames.push(u.varname);
            layers[j].uniforms[u.varname] = { uniformSpec: u, value: undefined };
        });
    }
    uniforms_uploaded = true;
    load_uniforms = false;
    update = true;
    }




    var transformChanged = this.inputPins["Transform"].pinIsChanged();
    var textureChanged = this.inputPins["BaseColorSampler"].pinIsChanged();



    if (renderStateIn.pinIsChanged() || update) {
      for (var i=0; i<maxSize; i++) {
        if (renderStateIn.isConnected())
          layers[i].renderState = renderStateIn.getValue(i);
        else
          layers[i].renderState = VVVV.DefaultRenderState;
      }
    }


    if (meshIn.pinIsChanged() || update) {
      for (var i=0; i<maxSize; i++) {
        if (meshIn.isConnected())
          layers[i].mesh = meshIn.getValue(i);
        else
          layers[i].mesh = null;
      }
    }

    if (transformChanged || update) {
      for (var i=0; i<maxSize; i++) {
        var transform = this.inputPins["Transform"].getValue(i);
        layers[i].uniforms[layers[i].shader.uniformSemanticMap['WORLD']].value = transform;
      }
    }
    //textures
    if (this.inputPins["BaseColorSampler"].pinIsChanged() || update) {
      for (var i=0; i<maxSize; i++) {
        layers[i].uniforms["u_BaseColorSampler"].value = this.inputPins["BaseColorSampler"].getValue(i);
      }
    }
    if (this.inputPins["NormalSampler"].pinIsChanged() || update) {
      for (var i=0; i<maxSize; i++) {
        layers[i].uniforms["u_NormalSampler"].value = this.inputPins["NormalSampler"].getValue(i);
      }
    }
    if (this.inputPins["EmissiveSampler"].pinIsChanged() || update) {
      for (var i=0; i<maxSize; i++) {
        layers[i].uniforms["u_EmissiveSampler"].value = this.inputPins["EmissiveSampler"].getValue(i);
      }
    }
    if (this.inputPins["OcclusionSampler"].pinIsChanged() || update) {
      for (var i=0; i<maxSize; i++) {
        layers[i].uniforms["u_OcclusionSampler"].value = this.inputPins["OcclusionSampler"].getValue(i);
      }
    }
    if (this.inputPins["MetallicRoughnessSampler"].pinIsChanged() || update) {
      for (var i=0; i<maxSize; i++) {
        layers[i].uniforms["u_MetallicRoughnessSampler"].value = this.inputPins["MetallicRoughnessSampler"].getValue(i);
      }
    }
    if (this.inputPins["brdfLUT"].pinIsChanged() || update) {
      for (var i=0; i<maxSize; i++) {
        layers[i].uniforms["u_brdfLUT"].value = this.inputPins["brdfLUT"].getValue(i);
      }
    }
    if (this.inputPins["DiffuseEnvSampler"].pinIsChanged() || update) {
      for (var i=0; i<maxSize; i++) {
        layers[i].uniforms["u_DiffuseEnvSampler"].value = this.inputPins["DiffuseEnvSampler"].getValue(i);
      }
    }
    if (this.inputPins["SpecularEnvSampler"].pinIsChanged() || update) {
      for (var i=0; i<maxSize; i++) {
        layers[i].uniforms["u_SpecularEnvSampler"].value = this.inputPins["SpecularEnvSampler"].getValue(i);
      }
    }
    //uniforms
    if (this.inputPins["LightDirection"].pinIsChanged() || update) {
      for (var i=0; i<maxSize; i++) {
        layers[i].uniforms["u_LightDirection"].value = this.inputPins["LightDirection"].getValue(i,3);
      }
    }
    if (this.inputPins["LightColor"].pinIsChanged() || update) {
      for (var i=0; i<maxSize; i++) {
        layers[i].uniforms["u_LightColor"].value = this.inputPins["LightColor"].getValue(i,3);
      }
    }
    if (this.inputPins["NormalScale"].pinIsChanged() || update) {
      for (var i=0; i<maxSize; i++) {
        layers[i].uniforms["u_NormalScale"].value = this.inputPins["NormalScale"].getValue(i);
      }
    }
    if (this.inputPins["EmissiveFactor"].pinIsChanged() || update) {
      for (var i=0; i<maxSize; i++) {
        layers[i].uniforms["u_EmissiveFactor"].value = this.inputPins["EmissiveFactor"].getValue(i,3);
      }
    }
    if (this.inputPins["OcclusionStrength"].pinIsChanged() || update) {
      for (var i=0; i<maxSize; i++) {
        layers[i].uniforms["u_OcclusionStrength"].value = this.inputPins["OcclusionStrength"].getValue(i);
      }
    }
    if (this.inputPins["MetallicRoughnessValues"].pinIsChanged() || update) {
      for (var i=0; i<maxSize; i++) {
        layers[i].uniforms["u_MetallicRoughnessValues"].value = this.inputPins["MetallicRoughnessValues"].getValue(i,2);
      }
    }
    if (this.inputPins["BaseColorFactor"].pinIsChanged() || update) {
      for (var i=0; i<maxSize; i++) {
        layers[i].uniforms["u_BaseColorFactor"].value = this.inputPins["BaseColorFactor"].getValue(i,4);
      }
    }
    if (this.inputPins["Camera"].pinIsChanged() || update) {
      for (var i=0; i<maxSize; i++) {
        layers[i].uniforms["u_Camera"].value = this.inputPins["Camera"].getValue(i,3);
      }
    }
    if (this.inputPins["Exposure"].pinIsChanged() || update) {
      for (var i=0; i<maxSize; i++) {
        layers[i].uniforms["exposure"].value = this.inputPins["Exposure"].getValue(i);
      }
    }
    if (this.inputPins["Alpha"].pinIsChanged() || update) {
      for (var i=0; i<maxSize; i++) {
        layers[i].uniforms["alpha"].value = this.inputPins["Alpha"].getValue(i);
      }
    }

      if (this.inputPins["TextureTransform"].pinIsChanged() || update) {
      for (var i=0; i<maxSize; i++) {
        var transform = this.inputPins["TextureTransform"].getValue(i);
        layers[i].uniforms["Texture_Transform"].value = transform;
      }
    }

    if (this.inputPins["spec_gloss_specularFactor"].pinIsChanged() || update) {
      for (var i=0; i<maxSize; i++) {
        layers[i].uniforms["spec_gloss_specularFactor"].value = this.inputPins["spec_gloss_specularFactor"].getValue(i,4);
      }
    }

    update = false;



    this.outputPins["Layer"].setSliceCount(maxSize);
    for (var i=0; i<maxSize; i++) {
      this.outputPins["Layer"].setValue(i, layers[i]);
    }

    this.contextChanged = false;
    update = false;
  }

}
VVVV.Nodes.glTF_PBR_core.prototype = new Node();

///*
//  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   NODE: Defines (glTF)
//   Author(s): David Gann
//  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  */

  VVVV.Nodes.DefinesGLTF = function(id, graph) {
    this.constructor(id, "Defines (glTF)", graph);

    this.meta = {
      authors: ['David Gann'],
      original_authors: ['000.graphics'],
      credits: [],
      compatibility_issues: []
    };

    //input
    var glTF_In = this.addInputPin("glTF", [], VVVV.PinTypes.glTF);
    var Update= this.addInputPin('Update', [0], VVVV.PinTypes.Value);
    //output
    var definesOut = this.addOutputPin("Defines", [], VVVV.PinTypes.Defines);
    var VsDefinesOut = this.addOutputPin("VS Defines", [""], VVVV.PinTypes.String);
    //var Success = this.addOutputPin("Success", [0.0], VVVV.PinTypes.Value);


 function defined(value) {
        return value !== undefined && value !== null;
    }


    this.evaluate = function() {


    var maxCount = glTF_In.getSliceCount();
    var index_offset=0;
    var output_count;
    var iterator = 0;
    if(glTF_In.isConnected()){
        for (var i=0; i<maxCount; i++) {
            if (  glTF_In.pinIsChanged()) {

                var glTF = glTF_In.getValue(i);

                var mesh_count = glTF.data.mesh_primitives.length;

                index_offset = i *  mesh_count;

                for (var j=0; j<mesh_count; j++) {

                    var defines = new VVVV.Types.Defines();

                    defines.setDefines(glTF.data.mesh_primitives[j].defines)

                    var output_index = index_offset + j;

                    definesOut.setValue(j, defines.data)

                }

            }
        }
    definesOut.setSliceCount(mesh_count);
    }else{
        var defaultDefine = new VVVV.Types.Defines();
        definesOut.setValue(0, defaultDefine.data)
        definesOut.setSliceCount(1);
    }



    }
}
VVVV.Nodes.DefinesGLTF.prototype = new Node();

});
