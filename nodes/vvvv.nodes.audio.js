// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.
// This component was developed is (c) 2014 Lukas Winter, distributed under the MIT license.

(function($) {

if (!window.AudioContext)
  return;

var debugID = 0;

VVVV.PinTypes.WebAudio = {
  typeName: "WebAudio",
  reset_on_disconnect: true,
  defaultValue: function() {
    return "Unconnected Audio";
  },
  connectionChangedHandlers: {
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

var WebAudioOutputSlice = function WebAudioOutputSlice(srcApiNode, srcName)
{
  this.srcApiNode = srcApiNode;
  this.srcName = srcName;

  this.connections = [];
}
WebAudioOutputSlice.prototype =
{
  connect: function(destApiNode, destName)
  {
    console.log("CONNECT ", this.srcApiNode, " OUTPUT ", this.srcName, "\n TO ", destApiNode, " INPUT ", destName);

    if(typeof destName == "number")
      this.srcApiNode.connect(destApiNode, this.srcName, destName);
    else if(typeof destName == "string")
    {
      var destParam = destApiNode[destName];
      console.log("DEST PARAM ", destParam);
      this.srcApiNode.connect(destParam, this.srcName);
    }
    else
    {
      console.log("EEEK!", typeof destName, destName);
    }

    this.connections.push({destApiNode: destApiNode, destName: destName});
  },

  disconnect: function(destApiNode, destName)
  {
    console.log("DISCONNECT ", this.srcApiNode, " OUTPUT ", this.srcName, "\n FROM ", destApiNode, " INPUT ", destName);

    var that = this;
    this.srcApiNode.disconnect(this.srcName);

    var indexToRemove = -1;
    this.connections.forEach(function(connection, i)
    {
      if(connection.destApiNode == destApiNode && connection.destName == destName)
        indexToRemove = i;
      else //reconnect a lost connection
      {
        if(typeof connection.destName == "number")
          that.srcApiNode.connect(connection.destApiNode, that.srcName, connection.destName);
        else if(typeof connection.destName == "string")
        {
          var destParam = connection.destApiNode[connection.destName];
          that.srcApiNode.connect(destParam, that.srcName);
        }
      }
    });

    if(indexToRemove != -1)
      this.connections.splice(indexToRemove, 1);
    else
      console.log("Warning: Connection removal bug detected!");
  },

  toString: function()
  {
    return this.srcApiNode.constructor.name + ":" + this.srcName + " (" + this.srcApiNode.channelCount + "ch)";
  }
};

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
      this.createAPIMultiNode(1);
      this.createAudioPins();
      this.createParamPins();
    }
    this.destroy = function()
    {
      this.truncateAPIMultiNode(0);
    }
    this.audioInputPins = [];
    this.audioOutputPins = [];
    this.paramPins = [];
    this.modulationPins = [];
    this.apiMultiNode = [];
    this.auto_nil = false;
  }
  else //constructing prototype
  {
    this.createAPISingleNode = function(arg)
    {
      //this is just for debugging purposes with firefox's web audio visualiser
      if(id == 'Analyser')
        var apiNode = audioContext.createAnalyser(arg);
      else if(id == 'MediaElementSource')
        var apiNode = audioContext.createMediaElementSource(arg);
      else if(id == 'Oscillator')
        var apiNode = audioContext.createOscillator(arg);
      else if(id == 'Delay')
        var apiNode = audioContext.createDelay(arg);
      else if(id == 'Gain')
        var apiNode = audioContext.createGain(arg);
      else if(id == 'DynamicsCompressor')
        var apiNode = audioContext.createDynamicsCompressor(arg);
      else if(id == 'BiquadFilter')
        var apiNode = audioContext.createBiquadFilter(arg);
      else if(id == 'MediaStreamSource')
        var apiNode = audioContext.createMediaStreamSource(arg);
      else if(id == 'Convolver')
        var apiNode = audioContext.createConvolver(arg);
      else if(id == 'WaveShaper')
        var apiNode = audioContext.createWaveShaper(arg);
      else //this is the normal code
        var apiNode = audioContext['create'+id].apply(audioContext, arguments);

      apiNode['_id'] = debugID++;
      return apiNode;
    }
    this.auto_evaluate = false;
  }
}
WebAudioNode.prototype = new VVVV.Core.Node();
WebAudioNode.prototype.truncateAPIMultiNode = function(n)
{
  var that = this;
  this.audioInputPins.concat(this.modulationPins).forEach( function(pin)
  {
    for(var i = n; i < that.apiMultiNode.length; i++)
    {
      var oldSource = pin.oldValue[i];
      if(oldSource && oldSource != "Unconnected Audio")
      {
        oldSource.disconnect(that.apiMultiNode[i], pin.apiName);
      }
      delete pin.oldValue[i];
    }
  });
  this.apiMultiNode.splice(n);
}
WebAudioNode.prototype.createAPIMultiNode = function(n)
{
  var that = this;
  var allArgs = [].slice.call(arguments, 1);
  for(var i = this.apiMultiNode.length; i < n; i++)
  {
    var thoseArgs = [];
    allArgs.forEach(function(thisArg)
    {
      if(thisArg instanceof Array)
        thoseArgs.push(thisArg[i]);
      else
        thoseArgs.push(thisArg);
    });

    this.apiMultiNode[i] = this.createAPISingleNode.apply(this.createAPISingleNode, thoseArgs);

    this.audioOutputPins.forEach(function(pin)
    {
      pin.setValue(i, new WebAudioOutputSlice(that.apiMultiNode[i], pin.apiName));
    });
  }
  this.apiNode = this.apiMultiNode[0];
}
//override this if your node implementation needs to pass arguments to the AudioNode factory function
WebAudioNode.prototype.resizeAPIMultiNode = function(n)
{
  this.truncateAPIMultiNode(n);
  this.createAPIMultiNode(n);
}
WebAudioNode.prototype.createAudioPins = function()
{
  for(var i = 0; i < this.apiNode.numberOfInputs; i++)
  {
    var inPin = this.addInputPin('Input '+(i+1), [], VVVV.PinTypes.WebAudio);
    inPin.apiName = i;
    inPin.oldValue = [];
    this.audioInputPins.push(inPin);
  }
  for(var i = 0; i < this.apiNode.numberOfOutputs; i++)
  {
    var pinName = 'Output '+(i+1);
    if(this.outputPins.hasOwnProperty(pinName)) //pin was already added by XML
    {
      var outputPin = this.outputPins[pinName];
      outputPin.setType(VVVV.PinTypes.WebAudio);
      outputPin.setValue(0, new WebAudioOutputSlice(this.apiNode, i));
    }
    else
      var outputPin = this.addOutputPin(pinName, [new WebAudioOutputSlice(this.apiNode, i)], VVVV.PinTypes.WebAudio);
    outputPin.apiName = i;
    outputPin.audioConnections = [];
    this.audioOutputPins.push(outputPin);
  }
}
WebAudioNode.prototype.createParamPins = function()
{
  for(var key in this.apiNode)
  {
    var param = this.apiNode[key];
    if(param instanceof AudioParam)
    {
      var name = key.replace(/([a-z^])([A-Z])/g, '$1 $2');
      name = name.charAt(0).toUpperCase() + name.slice(1);

      var valuePin = this.addInputPin(name, [param.defaultValue], VVVV.PinTypes.Value);
      valuePin.apiName = key;
      this.paramPins.push(valuePin);

      var modulationPin = this.addInputPin(name + " Modulation", [], VVVV.PinTypes.WebAudio);
      modulationPin.apiName = key;
      modulationPin.oldValue = [];
      this.modulationPins.push(modulationPin);
    }
  }
}
WebAudioNode.prototype.updateParamPins = function()
{
  var that = this;
  this.paramPins.forEach( function(pin, i)
  {
    if(pin.pinIsChanged())
    {
      that.apiMultiNode.forEach( function(apiNode, i)
      {
        apiNode[pin.apiName].value = pin.getValue(i);
      });
    }
  });
}
//override this if your node needs another way of determining the number of API nodes
WebAudioNode.prototype.getAudioSliceCount = function()
{
  return this.getMaxInputSliceCount();
}
WebAudioNode.prototype.updateAudioConnections = function()
{
  var that = this;

  var n = this.getAudioSliceCount();
  var oldSliceCount = this.apiMultiNode.length;

  this.resizeAPIMultiNode(n);

  if(n != oldSliceCount)
    that.audioOutputPins.forEach(function(pin) { pin.setSliceCount(n) });

  this.audioInputPins.concat(this.modulationPins).forEach( function(pin)
  {
    var i = n; //don't check this inputs connections by default

    if(n != oldSliceCount)
      i = oldSliceCount; //check only new slices if slice count changed

    if(pin.pinIsChanged())
      i = 0; //check all slices if some pin value changed

    for(; i < n; i++)
    {
      var newSource = pin.getValue(i);
      var oldSource = pin.oldValue[i];

      if(oldSource == newSource)
      {
        console.log("No change!");
        continue;
      }

      if(oldSource && oldSource != "Unconnected Audio")
      {
        oldSource.disconnect(that.apiMultiNode[i], pin.apiName);
      }
      if(newSource && newSource != "Unconnected Audio")
      {
        console.log(newSource);
        newSource.connect(that.apiMultiNode[i], pin.apiName);
      }

      pin.oldValue[i] = newSource;
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
            if(j < that.getMaxInputSliceCount())
              outputPin.setValue(j, buffer);
          });
        }}(i);
        request.send();
      }
      outputPin.setSliceCount(maxSize);
    }

  }
};
VVVV.Nodes.FileAudioBuffer.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: FFT (HTML5 Audio)
 Author(s): 'Lukas Winter'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.FFT = function(id, graph) {
  WebAudioNode.call(this, id, 'FFT (HTML5 Audio)', graph);

  this.meta = {
    authors: ['Lukas Winter'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = true;

  var that = this;

  var fftSizeIn = this.addInputPin('FFTSize', [2048], VVVV.PinTypes.Value);
  var smoothingIn = this.addInputPin('Smoothing', [0.8], VVVV.PinTypes.Value);
  var fftOut = this.addOutputPin('FFT', [], VVVV.PinTypes.Value);
  var fftData = new Float32Array(1024);;
  var binCount = 1024;

  function nearestPow2( aSize )
  {
    return Math.pow( 2, Math.round( Math.log( aSize ) / Math.log( 2 ) ) );
  }

  this.evaluate = function()
  {
    var n = this.getMaxInputSliceCount();
    if(n != this.apiMultiNode.length && !fftSizeIn.pinIsChanged())
    {
      fftOut.setSliceCount(binCount*n);
      fftData = new Float32Array(binCount);
    }

    this.updateAudioConnections();

    if(fftSizeIn.pinIsChanged())
    {
      binCount = 0;
      for(var i = 0; i < n; i++)
      {
        var size = fftSizeIn.getValue(i);
        if(size < 32) size = 32;
        if(size > 32768) size = 32768;
        size = nearestPow2(size);
        this.apiMultiNode[i].fftSize = size;
        binCount = Math.max(size / 2, binCount);
      }
      if(binCount != fftData.length)
      {
        fftOut.setSliceCount(binCount*n);
        fftData = new Float32Array(binCount);
      }
    }

    for(var i = 0; i < n; i++)
    {
      if(smoothingIn.pinIsChanged())
        this.apiMultiNode[i].smoothingTimeConstant = smoothingIn.getValue(i);

      this.apiMultiNode[i].getFloatFrequencyData(fftData);
      for(var j = 0; j < binCount; j++)
      {
        fftOut.setValue(i*binCount + j, fftData[j]); //FIXME: veeeeery inefficient!
      }
    }
  }
}
VVVV.Nodes.FFT.prototype = new WebAudioNode('Analyser');

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
  audioOut.apiName = 0;
  this.audioOutputPins.push(audioOut);

  this.initialize = function() {};

  var mediaElements = [];

  this.evaluate = function()
  {
    if(audioIn.pinIsChanged())
    {
      var n = this.getMaxInputSliceCount();
      audioOut.setSliceCount(n);
      mediaElements.length = n;

      for(var i = 0; i < n; i++)
      {
        var inElement = audioIn.getValue(i);
        if(inElement && inElement != mediaElements[i])
        {
          mediaElements[i] = inElement;
          this.apiMultiNode[i] = this.createAPISingleNode(inElement);
          inElement.volume = 1;
          audioOut.setValue(i, new WebAudioOutputSlice(this.apiMultiNode[i], 0));
        }
      }
    }

    this.updateAudioConnections();
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

  this.createAPISingleNode = function() { return audioContext.destination; };

  this.evaluate = function() {
    this.updateAudioConnections();
  }
}
VVVV.Nodes.AudioDestination.prototype = new WebAudioNode('AudioDestination');

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: AudioIn (HTML5 Audio)
 Author(s): 'Lukas Winter'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AudioIn = function(id, graph) {
  WebAudioNode.call(this, id, 'AudioIn (HTML5 Audio)', graph);

  this.meta = {
    authors: ['Lukas Winter'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  var that = this;

  var statusOut = this.addOutputPin("Status", ['Waiting'], VVVV.PinTypes.String);

  this.initialize = function()
  {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (navigator.getUserMedia )
    {
      navigator.getUserMedia(
      {
        "audio":
        {
          "mandatory":
          {
            "googEchoCancellation": "false",
            "googAutoGainControl": "false",
            "googNoiseSuppression": "false",
            "googHighpassFilter": "false"
          },
          "optional": []
        },
      }, function success(stream)
      {
        that.createAPIMultiNode(1, stream);
        that.createAudioPins();
        statusOut.setValue(0, 'OK');
      }, function errror(err)
      {
        statusOut.setValue(0, err);
      });
    }
    else
      statusOut.setValue(0, "Error: getUserMedia not supported!");
  };

  this.evaluate = function() {
    this.updateAudioConnections();

  }
}
VVVV.Nodes.AudioIn.prototype = new WebAudioNode('MediaStreamSource');

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

  this.createAPISingleNode = function()
  {
    var apiNode = audioContext.createOscillator();
    apiNode.start();
    return apiNode;
  }

  this.evaluate = function() {
    this.updateAudioConnections();
    this.updateParamPins();

    var n = this.getMaxInputSliceCount();

    if(typeIn.pinIsChanged())
    {
      for(var i = 0; i < n; i++)
        this.apiMultiNode[i].type = typeIn.getValue(i);
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

VVVV.Nodes.DelayAudio = function(id, graph) {
  WebAudioNode.call(this, id, 'Delay (HTML5 Audio)', graph);

  this.meta = {
    authors: ['Lukas Winter'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  //Deactivate this until we find out how this plays together with spreadability
  //this.delays_output = true;

  var maxDelayCfg = this.addInvisiblePin("Maximum Delay",[1],VVVV.PinTypes.Value);

  this.createAPISingleNode = function()
  {
    return audioContext.createDelay(maxDelayCfg.getValue(0));
  }

  this.evaluate = function() {
    this.updateAudioConnections();
    this.updateParamPins();

  }
}
VVVV.Nodes.DelayAudio.prototype = new WebAudioNode('Delay');

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

  }
}
VVVV.Nodes.Gain.prototype = new WebAudioNode('Gain');

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Add (HTML5 Audio)
 Author(s): 'Lukas Winter'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AddAudio = function(id, graph) {
  WebAudioNode.call(this, id, 'Add (HTML5 Audio)', graph);

  this.meta = {
    authors: ['Lukas Winter'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  var cntCfg = this.addInvisiblePin("Input Count",[2],VVVV.PinTypes.Value);
  var that = this;

  var addInputPins = function()
  {
    var inputCount = Math.max(2, cntCfg.getValue(0));
    VVVV.Helpers.dynamicPins(that, that.audioInputPins, inputCount, function(i) {
      var pin = that.addInputPin('Input '+(i+1), [], VVVV.PinTypes.WebAudio);
      pin.apiName = 0;
      pin.oldValue = [];
      return pin;
    })
  };

  this.initialize = function()
  {
    this.createAPIMultiNode(1);
    this.createAudioPins();
  };

  this.evaluate = function() {
    if (cntCfg.pinIsChanged())
      addInputPins();
    this.updateAudioConnections();

  }
}
VVVV.Nodes.AddAudio.prototype = new WebAudioNode('Gain');

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Add (HTML5 Audio Spectral)
 Author(s): 'Lukas Winter'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AddAudioSpectral = function(id, graph) {
  WebAudioNode.call(this, id, 'Add (HTML5 Audio Spectral)', graph);
  
  this.meta = {
    authors: ['Lukas Winter'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  
  var that = this;
  var apiNode;
  
  this.createAPISingleNode = function()
  {
    if(!apiNode)
      apiNode = audioContext.createGain();
    return apiNode;
  };
  
  this.initialize = function()
  {
    this.createAPIMultiNode(1);
    this.createAudioPins();
  };
  
  this.evaluate = function() {
    
    this.updateAudioConnections();
    this.audioOutputPins[0].setSliceCount(1);
  }
}
VVVV.Nodes.AddAudioSpectral.prototype = new WebAudioNode('Gain');

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
    this.updateAudioConnections();
    this.updateParamPins();
    if(normalizeIn.pinIsChanged() || responseIn.pinIsChanged())
    {
      var n = this.getMaxInputSliceCount();
      for(var i = 0; i < n; i++)
      {
        this.apiMultiNode[i].normalize = normalizeIn.getValue(i) > 0.5;
        if(responseIn.getValue(i) instanceof AudioBuffer)
          this.apiMultiNode[i].buffer = responseIn.getValue(i);
      }
    }
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
  var binSizeIn = this.addInputPin("Bin Size", [-1], VVVV.PinTypes.Value);
  var oversampleIn = this.addInputPin("Oversample", [1], VVVV.PinTypes.Enum);
  oversampleIn.enumOptions = ["none", "2x", "4x"];

  this.getAudioSliceCount = function()
  {
    return Math.max(this.audioInputPins[0].getSliceCount(), oversampleIn.getSliceCount(), binSizeIn.getSliceCount());
  }

  this.evaluate = function() {
    this.updateAudioConnections();
    this.updateParamPins();

    var n = this.getAudioSliceCount();

    if(curveIn.pinIsChanged() || binSizeIn.pinIsChanged())
    {
      var binStartIndex = 0;
      for(var i = 0; i < n; i++)
      {
        var binSize = binSizeIn.getValue(i);
        if(binSize < 0)
          binSize = Math.ceil(curveIn.getSliceCount() / (-binSize));
        var curve = new Float32Array(curveIn.getValue(binStartIndex / binSize, binSize));
        console.log(curve);
        if(curve.length > 2)
          this.apiMultiNode[i].curve = curve;

        binStartIndex += binSize;
      }
    }
    if(oversampleIn.pinIsChanged())
    {
      for(var i = 0; i < n; i++)
        this.apiMultiNode[i].oversample = oversampleIn.getValue(i);
    }
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

    if(typeIn.pinIsChanged())
    {
      var n = this.getMaxInputSliceCount();
      for(var i = 0; i < n; i++)
        this.apiMultiNode[i].type = typeIn.getValue(i);
    }
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

  this.auto_evaluate = true;

  var reductionOut = this.addOutputPin('Reduction', [ 0 ], VVVV.PinTypes.Value);

  this.evaluate = function() {
    this.updateAudioConnections();
    this.updateParamPins();


    //according to the spec, reduction shouldn't be an AudioParam, but browsers seem to implement it as such
    this.apiMultiNode.forEach( function(apiNode, i)
    {
      reductionOut.setValue(i, apiNode.reduction.value);
    });
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

  this.auto_evaluate = true;

  var that = this;
  var fftSize = 2048;
  var fftData = new Float32Array(fftSize/2);
  var beatDetectors = [ ];

  var beatCounterOut = this.addOutputPin('Beat Counter', [ 0 ], VVVV.PinTypes.Value);
  var bpmOut = this.addOutputPin('BPM', [ 0 ], VVVV.PinTypes.Value);

  this.createAPISingleNode = function()
  {
    var apiNode = audioContext.createAnalyser();
    apiNode.fftSize = fftSize;
    apiNode.smoothingTimeConstant = 0;
    return apiNode;
  }

  this.evaluate = function()
  {
    this.updateAudioConnections();
    var n = this.getMaxInputSliceCount();

    for(var i = 0; i < n; i++)
    {
      if(!beatDetectors[i])
        beatDetectors[i] = new BeatDetektor();
      this.apiMultiNode[i].getFloatFrequencyData(fftData);
      beatDetectors[i].process(audioContext.currentTime, fftData);
      beatCounterOut.setValue(i, beatDetectors[i].beat_counter);
      bpmOut.setValue(i, beatDetectors[i].win_bpm_int / 10);
    }

    beatDetectors.length = n;
    beatCounterOut.setSliceCount(n);
    bpmOut.setSliceCount(n);
  }
}
VVVV.Nodes.BeatDetector.prototype = new WebAudioNode('Analyser');
VVVV.Nodes.BeatDetector.requirements = ["beatdetektor"];

}(vvvvjs_jquery));
