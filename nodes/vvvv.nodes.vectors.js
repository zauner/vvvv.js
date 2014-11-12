// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

(function($) {

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Vector (2d Join)
 Author(s): Julien Vulliet
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Join2dVector = function(id, graph) {
  this.constructor(id, "Vector (2d Join)", graph);
  
  this.meta = {
    authors: ['Julien Vulliet'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['']
  };
  
  var xIn = this.addInputPin("X", [0.0], VVVV.PinTypes.Value);
  var yIn = this.addInputPin("Y", [0.0], VVVV.PinTypes.Value);
  
  var xyOut = this.addOutputPin("XY", [0.0,0.0], VVVV.PinTypes.Value);

  this.evaluate = function() 
  {  
      var maxSize = this.getMaxInputSliceCount();
	  xyOut.setSliceCount(maxSize * 2);
      
      for (var i=0; i<maxSize; i++) 
	  {
		xyOut.setValue(i*2,xIn.getValue(i));
		xyOut.setValue(i*2 + 1,yIn.getValue(i));
      }
  }

}
VVVV.Nodes.Join2dVector.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Vector (3d Join)
 Author(s): Julien Vulliet
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Join3dVector = function(id, graph) {
  this.constructor(id, "Vector (3d Join)", graph);
  
  this.meta = {
    authors: ['Julien Vulliet'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['']
  };
  
  var xIn = this.addInputPin("X", [0.0], VVVV.PinTypes.Value);
  var yIn = this.addInputPin("Y", [0.0], VVVV.PinTypes.Value);
  var zIn = this.addInputPin("Z", [0.0], VVVV.PinTypes.Value);
  
  var xyzOut = this.addOutputPin("XYZ", [0.0,0.0,0.0], VVVV.PinTypes.Value);

  this.evaluate = function() 
  {  
      var maxSize = this.getMaxInputSliceCount();
	  xyzOut.setSliceCount(maxSize * 3);
      
      for (var i=0; i<maxSize; i++) 
	  {
		xyzOut.setValue(i*3,xIn.getValue(i));
		xyzOut.setValue(i*3 + 1,yIn.getValue(i));
		xyzOut.setValue(i*3 + 2,zIn.getValue(i));
      }
  }

}
VVVV.Nodes.Join3dVector.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Vector (4d Join)
 Author(s): Julien Vulliet
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Join4dVector = function(id, graph) {
  this.constructor(id, "Vector (4d Join)", graph);
  
  this.meta = {
    authors: ['Julien Vulliet'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['']
  };
  
  var xIn = this.addInputPin("X", [0.0], VVVV.PinTypes.Value);
  var yIn = this.addInputPin("Y", [0.0], VVVV.PinTypes.Value);
  var zIn = this.addInputPin("Z", [0.0], VVVV.PinTypes.Value);
  var wIn = this.addInputPin("W", [0.0], VVVV.PinTypes.Value);
  
  var xyzwOut = this.addOutputPin("XYZW", [0.0,0.0,0.0,1.0], VVVV.PinTypes.Value);

  this.evaluate = function() 
  {  
      var maxSize = this.getMaxInputSliceCount();
	  xyzwOut.setSliceCount(maxSize * 4);
      
      for (var i=0; i<maxSize; i++) 
	  {
		xyzwOut.setValue(i*4,xIn.getValue(i));
		xyzwOut.setValue(i*4 + 1,yIn.getValue(i));
		xyzwOut.setValue(i*4 + 2,zIn.getValue(i));
		xyzwOut.setValue(i*4 + 3,wIn.getValue(i));
      }
  }

}
VVVV.Nodes.Join4dVector.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Vector (2d Split)
 Author(s): Julien Vulliet
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Split2dVector = function(id, graph) {
  this.constructor(id, "Vector (2d Split)", graph);
  
  this.meta = {
    authors: ['Julien Vulliet'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['']
  };
  
  var xyIn = this.addInputPin("XY", [0.0], VVVV.PinTypes.Value);
  
  var xOut = this.addOutputPin("X", [0.0], VVVV.PinTypes.Value);
  var yOut = this.addOutputPin("Y", [0.0], VVVV.PinTypes.Value);
  
  this.evaluate = function() 
  {  
      var maxSize = this.getMaxInputSliceCount();
	      
	  var id = 0;
      for (var i=0; i<maxSize; i+=2) 
	  {
		xOut.setValue(id,xyIn.getValue(i));
		yOut.setValue(id,xyIn.getValue(i+1));	
		id ++;
      }
      
      xOut.setSliceCount(id);
      yOut.setSliceCount(id);
  }

}
VVVV.Nodes.Split2dVector.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Vector (3d Split)
 Author(s): Julien Vulliet
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Split3dVector = function(id, graph) {
  this.constructor(id, "Vector (3d Split)", graph);
  
  this.meta = {
    authors: ['Julien Vulliet'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['']
  };
  
  var xyzIn = this.addInputPin("XYZ", [0.0], VVVV.PinTypes.Value);
  
  var xOut = this.addOutputPin("X", [0.0], VVVV.PinTypes.Value);
  var yOut = this.addOutputPin("Y", [0.0], VVVV.PinTypes.Value);
  var zOut = this.addOutputPin("Z", [0.0], VVVV.PinTypes.Value);
  
  this.evaluate = function() 
  {  
      var maxSize = this.getMaxInputSliceCount();
      
	  var id = 0;
      for (var i=0; i<maxSize; i+=3) 
	  {
		xOut.setValue(id,xyzIn.getValue(i));
		yOut.setValue(id,xyzIn.getValue(i+1));	
		zOut.setValue(id,xyzIn.getValue(i+2));	
		id ++;
      }
      
      xOut.setSliceCount(id);
      yOut.setSliceCount(id);
      zOut.setSliceCount(id);
  }

}
VVVV.Nodes.Split3dVector.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Vector (4d Split)
 Author(s): Julien Vulliet
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Split4dVector = function(id, graph) {
  this.constructor(id, "Vector (4d Split)", graph);
  
  this.meta = {
    authors: ['Julien Vulliet'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['']
  };
  
  var xyzwIn = this.addInputPin("XYZW", [0.0,0.0,0.0,1.0], VVVV.PinTypes.Value);
  
  var xOut = this.addOutputPin("X", [0.0], VVVV.PinTypes.Value);
  var yOut = this.addOutputPin("Y", [0.0], VVVV.PinTypes.Value);
  var zOut = this.addOutputPin("Z", [0.0], VVVV.PinTypes.Value);
  var wOut = this.addOutputPin("W", [0.0], VVVV.PinTypes.Value);
  
  this.evaluate = function() 
  {  
      var maxSize = this.getMaxInputSliceCount();
      
	  var id = 0;
      for (var i=0; i<maxSize; i+=4) 
	  {
		xOut.setValue(id,xyzwIn.getValue(i));
		yOut.setValue(id,xyzwIn.getValue(i+1));	
		zOut.setValue(id,xyzwIn.getValue(i+2));	
		wOut.setValue(id,xyzwIn.getValue(i+3));	
		id ++;
      }
      
      xOut.setSliceCount(id);
      yOut.setSliceCount(id);
      zOut.setSliceCount(id);
      wOut.setSliceCount(id);
  }

}
VVVV.Nodes.Split4dVector.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Simplex (2d/3d/4d)
 Author(s): woei
 Original Node Author(s): tonfilm
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/
  function SimplexNoise() {// Simplex noise in 2D, 3D and 4D
    var grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
                  [1,0,1],[-1,0,1],[1,0,-1],[-1,0,1],
                  [0,1,1],[0,-1,1],[0,1,-1],[0,-1,1]];
  
    var grad4 = [[0,1,1,1], [0,1,1,-1], [0,1,-1,1], [0,1,-1,-1],
                  [0,-1,1,1], [0,-1,1,-1], [0,-1,-1,1], [0,-1,-1,-1],
                  [1,0,1,1], [1,0,1,-1], [1,0,-1,1], [1,0,-1,-1],
                  [-1,0,1,1], [-1,0,1,-1], [-1,0,-1,1], [-1,0,-1,-1],
                  [1,1,0,1], [1,1,0,-1], [1,-1,0,1], [1,-1,0,-1],
                  [-1,1,0,1], [-1,1,0,-1], [-1,-1,0,1], [-1,-1,0,-1],
                  [1,1,1,0], [1,1,-1,0], [1,-1,1,0], [1,-1,-1,0],
                  [-1,1,1,0], [-1,1,-1,0], [-1,-1,1,0], [-1,-1,-1,0]];
  
    // To remove the need for index wrapping, double the permutation table length
    var perm = [151,160,137,91,90,15,
      131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
      190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
      88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
      77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
      102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
      135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
      5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
      223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
      129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
      251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
      49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
      138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180,151,160,137,91,90,15,
      131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
      190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
      88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
      77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
      102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
      135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
      5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
      223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
      129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
      251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
      49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
      138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
    
    // A lookup table to traverse the simplex around a given point in 4D.
    // Details can be found where this table is used, in the 4D noise method.
    var simplex = [
      [0,1,2,3],[0,1,3,2],[0,0,0,0],[0,2,3,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,3,0],
      [0,2,1,3],[0,0,0,0],[0,3,1,2],[0,3,2,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,3,2,0],
      [0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],
      [1,2,0,3],[0,0,0,0],[1,3,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,3,0,1],[2,3,1,0],
      [1,0,2,3],[1,0,3,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,3,1],[0,0,0,0],[2,1,3,0],
      [0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],
      [2,0,1,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,0,1,2],[3,0,2,1],[0,0,0,0],[3,1,2,0],
      [2,1,0,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,1,0,2],[0,0,0,0],[3,2,0,1],[3,2,1,0]];
    
    // This method is a *lot* faster than using (int)Math.floor(x)
    function fastfloor(x) {
      if (x>0) {
        return parseInt(x);
      }
      else {
        return parseInt(x-1);
      }
    }
    
    function dot2d(g, x, y) {
      return g[0]*x + g[1]*y; 
    }
    
    function dot3d(g, x, y, z) {
      return g[0]*x + g[1]*y + g[2]*z; 
    }
    
    function dot4d(g, x, y, z, w) {
      return g[0]*x + g[1]*y + g[2]*z + g[3]*w; 
    }
    
    // 2D simplex noise
    this.noise2d = function(xin, yin) 
    {
      var n0, n1, n2; // Noise contributions from the three corners
      // Skew the input space to determine which simplex cell we're in
      var F2 = 0.5*(Math.sqrt(3.0)-1.0);
      var s = (xin+yin)*F2; // Hairy factor for 2D
      var i = fastfloor(xin+s);
      var j = fastfloor(yin+s);
      var G2 = (3.0-Math.sqrt(3.0))/6.0;
      var t = (i+j)*G2;
      var X0 = i-t; // Unskew the cell origin back to (x,y) space
      var Y0 = j-t;
      var x0 = xin-X0; // The x,y distances from the cell origin
      var y0 = yin-Y0;
      // For the 2D case, the simplex shape is an equilateral triangle.
      // Determine which simplex we are in.
      var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
      if(x0>y0) {i1=1; j1=0;} // lower triangle, XY order: (0,0)->(1,0)->(1,1)
      else {i1=0; j1=1;} // upper triangle, YX order: (0,0)->(0,1)->(1,1)
      // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
      // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
      // c = (3-sqrt(3))/6
      var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
      var y1 = y0 - j1 + G2;
      var x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
      var y2 = y0 - 1.0 + 2.0 * G2;
      // Work out the hashed gradient indices of the three simplex corners
      var ii = i & 255;
      var jj = j & 255;
      var gi0 = perm[ii+perm[jj]] % 12; 
      var gi1 = perm[ii+i1+perm[jj+j1]] % 12;
      var gi2 = perm[ii+1+perm[jj+1]] % 12;
      // Calculate the contribution from the three corners
      var t0 = 0.5 - x0*x0-y0*y0; 
      if(t0<0) { n0 = 0.0; }
      else {
        t0 *= t0;
        n0 = t0 * t0 * dot2d(grad3[gi0], x0, y0); // (x,y) of grad3 used for 2D gradient
      }
      var t1 = 0.5 - x1*x1-y1*y1;
      if(t1<0) { n1 = 0.0; }
      else {
        t1 *= t1;
        n1 = t1 * t1 * dot2d(grad3[gi1], x1, y1);
      }
      var t2 = 0.5 - x2*x2-y2*y2;
      if(t2<0) { n2 = 0.0; }
      else {
        t2 *= t2;
        n2 = t2 * t2 * dot2d(grad3[gi2], x2, y2);
      }
      // Add contributions from each corner to get the final noise value.
      // The result is scaled to return values in the interval [-1,1].
      return 70.0 * (n0 + n1 + n2);
    }
    
    // 3D simplex noise
    this.noise3d = function(xin, yin, zin) 
    {
      var n0, n1, n2, n3; // Noise contributions from the four corners
      // Skew the input space to determine which simplex cell we're in
      var F3 = 1.0/3.0;
      var s = (xin+yin+zin)*F3; // Very nice and simple skew factor for 3D
      var i = fastfloor(xin+s);
      var j = fastfloor(yin+s);
      var k = fastfloor(zin+s);
      var G3 = 1.0/6.0; // Very nice and simple unskew factor, too
      var t = (i+j+k)*G3;
      var X0 = i-t; // Unskew the cell origin back to (x,y,z) space
      var Y0 = j-t;
      var Z0 = k-t;
      var x0 = xin-X0; // The x,y,z distances from the cell origin
      var y0 = yin-Y0;
      var z0 = zin-Z0;
      
      // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
      // Determine which simplex we are in.
      var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
      var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
      if(x0>=y0) {
        if(y0>=z0)
        { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; } // X Y Z order
        else if(x0>=z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; } // X Z Y order
        else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; } // Z X Y order
      }
      else { // x0<y0
        if(y0<z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; } // Z Y X order
        else if(x0<z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; } // Y Z X order
        else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; } // Y X Z order
      }
      
      // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
      // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
      // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
      // c = 1/6.
      var x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
      var y1 = y0 - j1 + G3;
      var z1 = z0 - k1 + G3;
      var x2 = x0 - i2 + 2.0*G3; // Offsets for third corner in (x,y,z) coords
      var y2 = y0 - j2 + 2.0*G3;
      var z2 = z0 - k2 + 2.0*G3;
      var x3 = x0 - 1.0 + 3.0*G3; // Offsets for last corner in (x,y,z) coords
      var y3 = y0 - 1.0 + 3.0*G3;
      var z3 = z0 - 1.0 + 3.0*G3;
      
      // Work out the hashed gradient indices of the four simplex corners
      var ii = i & 255;
      var jj = j & 255;
      var kk = k & 255;
      var gi0 = perm[ii+perm[jj+perm[kk]]] % 12;
      var gi1 = perm[ii+i1+perm[jj+j1+perm[kk+k1]]] % 12;
      var gi2 = perm[ii+i2+perm[jj+j2+perm[kk+k2]]] % 12;
      var gi3 = perm[ii+1+perm[jj+1+perm[kk+1]]] % 12;
      
      // Calculate the contribution from the four corners
      var t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
      if(t0<0) { n0 = 0.0; }
      else 
      {
        t0 *= t0;
        n0 = t0 * t0 * dot3d(grad3[gi0], x0, y0, z0);
      }
      
      var t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
      if(t1<0) { n1 = 0.0; }
      else 
      {
        t1 *= t1;
        n1 = t1 * t1 * dot3d(grad3[gi1], x1, y1, z1);
      }
      
      var t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
      if(t2<0) { n2 = 0.0; }
      else 
      {
        t2 *= t2;
        n2 = t2 * t2 * dot3d(grad3[gi2], x2, y2, z2);
      }
      
      var t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
      if(t3<0) { n3 = 0.0; }
      else 
      {
        t3 *= t3;
        n3 = t3 * t3 * dot3d(grad3[gi3], x3, y3, z3);
      }
      
      // Add contributions from each corner to get the final noise value.
      // The result is scaled to stay just inside [-1,1]
      return 32.0*(n0 + n1 + n2 + n3);
    }
    
    // 4D simplex noise
    this.noise4d = function(x, y, z, w) 
    {
      // The skewing and unskewing factors are hairy again for the 4D case
      var F4 = (Math.sqrt(5.0)-1.0)/4.0;
      var G4 = (5.0-Math.sqrt(5.0))/20.0;
      
      var n0, n1, n2, n3, n4; // Noise contributions from the five corners
      
      // Skew the (x,y,z,w) space to determine which cell of 24 simplices we're in
      var s = (x + y + z + w) * F4; // Factor for 4D skewing
      var i = fastfloor(x + s);
      var j = fastfloor(y + s);
      var k = fastfloor(z + s);
      var l = fastfloor(w + s);
      var t = (i + j + k + l) * G4; // Factor for 4D unskewing
      var X0 = i - t; // Unskew the cell origin back to (x,y,z,w) space
      var Y0 = j - t;
      var Z0 = k - t;
      var W0 = l - t;
      var x0 = x - X0; // The x,y,z,w distances from the cell origin
      var y0 = y - Y0;
      var z0 = z - Z0;
      var w0 = w - W0;
      
      // For the 4D case, the simplex is a 4D shape I won't even try to describe.
      // To find out which of the 24 possible simplices we're in, we need to
      // determine the magnitude ordering of x0, y0, z0 and w0.
      // The method below is a good way of finding the ordering of x,y,z,w and
      // then find the correct traversal order for the simplex we’re in.
      // First, six pair-wise comparisons are performed between each possible pair
      // of the four coordinates, and the results are used to add up binary bits
      // for an integer index.
      var c1 = (x0 > y0) ? 32 : 0;
      var c2 = (x0 > z0) ? 16 : 0;
      var c3 = (y0 > z0) ? 8 : 0;
      var c4 = (x0 > w0) ? 4 : 0;
      var c5 = (y0 > w0) ? 2 : 0;
      var c6 = (z0 > w0) ? 1 : 0;
      var c = c1 + c2 + c3 + c4 + c5 + c6;
      
      var i1, j1, k1, l1; // The integer offsets for the second simplex corner
      var i2, j2, k2, l2; // The integer offsets for the third simplex corner
      var i3, j3, k3, l3; // The integer offsets for the fourth simplex corner
      
      // simplex[c] is a 4-vector with the numbers 0, 1, 2 and 3 in some order.
      // Many values of c will never occur, since e.g. x>y>z>w makes x<z, y<w and x<w
      // impossible. Only the 24 indices which have non-zero entries make any sense.
      // We use a thresholding to set the coordinates in turn from the largest magnitude.
      
      // The number 3 in the "simplex" array is at the position of the largest coordinate.
      i1 = simplex[c][0]>=3 ? 1 : 0;
      j1 = simplex[c][1]>=3 ? 1 : 0;
      k1 = simplex[c][2]>=3 ? 1 : 0;
      l1 = simplex[c][3]>=3 ? 1 : 0;
      // The number 2 in the "simplex" array is at the second largest coordinate.
      i2 = simplex[c][0]>=2 ? 1 : 0;
      j2 = simplex[c][1]>=2 ? 1 : 0;
      k2 = simplex[c][2]>=2 ? 1 : 0;
      l2 = simplex[c][3]>=2 ? 1 : 0;
      // The number 1 in the "simplex" array is at the second smallest coordinate.
      i3 = simplex[c][0]>=1 ? 1 : 0;
      j3 = simplex[c][1]>=1 ? 1 : 0;
      k3 = simplex[c][2]>=1 ? 1 : 0;
      l3 = simplex[c][3]>=1 ? 1 : 0;
      
      // The fifth corner has all coordinate offsets = 1, so no need to look that up.
      var x1 = x0 - i1 + G4; // Offsets for second corner in (x,y,z,w) coords
      var y1 = y0 - j1 + G4;
      var z1 = z0 - k1 + G4;
      var w1 = w0 - l1 + G4;
      var x2 = x0 - i2 + 2.0*G4; // Offsets for third corner in (x,y,z,w) coords
      var y2 = y0 - j2 + 2.0*G4;
      var z2 = z0 - k2 + 2.0*G4;
      var w2 = w0 - l2 + 2.0*G4;
      var x3 = x0 - i3 + 3.0*G4; // Offsets for fourth corner in (x,y,z,w) coords
      var y3 = y0 - j3 + 3.0*G4;
      var z3 = z0 - k3 + 3.0*G4;
      var w3 = w0 - l3 + 3.0*G4;
      var x4 = x0 - 1.0 + 4.0*G4; // Offsets for last corner in (x,y,z,w) coords
      var y4 = y0 - 1.0 + 4.0*G4;
      var z4 = z0 - 1.0 + 4.0*G4;
      var w4 = w0 - 1.0 + 4.0*G4;
      
      // Work out the hashed gradient indices of the five simplex corners
      var ii = i & 255;
      var jj = j & 255;
      var kk = k & 255;
      var ll = l & 255;
      var gi0 = perm[ii+perm[jj+perm[kk+perm[ll]]]] % 32;
      var gi1 = perm[ii+i1+perm[jj+j1+perm[kk+k1+perm[ll+l1]]]] % 32;
      var gi2 = perm[ii+i2+perm[jj+j2+perm[kk+k2+perm[ll+l2]]]] % 32;
      var gi3 = perm[ii+i3+perm[jj+j3+perm[kk+k3+perm[ll+l3]]]] % 32;
      var gi4 = perm[ii+1+perm[jj+1+perm[kk+1+perm[ll+1]]]] % 32;
      
      // Calculate the contribution from the five corners
      var t0 = 0.6 - x0*x0 - y0*y0 - z0*z0 - w0*w0;
      if(t0<0) { n0 = 0.0; }
      else {
        t0 *= t0;
        n0 = t0 * t0 * dot4d(grad4[gi0], x0, y0, z0, w0);
      }
      var t1 = 0.6 - x1*x1 - y1*y1 - z1*z1 - w1*w1;
      if(t1<0) { n1 = 0.0; }
      else {
        t1 *= t1;
        n1 = t1 * t1 * dot4d(grad4[gi1], x1, y1, z1, w1);
      }
      var t2 = 0.6 - x2*x2 - y2*y2 - z2*z2 - w2*w2;
      if(t2<0) { n2 = 0.0; }
      else {
        t2 *= t2;
        n2 = t2 * t2 * dot4d(grad4[gi2], x2, y2, z2, w2);
      }
      var t3 = 0.6 - x3*x3 - y3*y3 - z3*z3 - w3*w3;
      if(t3<0) { n3 = 0.0; }
      else {
        t3 *= t3;
        n3 = t3 * t3 * dot4d(grad4[gi3], x3, y3, z3, w3);
      }
      var t4 = 0.6 - x4*x4 - y4*y4 - z4*z4 - w4*w4;
      if(t4<0) { n4 = 0.0; }
      else {
        t4 *= t4;
        n4 = t4 * t4 * dot4d(grad4[gi4], x4, y4, z4, w4);
      }
      // Sum up and scale the result to cover the range [-1,1]
      return 27.0 * (n0 + n1 + n2 + n3 + n4);
    }
  }

VVVV.Nodes.Simplex2d = function(id, graph) {
  this.constructor(id, "Simplex (2d)", graph);
  
  this.meta = {
    authors: ['woei'],
    original_authors: ['tonfilm'],
    credits: [],
    compatibility_issues: []
  };
  
  var positionIn = this.addInputPin("Position Input XY", [0.5,0.5], VVVV.PinTypes.Value);
  var octavesIn = this.addInputPin("Octaves", [0], VVVV.PinTypes.Value);
  var frequencyIn = this.addInputPin("Frequency", [1.0], VVVV.PinTypes.Value);
  var persistanceIn = this.addInputPin("Persistance", [0.5], VVVV.PinTypes.Value);
  
  var outputOut = this.addOutputPin("Output", [0.0], VVVV.PinTypes.Value);

  var noise = new SimplexNoise();

  this.evaluate = function() {
    
    var maxSize = Math.ceil(Math.max(positionIn.getSliceCount()*0.5));
    var octaves = parseInt(octavesIn.getValue(0));
    var freq = frequencyIn.getValue(0);
    var pers = persistanceIn.getValue(0);

    for (var i=0; i<maxSize; i++) {
      var x = positionIn.getValue(i*2);
      var y = positionIn.getValue(i*2+1);

      var noiseVal = 0.0;
      for (var o = 0; o <= octaves; o++) {
        var comul = Math.pow(freq, o);
        noiseVal += noise.noise2d(x*comul, y*comul) * Math.pow(pers, o);
      }
      outputOut.setValue(i, noiseVal);
    }
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.Simplex2d.prototype = new VVVV.Core.Node();

VVVV.Nodes.Simplex3d = function(id, graph) {
  this.constructor(id, "Simplex (3d)", graph);
  
  this.meta = {
    authors: ['woei'],
    original_authors: ['tonfilm'],
    credits: [],
    compatibility_issues: []
  };
  
  var positionIn = this.addInputPin("Position Input XYZ", [0.5,0.5,0.5], VVVV.PinTypes.Value);
  var octavesIn = this.addInputPin("Octaves", [0], VVVV.PinTypes.Value);
  var frequencyIn = this.addInputPin("Frequency", [1.0], VVVV.PinTypes.Value);
  var persistanceIn = this.addInputPin("Persistance", [0.5], VVVV.PinTypes.Value);
  
  var outputOut = this.addOutputPin("Output", [0.0], VVVV.PinTypes.Value);

  var noise = new SimplexNoise();

  this.evaluate = function() {
    
    var maxSize = Math.ceil(Math.max(positionIn.getSliceCount()/3));
    var octaves = parseInt(octavesIn.getValue(0));
    var freq = frequencyIn.getValue(0);
    var pers = persistanceIn.getValue(0);

    for (var i=0; i<maxSize; i++) {
      var x = positionIn.getValue(i*3);
      var y = positionIn.getValue(i*3+1);
      var z = positionIn.getValue(i*3+2);

      var noiseVal = 0.0;
      for (var o = 0; o <= octaves; o++) {
        var comul = Math.pow(freq, o);
        noiseVal += noise.noise3d(x*comul, y*comul, z*comul) * Math.pow(pers, o);
      }
      outputOut.setValue(i, noiseVal);
    }
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.Simplex3d.prototype = new VVVV.Core.Node();

VVVV.Nodes.Simplex4d = function(id, graph) {
  this.constructor(id, "Simplex (4d)", graph);
  
  this.meta = {
    authors: ['woei'],
    original_authors: ['tonfilm'],
    credits: [],
    compatibility_issues: []
  };
  
  var positionIn = this.addInputPin("Position Input XYZW", [0.5,0.5,0.5,0.5], VVVV.PinTypes.Value);
  var octavesIn = this.addInputPin("Octaves", [0], VVVV.PinTypes.Value);
  var frequencyIn = this.addInputPin("Frequency", [1.0], VVVV.PinTypes.Value);
  var persistanceIn = this.addInputPin("Persistance", [0.5], VVVV.PinTypes.Value);
  
  var outputOut = this.addOutputPin("Output", [0.0], VVVV.PinTypes.Value);

  var noise = new SimplexNoise();

  this.evaluate = function() {
    
    var maxSize = Math.ceil(Math.max(positionIn.getSliceCount()/3));
    var octaves = parseInt(octavesIn.getValue(0));
    var freq = frequencyIn.getValue(0);
    var pers = persistanceIn.getValue(0);

    for (var i=0; i<maxSize; i++) {
      var x = positionIn.getValue(i*4);
      var y = positionIn.getValue(i*4+1);
      var z = positionIn.getValue(i*4+2);
      var w = positionIn.getValue(i*4+3);

      var noiseVal = 0.0;
      for (var o = 0; o <= octaves; o++) {
        var comul = Math.pow(freq, o);
        noiseVal += noise.noise4d(x*comul, y*comul, z*comul, w*comul) * Math.pow(pers, o);
      }
      outputOut.setValue(i, noiseVal);
    }
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.Simplex4d.prototype = new VVVV.Core.Node();

}(vvvvjs_jquery));