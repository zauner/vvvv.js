import {vec3, vec4, quat, mat4} from 'gl-matrix';

var MinimalGLTFLoader = MinimalGLTFLoader || {};

var globalUniformBlockID = 0;

var curLoader = null;       // @tmp, might be unsafe if loading multiple model at the same time

var NUM_MAX_JOINTS = 65;

// Data classes
var Scene = MinimalGLTFLoader.Scene = function (gltf, s) {
    this.name = s.name !== undefined ? s.name : null;
    this.nodes = new Array(s.nodes.length);    // root node object of this scene
    for (var i = 0, len = s.nodes.length; i < len; i++) {
        this.nodes[i] = gltf.nodes[s.nodes[i]];
    }

    this.extensions = s.extensions !== undefined ? s.extensions : null;
    this.extras = s.extras !== undefined ? s.extras : null;


    this.boundingBox = null;
};

/**
 * 
 * @param {vec3} min
 * @param {vec3} max
 */
var BoundingBox = MinimalGLTFLoader.BoundingBox = function (min, max, isClone) {
    // this.min = min;
    // this.max = max;
    min = min || vec3.fromValues(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    max = max || vec3.fromValues(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

    if (isClone === undefined || isClone === true) {
        this.min = vec3.clone(min);
        this.max = vec3.clone(max);
    } else {
        this.min = min;
        this.max = max;
    }
    

    this.transform = mat4.create();
};

BoundingBox.prototype.updateBoundingBox = function (bbox) {
    vec3.min(this.min, this.min, bbox.min);
    vec3.max(this.max, this.max, bbox.max);
};

BoundingBox.prototype.calculateTransform = function () {
    // transform from a unit cube whose min = (0, 0, 0) and max = (1, 1, 1)

    // scale
    this.transform[0] = this.max[0] - this.min[0];
    this.transform[5] = this.max[1] - this.min[1];
    this.transform[10] = this.max[2] - this.min[2];
    // translate
    this.transform[12] = this.min[0];
    this.transform[13] = this.min[1];
    this.transform[14] = this.min[2];
};

BoundingBox.getAABBFromOBB = (function() {
    var transformRight = vec3.create();
    var transformUp = vec3.create();
    var transformBackward = vec3.create();

    var tmpVec3a = vec3.create();
    var tmpVec3b = vec3.create();

    return (function (obb, matrix) {
        vec3.set(transformRight, matrix[0], matrix[1], matrix[2]);
        vec3.set(transformUp, matrix[4], matrix[5], matrix[6]);
        vec3.set(transformBackward, matrix[8], matrix[9], matrix[10]);

        var min = vec3.fromValues(matrix[12], matrix[13], matrix[14]);  // init with matrix translation
        var max = vec3.clone(min);

        vec3.scale(tmpVec3a, transformRight, obb.min[0]);
        vec3.scale(tmpVec3b, transformRight, obb.max[0]);
        vec3.min(transformRight, tmpVec3a, tmpVec3b);
        vec3.add(min, min, transformRight);
        vec3.max(transformRight, tmpVec3a, tmpVec3b);
        vec3.add(max, max, transformRight);

        vec3.scale(tmpVec3a, transformUp, obb.min[1]);
        vec3.scale(tmpVec3b, transformUp, obb.max[1]);
        vec3.min(transformUp, tmpVec3a, tmpVec3b);
        vec3.add(min, min, transformUp);
        vec3.max(transformUp, tmpVec3a, tmpVec3b);
        vec3.add(max, max, transformUp);

        vec3.scale(tmpVec3a, transformBackward, obb.min[2]);
        vec3.scale(tmpVec3b, transformBackward, obb.max[2]);
        vec3.min(transformBackward, tmpVec3a, tmpVec3b);
        vec3.add(min, min, transformBackward);
        vec3.max(transformBackward, tmpVec3a, tmpVec3b);
        vec3.add(max, max, transformBackward);

        var bbox = new BoundingBox(min, max, false);
        bbox.calculateTransform();
        return bbox;
    });
})();



var Accessor = MinimalGLTFLoader.Accessor = function (a, bufferViewObject) {
    this.bufferView = bufferViewObject;
    this.componentType = a.componentType;   // required
    this.byteOffset = a.byteOffset !== undefined ? a.byteOffset : 0;
    this.byteStride = bufferViewObject.byteStride;
    this.normalized = a.normalized !== undefined ? a.normalized : false;
    this.count = a.count;   // required
    this.type = a.type;     // required
    this.size = Type2NumOfComponent[this.type];

    this.min = a.min;   // @tmp assume required for now (for bbox)
    this.max = a.max;   // @tmp assume required for now (for bbox)

    this.extensions = a.extensions !== undefined ? a.extensions : null;
    this.extras = a.extras !== undefined ? a.extras : null;
};

Accessor.prototype.prepareVertexAttrib = function(location, gl) {
    gl.vertexAttribPointer(
        location,
        this.size,
        this.componentType,
        this.normalized,
        this.byteStride,
        this.byteOffset
        );
    gl.enableVertexAttribArray(location);
};

var BufferView = MinimalGLTFLoader.BufferView = function(bf, bufferData) {
    this.byteLength = bf.byteLength;    //required
    this.byteOffset = bf.byteOffset !== undefined ? bf.byteOffset : 0;
    this.byteStride = bf.byteStride !== undefined ? bf.byteStride : 0;
    this.target = bf.target !== undefined ? bf.target : null;

    this.data = bufferData.slice(this.byteOffset, this.byteOffset + this.byteLength);

    this.extensions = bf.extensions !== undefined ? bf.extensions : null;
    this.extras = bf.extras !== undefined ? bf.extras : null;

    // runtime stuffs -------------
    this.buffer = null;     // gl buffer
};

BufferView.prototype.createBuffer = function(gl) {
    this.buffer = gl.createBuffer();
};

BufferView.prototype.bindData = function(gl) {
    if (this.target) {
        gl.bindBuffer(this.target, this.buffer);
        gl.bufferData(this.target, this.data, gl.STATIC_DRAW);
        gl.bindBuffer(this.target, null);
        return true;
    }
    return false;
};


var Camera = MinimalGLTFLoader.Camera = function(c) {
    this.name = c.name !== undefined ? c.name : null;
    this.type = c.type; // required

    this.othographic = c.othographic === undefined ? null : c.othographic;  // every attribute inside is required (excluding extensions)
    this.perspective = c.perspective === undefined ? null : {
        yfov: c.perspective.yfov,
        znear: c.perspective.znear,
        zfar: c.perspective.zfar !== undefined ? c.perspective.zfar : null,
        aspectRatio: c.perspective.aspectRatio !== undefined ? c.perspective.aspectRatio : null
    };

    this.extensions = c.extensions !== undefined ? c.extensions : null;
    this.extras = c.extras !== undefined ? c.extras : null;
};



var Node = MinimalGLTFLoader.Node = function (n, nodeID) {
    this.name = n.name !== undefined ? n.name : null;
    this.nodeID = nodeID;
    // TODO: camera
    this.camera = n.camera !== undefined ? n.camera : null;

    this.matrix = mat4.create();
    if (n.hasOwnProperty('matrix')) {
        for(var i = 0; i < 16; ++i) {
            this.matrix[i] = n.matrix[i];
        }

        this.translation = vec3.create();
        mat4.getTranslation(this.translation, this.matrix);

        this.rotation = quat.create();
        mat4.getRotation(this.rotation, this.matrix);

        this.scale = vec3.create();
        mat4.getScaling(this.scale, this.matrix);
    } else {
        // this.translation = null;
        // this.rotation = null;
        // this.scale = null;
        this.getTransformMatrixFromTRS(n.translation, n.rotation, n.scale);
    }
    
    
    

    this.children = n.children || [];  // init as id, then hook up to node object later
    this.mesh = n.mesh !== undefined ? curLoader.glTF.meshes[n.mesh] : null;

    this.skin = n.skin !== undefined ? n.skin : null;   // init as id, then hook up to skin object later

    if (n.extensions !== undefined) {
        if (n.extensions.gl_avatar !== undefined && curLoader.enableGLAvatar === true) {
            var linkedSkinID = curLoader.skeletonGltf.json.extensions.gl_avatar.skins[ n.extensions.gl_avatar.skin.name ];
            var linkedSkin = curLoader.skeletonGltf.skins[linkedSkinID];
            this.skin = new SkinLink(curLoader.glTF, linkedSkin, n.extensions.gl_avatar.skin.inverseBindMatrices);
        }
    }
    


    // TODO: morph targets weights
    this.weights = n.weights !== undefined ? n.weights : null;


    this.extensions = n.extensions !== undefined ? n.extensions : null;
    this.extras = n.extras !== undefined ? n.extras : null;

    // runtime stuffs--------------

    this.aabb = null;   // axis aligned bounding box, not need to apply node transform to aabb
    this.bvh = new BoundingBox();
};

Node.prototype.traverse = function(parent, executeFunc) {
    executeFunc(this, parent);
    for (var i = 0, len = this.children.length; i < len; i++) {
        this.children[i].traverse(this, executeFunc);
    }
};

Node.prototype.traversePostOrder = function(parent, executeFunc) {
    for (var i = 0, len = this.children.length; i < len; i++) {
        this.children[i].traversePostOrder(this, executeFunc);
    }
    executeFunc(this, parent);
};

Node.prototype.traverseTwoExecFun = function(parent, execFunPre, execFunPos) {
    execFunPre(this, parent);
    for (var i = 0, len = this.children.length; i < len; i++) {
        this.children[i].traverseTwoExecFun(this, execFunPre, execFunPos);
    }
    execFunPos(this, parent);
};

var TRSMatrix = mat4.create();

Node.prototype.getTransformMatrixFromTRS = function(translation, rotation, scale) {

    this.translation = translation !== undefined ? vec3.fromValues(translation[0], translation[1], translation[2]) : vec3.fromValues(0, 0, 0);
    this.rotation = rotation !== undefined ? vec4.fromValues(rotation[0], rotation[1], rotation[2], rotation[3]) : vec4.fromValues(0, 0, 0, 1);
    this.scale = scale !== undefined ? vec3.fromValues(scale[0], scale[1], scale[2]) : vec3.fromValues(1, 1, 1);

    this.updateMatrixFromTRS();
};

Node.prototype.updateMatrixFromTRS = function() {
    mat4.fromRotationTranslation(TRSMatrix, this.rotation, this.translation);
    mat4.scale(this.matrix, TRSMatrix, this.scale);
};



var Mesh = MinimalGLTFLoader.Mesh = function (m, meshID) {
    this.meshID = meshID;
    this.name = m.name !== undefined ? m.name : null;

    this.primitives = [];   // required
    


    // bounding box (runtime stuff)
    this.boundingBox = null;

    var p, primitive, accessor;

    for (var i = 0, len = m.primitives.length; i < len; ++i) {
        p = m.primitives[i];
        primitive = new Primitive(curLoader.glTF, p);
        this.primitives.push(primitive);

        // bounding box related
        if (primitive.boundingBox) {
            if (!this.boundingBox) {
                this.boundingBox = new BoundingBox();
            }
            this.boundingBox.updateBoundingBox(primitive.boundingBox);
        }
    }

    if (this.boundingBox) {
        this.boundingBox.calculateTransform();
    }


    // TODO: weights for morph targets
    this.weights = m.weights !== undefined ? m.weights : null;

    this.extensions = m.extensions !== undefined ? m.extensions : null;
    this.extras = m.extras !== undefined ? m.extras : null;
    
};

var Primitive = MinimalGLTFLoader.Primitive = function (gltf, p) {
    // <attribute name, accessor id>, required
    // get hook up with accessor object in _postprocessing
    this.attributes = p.attributes;
    this.indices = p.indices !== undefined ? p.indices : null;  // accessor id

    var attname;
    if (p.extensions !== undefined) {
        if (p.extensions.gl_avatar !== undefined && curLoader.enableGLAvatar === true) {
            if (p.extensions.gl_avatar.attributes) {
                for ( attname in p.extensions.gl_avatar.attributes ) {
                    this.attributes[attname] = p.extensions.gl_avatar.attributes[attname];
                }
            }
        }
    }

    
    if (this.indices !== null) {
        this.indicesComponentType = gltf.json.accessors[this.indices].componentType;
        this.indicesLength = gltf.json.accessors[this.indices].count;
        this.indicesOffset = (gltf.json.accessors[this.indices].byteOffset || 0);
    } else {
        // assume 'POSITION' is there
        this.drawArraysCount = gltf.json.accessors[this.attributes.POSITION].count;
        this.drawArraysOffset = (gltf.json.accessors[this.attributes.POSITION].byteOffset || 0);
    }

    
    // hook up accessor object
    for ( attname in this.attributes ) {
        this.attributes[attname] = gltf.accessors[ this.attributes[attname] ];
    }


    this.material = p.material !== undefined ? gltf.materials[p.material] : null;


    this.mode = p.mode !== undefined ? p.mode : 4; // default: gl.TRIANGLES

    

    // morph related
    this.targets = p.targets;


    this.extensions = p.extensions !== undefined ? p.extensions : null;
    this.extras = p.extras !== undefined ? p.extras : null;


    // ----gl run time related
    this.vertexArray = null;    //vao
    
    this.vertexBuffer = null;
    this.indexBuffer = null;


    this.shader = null;


    this.boundingBox = null;
    if (this.attributes.POSITION !== undefined) {
        var accessor = this.attributes.POSITION;
        if (accessor.max) {
            // @todo: handle cases where no min max are provided

            // assume vec3
            if (accessor.type === 'VEC3') {
                this.boundingBox = new BoundingBox(
                    vec3.fromValues(accessor.min[0], accessor.min[1], accessor.min[2]),
                    vec3.fromValues(accessor.max[0], accessor.max[1], accessor.max[2]),
                    false
                );
                this.boundingBox.calculateTransform();
                

                
            }
            
        }
    }
};


var Texture = MinimalGLTFLoader.Texture = function (t) {
    this.name = t.name !== undefined ? t.name : null;
    this.sampler = t.sampler !== undefined ? curLoader.glTF.samplers[t.sampler] : null;
    this.source = t.source !== undefined ? curLoader.glTF.images[t.source] : null;

    this.extensions = t.extensions !== undefined ? t.extensions : null;
    this.extras = t.extras !== undefined ? t.extras : null;

    // runtime
    this.texture = null;
};

Texture.prototype.createTexture = function(gl) {
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(
        gl.TEXTURE_2D,  // assumed
        0,        // Level of details
        // gl.RGB, // Format
        // gl.RGB,
        gl.RGBA, // Format
        gl.RGBA,
        gl.UNSIGNED_BYTE, // Size of each channel
        this.source
    );
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
};

var Sampler = MinimalGLTFLoader.Sampler = function (s) {
    this.name = s.name !== undefined ? s.name : null;
    this.magFilter = s.magFilter !== undefined ? s.magFilter : null;
    this.minFilter = s.minFilter !== undefined ? s.minFilter : null;
    this.wrapS = s.wrapS !== undefined ? s.wrapS : 10497;
    this.wrapT = s.wrapT !== undefined ? s.wrapT : 10497;

    this.extensions = s.extensions !== undefined ? s.extensions : null;
    this.extras = s.extras !== undefined ? s.extras : null;

    this.sampler = null;
};

Sampler.prototype.createSampler = function(gl) {
    this.sampler = gl.createSampler();
    if (this.minFilter) {
        gl.samplerParameteri(this.sampler, gl.TEXTURE_MIN_FILTER, this.minFilter);
    } else {
        gl.samplerParameteri(this.sampler, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    }
    if (this.magFilter) {
        gl.samplerParameteri(this.sampler, gl.TEXTURE_MAG_FILTER, this.magFilter);
    } else {
        gl.samplerParameteri(this.sampler, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
    gl.samplerParameteri(this.sampler, gl.TEXTURE_WRAP_S, this.wrapS);
    gl.samplerParameteri(this.sampler, gl.TEXTURE_WRAP_T, this.wrapT);
};

// Sampler.prototype.bindSampler = function(i, gl) {
//     gl.bindSampler(i, this.sampler);
// }

var TextureInfo = MinimalGLTFLoader.TextureInfo = function (json) {
    this.index = json.index;
    this.texCoord = json.texCoord !== undefined ? json.texCoord : 0 ;

    this.extensions = json.extensions !== undefined ? json.extensions : null;
    this.extras = json.extras !== undefined ? json.extras : null;
};

var PbrMetallicRoughness = MinimalGLTFLoader.PbrMetallicRoughness = function (json) {
    this.baseColorFactor = json.baseColorFactor !== undefined ? json.baseColorFactor : [1, 1, 1, 1];
    this.baseColorTexture = json.baseColorTexture !== undefined ? new TextureInfo(json.baseColorTexture): null;
    this.metallicFactor = json.metallicFactor !== undefined ? json.metallicFactor : 1 ;
    this.roughnessFactor = json.roughnessFactor !== undefined ? json.roughnessFactor : 1 ;
    this.metallicRoughnessTexture = json.metallicRoughnessTexture !== undefined ? new TextureInfo(json.metallicRoughnessTexture): null;

    this.extensions = json.extensions !== undefined ? json.extensions : null;
    this.extras = json.extras !== undefined ? json.extras : null;
};

var NormalTextureInfo = MinimalGLTFLoader.NormalTextureInfo = function (json) {
    this.index = json.index;
    this.texCoord = json.texCoord !== undefined ? json.texCoord : 0 ;
    this.scale = json.scale !== undefined ? json.scale : 1 ;

    this.extensions = json.extensions !== undefined ? json.extensions : null;
    this.extras = json.extras !== undefined ? json.extras : null;
};

var OcclusionTextureInfo = MinimalGLTFLoader.OcclusionTextureInfo = function (json) {
    this.index = json.index;
    this.texCoord = json.texCoord !== undefined ? json.texCoord : 0 ;
    this.strength = json.strength !== undefined ? json.strength : 1 ;

    this.extensions = json.extensions !== undefined ? json.extensions : null;
    this.extras = json.extras !== undefined ? json.extras : null;
};

var Material = MinimalGLTFLoader.Material = function (m) {
    this.name = m.name !== undefined ? m.name : null;
    
    this.pbrMetallicRoughness = m.pbrMetallicRoughness !== undefined ? new PbrMetallicRoughness( m.pbrMetallicRoughness ) : new PbrMetallicRoughness({
        baseColorFactor: [1, 1, 1, 1],
        metallicFactor: 1,
        metallicRoughnessTexture: 1
    });
    // this.normalTexture = m.normalTexture !== undefined ? m.normalTexture : null;
    this.normalTexture = m.normalTexture !== undefined ? new NormalTextureInfo(m.normalTexture) : null;
    this.occlusionTexture = m.occlusionTexture !== undefined ? new OcclusionTextureInfo(m.occlusionTexture) : null;
    this.emissiveTexture = m.emissiveTexture !== undefined ? new TextureInfo(m.emissiveTexture) : null;

    this.emissiveFactor = m.emissiveFactor !== undefined ? m.emissiveFactor : [0, 0, 0];
    this.alphaMode = m.alphaMode !== undefined ? m.alphaMode : "OPAQUE";
    this.alphaCutoff = m.alphaCutoff !== undefined ? m.alphaCutoff : 0.5;
    this.doubleSided = m.doubleSided || false;

    this.extensions = m.extensions !== undefined ? m.extensions : null;
    this.extras = m.extras !== undefined ? m.extras : null;
};


var Skin = MinimalGLTFLoader.Skin = function (gltf, s, skinID) {
    this.name = s.name !== undefined ? s.name : null;
    this.skinID = skinID;

    this.joints = new Array(s.joints.length);   // required
    var i, len;
    for (i = 0, len = this.joints.length; i < len; i++) {
        this.joints[i] = gltf.nodes[s.joints[i]];
    }

    this.skeleton = s.skeleton !== undefined ? gltf.nodes[s.skeleton] : null;
    this.inverseBindMatrices = s.inverseBindMatrices !== undefined ? gltf.accessors[s.inverseBindMatrices] : null;

    this.extensions = s.extensions !== undefined ? s.extensions : null;
    this.extras = s.extras !== undefined ? s.extras : null;


    // @tmp: runtime stuff should be taken care of renderer
    // since glTF model should only store info
    // runtime can have multiple instances of this glTF models
    this.uniformBlockID = globalUniformBlockID++;

    if (this.inverseBindMatrices) {
        // should be a mat4
        this.inverseBindMatricesData = _getAccessorData(this.inverseBindMatrices);
        // this.inverseBindMatricesMat4 = mat4.fromValues(this.inverseBindMatricesData);

        this.inverseBindMatrix = [];  // for calculation
        this.jointMatrixUniformBuffer = null;
        // this.jointMatrixUnidormBufferData = _arrayBuffer2TypedArray(
        //     this.inverseBindMatricesData, 
        //     0, 
        //     this.inverseBindMatricesData.length, 
        //     this.inverseBindMatrices.componentType
        // );      // for copy to UBO

        // @tmp: fixed length to coordinate with shader, for copy to UBO
        this.jointMatrixUnidormBufferData = new Float32Array(NUM_MAX_JOINTS * 16);

        for (i = 0, len = this.inverseBindMatricesData.length; i < len; i += 16) {
            this.inverseBindMatrix.push(mat4.fromValues(
                this.inverseBindMatricesData[i],
                this.inverseBindMatricesData[i + 1],
                this.inverseBindMatricesData[i + 2],
                this.inverseBindMatricesData[i + 3],
                this.inverseBindMatricesData[i + 4],
                this.inverseBindMatricesData[i + 5],
                this.inverseBindMatricesData[i + 6],
                this.inverseBindMatricesData[i + 7],
                this.inverseBindMatricesData[i + 8],
                this.inverseBindMatricesData[i + 9],
                this.inverseBindMatricesData[i + 10],
                this.inverseBindMatricesData[i + 11],
                this.inverseBindMatricesData[i + 12],
                this.inverseBindMatricesData[i + 13],
                this.inverseBindMatricesData[i + 14],
                this.inverseBindMatricesData[i + 15]
            ));
        }
    }

};

var SkinLink = MinimalGLTFLoader.SkinLink = function (gltf, linkedSkin, inverseBindMatricesAccessorID) {
    this.isLink = true;

    if (!gltf.skins) {
        gltf.skins = [];
    }
    gltf.skins.push(this);

    this.name = linkedSkin.name;
    // this.skinID = linkedSkin.skinID;   // use this for uniformblock id
    // this.skinID = gltf.skins.length - 1;
    // this.skinID = curLoader.skeletonGltf.skins.length + gltf.skins.length - 1;
    this.skinID = gltf.skins.length - 1;

    this.joints = linkedSkin.joints;

    this.skeleton = linkedSkin.skeleton;
    this.inverseBindMatrices = inverseBindMatricesAccessorID !== undefined ? gltf.accessors[inverseBindMatricesAccessorID] : null;

    // @tmp: runtime stuff should be taken care of renderer
    // since glTF model should only store info
    // runtime can have multiple instances of this glTF models
    this.uniformBlockID = globalUniformBlockID++;
    if (this.inverseBindMatrices) {
        // should be a mat4
        this.inverseBindMatricesData = _getAccessorData(this.inverseBindMatrices);
        // this.inverseBindMatricesMat4 = mat4.fromValues(this.inverseBindMatricesData);

        this.inverseBindMatrix = [];  // for calculation
        this.jointMatrixUniformBuffer = null;
        // this.jointMatrixUnidormBufferData = _arrayBuffer2TypedArray(
        //     this.inverseBindMatricesData, 
        //     0, 
        //     this.inverseBindMatricesData.length, 
        //     this.inverseBindMatrices.componentType
        // );      // for copy to UBO

        // @tmp: fixed length to coordinate with shader, for copy to UBO
        this.jointMatrixUnidormBufferData = new Float32Array(NUM_MAX_JOINTS * 16);

        for (var i = 0, len = this.inverseBindMatricesData.length; i < len; i += 16) {
            this.inverseBindMatrix.push(mat4.fromValues(
                this.inverseBindMatricesData[i],
                this.inverseBindMatricesData[i + 1],
                this.inverseBindMatricesData[i + 2],
                this.inverseBindMatricesData[i + 3],
                this.inverseBindMatricesData[i + 4],
                this.inverseBindMatricesData[i + 5],
                this.inverseBindMatricesData[i + 6],
                this.inverseBindMatricesData[i + 7],
                this.inverseBindMatricesData[i + 8],
                this.inverseBindMatricesData[i + 9],
                this.inverseBindMatricesData[i + 10],
                this.inverseBindMatricesData[i + 11],
                this.inverseBindMatricesData[i + 12],
                this.inverseBindMatricesData[i + 13],
                this.inverseBindMatricesData[i + 14],
                this.inverseBindMatricesData[i + 15]
            ));
        }
    }

    

};




// animation has no potential plan for progressive rendering I guess
// so everything happens after all buffers are loaded

var Target = MinimalGLTFLoader.Target = function (t) {
    this.nodeID = t.node !== undefined ? t.node : null ;  //id, to be hooked up to object later
    this.path = t.path;     //required, string

    this.extensions = t.extensions !== undefined ? t.extensions : null;
    this.extras = t.extras !== undefined ? t.extras : null;
};

var Channel = MinimalGLTFLoader.Channel = function (c, animation) {
    this.sampler = animation.samplers[c.sampler];   //required
    this.target = new Target(c.target);     //required

    this.extensions = c.extensions !== undefined ? c.extensions : null;
    this.extras = c.extras !== undefined ? c.extras : null;
};

var AnimationSampler = MinimalGLTFLoader.AnimationSampler = function (gltf, s) {
    this.input = gltf.accessors[s.input];   //required, accessor object
    this.output = gltf.accessors[s.output]; //required, accessor object

    this.inputTypedArray = _getAccessorData(this.input);
    this.outputTypedArray = _getAccessorData(this.output);


    // "LINEAR"
    // "STEP"
    // "CATMULLROMSPLINE"
    // "CUBICSPLINE"
    this.interpolation = s.interpolation !== undefined ? s.interpolation : 'LINEAR' ;
    

    this.extensions = s.extensions !== undefined ? s.extensions : null;
    this.extras = s.extras !== undefined ? s.extras : null;

    // ------- extra runtime info -----------
    // runtime status thing
    this.curIdx = 0;
    // this.curValue = 0;
    this.curValue = vec4.create();
    this.endT = this.inputTypedArray[this.inputTypedArray.length - 1];
    this.inputMax = this.endT - this.inputTypedArray[0];
};

var animationOutputValueVec4a = vec4.create();
var animationOutputValueVec4b = vec4.create();

AnimationSampler.prototype.getValue = function (t) {
    if (t > this.endT) {
        t -= this.inputMax * Math.ceil((t - this.endT) / this.inputMax);
        this.curIdx = 0;
    }

    var len = this.inputTypedArray.length;
    while (this.curIdx <= len - 2 && t >= this.inputTypedArray[this.curIdx + 1]) {
        this.curIdx++;
    }


    if (this.curIdx >= len - 1) {
        // loop
        t -= this.inputMax;
        this.curIdx = 0;
    }

    // @tmp: assume no stride
    var count = Type2NumOfComponent[this.output.type];
    
    var v4lerp = count === 4 ? quat.slerp: vec4.lerp;

    var i = this.curIdx;
    var o = i * count;
    var on = o + count;

    var u = Math.max( 0, t - this.inputTypedArray[i] ) / (this.inputTypedArray[i+1] - this.inputTypedArray[i]);

    for (var j = 0; j < count; j++ ) {
        animationOutputValueVec4a[j] = this.outputTypedArray[o + j];
        animationOutputValueVec4b[j] = this.outputTypedArray[on + j];
    }

    switch(this.interpolation) {
        case 'LINEAR': 
        v4lerp(this.curValue, animationOutputValueVec4a, animationOutputValueVec4b, u);
        break;

        default:
        break;
    }
};



var Animation = MinimalGLTFLoader.Animation = function (gltf, a) {
    this.name = a.name !== undefined ? a.name : null;

    var i, len;

    

    this.samplers = []; // required, array of animation sampler
    
    for (i = 0, len = a.samplers.length; i < len; i++) {
        this.samplers[i] = new AnimationSampler(gltf, a.samplers[i]);
    }

    this.channels = [];     //required, array of channel
    
    for (i = 0, len = a.channels.length; i < len; i++) {
        this.channels[i] = new Channel(a.channels[i], this);
    }

    this.extensions = a.extensions !== undefined ? a.extensions : null;
    this.extras = a.extras !== undefined ? a.extras : null;
};


/**
 * 
 */
var glTFModel = MinimalGLTFLoader.glTFModel = function (gltf) {
    this.json = gltf;
    this.defaultScene = gltf.scene !== undefined ? gltf.scene : 0;

    this.version = Number(gltf.asset.version);

    if (gltf.accessors) {
        this.accessors = new Array(gltf.accessors.length);
    }

    if (gltf.bufferViews) {
        this.bufferViews = new Array(gltf.bufferViews.length);
    }

    if (gltf.scenes) {
        this.scenes = new Array(gltf.scenes.length);   // store Scene object
    }

    if (gltf.nodes) {
        this.nodes = new Array(gltf.nodes.length);    // store Node object
    }

    if (gltf.meshes) {
        this.meshes = new Array(gltf.meshes.length);    // store mesh object
    }

    if (gltf.materials) {
        this.materials = new Array(gltf.materials.length);  // store material object
    }

    if (gltf.textures) {
        this.textures = new Array(gltf.textures.length);
    }

    if (gltf.samplers) {
        this.samplers = new Array(gltf.samplers.length);
    }

    if (gltf.images) {
        this.images = new Array(gltf.images.length);
    }


    if (gltf.skins) {
        this.skins = new Array(gltf.skins.length);
    }

    if (gltf.animations) {
        this.animations = new Array(gltf.animations.length);
    }

    if (gltf.cameras) {
        this.cameras = new Array(gltf.cameras.length);
    }

    this.extensions = gltf.extensions !== undefined ? gltf.extensions : null;
    this.extras = gltf.extras !== undefined ? gltf.extras : null;

};



var gl;

var glTFLoader = MinimalGLTFLoader.glTFLoader = function (glContext) {
    gl = glContext !== undefined ? glContext : null;
    this._init();
    this.glTF = null;

    this.enableGLAvatar = false;
    this.linkSkeletonGltf = null;
};

glTFLoader.prototype._init = function() {
    this._loadDone = false;

    this._bufferRequested = 0;
    this._bufferLoaded = 0;
    this._buffers = [];
    this._bufferTasks = {};

    this._shaderRequested = 0;
    this._shaderLoaded = 0;

    this._imageRequested = 0;
    this._imageLoaded = 0;

    this._pendingTasks = 0;
    this._finishedPendingTasks = 0;

    this.onload = null;

    curLoader = this;
};


glTFLoader.prototype._checkComplete = function () {
    if (this._bufferRequested == this._bufferLoaded && 
        // this._shaderRequested == this._shaderLoaded && 
        this._imageRequested == this._imageLoaded 
        // && other resources finish loading
        ) {
        this._loadDone = true;
    }

    if (this._loadDone && this._pendingTasks == this._finishedPendingTasks) {

        this._postprocess();

        this.onload(this.glTF);
    }
};

glTFLoader.prototype.loadGLTF_GL_Avatar_Skin = function (uri, skeletonGltf, callback) {
    this.enableGLAvatar = true;
    this.skeletonGltf = skeletonGltf;

    this.loadGLTF(uri, callback);
};

/**
 * load a glTF model
 * 
 * @param {String} uri uri of the .glTF file. Other resources (bins, images) are assumed to be in the same base path
 * @param {Function} callback the onload callback function
 */
glTFLoader.prototype.loadGLTF = function (uri, callback) {

    this._init();

    this.onload = callback || function(glTF) {
        console.log('glTF model loaded.');
        console.log(glTF);
    };
    

    this.baseUri = _getBaseUri(uri);

    var loader = this;

    _loadJSON(uri, function (response) {
        // Parse JSON string into object
        var json = JSON.parse(response);

        loader.glTF = new glTFModel(json);

        var bid;

        var loadArrayBufferCallback = function (resource) {
            
            loader._buffers[bid] = resource;
            loader._bufferLoaded++;
            if (loader._bufferTasks[bid]) {
                var i,len;
                for (i = 0, len = loader._bufferTasks[bid].length; i < len; ++i) {
                    (loader._bufferTasks[bid][i])(resource);
                }
            }
            loader._checkComplete();

        };

        // Launch loading resources task: buffers, etc.
        if (json.buffers) {
            for (bid in json.buffers) {

                loader._bufferRequested++;

                _loadArrayBuffer(loader.baseUri + json.buffers[bid].uri, loadArrayBufferCallback);

            }
        }

        // load images
        var loadImageCallback = function (img, iid) {
            loader._imageLoaded++;
            loader.glTF.images[iid] = img;
            loader._checkComplete();
        };

        var iid;

        if (json.images) {
            for (iid in json.images) {
                loader._imageRequested++;
                _loadImage(loader.baseUri + json.images[iid].uri, iid, loadImageCallback);
            }
        }

        loader._checkComplete();
    });
};


glTFLoader.prototype._postprocess = function () {
    // if there's no plan for progressive loading (streaming)
    // than simply everything should be placed here
    
    // console.log('finish loading all assets, do a second pass postprocess');
    
    curLoader = this;

    var i, leni, j, lenj;

    var scene, s;
    var node;
    var mesh, primitive, accessor;

    // cameras
    if (this.glTF.cameras) {
        for (i = 0, leni = this.glTF.cameras.length; i < leni; i++) {
            this.glTF.cameras[i] = new Camera(this.glTF.json.cameras[i]);
        }
    }

    // bufferviews
    if (this.glTF.bufferViews) {
        for (i = 0, leni = this.glTF.bufferViews.length; i < leni; i++) {
            this.glTF.bufferViews[i] = new BufferView(this.glTF.json.bufferViews[i], this._buffers[ this.glTF.json.bufferViews[i].buffer ]);
        }
    }

    // accessors
    if (this.glTF.accessors) {
        for (i = 0, leni = this.glTF.accessors.length; i < leni; i++) {
            this.glTF.accessors[i] = new Accessor(this.glTF.json.accessors[i], this.glTF.bufferViews[ this.glTF.json.accessors[i].bufferView ]);
        }
    }

    // load all materials
    if (this.glTF.materials) {
        for (i = 0, leni = this.glTF.materials.length; i < leni; i++) {
            this.glTF.materials[i] = new Material(this.glTF.json.materials[i]);
        }
    }

    // load all samplers 
    if (this.glTF.samplers) {
        for (i = 0, leni = this.glTF.samplers.length; i < leni; i++) {
            this.glTF.samplers[i] = new Sampler(this.glTF.json.samplers[i]);
        } 
    }

    // load all textures
    if (this.glTF.textures) {
        for (i = 0, leni = this.glTF.textures.length; i < leni; i++) {
            this.glTF.textures[i] = new Texture(this.glTF.json.textures[i]);
        }
    }

    // mesh
    for (i = 0, leni = this.glTF.meshes.length; i < leni; i++) {
        this.glTF.meshes[i] = new Mesh(this.glTF.json.meshes[i], i);
    }

    // node
    for (i = 0, leni = this.glTF.nodes.length; i < leni; i++) {
        this.glTF.nodes[i] = new Node(this.glTF.json.nodes[i], i);
    }

    // node: hook up children
    for (i = 0, leni = this.glTF.nodes.length; i < leni; i++) {
        node = this.glTF.nodes[i];
        for (j = 0, lenj = node.children.length; j < lenj; j++) {
            node.children[j] = this.glTF.nodes[ node.children[j] ];
        }
    }

    // scene Bounding box
    var nodeMatrix = new Array(this.glTF.nodes.length);
    for(i = 0, leni = nodeMatrix.length; i < leni; i++) {
        nodeMatrix[i] = mat4.create();
    }

    function execUpdateTransform(n, parent) {
        var tmpMat4 = nodeMatrix[n.nodeID];

        if (parent !== null) {
            mat4.mul(tmpMat4, nodeMatrix[parent.nodeID], n.matrix);
        } else {
            mat4.copy(tmpMat4, n.matrix);
        }
    }

    function execUpdateBBox(n, parent){
        var tmpMat4 = nodeMatrix[n.nodeID];
        var parentBVH;

        if (parent !== null) {
            parentBVH = parent.bvh;
        } else {
            parentBVH = scene.boundingBox;
        }

        if (n.mesh) {
            mesh = n.mesh;
            if (mesh.boundingBox) {

                n.aabb = BoundingBox.getAABBFromOBB(mesh.boundingBox, tmpMat4);

                if (n.children.length === 0) {
                    // n.bvh = n.aabb;
                    vec3.copy(n.bvh.min, n.aabb.min);
                    vec3.copy(n.bvh.max, n.aabb.max);
                }
            }
        }

        vec3.min(parentBVH.min, parentBVH.min, n.bvh.min);
        vec3.max(parentBVH.max, parentBVH.max, n.bvh.max);
    }


    for (i = 0, leni = this.glTF.scenes.length; i < leni; i++) {
        scene = this.glTF.scenes[i] = new Scene(this.glTF, this.glTF.json.scenes[i]);

        scene.boundingBox = new BoundingBox();


        for (j = 0, lenj = scene.nodes.length; j < lenj; j++) {
            node = scene.nodes[j];
            // node.traverse(null, execUpdateBBox);
            node.traverseTwoExecFun(null, execUpdateTransform, execUpdateBBox);
        }

        scene.boundingBox.calculateTransform();
    }


    for (j = 0, lenj = this.glTF.nodes.length; j < lenj; j++) {
        node = this.glTF.nodes[j];
        if (node.bvh !== null) {
            node.bvh.calculateTransform();
        }
    }



    // load animations (when all accessors are loaded correctly)
    if (this.glTF.animations) {
        for (i = 0, leni = this.glTF.animations.length; i < leni; i++) {
            this.glTF.animations[i] = new Animation(this.glTF, this.glTF.json.animations[i]);
        }
    }

    var joints;
    // if (this.glTF.skins) {
    if (this.glTF.json.skins) {
        for (i = 0, leni = this.glTF.skins.length; i < leni; i++) {
            this.glTF.skins[i] = new Skin(this.glTF, this.glTF.json.skins[i], i);
            

            joints = this.glTF.skins[i].joints;
            for (j = 0, lenj = joints.length; j < lenj; j++) {
                // this.glTF.nodes[ joints[j] ].jointID = j;
                joints[j].jointID = j;
            }
        } 
    }

    for (i = 0, leni = this.glTF.nodes.length; i < leni; i++) {
        node = this.glTF.nodes[i];
        if (node.skin !== null) {
            if (typeof node.skin == 'number') {
                // usual skin, hook up
                node.skin = this.glTF.skins[ node.skin ];
            } else {
                // assume gl_avatar is in use
                // do nothing
            }
            
        }
    } 
    

};


// TODO: get from gl context
var ComponentType2ByteSize = {
    5120: 1, // BYTE
    5121: 1, // UNSIGNED_BYTE
    5122: 2, // SHORT
    5123: 2, // UNSIGNED_SHORT
    5126: 4  // FLOAT
};

var Type2NumOfComponent = {
    'SCALAR': 1,
    'VEC2': 2,
    'VEC3': 3,
    'VEC4': 4,
    'MAT2': 4,
    'MAT3': 9,
    'MAT4': 16
};


// ------ Scope limited private util functions---------------


// for animation use
function _arrayBuffer2TypedArray(buffer, byteOffset, countOfComponentType, componentType) {
    switch(componentType) {
        // @todo: finish
        case 5122: return new Int16Array(buffer, byteOffset, countOfComponentType);
        case 5123: return new Uint16Array(buffer, byteOffset, countOfComponentType);
        case 5124: return new Int32Array(buffer, byteOffset, countOfComponentType);
        case 5125: return new Uint32Array(buffer, byteOffset, countOfComponentType);
        case 5126: return new Float32Array(buffer, byteOffset, countOfComponentType);
        default: return null; 
    }
}

function _getAccessorData(accessor) {
    return _arrayBuffer2TypedArray(
        accessor.bufferView.data, 
        accessor.byteOffset, 
        accessor.count * Type2NumOfComponent[accessor.type],
        accessor.componentType
        );
}

function _getBaseUri(uri) {
    
    // https://github.com/AnalyticalGraphicsInc/cesium/blob/master/Source/Core/getBaseUri.js
    
    var basePath = '';
    var i = uri.lastIndexOf('/');
    if(i !== -1) {
        basePath = uri.substring(0, i + 1);
    }
    
    return basePath;
}

function _loadJSON(src, callback) {

    // native json loading technique from @KryptoniteDove:
    // http://codepen.io/KryptoniteDove/post/load-json-file-locally-using-pure-javascript

    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', src, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && // Request finished, response ready
            xobj.status == "200") { // Status OK
            callback(xobj.responseText, this);
        }
    };
    xobj.send(null);
}

function _loadArrayBuffer(url, callback) {
    var xobj = new XMLHttpRequest();
    xobj.responseType = 'arraybuffer';
    xobj.open('GET', url, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && // Request finished, response ready
            xobj.status == "200") { // Status OK
            var arrayBuffer = xobj.response;
            if (arrayBuffer && callback) {
                callback(arrayBuffer);
            }
        }
    };
    xobj.send(null);
}

function _loadImage(url, iid, onload) {
    var img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = function() {
        onload(img, iid);
    };
}

// export { MinimalGLTFLoader };
export { glTFLoader };