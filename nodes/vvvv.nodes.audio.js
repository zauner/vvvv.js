// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.
// This component was developed is (c) 2014 Lukas Winter, distributed under the MIT license.

VVVV.PinTypes.WebAudio = {
  typeName: "WebAudio",
  reset_on_disconnect: true,
  defaultValue: function() {
    return "Unconnected Audio";
  },
  connectionChangedHandlers: {
    'webaudio': function() {
      if(this.direction == PinDirection.Input)
        this.audioConnectionChanged = true;
    }
  }
}

var audioContext = null;

function WebAudioNode(id, name, graph) {
  if(graph) //constructing actual node
  {
    this.constructor(id, name, graph);
    if(!audioContext)
    {
      audioContext = new AudioContext();
    }
    this.initialize = function()
    {
      this.createAPINode();
      this.createAudioPins();
      this.createParamPins();
    }
    this.audioInputPins = [];
    this.audioOutputPins = [];
  }
  else //constructing prototype
  {
    this.createAPINode = function()
    {
      this.apiNode = audioContext['create'+id].apply(audioContext, arguments);
    }
    this.auto_evaluate = false;
  }
}
WebAudioNode.prototype = new VVVV.Core.Node();
WebAudioNode.prototype.createAudioPins = function()
{
  for(var i = 0; i < this.apiNode.numberOfInputs; i++)
  {
    this.audioInputPins.push(this.addInputPin('Input '+(i+1), [], VVVV.PinTypes.WebAudio));
  }
  for(var i = 0; i < this.apiNode.numberOfInputs; i++)
  {
    this.audioOutputPins.push(this.addOutputPin('Output '+(i+1), [], VVVV.PinTypes.WebAudio));
  }
}
WebAudioNode.prototype.createParamPins = function()
{
  for(var key in this.apiNode)
  {
    var param = this.apiNode[key];
    if(key instanceof AudioParam)
    {
      this.addInputPin(key.replace(/([a-z^])([A-Z])/g, '$1 $2'), [param.defaultValue], VVVV.PinTypes.WebAudio);
    }
  }
}
WebAudioNode.prototype.updateAudioConnections = function()
{
  var that = this;
  this.audioInputPins.forEach(function(audioIn, i) {
    if(audioIn.audioConnectionChanged && audioIn.getValue(0) instanceof AudioNode)
    {
      console.log("Connecting!");
      audioIn.getValue(0).connect(that.apiNode, 0 /*FIXME*/, i);
      audioIn.audioConnectionChanged = false;
    }
    
  });
}

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: AnalyserNode (HTML5 Audio)
 Author(s): 'Lukas Winter'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AnalyserNode = function(id, graph) {
  WebAudioNode.call(this, id, 'AnalyserNode (HTML5 Audio)', graph);
  
  this.meta = {
    authors: ['Lukas Winter'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  
  var that = this;
  
  var fftSizeIn = this.addInputPin('FFTSize', ['2048'], VVVV.PinTypes.Value);
  var smoothingIn = this.addInputPin('Smoothing', [0.8], VVVV.PinTypes.Value);
  var fftOut = this.addOutputPin('FFT', [], VVVV.PinTypes.Value);
  var fftData;
  
  function setFFTSize(size)
  {
    if(!size)
      size = 32;
    fftOut.setSliceCount(size);
    fftData = new Float32Array(size);
  }
  
  setFFTSize(2048);
  
  this.evaluate = function()
  {
    if(fftSizeIn.pinIsChanged())
      setFFTSize(fftSizeIn.getValue(0));
    if(smoothingIn.pinIsChanged())
      this.apiNode.smoothingTimeConstant = smoothingIn.getValue(0);
    
    this.updateAudioConnections();
    this.apiNode.getFloatFrequencyData(fftData);
    for(var i = 0; i < fftData.length; i++)
    {
      fftOut.setValue(i, fftData[i]); //FIXME: veeeeery inefficient!
    }
  }
}
VVVV.Nodes.AnalyserNode.prototype = new WebAudioNode('Analyser');

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: MediaElementSource (HTML5 Audio)
 Author(s): 'Lukas Winter'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.MediaElementSource = function(id, graph) {
  WebAudioNode.call(this, id, 'MediaElementSource (HTML5 Audio)', graph);
  
  this.meta = {
    authors: ['Lukas Winter'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  
  var audioIn = this.addInputPin('Audio', [], this);
  var audioOut = this.addOutputPin('Output', [], VVVV.PinTypes.WebAudio);
  
  this.initialize = function() {};
  
  var mediaElements = [ 7 ];
  
  this.evaluate = function() {
    if(audioIn.pinIsChanged())
    {
      var inElement = audioIn.getValue(0);
      if(inElement != mediaElements[0] && inElement)
      {
        mediaElements[0] = inElement;
        this.createAPINode(audioIn.getValue(0));
      }
      
      if(this.apiNode)
      {
        audioOut.setValue(0, this.apiNode);
      }
    }
    
  }
}
VVVV.Nodes.MediaElementSource.prototype = new WebAudioNode('MediaElementSource');

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: BeatDetector (HTML5 Audio)
 Author(s): 'Lukas Winter'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.BeatDetector = function(id, graph) {
  WebAudioNode.call(this, id, 'BeatDetector (HTML5 Audio)', graph);
  
  this.meta = {
    authors: ['Lukas Winter'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  
  var that = this;
  var fftSize = 1024;
  var fftData = new Float32Array(fftSize);
  var beatDetector;
  
  var beatCounterOut = this.addOutputPin('Beat Counter', [ 0 ], VVVV.PinTypes.Value);
  var bpmOut = this.addOutputPin('BPM', [ 0 ], VVVV.PinTypes.Value);
  
  var initialize = this.initialize;
  this.initialize = function() {
    initialize.call(this);
    this.apiNode.fftSize = fftSize;
    this.apiNode.smoothingTimeConstant = 0;
  }
  
  this.evaluate = function()
  {
    if(!beatDetector)
      beatDetector = new BeatDetektor();
    this.updateAudioConnections();
    this.apiNode.getFloatFrequencyData(fftData);
    beatDetector.process(audioContext.currentTime, fftData);
    beatCounterOut.setValue(0, beatDetector.beat_counter);
    bpmOut.setValue(0, beatDetector.win_bpm_int / 10);
  }
}
VVVV.Nodes.BeatDetector.prototype = new WebAudioNode('Analyser');

/*VVVV.Nodes.BiquadFilterNode = makeAudioNodeConstructor('BiquadFilter');
VVVV.Nodes.ChannelMergerNode = makeAudioNodeConstructor('ChannelMerger');
VVVV.Nodes.ChannelSplitterNode = makeAudioNodeConstructor('ChannelSplitter');
VVVV.Nodes.ConvolverNode = makeAudioNodeConstructor('Convolver');
VVVV.Nodes.DelayNode = makeAudioNodeConstructor('Delay');
VVVV.Nodes.DynamicsCompressorNode = makeAudioNodeConstructor('DynamicsCompressor');
VVVV.Nodes.GainNode = makeAudioNodeConstructor('Gain');
VVVV.Nodes.OscillatorNode = makeAudioNodeConstructor('Oscillator');
VVVV.Nodes.PannerNode = makeAudioNodeConstructor('Panner');
VVVV.Nodes.ScriptProcessorNode = makeAudioNodeConstructor('ScriptProcessor');
VVVV.Nodes.WaveShaperNode = makeAudioNodeConstructor('WaveShaper');*/

