// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

VVVV.Types.CanvasCapStyle = [ 'butt', 'round', 'square' ];
VVVV.Types.CanvasJoinStyle = [ 'miter', 'round', 'bevel' ];

VVVV.Types.CanvasRenderState = function() {
  this.fillColor = [0.0, 0.0, 0.0, 0.0];
  this.strokeColor = [1.0, 1.0, 1.0, 1.0];
  this.lineWidth = 1.0;
  this.capStyle = VVVV.Types.CanvasCapStyle[0];
  this.joinStyle = VVVV.Types.CanvasCapStyle[0];
  
  this.copy_attributes = function(other) {
    this.fillColor = other.fillColor;
    this.strokeColor = other.strokeColor;
    this.lineWidth = other.lineWidth;
    this.capStyle = other.capStyle;
    this.joinStyle = other.joinStyle;
    
  }
  
  this.apply = function(ctx) {
    ctx.fillStyle = 'rgba('+parseInt(this.fillColor[0]*255)+','+parseInt(this.fillColor[1]*255)+','+parseInt(this.fillColor[2]*255)+','+this.fillColor[3]+')';
    ctx.strokeStyle = 'rgba('+parseInt(this.strokeColor[0]*255)+','+parseInt(this.strokeColor[1]*255)+','+parseInt(this.strokeColor[2]*255)+','+this.strokeColor[3]+')';
    ctx.lineWidth = this.lineWidth/ctx.canvas.height;
    ctx.lineCap = this.capStyle;
    ctx.lineJoin = this.joinStyle;
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
  
  var renderStateIn = this.addInputPin("Render State In", [defaultRenderState], this);
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
  
  var renderStateIn = this.addInputPin("Render State In", [defaultRenderState], this);
  var colorIn = this.addInputPin("Color", ['1.0, 1.0, 1.0, 1.0'], this);
  var lineWidthIn = this.addInputPin("Width", [1.0], this);
  var capStyleIn = this.addInputPin("Cap Style", [0], this);
  var joinStyleIn = this.addInputPin("Join Style", [0], this);
  
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
      renderStates[i].capStyle = VVVV.Types.CanvasCapStyle[capStyleIn.getValue(i)%3];
      renderStates[i].joinStyle = VVVV.Types.CanvasJoinStyle[joinStyleIn.getValue(i)%3];
      renderStateOut.setValue(i, renderStates[i]);
    }
    renderStateOut.setSliceCount(maxSpreadSize);
    
  }
}
VVVV.Nodes.StrokeCanvas.prototype = new VVVV.Core.Node();

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
  
  var renderStateIn = this.addInputPin('Render State', [defaultRenderState], this);
  var xIn = this.addInputPin('X', [0.0], this);
  var yIn = this.addInputPin('Y', [0.0], this);
  var rIn = this.addInputPin('R', [0.5], this);
  var startAngleIn = this.addInputPin('Start Angle', [0.0], this);
  var endAngleIn = this.addInputPin('End Angle', [0.5], this);
  
  var layersOut = this.addOutputPin('Layer', [], this);
  
  var layers = [];
  
  var Arc = function() {
    this.x = 0;
    this.y = 0;
    this.r = 0.5;
    this.startAngle = 0;
    this.endAngle = 0.5;
    this.strokeColor = [1.0, 1.0, 1.0, 1.0];
    this.lineWidth = 1.0;
    this.renderState = defaultRenderState;
  
    this.draw = function(ctx) {
      ctx.beginPath();
      this.renderState.apply(ctx);
      ctx.arc(this.x, this.y, this.r, this.startAngle, this.endAngle, false);
      ctx.stroke();
      ctx.fill();
    }
  }
  
  this.evaluate = function() {
  
    //if (xIn.pinIsChanged() || yIn.pinIsChanged() || rIn.pinIsChanged() || strokeColorIn.pinIsChanged() || startAngleIn.pinIsChanged() || endAngleIn.pinIsChanged() || lineWidthIn.pinIsChanged() || fillColorIn.pinIsChanged()) {
      var maxSpreadSize = this.getMaxInputSliceCount();
      
      for (var i=0; i<maxSpreadSize; i++) {
        if (layers[i]==undefined)
          layers[i] = new Arc();
        layers[i].x = parseFloat(xIn.getValue(i));
        layers[i].y = parseFloat(yIn.getValue(i));
        layers[i].r = parseFloat(rIn.getValue(i));
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
      ctx.stroke();
      ctx.fill();
    }
  }
  
  this.evaluate = function() {
  
    //if (xIn.pinIsChanged() || yIn.pinIsChanged() || control1XIn.pinIsChanged() || control2XIn.pinIsChanged()|| control2XIn.pinIsChanged() || control2YIn.pinIsChanged() || strokeColorIn.pinIsChanged() || lineWidthIn.pinIsChanged() || fillColorIn.pinIsChanged()) {
      var maxSpreadSize = this.getMaxInputSliceCount();
        
      var binNum = 0;
      var subIndex = 0;
      for (var j=0; j<=maxSpreadSize || (subIndex>0 && binSizeIn.getValue(0)>0); j++) {
        
        if (layers[binNum]==undefined)
          layers[binNum] = new BezierCurve();
          
          
        if (subIndex == 0) {
          if (renderStateIn.isConnected())
            layers[binNum].renderState = renderStateIn.getValue(binNum);
          else
            layers[binNum].renderState = defaultRenderState;
        }
        layers[binNum].x[subIndex] = parseFloat(xIn.getValue(j));
        layers[binNum].y[subIndex] = parseFloat(yIn.getValue(j));
        layers[binNum].c1x[subIndex] = parseFloat(control1XIn.getValue(j));
        layers[binNum].c1y[subIndex] = parseFloat(control1YIn.getValue(j));
        layers[binNum].c2x[subIndex] = parseFloat(control2XIn.getValue(j));
        layers[binNum].c2y[subIndex] = parseFloat(control2YIn.getValue(j));
        
        subIndex++;
        if (binSizeIn.getValue(0)>0 && subIndex>=binSizeIn.getValue(binNum)) {
          binNum++;
          subIndex = 0;
        }
      }
      
      for (var i=0; i<layers.length; i++) {
        layersOut.setValue(i, layers[i]);
      }
    //}
    
  }
}
VVVV.Nodes.BezierCurveCanvas.prototype = new VVVV.Core.Node();

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
      layerIns[i] = this.addInputPin("Layer "+(i+1), [], this);
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
  
  var ctx;
  var canvasWidth;
  var canvasHeight;
  var bgColor = [0.0, 0.0, 0.0, 1.0];
  var clear = 1;
  
  this.initialize = function() {
    if (!this.invisiblePins["Descriptive Name"])
      return;
  
    var selector = this.invisiblePins["Descriptive Name"].getValue(0);
    if (selector==undefined || selector=="")
      return;
    var canvas = $(selector).get(0);
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    
    if (!canvas || !canvas.getContext)
      return;
    
    ctx = canvas.getContext('2d');
    
  }

  this.evaluate = function() {
  
    if (!ctx)
      return;
      
    if (bgColorIn.pinIsChanged()) {
      bgColor = bgColorIn.getValue(0).split(',');
      bgColor[0] = parseInt(bgColor[0]*255);
      bgColor[1] = parseInt(bgColor[1]*255);
      bgColor[2] = parseInt(bgColor[2]*255);
    }
      
    if (layersIn.pinIsChanged() || bgColorIn.pinIsChanged() || clearIn.pinIsChanged()) {
      ctx.save();
      
      if (true) {//clearIn.getValue(0)>0.5) {
        ctx.clearRect(0,0, canvasWidth, canvasHeight);
        ctx.fillStyle = 'rgba('+bgColor[0]+','+bgColor[1]+','+bgColor[2]+','+bgColor[3]+')';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }
      
      ctx.translate(canvasWidth/2, canvasHeight/2);
      ctx.scale(canvasWidth/2, -canvasHeight/2);
      ctx.scale(1, canvasWidth/canvasHeight);
      
      for (var i=0; i<layersIn.values.length; i++) {
        layersIn.getValue(i).draw(ctx);
      }
      
      ctx.restore();
    }
    
    


  }

}
VVVV.Nodes.RendererCanvas.prototype = new VVVV.Core.Node();