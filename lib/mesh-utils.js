/* Copyright (c) 2013, Brandon Jones. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

define([
  "util/gl-matrix-min"
], function () {

  "use strict";

  var generateNormals = (function() {
    var a = vec3.create();
    var b = vec3.create();
    var c = vec3.create();

    var ab = vec3.create();
    var ac = vec3.create();
    var n = vec3.create();

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
        vec3.subtract(b, a, ab);
        vec3.subtract(c, a, ac);
        vec3.cross(ab, ac, n);

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
        vec3.normalize(n, n);
        setVec3AtIndex(n, normalArray, 3, 0, i);
      }

      return normalArray;
    };
  })();

  return {
    generateNormals: generateNormals
  };
});