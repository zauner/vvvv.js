// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

(function($) {

VVVV.Types.CanvasTexture = { imageObject: undefined, loaded: false };

VVVV.Types.CanvasRenderState = function() {
  this.fillColor = new VVVV.Types.Color("1,1,1,1");
  this.strokeColor = new VVVV.Types.Color("0,0,0,0");
  this.lineWidth = 1.0;
  this.capStyle = 'butt';
  this.joinStyle = 'miter';
  this.gradient = {type: 'none'};
  this.shadowOffsetX = 0.0;
  this.shadowOffsetY = 0.0;
  this.shadowBlur = 0.0;
  this.shadowColor = new VVVV.Types.Color("0,0,0,1");
  this.blendMode = 'source-over';

  this.copy_attributes = function(other) {
    other.fillColor.copy_to(this.fillColor);
    other.strokeColor.copy_to(this.strokeColor);
    this.lineWidth = other.lineWidth;
    this.capStyle = other.capStyle;
    this.joinStyle = other.joinStyle;
    this.gradient = other.gradient;
    this.shadowOffsetX = other.shadowOffsetX;
    this.shadowOffsetY = other.shadowOffsetY;
    this.shadowBlur = other.shadowBlur;
    other.shadowColor.copy_to(this.shadowColor);
    this.blendMode = other.blendMode;
  }

  this.apply = function(ctx) {
    if (this.gradient.type!='none') {
      if (this.gradient.type=='linear')
        var g = ctx.createLinearGradient(this.gradient.startX,this.gradient.startY,this.gradient.endX, this.gradient.endY);

      var numStops = Math.max(this.gradient.colors.length, this.gradient.colorPositions.length);
      for (var i=0; i<numStops; i++) {
        var color = this.gradient.colors[i];
        g.addColorStop(this.gradient.colorPositions[i], 'rgba('+parseInt(color.rgba[0]*255)+','+parseInt(color.rgba[1]*255)+','+parseInt(color.rgba[2]*255)+','+color.rgba[3]+')');
      }
      ctx.fillStyle = g;
    }
    else
      ctx.fillStyle = 'rgba('+parseInt(this.fillColor.rgba[0]*255)+','+parseInt(this.fillColor.rgba[1]*255)+','+parseInt(this.fillColor.rgba[2]*255)+','+this.fillColor.rgba[3]+')';

    ctx.strokeStyle = 'rgba('+parseInt(this.strokeColor.rgba[0]*255)+','+parseInt(this.strokeColor.rgba[1]*255)+','+parseInt(this.strokeColor.rgba[2]*255)+','+this.strokeColor.rgba[3]+')';
    ctx.lineWidth = this.lineWidth/ctx.canvas.height;
    ctx.lineCap = this.capStyle;
    ctx.lineJoin = this.joinStyle;
    ctx.shadowOffsetX = this.shadowOffsetX;
    ctx.shadowOffsetY = this.shadowOffsetY;
    ctx.shadowBlur = this.shadowBlur;
    ctx.shadowColor = 'rgba('+parseInt(this.shadowColor.rgba[0]*255)+','+parseInt(this.shadowColor[1]*255)+','+parseInt(this.shadowColor[2]*255)+','+this.shadowColor[3]+')';
    ctx.globalCompositeOperation = this.blendMode;
  }
}

var defaultRenderState = new VVVV.Types.CanvasRenderState();
var invisibleRenderState = new VVVV.Types.CanvasRenderState();
invisibleRenderState.fillColor = new VVVV.Types.Color("0.0, 0.0, 0.0, 0.0");
VVVV.PinTypes.CanvasRenderState = {
  typeName: "CanvasRenderState",
  reset_on_disconnect: true,
  defaultValue: function() {
    return defaultRenderState;
  }
}

VVVV.Types.CanvasLayer = function() {
  this.draw = function() {};
}

var defaultCanvasLayer = new VVVV.Types.CanvasLayer();
VVVV.PinTypes.CanvasLayer = {
  typeName: "CanvasLayer",
  reset_on_disconnect: true,
  defaultValue: function() { return defaultCanvasLayer; }
}

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Fill (Canvas VVVVjs RenderState)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.FillCanvas = function(id, graph) {
  this.constructor(id, "Fill (Canvas VVVVjs RenderState)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  var renderStateIn = this.addInputPin("Render State In", [], VVVV.PinTypes.CanvasRenderState);
  var colorIn = this.addInputPin("Color", [new VVVV.Types.Color('1.0, 1.0, 1.0, 1.0')], VVVV.PinTypes.Color);

  var renderStateOut = this.addOutputPin("Render State Out", [], VVVV.PinTypes.CanvasRenderState);

  var renderStates = [];

  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSpreadSize; i++) {
      if (renderStates[i]==undefined) {
        renderStates[i] = new VVVV.Types.CanvasRenderState();
      }
      renderStates[i].copy_attributes(renderStateIn.getValue(i));
      colorIn.getValue(i).copy_to(renderStates[i].fillColor);
      renderStateOut.setValue(i, renderStates[i]);
    }
    renderStateOut.setSliceCount(maxSpreadSize);

  }
}
VVVV.Nodes.FillCanvas.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Stroke (Canvas VVVVjs RenderState)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.StrokeCanvas = function(id, graph) {
  this.constructor(id, "Stroke (Canvas VVVVjs RenderState)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  var renderStateIn = this.addInputPin("Render State In", [], VVVV.PinTypes.CanvasRenderState);
  var colorIn = this.addInputPin("Color", [new VVVV.Types.Color('1.0, 1.0, 1.0, 1.0')], VVVV.PinTypes.Color);
  var lineWidthIn = this.addInputPin("Width", [1.0], VVVV.PinTypes.Value);
  var capStyleIn = this.addInputPin("Cap Style", ['butt'], VVVV.PinTypes.Enum);
  capStyleIn.enumOptions = ['butt', 'round', 'square'];
  var joinStyleIn = this.addInputPin("Join Style", ['miter'], VVVV.PinTypes.Enum);
  joinStyleIn.enumOptions = ['miter', 'round', 'bevel'];

  var renderStateOut = this.addOutputPin("Render State Out", [], VVVV.PinTypes.CanvasRenderState);

  var renderStates = [];

  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSpreadSize; i++) {
      if (renderStates[i]==undefined) {
        renderStates[i] = new VVVV.Types.CanvasRenderState();
      }
      renderStates[i].copy_attributes(renderStateIn.getValue(i));

      colorIn.getValue(i).copy_to(renderStates[i].strokeColor);
      renderStates[i].lineWidth = lineWidthIn.getValue(i);
      renderStates[i].capStyle = capStyleIn.getValue(i);
      renderStates[i].joinStyle = joinStyleIn.getValue(i);
      renderStateOut.setValue(i, renderStates[i]);
    }
    renderStateOut.setSliceCount(maxSpreadSize);

  }
}
VVVV.Nodes.StrokeCanvas.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Shadow (Canvas VVVVjs RenderState)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.ShadowCanvas = function(id, graph) {
  this.constructor(id, "Shadow (Canvas VVVVjs RenderState)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  var renderStateIn = this.addInputPin("Render State In", [], VVVV.PinTypes.CanvasRenderState);
  var colorIn = this.addInputPin("Color", [new VVVV.Types.Color('0.0, 0.0, 0.0, 1.0')], VVVV.PinTypes.Color);
  var xOffsetIn = this.addInputPin("Offset X", [0.0], VVVV.PinTypes.Value);
  var yOffsetIn = this.addInputPin("Offset Y", [0.0], VVVV.PinTypes.Value);
  var blurIn = this.addInputPin("Blur", [0.0], VVVV.PinTypes.Value);

  var renderStateOut = this.addOutputPin("Render State Out", [], VVVV.PinTypes.CanvasRenderState);

  var renderStates = [];

  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSpreadSize; i++) {
      if (renderStates[i]==undefined) {
        renderStates[i] = new VVVV.Types.CanvasRenderState();
      }
      renderStates[i].copy_attributes(renderStateIn.getValue(i));
      renderStates[i].shadowOffsetX = xOffsetIn.getValue(i);
      renderStates[i].shadowOffsetY = yOffsetIn.getValue(i);
      renderStates[i].shadowBlur = blurIn.getValue(i);
      colorIn.getValue(i).copy_to(renderStates[i].shadowColor);
      renderStateOut.setValue(i, renderStates[i]);
    }
    renderStateOut.setSliceCount(maxSpreadSize);

  }
}
VVVV.Nodes.ShadowCanvas.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Blend (Canvas VVVVjs RenderState)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.BlendCanvas = function(id, graph) {
  this.constructor(id, "Blend (Canvas VVVVjs RenderState)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  var renderStateIn = this.addInputPin("Render State In", [], VVVV.PinTypes.CanvasRenderState);
  var modeIn = this.addInputPin("Mode", ['source-over'], VVVV.PinTypes.Enum);
  modeIn.enumOptions = ['source-over', 'source-out', 'source-in', 'source-atop', 'destination-over', 'destination-out', 'destination-in', 'destination-atop', 'copy', 'lighter', 'xor'];

  var renderStateOut = this.addOutputPin("Render State Out", [], VVVV.PinTypes.CanvasRenderState);

  var renderStates = [];

  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSpreadSize; i++) {
      if (renderStates[i]==undefined) {
        renderStates[i] = new VVVV.Types.CanvasRenderState();
      }
      renderStates[i].copy_attributes(renderStateIn.getValue(i));
      renderStates[i].blendMode = modeIn.getValue(i);
      renderStateOut.setValue(i, renderStates[i]);
    }
    renderStateOut.setSliceCount(maxSpreadSize);

  }
}
VVVV.Nodes.BlendCanvas.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: LinearGradient (Canvas VVVVjs RenderState)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.LinearGradientCanvas = function(id, graph) {
  this.constructor(id, "LinearGradient (Canvas VVVVjs RenderState)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  var renderStateIn = this.addInputPin("Render State In", [], VVVV.PinTypes.CanvasRenderState);
  var startXIn = this.addInputPin("Start X", [0.0], VVVV.PinTypes.Value);
  var startYIn = this.addInputPin("Start Y", [0.0], VVVV.PinTypes.Value);
  var endXIn = this.addInputPin("End X", [0.0], VVVV.PinTypes.Value);
  var endYIn = this.addInputPin("End Y", [0.0], VVVV.PinTypes.Value);
  var colorsIn = this.addInputPin("Colors", [new VVVV.Types.Color('1.0, 1.0, 1.0, 1.0'), new VVVV.Types.Color('0.0, 0.0, 0.0, 1.0')], VVVV.PinTypes.Color);
  var colorPositionsIn = this.addInputPin("Color Positions", [0.0, 1.0], VVVV.PinTypes.Value);

  var renderStateOut = this.addOutputPin("Render State Out", [], VVVV.PinTypes.CanvasRenderState);

  var renderStates = [];

  this.evaluate = function() {
    var maxSpreadSize = Math.max(renderStateIn.getSliceCount(), startXIn.getSliceCount());
    maxSpreadSize = Math.max(maxSpreadSize, startYIn.getSliceCount());
    maxSpreadSize = Math.max(maxSpreadSize, endXIn.getSliceCount());
    maxSpreadSize = Math.max(maxSpreadSize, endYIn.getSliceCount());

    for (var i=0; i<maxSpreadSize; i++) {
      if (renderStates[i]==undefined) {
        renderStates[i] = new VVVV.Types.CanvasRenderState();
      }
      renderStates[i].copy_attributes(renderStateIn.getValue(i));
      renderStates[i].gradient = {type: 'linear'};
      renderStates[i].gradient.startX = startXIn.getValue(i);
      renderStates[i].gradient.startY = startYIn.getValue(i);
      renderStates[i].gradient.endX = endXIn.getValue(i);
      renderStates[i].gradient.endY = endYIn.getValue(i);
      renderStates[i].gradient.colors = [];
      renderStates[i].gradient.colorPositions = [];
      var numStops = Math.max(colorsIn.getSliceCount(), colorPositionsIn.getSliceCount());
      for (var j=0; j<numStops; j++) {
        renderStates[i].gradient.colors.push(colorsIn.getValue(j));
        renderStates[i].gradient.colorPositions.push(colorPositionsIn.getValue(j));
      }
      renderStateOut.setValue(i, renderStates[i]);
    }
    renderStateOut.setSliceCount(maxSpreadSize);

  }
}
VVVV.Nodes.LinearGradientCanvas.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Arc (Canvas VVVVjs)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.ArcCanvas = function(id, graph) {
  this.constructor(id, "Arc (Canvas VVVVjs)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  var renderStateIn = this.addInputPin('Render State', [], VVVV.PinTypes.CanvasRenderState);
  var transformIn = this.addInputPin('Transform', [], VVVV.PinTypes.Transform);
  var clippingLayerIn = this.addInputPin('Clipping Layer', [], VVVV.PinTypes.CanvasLayer);
  var radiusIn = this.addInputPin('Radius', [1.0], VVVV.PinTypes.Value);
  var startAngleIn = this.addInputPin('Start Angle', [0.0], VVVV.PinTypes.Value);
  var endAngleIn = this.addInputPin('End Angle', [0.5], VVVV.PinTypes.Value);
  var segmentIn = this.addInputPin('Draw Segment', [0], VVVV.PinTypes.Value);

  var layersOut = this.addOutputPin('Layer', [], VVVV.PinTypes.CanvasLayer);

  var layers = [];

  var Arc = function() {
    this.transform = mat4.create();
    mat4.identity(this.transform);
    this.startAngle = 0;
    this.endAngle = 0.5;
    this.strokeColor = [1.0, 1.0, 1.0, 1.0];
    this.lineWidth = 1.0;
    this.renderState = defaultRenderState;
    this.clippingLayer = defaultCanvasLayer;
    this.drawSegment = false;

    this.draw = function(ctx, invisible) {
      if (this.clippingLayer!=defaultCanvasLayer) {
        ctx.save();
        this.clippingLayer.draw(ctx, true);
        ctx.clip();
      }
      ctx.restoreView();
      if (this.transform)
        ctx.transform(this.transform[0], this.transform[1], this.transform[4], this.transform[5], this.transform[12], this.transform[13]);
      ctx.beginPath();
      if (!invisible)
        this.renderState.apply(ctx);
      else
        invisibleRenderState.apply(ctx);
      if (this.drawSegment) {
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(this.startAngle) * this.radius, Math.sin(this.startAngle) * this.radius);
      }
      ctx.arc(0, 0, this.radius, this.startAngle, this.endAngle, false);
      if (this.drawSegment) {
        ctx.moveTo(Math.cos(this.endAngle) * this.radius, Math.sin(this.endAngle) * this.radius);
        ctx.lineTo(0, 0);
      }
      if (this.renderState.fillColor.rgba[3]>0)
        ctx.fill();
      if (this.renderState.strokeColor.rgba[3]>0)
        ctx.stroke();
      if (this.clippingLayer!=defaultCanvasLayer)
        ctx.restore();
    }
  }

  this.evaluate = function() {

    //if (xIn.pinIsChanged() || yIn.pinIsChanged() || rIn.pinIsChanged() || strokeColorIn.pinIsChanged() || startAngleIn.pinIsChanged() || endAngleIn.pinIsChanged() || lineWidthIn.pinIsChanged() || fillColorIn.pinIsChanged()) {
      var maxSpreadSize = this.getMaxInputSliceCount();

      for (var i=0; i<maxSpreadSize; i++) {
        if (layers[i]==undefined)
          layers[i] = new Arc();
        layers[i].transform = transformIn.getValue(i);
        layers[i].radius = radiusIn.getValue(i);
        layers[i].startAngle = startAngleIn.getValue(i)*Math.PI*2;
        layers[i].endAngle = endAngleIn.getValue(i)*Math.PI*2;
        layers[i].renderState = renderStateIn.getValue(i);
        layers[i].drawSegment = segmentIn.getValue(i)==1;
        if (layers[i].radius<0) {
          layers[i].radius = -layers[i].radius;
          layers[i].startAngle += Math.PI;
          layers[i].endAngle += Math.PI;
        }
        layers[i].clippingLayer = clippingLayerIn.getValue(i);
      }

      for (var i=0; i<layers.length; i++) {
        layersOut.setValue(i, layers[i]);
      }

      layersOut.setSliceCount(maxSpreadSize);
    //}

  }
}
VVVV.Nodes.ArcCanvas.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Rectangle (Canvas VVVVjs)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.RectangleCanvas = function(id, graph) {
  this.constructor(id, "Rectangle (Canvas VVVVjs)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  var renderStateIn = this.addInputPin('Render State', [], VVVV.PinTypes.CanvasRenderState);
  var transformIn = this.addInputPin('Transform', [], VVVV.PinTypes.Transform);
  var clippingLayerIn = this.addInputPin('Clipping Layer', [], VVVV.PinTypes.CanvasLayer);
  var widthIn = this.addInputPin('Width', [1.0], VVVV.PinTypes.Value);
  var heightIn = this.addInputPin('Height', [1.0], VVVV.PinTypes.Value);
  var cornerRadiusIn = this.addInputPin('Corner Radius', [0.0], VVVV.PinTypes.Value);

  var layersOut = this.addOutputPin('Layer', [], VVVV.PinTypes.CanvasLayer);

  var layers = [];

  var Rectangle = function() {
    this.transform = mat4.create();
    mat4.identity(this.transform);
    this.renderState = defaultRenderState;
    this.clippingLayer = defaultCanvasLayer;

    this.draw = function(ctx, invisible) {
      if (this.clippingLayer!=defaultCanvasLayer) {
        ctx.save();
        this.clippingLayer.draw(ctx, true);
        ctx.clip();
      }

      ctx.restoreView();
      if (this.transform)
        ctx.transform(this.transform[0], this.transform[1], this.transform[4], this.transform[5], this.transform[12], this.transform[13]);
      ctx.beginPath();
      if (!invisible)
        this.renderState.apply(ctx);
      else
        invisibleRenderState.apply(ctx);
      var outer_right = this.width / 2;
      var inner_right = outer_right - this.cornerRadius;
      var outer_top = this.height / 2;
      var inner_top = outer_top - this.cornerRadius;
      var outer_left = -outer_right;
      var inner_left = -inner_right;
      var outer_bottom = -outer_top;
      var inner_bottom = -inner_top;
      ctx.moveTo(inner_left, outer_bottom);
      ctx.lineTo(inner_right, outer_bottom);
      ctx.arc(inner_right, inner_bottom, this.cornerRadius, 1.5 * Math.PI, 0, false);
      ctx.lineTo(outer_right, inner_top);
      ctx.arc(inner_right, inner_top, this.cornerRadius, 0, 0.5 * Math.PI, false);
      ctx.lineTo(inner_left, outer_top);
      ctx.arc(inner_left, inner_top, this.cornerRadius, 0.5 * Math.PI, Math.PI, false);
      ctx.lineTo(outer_left, inner_bottom);
      ctx.arc(inner_left, inner_bottom, this.cornerRadius, Math.PI, 1.5 * Math.PI, false);
      ctx.closePath();
      if (this.renderState.fillColor.rgba[3]>0)
        ctx.fill();
      if (this.renderState.strokeColor.rgba[3]>0)
        ctx.stroke();
      if (this.clippingLayer!=defaultCanvasLayer)
        ctx.restore();

    }
  }

  this.evaluate = function() {

    //if (xIn.pinIsChanged() || yIn.pinIsChanged() || rIn.pinIsChanged() || strokeColorIn.pinIsChanged() || startAngleIn.pinIsChanged() || endAngleIn.pinIsChanged() || lineWidthIn.pinIsChanged() || fillColorIn.pinIsChanged()) {
      var maxSpreadSize = this.getMaxInputSliceCount();

      for (var i=0; i<maxSpreadSize; i++) {
        if (layers[i]==undefined)
          layers[i] = new Rectangle();
        layers[i].transform = transformIn.getValue(i);
        layers[i].width = widthIn.getValue(i);
        layers[i].height = heightIn.getValue(i);
        layers[i].cornerRadius = cornerRadiusIn.getValue(i);
        layers[i].renderState = renderStateIn.getValue(i);
        layers[i].clippingLayer = clippingLayerIn.getValue(i);
      }

      for (var i=0; i<layers.length; i++) {
        layersOut.setValue(i, layers[i]);
      }

      layersOut.setSliceCount(maxSpreadSize);
    //}

  }
}
VVVV.Nodes.RectangleCanvas.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Text (Canvas VVVVjs)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.TextCanvas = function(id, graph) {
  this.constructor(id, "Text (Canvas VVVVjs)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  var renderStateIn = this.addInputPin('Render State', [], VVVV.PinTypes.CanvasRenderState);
  var transformIn = this.addInputPin('Transform', [], VVVV.PinTypes.Transform);
  var clippingLayerIn = this.addInputPin('Clipping Layer', [], VVVV.PinTypes.CanvasLayer);
  var textIn = this.addInputPin('Text', ['VVVV.js'], VVVV.PinTypes.String);
  var fontIn = this.addInputPin('Font', ['10px sans-serif'], VVVV.PinTypes.String);
  var alignIn = this.addInputPin('Align', ['start'], VVVV.PinTypes.Enum);
  alignIn.enumOptions = ['start', 'left', 'end', 'right', 'center'];
  var baselineIn = this.addInputPin('Baseline', ['alphabetic'], VVVV.PinTypes.Enum);
  baselineIn.enumOptions = ['top', 'hanging', 'middle', 'alphabetic', 'ideographic', 'bottom'];

  var layersOut = this.addOutputPin('Layer', [], VVVV.PinTypes.CanvasLayer);

  var layers = [];

  var Text = function() {
    this.transform = mat4.create();
    mat4.identity(this.transform);
    this.text = "VVVV.js";
    this.font = "sans-serif";
    this.align = 'start';
    this.baseline = 'top';
    this.renderState = defaultRenderState;
    this.clippingLayer = defaultCanvasLayer;

    this.draw = function(ctx, invisible) {
      if (this.clippingLayer!=defaultCanvasLayer) {
        ctx.save();
        this.clippingLayer.draw(ctx, true);
        ctx.clip();
      }

      ctx.restoreView();
      ctx.save();
      if (this.transform)
        ctx.transform(this.transform[0], this.transform[1], this.transform[4], this.transform[5], this.transform[12], this.transform[13]);
      ctx.scale(1/100, -1/100);
      ctx.font = "100px "+this.font;
      ctx.textAlign = this.align;
      ctx.textBaseline = this.baseline;
      if (!invisible)
        this.renderState.apply(ctx);
      else
        invisibleRenderState.apply(ctx);
      if (this.renderState.fillColor.rgba[3]>0)
        ctx.fillText(this.text, 0, 0);
      if (this.renderState.strokeColor.rgba[3]>0)
        ctx.strokeText(this.text, 0, 0);
      ctx.restore();
      if (this.clippingLayer!=defaultCanvasLayer)
        ctx.restore();
    }
  }

  this.evaluate = function() {

    var maxSpreadSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSpreadSize; i++) {
      if (layers[i]==undefined)
        layers[i] = new Text();
      layers[i].transform = transformIn.getValue(i);
      layers[i].text = textIn.getValue(i);
      layers[i].font = fontIn.getValue(i);
      layers[i].align = alignIn.getValue(i);
      layers[i].baseline = baselineIn.getValue(i);
      layers[i].renderState = renderStateIn.getValue(i);
      layers[i].clippingLayer = clippingLayerIn.getValue(i);
    }

    for (var i=0; i<layers.length; i++) {
      layersOut.setValue(i, layers[i]);
    }

    layersOut.setSliceCount(maxSpreadSize);

  }
}
VVVV.Nodes.TextCanvas.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: BezierCurve (Canvas VVVVjs)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.BezierCurveCanvas = function(id, graph) {
  this.constructor(id, "BezierCurve (Canvas VVVVjs)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  var renderStateIn = this.addInputPin('Render State', [], VVVV.PinTypes.CanvasRenderState);
  var transformIn = this.addInputPin('Transform', [], VVVV.PinTypes.Transform);
  var clippingLayerIn = this.addInputPin('Clipping Layer', [], VVVV.PinTypes.CanvasLayer);
  var xIn = this.addInputPin('X', [0.0], VVVV.PinTypes.Value);
  var yIn = this.addInputPin('Y', [0.0], VVVV.PinTypes.Value);
  var control1XIn = this.addInputPin('Control 1 X', [0.0], VVVV.PinTypes.Value);
  var control1YIn = this.addInputPin('Control 1 Y', [0.0], VVVV.PinTypes.Value);
  var control2XIn = this.addInputPin('Control 2 X', [0.0], VVVV.PinTypes.Value);
  var control2YIn = this.addInputPin('Control 2 Y', [0.0], VVVV.PinTypes.Value);
  var binSizeIn = this.addInputPin('BinSize', [-1], VVVV.PinTypes.Value);

  var layersOut = this.addOutputPin('Layer', [], VVVV.PinTypes.CanvasLayer);

  var layers = [];

  var BezierCurve = function() {
    this.transform = mat4.create();
    mat4.identity(this.transform);
    this.x = [];
    this.y = [];
    this.c1x = [];
    this.c1y = [];
    this.c2x = [];
    this.c2y = [];
    this.strokeColor = [1.0, 1.0, 1.0, 1.0];
    this.lineWidth = 1.0;
    this.fillColor = [1.0, 1.0, 1.0, 1.0];
    this.renderState = defaultRenderState;
    this.clippingLayer = defaultCanvasLayer;

    this.draw = function(ctx, invisible) {
      if (this.x.length<1)
        return;

      if (this.clippingLayer!=defaultCanvasLayer) {
        ctx.save();
        this.clippingLayer.draw(ctx, true);
        ctx.clip();
      }

      if (!invisible)
        this.renderState.apply(ctx);
      else
        invisibleRenderState.apply(ctx);

      ctx.restoreView();
      if (this.transform)
        ctx.transform(this.transform[0], this.transform[1], this.transform[4], this.transform[5], this.transform[12], this.transform[13]);

      ctx.beginPath();
      ctx.moveTo(this.x[0], this.y[0]);
      for (var i=1; i<this.x.length; i++) {
        ctx.bezierCurveTo(
          this.c1x[i-1]+this.x[i-1],
          this.c1y[i-1]+this.y[i-1],
          this.c2x[i]+this.x[i],
          this.c2y[i]+this.y[i],
          this.x[i],
          this.y[i]
        );
      }
      if (this.renderState.fillColor.rgba[3]>0)
        ctx.fill();
      if (this.renderState.strokeColor.rgba[3]>0)
        ctx.stroke();

      if (this.clippingLayer!=defaultCanvasLayer)
        ctx.restore();
    }
  }

  function adjustVertexListSize(layer, idx) {
    layer.x.splice(idx);
    layer.y.splice(idx);
    layer.c1x.splice(idx);
    layer.c1y.splice(idx);
    layer.c2x.splice(idx);
    layer.c2y.splice(idx);
  }

  this.evaluate = function() {

    //if (xIn.pinIsChanged() || yIn.pinIsChanged() || control1XIn.pinIsChanged() || control2XIn.pinIsChanged()|| control2XIn.pinIsChanged() || control2YIn.pinIsChanged() || strokeColorIn.pinIsChanged() || lineWidthIn.pinIsChanged() || fillColorIn.pinIsChanged()) {
      var maxSpreadSize = this.getMaxInputSliceCount();

      var binNum = 0;
      var subIndex = 0;
      for (var j=0; j<maxSpreadSize || (binSizeIn.getValue(0)>0 && (subIndex>0 || binNum%transformIn.getSliceCount()>0)); j++) {
        if (layers[binNum]==undefined)
          layers[binNum] = new BezierCurve();


        if (subIndex == 0) {
          layers[binNum].renderState = renderStateIn.getValue(binNum);
          layers[binNum].transform = transformIn.getValue(binNum);
          layers[binNum].clippingLayer = clippingLayerIn.getValue(binNum);
        }
        layers[binNum].x[subIndex] = xIn.getValue(j);
        layers[binNum].y[subIndex] = yIn.getValue(j);
        layers[binNum].c1x[subIndex] = control1XIn.getValue(j);
        layers[binNum].c1y[subIndex] = control1YIn.getValue(j);
        layers[binNum].c2x[subIndex] = control2XIn.getValue(j);
        layers[binNum].c2y[subIndex] = control2YIn.getValue(j);

        subIndex++;
        if (binSizeIn.getValue(0)>0 && subIndex>=binSizeIn.getValue(binNum)) {
          if (subIndex<layers[binNum].x.length) {
            adjustVertexListSize(layers[binNum], subIndex);
          }
          binNum++;
          subIndex = 0;
        }
      }
      if (binSizeIn.getValue(0)<0) {
        if (subIndex<layers[binNum].x.length) {
          adjustVertexListSize(layers[binNum], subIndex);
          layers.splice(1);
        }
      }
      else
        layers.splice(binNum);
      for (var i=0; i<layers.length; i++) {
        layersOut.setValue(i, layers[i]);
      }
      layersOut.setSliceCount(layers.length);
    //}

  }
}
VVVV.Nodes.BezierCurveCanvas.prototype = new VVVV.Core.Node();



/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Quad (Canvas VVVVjs)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.QuadCanvas = function(id, graph) {
  this.constructor(id, "Quad (Canvas VVVVjs)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  var transformIn = this.addInputPin('Transform', [], VVVV.PinTypes.Transform);
  var clippingLayerIn = this.addInputPin('Clipping Layer', [], VVVV.PinTypes.CanvasLayer);
  var textureIn = this.addInputPin('Texture', [], VVVV.PinTypes.HTML5Texture);
  var colorIn = this.addInputPin('Color', [new VVVV.Types.Color('1.0, 1.0, 1.0, 1.0')], VVVV.PinTypes.Color);

  var layersOut = this.addOutputPin('Layer', [], VVVV.PinTypes.CanvasLayer);

  var layers = [];

  var Quad = function() {
    this.transform = mat4.create();
    this.clippingLayer = defaultCanvasLayer;
    mat4.identity(this.transform);
    this.texture = VVVV.PinTypes.HTML5Texture.defaultValue();
    this.color = [1.0, 1.0, 1.0, 1.0];

    this.draw = function(ctx, invisible) {
      if (this.clippingLayer!=defaultCanvasLayer) {
        ctx.save();
        this.clippingLayer.draw(ctx, true);
        ctx.clip();
      }

      ctx.restoreView();
      if (this.transform)
        ctx.transform(this.transform[0], this.transform[1], this.transform[4], this.transform[5], this.transform[12], this.transform[13]);

      if (this.texture!="Empty Texture") {
        if (this.texture.loaded) {
          ctx.globalAlpha = this.color[3];
          ctx.save();
            ctx.translate(-.5, .5);
            if (this.texture.videoWidth)
              ctx.scale(1/this.texture.videoWidth, -1/this.texture.videoHeight);
            else
              ctx.scale(1/this.texture.width, -1/this.texture.height);
            ctx.drawImage(this.texture, 0, 0);
          ctx.restore();
          ctx.fillStyle = 'rgba(0, 0, 0, .001)';
          ctx.fillRect(-.5, -.5, 1, 1);
          ctx.globalAlpha = 1.0;
        }
      }
      else {
        ctx.fillStyle = 'rgba('+parseInt(this.color.rgba[0]*255)+', '+parseInt(this.color.rgba[1]*255)+', '+parseInt(this.color.rgba[2]*255)+', '+this.color.rgba[3]+')';
        ctx.fillRect(-.5, -.5, 1, 1);
      }

      if (this.clippingLayer!=defaultCanvasLayer)
        ctx.restore();
    }
  }

  this.evaluate = function() {

    var maxSpreadSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSpreadSize; i++) {
      if (layers[i]==undefined)
        layers[i] = new Quad();
      layers[i].transform = transformIn.getValue(i);
      layers[i].texture = textureIn.getValue(i);
      layers[i].color = colorIn.getValue(i);
      layers[i].clippingLayer = clippingLayerIn.getValue(i);
    }

    for (var i=0; i<layers.length; i++) {
      layersOut.setValue(i, layers[i]);
    }

    layersOut.setSliceCount(maxSpreadSize);

  }
}
VVVV.Nodes.QuadCanvas.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Group (Canvas VVVVjs)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GroupCanvas = function(id, graph) {
  this.constructor(id, "Group (Canvas VVVVjs)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  var layerCountIn = this.addInvisiblePin("Layer Count", [2], VVVV.PinTypes.Value);

  var layerIns = [];

  var layerOut = this.addOutputPin("Layer", [], VVVV.PinTypes.CanvasLayer);

  this.initialize = function() {
    var layerCount = Math.max(2, layerCountIn.getValue(0));
    VVVV.Helpers.dynamicPins(this, layerIns, layerCount, function(i) {
      return this.addInputPin("Layer "+(i+1), [], VVVV.PinTypes.CanvasLayer);
    });
  }

  this.evaluate = function() {
    if (layerCountIn.pinIsChanged())
      this.initialize();
    var outSliceIdx = 0;
    var layerCount = layerIns.length;
    var sliceCount;
    for (var i=0; i<layerCount; i++) {
      if (layerIns[i].isConnected()) {
        sliceCount = layerIns[i].getSliceCount();
        for (var j=0; j<sliceCount; j++) {
          layerOut.setValue(outSliceIdx++, layerIns[i].getValue(j));
        }
      }
    }
    if (outSliceIdx>0)
      layerOut.setSliceCount(outSliceIdx);
    else {
      layerOut.setValue(0, defaultCanvasLayer);
      layerOut.setSliceCount(1);
    }
  }

}
VVVV.Nodes.GroupCanvas.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Renderer (Canvas VVVVjs)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.RendererCanvas = function(id, graph) {
  this.constructor(id, "Renderer (Canvas VVVVjs)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_nil = false;

  var layersIn = this.addInputPin("Layers", [], VVVV.PinTypes.CanvasLayer);
  var clearIn = this.addInputPin("Clear", [1], VVVV.PinTypes.Value);
  var bgColorIn = this.addInputPin("Background Color", [new VVVV.Types.Color("0.0, 0.0, 0.0, 1.0")], VVVV.PinTypes.Color);
  var bufferWidthIn = this.addInputPin("Backbuffer Width", [0], VVVV.PinTypes.Value);
  var bufferHeightIn = this.addInputPin("Backbuffer Height", [0], VVVV.PinTypes.Value);
  var viewIn = this.addInputPin("View", [], VVVV.PinTypes.Transform);

  var canvasOut = this.addOutputPin("Canvas Out", [], VVVV.PinTypes.CanvasGraphics);

  var ctx;
  var canvasWidth;
  var canvasHeight;
  var bgColor = [0.0, 0.0, 0.0, 1.0];
  var clear = 1;
  var canvas;
  var viewT = mat4.create();
  var projT;

  // this is actually some code duplication, because the very same exists in Renderer (EX9)
  function attachMouseEvents(canvas) {
    $(canvas).detach('mousemove');
    $(canvas).detach('mousedown');
    $(canvas).detach('mouseup');
    VVVV.MousePositions[canvas.id] = {'x': [0.0], 'y': [0.0], 'wheel': [0.0], 'lb': [0.0], 'mb': [0.0], 'rb': [0.0]};
    $(canvas).mousemove(function(e) {
      var x = (e.pageX - $(this).offset().left) * 2 / $(this).width() - 1;
      var y = -((e.pageY - $(this).offset().top) * 2 / $(this).height() - 1);
      VVVV.MousePositions['_all'].x[0] = x;
      VVVV.MousePositions['_all'].y[0] = y;
      VVVV.MousePositions[canvas.id].x[0] = x;
      VVVV.MousePositions[canvas.id].y[0] = y;
    });
    $(canvas).bind('mousewheel', function(e) {
      var delta = e.originalEvent.wheelDelta/120;
      VVVV.MousePositions[canvas.id].wheel[0] += delta;
      VVVV.MousePositions['_all'].wheel[0] += delta;
    });
    $(canvas).bind('DOMMouseScroll', function(e) {
      var delta = -e.originalEvent.detail/3;
      VVVV.MousePositions[canvas.id].wheel[0] += delta;
      VVVV.MousePositions['_all'].wheel[0] += delta;
    })
    function mouseup(e) {
      switch (e.which) {
        case 1: VVVV.MousePositions['_all'].lb[0] = 0; VVVV.MousePositions[canvas.id].lb[0] = 0; break;
        case 2: VVVV.MousePositions['_all'].mb[0] = 0; VVVV.MousePositions[canvas.id].mb[0] = 0; break;
        case 3: VVVV.MousePositions['_all'].rb[0] = 0; VVVV.MousePositions[canvas.id].rb[0] = 0; break;
      }
    }
    $(canvas).mousedown(function(e) {
      switch (e.which) {
        case 1: VVVV.MousePositions['_all'].lb[0] = 1; VVVV.MousePositions[canvas.id].lb[0] = 1; break;
        case 2: VVVV.MousePositions['_all'].mb[0] = 1; VVVV.MousePositions[canvas.id].mb[0] = 1; break;
        case 3: VVVV.MousePositions['_all'].rb[0] = 1; VVVV.MousePositions[canvas.id].rb[0] = 1; break;
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
        VVVV.MousePositions['_all'].lb[e.originalEvent.changedTouches[i].identifier] = VVVV.MousePositions[canvas.id].lb[e.originalEvent.changedTouches[i].identifier] = 1;
      }
      setTouchPositions(e, this);
    })

    $(canvas).bind('touchend', function(e) {
      var i = e.originalEvent.changedTouches.length;
      while (i--) {
        VVVV.MousePositions['_all'].lb[e.originalEvent.changedTouches[i].identifier] = VVVV.MousePositions[canvas.id].lb[e.originalEvent.changedTouches[i].identifier] = 0;
      }
    })

    $(canvas).bind('touchmove', function(e) {
      setTouchPositions(e, this);
      e.preventDefault();
    })

  }

  this.getContext = function() {

    var selector = this.invisiblePins["Descriptive Name"].getValue(0);
    var targetElement = $(selector).get(0);
    if (!targetElement || targetElement.nodeName!='CANVAS') {
      var w = parseInt(bufferWidthIn.getValue(0));
      var h = parseInt(bufferHeightIn.getValue(0));
      w = w > 0 ? w : 512;
      h = h > 0 ? h : 512;
      canvas = $('<canvas width="'+w+'" height="'+h+'" id="vvvv-js-generated-renderer-'+(new Date().getTime())+'" class="vvvv-js-generated-renderer"></canvas>');
      if (!targetElement) targetElement = 'body';
      $(targetElement).append(canvas);
      canvas = canvas.get(0);
    }
    else
      canvas = targetElement;

    canvasWidth = canvas.width;
    canvasHeight = canvas.height;

    if (!canvas || !canvas.getContext)
      return;

    attachMouseEvents(canvas);

    ctx = canvas.getContext('2d');
    canvas.ctx = ctx;

    ctx.restoreView = function() {
      ctx.setTransform(viewT[0], viewT[1], viewT[4], viewT[5], viewT[12], viewT[13]);
    }

  }

  this.destroy = function() {
    $(canvas).remove();
  }

  this.evaluate = function() {

    if (this.invisiblePins["Descriptive Name"].pinIsChanged()) {
      if ($(canvas).hasClass('vvvv-js-generated-renderer'))
        $(canvas).remove();
      this.getContext();
    }

    if (!ctx)
      return;

    if (bufferWidthIn.pinIsChanged() || bufferHeightIn.pinIsChanged()) {
      var w = parseInt(bufferWidthIn.getValue(0));
      var h = parseInt(bufferHeightIn.getValue(0));
      if (w>0) {
        canvasWidth = w;
        $(canvas).attr('width', canvasWidth);
      }
      if (h>0) {
        canvasHeight = h;
        $(canvas).attr('height', canvasHeight);
      }
      projT = mat4.create([canvasWidth/2, 0, 0, 0, 0, -canvasHeight/2, 0, 0, 0, 0, 1, 0, canvasWidth/2, canvasHeight/2, 0, 1]);
      if (viewIn.getValue(0))
        mat4.multiply(projT, viewIn.getValue(0), viewT);
    }

    if (bgColorIn.pinIsChanged() && bgColorIn.getValue(0)!=undefined) {
      var col = bgColorIn.getValue(0);
      bgColor[0] = parseInt(col.rgba[0]*255);
      bgColor[1] = parseInt(col.rgba[1]*255);
      bgColor[2] = parseInt(col.rgba[2]*255);
      bgColor[3] = col.rgba[3];
    }

    if (true) { //layersIn.pinIsChanged() || bgColorIn.pinIsChanged() || clearIn.pinIsChanged() || viewIn.pinIsChanged()) {

      defaultRenderState.apply(ctx);

      ctx.setTransform(1, 0, 0, 1, 0, 0);

      if (true) {//clearIn.getValue(0)>0.5) {
        if (bgColor[3]<1.0)
          ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = 'rgba('+bgColor[0]+','+bgColor[1]+','+bgColor[2]+','+bgColor[3]+')';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      if (viewIn.pinIsChanged()) {
        mat4.multiply(projT, viewIn.getValue(0), viewT);
      }

      ctx.restoreView();

      if (layersIn.isConnected()) {
        for (var i=0; i<layersIn.getSliceCount(); i++) {
          if (layersIn.getValue(i)!=undefined)
            layersIn.getValue(i).draw(ctx);
        }
      }

      canvasOut.setValue(0, canvas);

    }

    canvas.loaded = true;


  }

}
VVVV.Nodes.RendererCanvas.prototype = new VVVV.Core.Node();

}(vvvvjs_jquery));
