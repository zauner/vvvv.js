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
      if(this.direction == VVVV.PinDirection.Output)
      {
        console.log("Connection changed!", this);
        this.audioConnectionChanged = true;
      }
    }
  }
}

VVVV.PinTypes.AudioBuffer = {
  typeName: "AudioBuffer",
  reset_on_disconnect: true,
  defaultValue: function() {
    return "Empty audio buffer";
  },
  connectionChangedHandlers: {}
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
    this.paramPins = [];
  }
  else //constructing prototype
  {
    this.createAPINode = function(arg)
    {
      //this is just for debugging purposes with firefox's web audio visualiser
      if(id == 'Analyser')
        this.apiNode = audioContext.createAnalyser(arg);
      else if(id == 'MediaElementSource')
        this.apiNode = audioContext.createMediaElementSource(arg);
      else if(id == 'Oscillator')
        this.apiNode = audioContext.createOscillator(arg);
      else if(id == 'Delay')
        this.apiNode = audioContext.createDelay(arg);
      else if(id == 'Gain')
        this.apiNode = audioContext.createGain(arg);
      else if(id == 'DynamicsCompressor')
        this.apiNode = audioContext.createDynamicsCompressor(arg);
      else if(id == 'BiquadFilter')
        this.apiNode = audioContext.createBiquadFilter(arg);
      else //this is the normal code
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
  for(var i = 0; i < this.apiNode.numberOfOutputs; i++)
  {
    this.audioOutputPins.push(this.addOutputPin('Output '+(i+1), [this.apiNode], VVVV.PinTypes.WebAudio));
  }
}
WebAudioNode.prototype.createParamPins = function()
{
  for(var key in this.apiNode)
  {
    var param = this.apiNode[key];
    if(param instanceof AudioParam)
    {
      this.paramPins.push(this.addInputPin(key.replace(/([a-z^])([A-Z])/g, '$1 $2'), [param.defaultValue], VVVV.PinTypes.Value)); //FIXME: params can be connected to a value or an audio stream
      this.paramPins[this.paramPins.length - 1].apiName = key;
    }
  }
}
WebAudioNode.prototype.updateParamPins = function()
{
  var that = this;
  this.paramPins.forEach( function(pin, i)
  {
    if(pin.pinIsChanged() && that.apiNode)
    {
      that.apiNode[pin.apiName].value = pin.getValue(0);
    }
  });
}
WebAudioNode.prototype.updateAudioConnections = function()
{
  var that = this;
  this.audioOutputPins.forEach(function(audioOut, outIndex) {
    if(audioOut.audioConnectionChanged && that.apiNode)
    {
      console.log("Re-connecting!");
      that.apiNode.disconnect(outIndex);
      audioOut.links.forEach(function(link)
      {
        var inPin = link.toPin;
        var inNode = inPin.node;
        var inIndex = inNode.audioInputPins.indexOf(inPin);
        that.apiNode.connect(inNode.apiNode, outIndex, inIndex);
      });
      audioOut.audioConnectionChanged = false;
    }
  });
}

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: FileAudioBuffer (HTML5 Audio)
 Author(s): 'Lukas Winter'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.FileAudioBuffer = function(id, graph) {
  this.constructor(id, 'FileAudioBuffer (HTML5 Audio)', graph);
  
  this.meta = {
    authors: ['Lukas Winter'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  
  var that = this;
  this.auto_evaluate = false;
  
  var filenamePin = this.addInputPin("Filename", [""], VVVV.PinTypes.String);
  var outputPin = this.addOutputPin("Audio Out", [], VVVV.PinTypes.AudioBuffer);
  
  this.evaluate = function() {

    if (!audioContext) return;
    
    if (filenamePin.pinIsChanged())
    {
      var maxSize = this.getMaxInputSliceCount();
      for (var i=0; i<maxSize; i++) {
        var filename = VVVV.Helpers.prepareFilePath(filenamePin.getValue(i), this.parentPatch);
        var request = new XMLHttpRequest();
        request.open("GET", filename, true);
        request.responseType = "arraybuffer";
        request.onload = function(j) { return function()
        {
          audioContext.decodeAudioData(request.response, function(buffer){
            outputPin.setValue(j, buffer);
          });
        }}(i);
        request.send();
      }
    }
    
  }
};
VVVV.Nodes.FileAudioBuffer.prototype = new VVVV.Core.Node();

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
    
    this.audioOutputPins.forEach( function(pin) { pin.markPinAsChanged(); } );
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
  this.audioOutputPins.push(audioOut);
  
  this.initialize = function() {};
  
  var mediaElements = [ 7 ];
  
  this.evaluate = function() {
    this.updateAudioConnections();
    if(audioIn.pinIsChanged())
    {
      var inElement = audioIn.getValue(0);
      if(inElement != mediaElements[0] && inElement)
      {
        mediaElements[0] = inElement;
        this.createAPINode(audioIn.getValue(0));
        inElement.volume = 1;
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
 NODE: AudioDestination (HTML5 Audio)
 Author(s): 'Lukas Winter'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AudioDestination = function(id, graph) {
  WebAudioNode.call(this, id, 'AudioDestination (HTML5 Audio)', graph);
  
  this.meta = {
    authors: ['Lukas Winter'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  
  this.createAPINode = function() { this.apiNode = audioContext.destination; };
  
  this.evaluate = function() {
    this.updateAudioConnections();    
  }
}
VVVV.Nodes.AudioDestination.prototype = new WebAudioNode('AudioDestination');

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Oscillator (HTML5 Audio)
 Author(s): 'Lukas Winter'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Oscillator = function(id, graph) {
  WebAudioNode.call(this, id, 'Oscillator (HTML5 Audio)', graph);
  
  this.meta = {
    authors: ['Lukas Winter'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  
  var typeIn = this.addInputPin("Type", ['sine'], VVVV.PinTypes.Enum);
  typeIn.enumOptions = ['sine', 'square', 'sawtooth', 'triangle', 'custom' ];
  var enableIn = this.addInputPin("Enabled", [1], VVVV.PinTypes.Value);
  
  this.auto_evaluate = true;
  
  this.evaluate = function() {
    this.updateAudioConnections();
    this.updateParamPins();
    this.audioOutputPins.forEach( function(pin) { pin.markPinAsChanged(); } );
    
    if(typeIn.pinIsChanged() && this.apiNode)
    {
      this.apiNode.type = typeIn.getValue(0);
    }
    
    if(enableIn.pinIsChanged() && this.apiNode)
    {
      if(enableIn.getValue(0) > 0)
      {
        this.apiNode.start();
      }
      else
      {
        this.apiNode.stop();
      }
    }
  }
}
VVVV.Nodes.Oscillator.prototype = new WebAudioNode('Oscillator');

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Delay (HTML5 Audio)
 Author(s): 'Lukas Winter'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Delay = function(id, graph) {
  WebAudioNode.call(this, id, 'Delay (HTML5 Audio)', graph);
  
  this.meta = {
    authors: ['Lukas Winter'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  
  var createAPINode = this.createAPINode;
  this.createAPINode = function() { createAPINode.call(this, 10); }
  
  this.delays_output = true;
  
  this.evaluate = function() {
    this.updateAudioConnections();
    this.updateParamPins();
    this.audioOutputPins.forEach( function(pin) { pin.markPinAsChanged(); } );
  }
}
VVVV.Nodes.Delay.prototype = new WebAudioNode('Delay');

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Gain (HTML5 Audio)
 Author(s): 'Lukas Winter'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Gain = function(id, graph) {
  WebAudioNode.call(this, id, 'Gain (HTML5 Audio)', graph);
  
  this.meta = {
    authors: ['Lukas Winter'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  
  this.evaluate = function() {
    this.updateAudioConnections();
    this.updateParamPins();
    this.audioOutputPins.forEach( function(pin) { pin.markPinAsChanged(); } );
  }
}
VVVV.Nodes.Gain.prototype = new WebAudioNode('Gain');

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Convolver (HTML5 Audio)
 Author(s): 'Lukas Winter'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Convolver = function(id, graph) {
  WebAudioNode.call(this, id, 'Convolver (HTML5 Audio)', graph);
  
  this.meta = {
    authors: ['Lukas Winter'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  
  var responseIn = this.addInputPin("Impulse Response", [], VVVV.PinTypes.AudioBuffer);
  var normalizeIn = this.addInputPin("Normalize", [1], VVVV.PinTypes.Value);
  
  this.evaluate = function() {
    if(this.apiNode && (normalizeIn.pinIsChanged() || responseIn.pinIsChanged()))
    {
      this.apiNode.normalize = normalizeIn.getValue(0) != 0;
      this.apiNode.buffer = responseIn.getValue(0);
    }
    this.updateAudioConnections();
    this.updateParamPins();
    this.audioOutputPins.forEach( function(pin) { pin.markPinAsChanged(); } );
  }
}
VVVV.Nodes.Convolver.prototype = new WebAudioNode('Convolver');

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: WaveShaper (HTML5 Audio)
 Author(s): 'Lukas Winter'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.WaveShaper = function(id, graph) {
  WebAudioNode.call(this, id, 'WaveShaper (HTML5 Audio)', graph);
  
  this.meta = {
    authors: ['Lukas Winter'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  
  var curveIn = this.addInputPin("Curve", [], VVVV.PinTypes.Value);
  var oversampleIn = this.addInputPin("Oversample", [1], VVVV.PinTypes.Enum);
  oversampleIn.enumOptions = ["none", "2x", "4x"];
  
  this.evaluate = function() {
    if(this.apiNode && curveIn.pinIsChanged())
    {
      var curve = new Float32Array(curveIn.getValue(0, curveIn.getSliceCount()));
      if(curve.length > 2)
        this.apiNode.curve = curve;
    }
    this.updateAudioConnections();
    this.updateParamPins();
    this.audioOutputPins.forEach( function(pin) { pin.markPinAsChanged(); } );
  }
}
VVVV.Nodes.WaveShaper.prototype = new WebAudioNode('WaveShaper');

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: BiquadFilter (HTML5 Audio)
 Author(s): 'Lukas Winter'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.BiquadFilter = function(id, graph) {
  WebAudioNode.call(this, id, 'BiquadFilter (HTML5 Audio)', graph);
  
  this.meta = {
    authors: ['Lukas Winter'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  
  var typeIn = this.addInputPin("Type", ['lowpass'], VVVV.PinTypes.Enum);
  typeIn.enumOptions = ["lowpass", "highpass", "bandpass", "lowshelf", "highshelf", "peaking", "notch", "allpass" ];
  
  this.evaluate = function() {
    this.updateAudioConnections();
    this.updateParamPins();
    this.audioOutputPins.forEach( function(pin) { pin.markPinAsChanged(); } );
    
    if(this.apiNode && typeIn.pinIsChanged())
      this.apiNode.type = typeIn.getValue(0);
  }
}
VVVV.Nodes.BiquadFilter.prototype = new WebAudioNode('BiquadFilter');

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: DynamicsCompressor (HTML5 Audio)
 Author(s): 'Lukas Winter'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.DynamicsCompressor = function(id, graph) {
  WebAudioNode.call(this, id, 'DynamicsCompressor (HTML5 Audio)', graph);
  
  this.meta = {
    authors: ['Lukas Winter'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  
  var reductionOut = this.addOutputPin('Reduction', [ 0 ], VVVV.PinTypes.Value);
  
  this.evaluate = function() {
    this.updateAudioConnections();
    this.updateParamPins();
    this.audioOutputPins.forEach( function(pin) { pin.markPinAsChanged(); } );
    
    //according to the spec, reduction shouldn't be an AudioParam, but browsers seem to implement it as such
    if(this.apiNode)
      reductionOut.setValue(0, this.apiNode.reduction.value);
  }
}
VVVV.Nodes.DynamicsCompressor.prototype = new WebAudioNode('DynamicsCompressor');

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
    
    this.audioOutputPins.forEach( function(pin) { pin.markPinAsChanged(); } );
  }
}
VVVV.Nodes.BeatDetector.prototype = new WebAudioNode('Analyser');
VVVV.Nodes.BeatDetector.requirements = ["beatdetektor"];

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

