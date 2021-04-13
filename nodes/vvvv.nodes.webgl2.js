// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }
define(function(require,exports) {

  var $ = require('jquery');
  var _ = require('underscore');
var Node = require('core/vvvv.core.node');
var VVVV = require('core/vvvv.core.defines');
var webglUtils = require('webgl2/webgl-utils');
var glMat = require('webgl2/gl-matrix27');

//the big change against webgl implementation is that gl is defined globally.

var webgl2gl = undefined;

/////////////////////////////////////Global

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
 * @param {WebGL2Context} gl the WebGL context
 * @param {VVVV.Core.VertexBuffer} the vertex data
 * @param {Array} indices the list of indices
 */

 //##############################################################################################
 ///////////////////////////////////////////WebGL2 Geometry/////////////////////////////
 //##############################################################################################
 //##############################################################################################

var default_Geometry = {
  Position: [],
  Normal: [],
  Tangent: [],
  Texcoord_0: [],
  Texcoord_1: [],
  Texcoord_2: [],
  Texcoord_3: [],
  Color_0: [],
  Color_1: [],
  Color_2: [],
  Color_3: [],
  Joints_0: [],
  Joints_1: [],
  Weights_0: [],
  Weights_1: []

}




 //##############################################################################################
 ///////////////////////////////////////////WebGL2 Mesh/////////////////////////////
 //##############################################################################################
 //##############################################################################################

VVVV.Types.WebGL2Mesh = function(gl, vertexBuffer, indices) {
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


VVVV.Types.default_WebGL2Mesh = function() {
  /** @member */
  this.vertexBuffer = {};
  /** @member */
  this.indexBuffer = {};

  //this.instancedBuffer = gl.createBuffer();
   this.instanceBuffers = [];
      this.semantics = [];
   this.VectorSize = [];
   this.Divisor = [];

  /** @member */
  this.instanced = false;
  this.isUint32 = false;

  /** @member */
  this.instanceCount = 1.0;

  this.instancedBufferChanged = false;

}

//##############################################################################################
///////////////////////////////////////////WebGL2 Datatypes/////////////////////////////
//##############################################################################################
//##############################################################################################



/**
 * vertex shader
 *
 * @class
 * @constructor
 */
VVVV.Types.VertexShader = function() {
  /** @type VVVV.Types.ShaderProgram */
  this.shader = null;
  /** An array of WebGlTexture objects */
  this.textures = [];
  /** @member */
  this.uniforms = {};
  /** @member */
  this.defines = {};
}

VVVV.Types.PixelShader = function() {
  /** @type VVVV.Types.ShaderProgram */
  this.shader = null;
  /** An array of WebGlTexture objects */
  this.textures = [];
  /** @member */
  this.uniforms = {};
  /** @member */
  this.defines = {};
}

/**
 * A Layer is the sum of a mesh, textures, render state, shaders and it parameters. Usually, a Layer object is the output
 * of a shader node and flows into a Renderer (EX9) or Group (EX9) node.
 * @class
 * @constructor
 */
VVVV.Types.WebGL2Layer = function() {
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
 VVVV.PinTypes.WebGL2Resource = {
   typeName: "WebGL2Resource",
   reset_on_disconnect: true,
   connectionChangedHandlers: {
     "WebGL2resource": function() {
       if (this.direction==VVVV.PinDirection.Input)
         return;
       var that = this.node
       var renderers = that.findDownstreamNodes('Renderer (WebGL2)');
       console.log(renderers);
       if (!that.renderContexts)
         that.renderContexts = []; // this 'public property' should actually go to the top, right above this.setAsWebGL2ResourcePin. However, that doesnt work, values got overwritte by nodes of the same type.
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

       function isWebGL2PinType(typeName) {
         return typeName=="WebGL2Resource" || typeName=="WebGL2Texture";
       }

       if (!that.isSubpatch) {
         _(that.inputPins).each(function(p) {
           var fromPin;
           p.markPinAsChanged();
           if (that.nodename!="Renderer (WebGL2)") {
             if (p.isConnected()) {
               if (p.links.length>0)
                 fromPin = p.links[0].fromPin
               else if (p.masterPin.links[0].fromPin.links.length>0)
                 fromPin = p.masterPin.links[0].fromPin;
               if (fromPin && isWebGL2PinType(fromPin.typeName))
                 fromPin.connectionChanged();
             }
           }
         });
       }

       if (this.masterPin && isWebGL2PinType(this.masterPin.typeName))
         this.masterPin.connectionChanged();
     }
   },
   defaultValue: function() {
     return new VVVV.Types.WebGL2Layer();
   }
 }

 /**
  * The WebGL2Texture Pin Type, has the same connectionChangedHandler as {@link VVVV.PinTypes.WebGL2Resource}.
  * @mixin
  * @property {String} typeName "WebGL2Texture"
  * @property {Boolean} reset_on_disconnect true
  * @property {Object} connectionChangedHandlers "WebGL2resource" => function
  * @property {Function} defaultValue a function returning {@link VVVV.DefaultTexture}
  */
 VVVV.PinTypes.WebGL2Texture = {
   typeName: "WebGL2Texture",
   reset_on_disconnect: true,
   connectionChangedHandlers: {
     "WebGL2resource": VVVV.PinTypes.WebGL2Resource.connectionChangedHandlers["WebGL2resource"]
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





VVVV.Types.Scene = function(data) {
  this.data = data;
  }

VVVV.PinTypes.Scene = {
  typeName: "Scene",
  reset_on_disconnect: true,
  defaultValue: function() {
    return "No Scene"
  }
}

function defined(value) {
       return value !== undefined && value !== null;
   }

   function undefined(value) {
          return value == undefined || value == null;
      }








      /////////////////////////////////////////////////////////////////////////////////////////////////
      /////////////////////////////////////////////////////////////////////////////////////////////////
      ///////////////////////////////////////////NODES/////////////////////////////////////////////////
      /////////////////////////////////////////////////////////////////////////////////////////////////
      /////////////////////////////////////////////////////////////////////////////////////////////////


      /*
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
       NODE: PrimitivesWebGL2 (WebGL2)
       Author(s): Luna Nane
       Original Node Author(s): VVVV Group
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      */

      VVVV.Nodes.PrimitivesWebGL2 = function(id, graph) {
        this.constructor(id, "Primitives (WebGL2)", graph);

        this.auto_nil = false;

        this.auto_evaluate = true;

        this.meta = {
          authors: ['Luna Nane'],
        };
        var selectIn = this.addInputPin("Primitive Index", [0.0], VVVV.PinTypes.Value);

        var meshOut = this.addOutputPin("Geometry", [], VVVV.PinTypes.WebGl2Resource);

        var mesh = null;

        this.initialize = function() {



            var gl = webgl2gl;
            if (undefined(webgl2gl)){
              meshOut.setValue(0, new VVVV.Types.default_WebGL2Mesh() );
               return;

            }

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

            mesh = new VVVV.Types.WebGL2Mesh(gl, vertexBuffer, indices);
            mesh.update(indices);
           console.log(mesh)
            meshOut.setValue(0, mesh);
        }

        this.evaluate = function() {

            if(defined(webgl2gl)){
              console.log(defined(webgl2gl))
              this.initialize();
            }

          }
        }

      VVVV.Nodes.PrimitivesWebGL2.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: ConstantVS (WebGL2 VertexShader)
 Author(s): Luna Nane

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/


    VVVV.Nodes.ConstantVS = function(id, graph) {
        this.constructor(id, "ConstantVS (WebGL2 VertexShader)", graph);

        this.meta = {
          authors: ['Luna Nane'],
        };

        this.auto_evaluate = true;

////////////////pins

        var LayerOut = this.addOutputPin('VertexShader', [], VVVV.PinTypes.WebGl2Resource);

////////////////functions



///////////////Init
          this.initialize = function() {


          }
//////////////Runtime
          this.evaluate = function()
          {

            var vertexShaderSource = `#version 300 es

            // an attribute is an input (in) to a vertex shader.
            // It will receive data from a buffer
            in vec4 a_position;
            uniform mat4 u_tW;
            uniform mat4 u_tV;
            uniform mat4 u_tP;

            // all shaders have a main function
            void main() {

              // gl_Position is a special variable a vertex shader
              // is responsible for setting

              mat4 tWV = u_tV * u_tW;
              mat4 tWVP = u_tP * tWV;

              //vec4 pos = u_tW * a_position;

              gl_Position = tWVP * a_position;
            }
            `;



            LayerOut.setValue(0, new VVVV.Types.VertexShader)

          }
    }
    VVVV.Nodes.ConstantVS.prototype = new Node();


    /*
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     NODE: ConstantPS (WebGL2 VertexShader)
     Author(s): Luna Nane

    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    */


        VVVV.Nodes.ConstantPS = function(id, graph) {
            this.constructor(id, "ConstantPS (WebGL2 PixelShader)", graph);

            this.meta = {
              authors: ['Luna Nane'],
            };

            this.auto_evaluate = true;

    ////////////////pins

            var LayerOut = this.addOutputPin('VertexShader', [], VVVV.PinTypes.WebGl2Resource);

    ////////////////functions

              var fragmentShaderSource = `#version 300 es

              // fragment shaders don't have a default precision so we need
              // to pick one. mediump is a good default. It means "medium precision"
              precision mediump float;

              // we need to declare an output for the fragment shader
              out vec4 outColor;

              void main() {
                // Just set the output to a constant redish-purple
                outColor = vec4(1, 0, 0.5, 1);
              }
              `;

    ///////////////Init
              this.initialize = function() {


              }
    //////////////Runtime
              this.evaluate = function()
              {

                var VS_Object = new VVVV.Types.VertexShader;


                LayerOut.setValue(0, VS_Object)

              }
        }
        VVVV.Nodes.ConstantPS.prototype = new Node();



/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: LayerComposer (WebGL2)
 Author(s): Luna Nane

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/


    VVVV.Nodes.LayerComposer = function(id, graph) {
        this.constructor(id, "LayerComposer (WebGL2)", graph);

        this.meta = {
          authors: ['Luna Nane'],
        };

        this.auto_evaluate = true;

////////////////pins
        var geometryIn = this.addInputPin("Geometry", [], VVVV.PinTypes.WebGl2Resource);
        var VSIn = this.addInputPin('Vertex Shader', [ 0,0,0 ], VVVV.PinTypes.WebGl2Resource);
        var PSIn = this.addInputPin('Fragment Shader', [ 0,0,0 ], VVVV.PinTypes.WebGl2Resource);
        var renderStateIn = this.addInputPin("Render State", [], VVVV.PinTypes.WebGlRenderState);

        var LayerOut = this.addOutputPin('LayerOut', [], VVVV.PinTypes.WebGl2Resource);

////////////////functions



///////////////Init
          this.initialize = function() {


          }
//////////////Runtime
          this.evaluate = function()
          {


            LayerOut.setValue(0, new VVVV.Types.WebGL2Layer)

          }
    }
    VVVV.Nodes.LayerComposer.prototype = new Node();



/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Renderer (WebGL2)
 Author(s): Luna Nane

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/


    VVVV.Nodes.RendererWebGL2 = function(id, graph) {
        this.constructor(id, "Renderer (WebGL2)", graph);

        this.meta = {
          authors: ['Luna Nane'],
          original_authors: [],
          credits: [],
          compatibility_issues: []
        };

        this.auto_evaluate = true;

////////////////pins
        var InputPin1 = this.addInputPin('LayerIn', [], VVVV.PinTypes.WebGl2Resource);

        var ViewIn = this.addInputPin('View', [], VVVV.PinTypes.Transform);
        var PerspectiveIn = this.addInputPin('Perspective', [], VVVV.PinTypes.Transform);

        var OutputPin1 = this.addOutputPin('Output', [ 0 ], VVVV.PinTypes.Value);

////////////////functions

        function createShader(gl, type, source) {
          var shader = gl.createShader(type);
          gl.shaderSource(shader, source);
          gl.compileShader(shader);
          var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
          if (success) {
            return shader;
          }

          console.log(gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
        }

        function createProgram(gl, vertexShader, fragmentShader) {
          var program = gl.createProgram();
          gl.attachShader(program, vertexShader);
          gl.attachShader(program, fragmentShader);
          gl.linkProgram(program);
          var success = gl.getProgramParameter(program, gl.LINK_STATUS);
          if (success) {
            return program;
          }

          console.log(gl.getProgramInfoLog(program));
          gl.deleteProgram(program);
        }


///////////////Init
          this.initialize = function() {

          }
//////////////Runtime


          var gl = undefined;

          this.evaluate = function()
          {


                        var vertexShaderSource = `#version 300 es

                        // an attribute is an input (in) to a vertex shader.
                        // It will receive data from a buffer
                        in vec4 a_position;
                        uniform mat4 u_tW;
                        uniform mat4 u_tV;
                        uniform mat4 u_tP;

                        // all shaders have a main function
                        void main() {

                          // gl_Position is a special variable a vertex shader
                          // is responsible for setting

                          mat4 tWV = u_tV * u_tW;
                          mat4 tWVP = u_tP * tWV;

                          //vec4 pos = u_tW * a_position;

                          gl_Position = tWVP * a_position;
                        }
                        `;

                        var fragmentShaderSource = `#version 300 es

                        // fragment shaders don't have a default precision so we need
                        // to pick one. mediump is a good default. It means "medium precision"
                        precision mediump float;

                        // we need to declare an output for the fragment shader
                        out vec4 outColor;

                        void main() {
                          // Just set the output to a constant redish-purple
                          outColor = vec4(1, 0, 0.5, 1);
                        }
                        `;


                        /////////////////////////init time
                        if(undefined(gl)){

                          console.log("setting up WebGL 2")
                          var canvas = document.getElementById("gl-canvas");
                          //context is set globally
                          webgl2gl = canvas.getContext("webgl2");
                          gl = webgl2gl;




                        if(!gl){"WebGL2 is not supported by your browser."}
                        }

                        //compile the shaders
                        var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
                        var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

                        //create the shader program by linking vs and ps
                        var program = createProgram(gl, vertexShader, fragmentShader);

                        //location of attribute
                        var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

                        //create buffer for attributes
                        var positionBuffer = gl.createBuffer();

                        //bind the position buffer to apply webgl functions on it
                        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

                        // quad
                        var positions = [
                          0.5, -0.5,
                          0.5, 0.5,
                          -0.5, -0.5,
                          -0.5,-0.5,
                          -0.5,0.5,
                          0.5,0.5
                        ];

                        //apply buffer data to gl.ARRAY_BUFFER (previously bound for positions)
                        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

                        //create vertex array buffer
                        var vao = gl.createVertexArray();

                        gl.bindVertexArray(vao);

                        gl.enableVertexAttribArray(positionAttributeLocation);

                        var size = 2;          // 2 components per iteration
                        var type = gl.FLOAT;   // the data is 32bit floats
                        var normalize = false; // don't normalize the data
                        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
                        var offset = 0;        // start at the beginning of the buffer

                        //binds the current ARRAY_BUFFER to the attribute
                        gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)

                        //set renderer window to fill the canvas div
                        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

                        //set the viewport (clipspace)
                        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

                        //clear the canvas color
                        gl.clearColor(0, 0, 0, 0);
                        gl.clear(gl.COLOR_BUFFER_BIT);

                        //set the shader Programming
                        gl.useProgram(program);

                        //bind the buffers to the attributes
                        gl.bindVertexArray(vao);

                        var transformLocation = gl.getUniformLocation(program, "u_tW");
                        var transform = glMat.mat4.create();
                        glMat.mat4.fromZRotation(transform, 0.0);
                        gl.uniformMatrix4fv(transformLocation, false, transform);

                        var tVLocation = gl.getUniformLocation(program, "u_tV");
                        gl.uniformMatrix4fv(tVLocation, false, ViewIn.getValue(0));

                        var tPLocation = gl.getUniformLocation(program, "u_tP");
                        gl.uniformMatrix4fv(tPLocation, false, PerspectiveIn.getValue(0));


                        //EXECUTE the GLSL program
                        var primitiveType = gl.TRIANGLES;
                        var offset = 0;
                        var count = 6;
                        gl.drawArrays(primitiveType, offset, count);



            var input = InputPin1.getValue(0);

            OutputPin1.setValue(input, 0);

            ///////////////////////////////////Getting Started

            var View = ViewIn.getValue(0) ;




          }
    }
    VVVV.Nodes.RendererWebGL2.prototype = new Node();




    /*
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     NODE: Camera (WebGL2)
     Author(s): Luna Nane

    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    */


        VVVV.Nodes.CameraWebGL2 = function(id, graph) {
            this.constructor(id, "Camera (WebGL2)", graph);

            this.meta = {
              authors: ['Luna Nane'],
            };

            this.auto_evaluate = true;

    ////////////////pins
            var RotXYZ = this.addInputPin('RotateXYZ', [ 0,0,0 ], VVVV.PinTypes.Value);
            var TransXYZ = this.addInputPin('TranslateXYZ', [ 0,0,0 ], VVVV.PinTypes.Value);
            var InitXYZ = this.addInputPin('InitialPositionXYZ', [ 0,0,0 ], VVVV.PinTypes.Value);

            var ViewOut = this.addOutputPin('View', [], VVVV.PinTypes.Transform);
            var PerspectiveOut = this.addOutputPin('Perspective', [], VVVV.PinTypes.Transform);

    ////////////////functions



    ///////////////Init
              this.initialize = function() {


              }
    //////////////Runtime
              this.evaluate = function()
              {

                //calculate translation matrix
                var translation_values = glMat.vec3.fromValues(TransXYZ.getValue(0), TransXYZ.getValue(1), TransXYZ.getValue(2));
                var translation = glMat.mat4.create();
                glMat.mat4.fromTranslation(translation, translation_values);

                //calculate rotation X
                var r_x = glMat.mat4.create();
                glMat.mat4.fromXRotation(r_x, RotXYZ.getValue(0));

                //rotation Y
                var r_y = glMat.mat4.create();
                glMat.mat4.fromYRotation(r_y, RotXYZ.getValue(1));

                //resulting rotation
                var rotation = glMat.mat4.create();
                glMat.mat4.mul(rotation, r_x, r_y);

                //apply final transform matrix
                var transform = glMat.mat4.create();
                glMat.mat4.mul(transform, translation, rotation);


                var perspective = glMat.mat4.create();
                var fov = 0.2;
                var aspect = 1.0;
                var near = 0.05;
                var far = 200;

                glMat.mat4.perspective(perspective,fov, aspect, near, far);

                ViewOut.setValue(0, transform );
                PerspectiveOut.setValue(0, perspective );
                ///////////////////////////////////Getting Started


              }
        }
        VVVV.Nodes.CameraWebGL2.prototype = new Node();



});
