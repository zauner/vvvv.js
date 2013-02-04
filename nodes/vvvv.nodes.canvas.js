// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

VVVV.Types.CanvasTexture = { imageObject: undefined, loaded: false };

VVVV.Types.CanvasRenderState = function() {
  this.fillColor = [1.0, 1.0, 1.0, 1.0];
  this.strokeColor = [0.0, 0.0, 0.0, 0.0];
  this.lineWidth = 1.0;
  this.capStyle = 'butt';
  this.joinStyle = 'miter';
  this.gradient = {type: 'none'};
  this.shadowOffsetX = 0.0;
  this.shadowOffsetY = 0.0;
  this.shadowBlur = 0.0;
  this.shadowColor = [0.0, 0.0, 0.0, 1.0];
  this.blendMode = 'source-over';
  
  this.copy_attributes = function(other) {
    this.fillColor = other.fillColor;
    this.strokeColor = other.strokeColor;
    this.lineWidth = other.lineWidth;
    this.capStyle = other.capStyle;
    this.joinStyle = other.joinStyle;
    this.gradient = other.gradient;
    this.shadowOffsetX = other.shadowOffsetX;
    this.shadowOffsetY = other.shadowOffsetY;
    this.shadowBlur = other.shadowBlur;
    this.shadowColor = other.shadowColor;
    this.blendMode = other.blendMode;
  }
  
  this.apply = function(ctx) {
    if (this.gradient.type!='none') {
      if (this.gradient.type=='linear')
        var g = ctx.createLinearGradient(this.gradient.startX,this.gradient.startY,this.gradient.endX, this.gradient.endY);
      
      var numStops = Math.max(this.gradient.colors.length, this.gradient.colorPositions.length);
      for (var i=0; i<numStops; i++) {
        var color = this.gradient.colors[i];
        g.addColorStop(this.gradient.colorPositions[i], 'rgba('+parseInt(color[0]*255)+','+parseInt(color[1]*255)+','+parseInt(color[2]*255)+','+color[3]+')');
      }
      ctx.fillStyle = g;
    }
    else
      ctx.fillStyle = 'rgba('+parseInt(this.fillColor[0]*255)+','+parseInt(this.fillColor[1]*255)+','+parseInt(this.fillColor[2]*255)+','+this.fillColor[3]+')';
     
    ctx.strokeStyle = 'rgba('+parseInt(this.strokeColor[0]*255)+','+parseInt(this.strokeColor[1]*255)+','+parseInt(this.strokeColor[2]*255)+','+this.strokeColor[3]+')';
    ctx.lineWidth = this.lineWidth/ctx.canvas.height;
    ctx.lineCap = this.capStyle;
    ctx.lineJoin = this.joinStyle;
    ctx.shadowOffsetX = this.shadowOffsetX;
    ctx.shadowOffsetY = this.shadowOffsetY;
    ctx.shadowBlur = this.shadowBlur;
    ctx.shadowColor = 'rgba('+parseInt(this.shadowColor[0]*255)+','+parseInt(this.shadowColor[1]*255)+','+parseInt(this.shadowColor[2]*255)+','+this.shadowColor[3]+')';
    ctx.globalCompositeOperation = this.blendMode;
  }
}

