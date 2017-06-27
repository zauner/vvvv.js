// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }

define(function(require,exports) {


var _ = require('underscore');
var VVVV = require('core/vvvv.core.defines');


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

VVVV.Types.HTMLLayer = function(tagName) {

  this.tagName = tagName;
  this.styles = {};
  this.attributes = {};
  this.children = [emptyHTMLLayer];
  this.parent = emptyHTMLLayer;
  this.text = "";
  this.position = 0;
  this.style = defaultHTMLStyle;
  this.enabled = true;

  this.set_style_properties = {};

  this.enable = function() {
    this.element = $('<'+this.tagName+'>');
    this.element.data('vvvvjslayer', this);
    this.enabled = true;
    this.freshlyEnabled = true;
  }

  this.disable = function() {
    for (var i=0; i<this.children.length; i++) {
      if (this.children[i].tagName)
        this.children[i].disable();
    }
    this.children = [emptyHTMLLayer];
    this.parent = emptyHTMLLayer;
    this.attributes = {};
    if (this.element)
      this.element.remove();
    this.element = null;
    this.enabled = false;
  }

  if (this.tagName) {
    this.enable();
  }
  else
    this.element = undefined;

  this.setText = function(text) {
    if (!this.element || this.element.prop("tagName")=="IFRAME")
      return;
    this.text = text;
    var $el = $(this.element);
    if ($el.contents().length>0 && $el.contents().first()[0].nodeType==3)
      $el.contents().first()[0].data = this.text;
    else
      $el.prepend(document.createTextNode(this.text));
  }

  this.setAttribute = function(name, value) {
    if (!this.element)
      return;
    if (this.attributes[name]==value)
      return;
    this.attributes[name] = value;
    this.element.attr(name, value);
  }

  this.setStyle = function(style) {
    if (!this.element)
      return;
    this.style = style;
    for (var stylename in this.set_style_properties) {
      if (this.set_style_properties[stylename]==true && !this.style.style_properties[stylename]) {
        this.element.css(stylename, "");
        this.set_style_properties[stylename] = false;
      }
    }
    this.style.apply(this);
  }

  this.setParent = function(parent) {
    if (!this.element)
      return;
    if ((this.parent.element && parent.element && this.parent.element[0] == parent.element[0]) || (this.parent.element==undefined && parent.element==undefined && this.element.parent().length!=0))
      return;
    this.parent = parent;
    if (this.parent.tagName) {
      if (this.parent.element[0]!=this.element[0].parentElement) {
        this.parent.element.append(this.element);
        if (this.parent.children[0]==emptyHTMLLayer && this.parent.children.length==1)
          this.parent.children[0] = this;
        else
          this.parent.children.push(this);
      }
    }
    else if (this.element[0].parentElement!=document.body) {
      $('body').append(this.element);
    }
  }

  this.changeTagName = function(tagName) {
    if (!this.element)
      return;
    if (this.tagName == tagName)
      return;
    this.tagName = tagName;
    var $newElement = $('<'+this.tagName+'>');
    this.element.before($newElement);
    this.element.contents().detach().appendTo($newElement);
    this.element.remove();
    this.element = $newElement;
    this.style.apply(this);
  }
}

var emptyHTMLLayer = new VVVV.Types.HTMLLayer();

VVVV.PinTypes.HTMLLayer = {
  typeName: "HTMLLayer",
  reset_on_disconnect: true,
  defaultValue: function() {
    return emptyHTMLLayer
  }
}

VVVV.PinTypes.HTMLFile = {
  typeName: "HTMLFile",
  reset_on_disconnect: true,
  defaultValue: function() {
    return 'No File';
  }
}

VVVV.Types.HTMLStyle = function() {
  this.style_properties = {};
  this.inherited_properties = {};

  this.set_properties = {};

  this.apply = function(layer) {
    var $el = $(layer.element);
    for (var stylename in this.inherited_properties) {
      $el.css(stylename, this.inherited_properties[stylename]);
      layer.set_style_properties[stylename] = true;
    }
    for (var stylename in this.style_properties) {
      $el.css(stylename, this.style_properties[stylename]);
      layer.set_style_properties[stylename] = true;
    }
  }

  this.copy_properties = function(other_style) {
    for (var stylename in other_style.style_properties) {
      this.inherited_properties[stylename] = other_style.style_properties[stylename];
    }
    for (var stylename in other_style.inherited_properties) {
      this.inherited_properties[stylename] = other_style.inherited_properties[stylename];
    }

    // clear inherited properties which have been removed upstream
    for (var stylename in this.inherited_properties) {
      if (!other_style.style_properties[stylename] && !other_style.inherited_properties[stylename]) {
        delete this.inherited_properties[stylename];
      }
    }
  }
}

var defaultHTMLStyle = new VVVV.Types.HTMLStyle();

VVVV.PinTypes.HTMLStyle = {
  typeName: "HTMLStyle",
  reset_on_disconnect: true,
  defaultValue: function() {
    return defaultHTMLStyle;
  }
}

/*VVVV.Types.Buffer = function(b) {
  var data = b;

  this.toString = function(encoding) {
    if (VVVVContext.name=='nodejs')
      return data.toString();
    else
      return String.fromCharCode.apply(null, data);
  }
}*/

VVVV.PinTypes.Buffer = {
  typeName: "Buffer",
  reset_on_disconnect: true,
  defaultValue: function() { return "EMPTY BUFFER"; }
}

VVVV.Types.SceneBuffer = function(vectorSize, data, offset, count, id) {
  this.VectorSize = vectorSize;
  this.data = data;
  this.offset = offset;
  this.count = count;
  this.id = id;
  }

VVVV.PinTypes.SceneBuffer = {
  typeName: "SceneBuffer",
  reset_on_disconnect: true,
  defaultValue: function() {
    return "No Buffer"
  }
}

});
