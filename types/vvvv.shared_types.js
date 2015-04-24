// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

(function($) {


VVVV.Types.Color = function(str) {
  
  this.rgba = new Float32Array(_(str.split(',')).map(function(v) { return parseFloat(v); }));
  
  this.toString = function() {
    return this.rgba[0]+", "+this.rgba[1]+", "+this.rgba[2]+", "+this.rgba[3];
  }
  
  this.setHSV = function(h, s, v) {
    h = (h%1.0 + 1.0)%1.0 * 360;
    var hi = Math.floor(h/60.0);
    var f = (h/60.0) - hi;
    var p = v * (1-s);
    var q = v * (1-s*f);
    var t = v * (1-s*(1-f));
    switch (hi) {
      case 1: this.rgba[0] = q; this.rgba[1] = v; this.rgba[2] = p; break;
      case 2: this.rgba[0] = p; this.rgba[1] = v; this.rgba[2] = t; break;
      case 3: this.rgba[0] = p; this.rgba[1] = q; this.rgba[2] = v; break;
      case 4: this.rgba[0] = t; this.rgba[1] = p; this.rgba[2] = v; break;
      case 5: this.rgba[0] = v; this.rgba[1] = p; this.rgba[2] = q; break;
      default: this.rgba[0] = v; this.rgba[1] = t; this.rgba[2] = p;
    }
  }
  
  this.getHSV = function() {
    var r = this.rgba[0];
    var g = this.rgba[1];
    var b = this.rgba[2];
    var max = Math.max(r, Math.max(g, b));
    var min = Math.min(r, Math.min(g, b));
    var h;
    if (max==min)
      h = 0;
    else if (max == r)
      h = 60 * ( 0 + (g - b)/(max - min) );
    else if (max == g)
      h = 60 * ( 2 + (b - r)/(max - min) );
    else if (max == b)
      h = 60 * ( 4 + (r - g)/(max - min) );
    if (h<0)
      h = h + 360;
    var s = 0;
    if (max!=0)
      s = (max-min)/max;
    var v = max;
    return [h/360.0, s, v];
  }
  
  this.copy_to = function(col) {
    col.rgba[0] = this.rgba[0];
    col.rgba[1] = this.rgba[1];
    col.rgba[2] = this.rgba[2];
    col.rgba[3] = this.rgba[3];
  }
}

VVVV.Types.CanvasGraphics = {
  typeName: "CanvasGraphics",
  reset_on_disconnect: true,
  defaultValue: function() {
    return "NONE";
  }
  
}

}(vvvvjs_jquery));