var defaultRenderState = new VVVV.Types.CanvasRenderState();

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
  
  var renderStateIn = this.addInputPin("Render State In", [defaultRenderState], this, true);
  var colorIn = this.addInputPin("Color", ['1.0, 1.0, 1.0, 1.0'], this);
  
  var renderStateOut = this.addOutputPin("Render State Out", [defaultRenderState], this);
  
  var renderStates = [];
  
  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();
      
    for (var i=0; i<maxSpreadSize; i++) {
      if (renderStates[i]==undefined) {
        renderStates[i] = new VVVV.Types.CanvasRenderState();
      }
      if (renderStateIn.isConnected())
        renderStates[i].copy_attributes(renderStateIn.getValue(i));
      else
        renderStates[i].copy_attributes(defaultRenderState);
      renderStates[i].fillColor = colorIn.getValue(i).split(',');
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
  
  var renderStateIn = this.addInputPin("Render State In", [defaultRenderState], this, true);
  var colorIn = this.addInputPin("Color", ['1.0, 1.0, 1.0, 1.0'], this);
  var lineWidthIn = this.addInputPin("Width", [1.0], this);
  var capStyleIn = this.addInputPin("Cap Style", ['butt'], this);
  var joinStyleIn = this.addInputPin("Join Style", ['miter'], this);
  
  var renderStateOut = this.addOutputPin("Render State Out", [defaultRenderState], this);
  
  var renderStates = [];
  
  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();
      
    for (var i=0; i<maxSpreadSize; i++) {
      if (renderStates[i]==undefined) {
        renderStates[i] = new VVVV.Types.CanvasRenderState();
      }
      if (renderStateIn.isConnected())
        renderStates[i].copy_attributes(renderStateIn.getValue(i));
      else
        renderStates[i].copy_attributes(defaultRenderState);

      renderStates[i].strokeColor = colorIn.getValue(i).split(',');
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
  
  var renderStateIn = this.addInputPin("Render State In", [defaultRenderState], this, true);
  var colorIn = this.addInputPin("Color", ['0.0, 0.0, 0.0, 1.0'], this);
  var xOffsetIn = this.addInputPin("Offset X", [0.0], this);
  var yOffsetIn = this.addInputPin("Offset Y", [0.0], this);
  var blurIn = this.addInputPin("Blur", [0.0], this);
  
  var renderStateOut = this.addOutputPin("Render State Out", [defaultRenderState], this);
  
  var renderStates = [];
  
  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();
      
    for (var i=0; i<maxSpreadSize; i++) {
      if (renderStates[i]==undefined) {
        renderStates[i] = new VVVV.Types.CanvasRenderState();
      }
      if (renderStateIn.isConnected())
        renderStates[i].copy_attributes(renderStateIn.getValue(i));
      else
        renderStates[i].copy_attributes(defaultRenderState);
      renderStates[i].shadowOffsetX = xOffsetIn.getValue(i);
      renderStates[i].shadowOffsetY = yOffsetIn.getValue(i);
      renderStates[i].shadowBlur = blurIn.getValue(i);
      renderStates[i].shadowColor = colorIn.getValue(i).split(',');
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
  
  var renderStateIn = this.addInputPin("Render State In", [defaultRenderState], this, true);
  var modeIn = this.addInputPin("Mode", ['source-over'], this);
  
  var renderStateOut = this.addOutputPin("Render State Out", [defaultRenderState], this);
  
  var renderStates = [];
  
  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();
      
    for (var i=0; i<maxSpreadSize; i++) {
      if (renderStates[i]==undefined) {
        renderStates[i] = new VVVV.Types.CanvasRenderState();
      }
      if (renderStateIn.isConnected())
        renderStates[i].copy_attributes(renderStateIn.getValue(i));
      else
        renderStates[i].copy_attributes(defaultRenderState);
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
  
  var renderStateIn = this.addInputPin("Render State In", [defaultRenderState], this, true);
  var startXIn = this.addInputPin("Start X", [0.0], this);
  var startYIn = this.addInputPin("Start Y", [0.0], this);
  var endXIn = this.addInputPin("End X", [0.0], this);
  var endYIn = this.addInputPin("End Y", [0.0], this);
  var colorsIn = this.addInputPin("Colors", ['1.0, 1.0, 1.0, 1.0', '0.0, 0.0, 0.0, 1.0'], this);
  var colorPositionsIn = this.addInputPin("Color Positions", [0.0, 1.0], this);
  
  var renderStateOut = this.addOutputPin("Render State Out", [defaultRenderState], this);
  
  var renderStates = [];
  
  this.evaluate = function() {
    var maxSpreadSize = Math.max(renderStateIn.values.length, startXIn.values.length);
    maxSpreadSize = Math.max(maxSpreadSize, startYIn.values.length);
    maxSpreadSize = Math.max(maxSpreadSize, endXIn.values.length);
    maxSpreadSize = Math.max(maxSpreadSize, endYIn.values.length);
      
    for (var i=0; i<maxSpreadSize; i++) {
      if (renderStates[i]==undefined) {
        renderStates[i] = new VVVV.Types.CanvasRenderState();
      }
      if (renderStateIn.isConnected())
        renderStates[i].copy_attributes(renderStateIn.getValue(i));
      else
        renderStates[i].copy_attributes(defaultRenderState);
      renderStates[i].gradient = {type: 'linear'};
      renderStates[i].gradient.startX = startXIn.getValue(i);
      renderStates[i].gradient.startY = startYIn.getValue(i);
      renderStates[i].gradient.endX = endXIn.getValue(i);
      renderStates[i].gradient.endY = endYIn.getValue(i);
      renderStates[i].gradient.colors = [];
      renderStates[i].gradient.colorPositions = [];
      var numStops = Math.max(colorsIn.values.length, colorPositionsIn.values.length);
      for (var j=0; j<numStops; j++) {
        renderStates[i].gradient.colors.push(colorsIn.getValue(j).split(','));
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
  
  var renderStateIn = this.addInputPin('Render State', [defaultRenderState], this, true);
  var transformIn = this.addInputPin('Transform', [], this, true);
  var startAngleIn = this.addInputPin('Start Angle', [0.0], this);
  var endAngleIn = this.addInputPin('End Angle', [0.5], this);
  
  var layersOut = this.addOutputPin('Layer', [], this);
  
  var layers = [];
  
  var Arc = function() {
    this.transform = mat4.create();
    mat4.identity(this.transform);
    this.startAngle = 0;
    this.endAngle = 0.5;
    this.strokeColor = [1.0, 1.0, 1.0, 1.0];
    this.lineWidth = 1.0;
    this.renderState = defaultRenderState;
  
    this.draw = function(ctx) {
      ctx.save();
      if (this.transform)
        ctx.transform(this.transform[0], this.transform[1], this.transform[4], this.transform[5], this.transform[12], this.transform[13]);
      ctx.beginPath();
      this.renderState.apply(ctx);
      ctx.arc(0, 0, 1, this.startAngle, this.endAngle, false);
      if (this.renderState.fillColor[3]>0)
        ctx.fill();
      if (this.renderState.strokeColor[3]>0)
        ctx.stroke();
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
        layers[i].startAngle = parseFloat(startAngleIn.getValue(i))*Math.PI*2;
        layers[i].endAngle = parseFloat(endAngleIn.getValue(i))*Math.PI*2;
        if (renderStateIn.isConnected()) {
          layers[i].renderState = renderStateIn.getValue(i);
        }
        else {
          layers[i].renderState = defaultRenderState;
        }
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
  
  var renderStateIn = this.addInputPin('Render State', [defaultRenderState], this, true);
  var transformIn = this.addInputPin('Transform', [], this, true);
  var textIn = this.addInputPin('Text', ['VVVV.js'], this);
  var fontIn = this.addInputPin('Font', ['10px sans-serif'], this);
  var alignIn = this.addInputPin('Align', ['start'], this);
  var baselineIn = this.addInputPin('Baseline', ['alphabetic'], this);
  
  var layersOut = this.addOutputPin('Layer', [], this);
  
  var layers = [];
  
  var Text = function() {
    this.transform = mat4.create();
    mat4.identity(this.transform);
    this.text = "VVVV.js";
    this.font = "sans-serif";
    this.align = 'start';
    this.baseline = 'top';
    this.renderState = defaultRenderState;
  
    this.draw = function(ctx) {
      ctx.save();
      if (this.transform)
        ctx.transform(this.transform[0], this.transform[1], this.transform[4], this.transform[5], this.transform[12], this.transform[13]);
      ctx.scale(1/100, -1/100);
      ctx.font = "100px "+this.font;
      ctx.textAlign = this.align;
      ctx.textBaseline = this.baseline;
      this.renderState.apply(ctx);
      if (this.renderState.fillColor[3]>0)
        ctx.fillText(this.text, 0, 0);
      if (this.renderState.strokeColor[3]>0)
        ctx.strokeText(this.text, 0, 0);
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
      if (renderStateIn.isConnected()) {
        layers[i].renderState = renderStateIn.getValue(i);
      }
      else {
        layers[i].renderState = defaultRenderState;
      }
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
  
  var renderStateIn = this.addInputPin('Render State', [defaultRenderState], this);
  var transformIn = this.addInputPin('Transform', [], this);
  var xIn = this.addInputPin('X', [0.0], this);
  var yIn = this.addInputPin('Y', [0.0], this);
  var control1XIn = this.addInputPin('Control 1 X', [0.0], this);
  var control1YIn = this.addInputPin('Control 1 Y', [0.0], this);
  var control2XIn = this.addInputPin('Control 2 X', [0.0], this);
  var control2YIn = this.addInputPin('Control 2 Y', [0.0], this);
  var binSizeIn = this.addInputPin('BinSize', [-1], this);
  
  var layersOut = this.addOutputPin('Layer', [], this);
  
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
  
    this.draw = function(ctx) {
      if (this.x.length<1)
        return;
      this.renderState.apply(ctx);
      
      ctx.save();
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
      if (this.renderState.fillColor[3]>0)
        ctx.fill();
      if (this.renderState.strokeColor[3]>0)
        ctx.stroke();
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
          if (renderStateIn.isConnected())
            layers[binNum].renderState = renderStateIn.getValue(binNum);
          else
            layers[binNum].renderState = defaultRenderState;
          layers[binNum].transform = transformIn.getValue(binNum);
        }
        layers[binNum].x[subIndex] = parseFloat(xIn.getValue(j));
        layers[binNum].y[subIndex] = parseFloat(yIn.getValue(j));
        layers[binNum].c1x[subIndex] = parseFloat(control1XIn.getValue(j));
        layers[binNum].c1y[subIndex] = parseFloat(control1YIn.getValue(j));
        layers[binNum].c2x[subIndex] = parseFloat(control2XIn.getValue(j));
        layers[binNum].c2y[subIndex] = parseFloat(control2YIn.getValue(j));
        
        subIndex++;
        if (binSizeIn.getValue(0)>0 && subIndex>=binSizeIn.getValue(binNum)) {
          if (subIndex<layers[binNum].x.length) {
            adjustVertexListSize(layers[binNum], subIndex);
          }
          binNum++;
          subIndex = 0;
        }
      }
      if (binSizeIn.getValue(0)<0 && subIndex<layers[binNum].x.length) {
        adjustVertexListSize(layers[binNum], subIndex);
        layers.splice(1);
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
  
  var transformIn = this.addInputPin('Transform', [], this, true);
  var textureIn = this.addInputPin('Texture', [], this, true);
  var colorIn = this.addInputPin('Color', ['1.0, 1.0, 1.0, 1.0'], this);
  
  var layersOut = this.addOutputPin('Layer', [], this);
  
  var layers = [];
  
  var Quad = function() {
    this.transform = mat4.create();
    mat4.identity(this.transform);
    this.texture = undefined;
    this.color = [1.0, 1.0, 1.0, 1.0];
  
    this.draw = function(ctx) {
      ctx.save();
      if (this.transform)
        ctx.transform(this.transform[0], this.transform[1], this.transform[4], this.transform[5], this.transform[12], this.transform[13]);
        
      if (this.texture) {
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
        ctx.fillStyle = 'rgba('+parseInt(this.color[0]*255)+', '+parseInt(this.color[1]*255)+', '+parseInt(this.color[2]*255)+', '+this.color[3]+')';
        ctx.fillRect(-.5, -.5, 1, 1);
      }
      
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
      layers[i].color = colorIn.getValue(i).split(',');
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
  
  var layerIns = [];
  
  var layerOut = this.addOutputPin("Layer", [], this);
  
  this.initialize = function() {
    for (var i=0; i<2; i++) {
      layerIns[i] = this.addInputPin("Layer "+(i+1), [], this, true);
    }
  }
  
  this.evaluate = function() {
  
    var outSliceIdx = 0;
    for (var i=0; i<2; i++) {
      if (layerIns[i].isConnected()) {
        for (var j=0; j<layerIns[i].values.length; j++) {
          layerOut.setValue(outSliceIdx++, layerIns[i].getValue(j));
        }
      }
    }
    
    layerOut.setSliceCount(outSliceIdx);
    
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
  
  var layersIn = this.addInputPin("Layers", [], this);
  var clearIn = this.addInputPin("Clear", [1], this);
  var bgColorIn = this.addInputPin("Background Color", ["0.0, 0.0, 0.0, 1.0"], this);
  var bufferWidthIn = this.addInputPin("Backbuffer Width", [0], this);
  var bufferHeightIn = this.addInputPin("Backbuffer Height", [0], this);
  var viewIn = this.addInputPin("View", [], this);
  
  var canvasOut = this.addOutputPin("Canvas Out", [], this);
  
  var ctx;
  var canvasWidth;
  var canvasHeight;
  var bgColor = [0.0, 0.0, 0.0, 1.0];
  var clear = 1;
  var canvas;
  
  // this is actually some code duplication, because the very same exists in Renderer (EX9)
  function attachMouseEvents(canvas) {
    $(canvas).detach('mousemove');
    $(canvas).detach('mousedown');
    $(canvas).detach('mouseup');
    VVVV.MousePositions[canvas.id] = {'x': 0.0, 'y': 0.0, 'wheel': 0.0, 'lb': 0.0, 'mb': 0.0, 'rb': 0.0};
    $(canvas).mousemove(function(e) {
      var x = (e.pageX - $(this).offset().left) * 2 / $(this).width() - 1;
      var y = -((e.pageY - $(this).offset().top) * 2 / $(this).height() - 1);
      VVVV.MousePositions['_all'].x = x;
      VVVV.MousePositions['_all'].y = y;
      VVVV.MousePositions[canvas.id].x = x;
      VVVV.MousePositions[canvas.id].y = y;
    });
    $(canvas).bind('mousewheel', function(e) {
      var delta = e.originalEvent.wheelDelta/120;
      VVVV.MousePositions[canvas.id].wheel += delta;
      VVVV.MousePositions['_all'].wheel += delta;
    });
    $(canvas).bind('DOMMouseScroll', function(e) {
      var delta = -e.originalEvent.detail/3;
      VVVV.MousePositions[canvas.id].wheel += delta;
      VVVV.MousePositions['_all'].wheel += delta;
    })
    $(canvas).mousedown(function(e) {
      switch (e.which) {
        case 1: VVVV.MousePositions['_all'].lb = 1; VVVV.MousePositions[canvas.id].lb = 1; break;
        case 2: VVVV.MousePositions['_all'].mb = 1; VVVV.MousePositions[canvas.id].mb = 1; break;
        case 3: VVVV.MousePositions['_all'].rb = 1; VVVV.MousePositions[canvas.id].rb = 1; break;
      }
    });
    $(canvas).mouseup(function(e) {
      switch (e.which) {
        case 1: VVVV.MousePositions['_all'].lb = 0; VVVV.MousePositions[canvas.id].lb = 0; break;
        case 2: VVVV.MousePositions['_all'].mb = 0; VVVV.MousePositions[canvas.id].mb = 0; break;
        case 3: VVVV.MousePositions['_all'].rb = 0; VVVV.MousePositions[canvas.id].rb = 0; break;
      }
    });
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
    
  }

  this.evaluate = function() {
    
    if (this.invisiblePins["Descriptive Name"].pinIsChanged()) {
      if ($(canvas).hasClass('vvvv-js-generated-renderer'))
        $(canvas).remove();
      this.getContext();
    }
  
    if (!ctx)
      return;
      
    if (bufferWidthIn.pinIsChanged()) {
      var w = parseInt(bufferWidthIn.getValue(0));
      if (w>0) {
        canvasWidth = w;
        $(canvas).attr('width', canvasWidth);
      }
    }
    if (bufferHeightIn.pinIsChanged()) {
      var h = parseInt(bufferHeightIn.getValue(0));
      if (h>0) {
        canvasHeight = h;
        $(canvas).attr('height', canvasHeight);
      }
    }
      
    if (bgColorIn.pinIsChanged()) {
      bgColor = bgColorIn.getValue(0).split(',');
      bgColor[0] = parseInt(bgColor[0]*255);
      bgColor[1] = parseInt(bgColor[1]*255);
      bgColor[2] = parseInt(bgColor[2]*255);
    }
      
    if (true) {//layersIn.pinIsChanged() || bgColorIn.pinIsChanged() || clearIn.pinIsChanged()) {
    
      defaultRenderState.apply(ctx);
      
      if (true)
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      ctx.save();
      ctx.translate(canvasWidth/2, canvasHeight/2);
      ctx.scale(canvasWidth/2, -canvasHeight/2);
      //ctx.scale(1, canvasWidth/canvasHeight);
      
      if (viewIn.isConnected()) {
        var view = viewIn.getValue(0);
        ctx.transform(view[0], view[1], view[4], view[5], view[12], view[13]);
      }
      
      if (layersIn.isConnected()) {
        for (var i=0; i<layersIn.values.length; i++) {
          layersIn.getValue(i).draw(ctx);
        }
      }
      ctx.restore();
      
      defaultRenderState.apply(ctx);
      ctx.globalCompositeOperation = 'destination-over';
      
      if (true) {//clearIn.getValue(0)>0.5) {
        ctx.fillStyle = 'rgba('+bgColor[0]+','+bgColor[1]+','+bgColor[2]+','+bgColor[3]+')';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }
      
    }
    
    canvas.loaded = true;
    canvasOut.setValue(0, canvas);


  }

}
VVVV.Nodes.RendererCanvas.prototype = new VVVV.Core.Node();