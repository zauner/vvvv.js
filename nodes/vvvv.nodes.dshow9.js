/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: ScopeSpread (DShow9)
 Author(s): Vadim Smakhtin
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.ScopeSpread = function(id, graph) {
  this.constructor(id, "ScopeSpread (DShow9)", graph);

  this.meta = {
    authors: ['Vadim Smakhtin'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = true;

  var audioIn = this.addInputPin('Audio', [], this);
  var spreadCountIn = this.addInputPin("Spread Count", [120], this);

  var lOut = this.addOutputPin('Output L', [0], this);
  var rOut = this.addOutputPin('Output R', [0], this);

  var buffersPerFrameOut = this.addOutputPin('BuffersPerFrame', [0], this);
  var bufferSizeOut = this.addOutputPin('Buffer Size', [0], this);

  if (window.webkitAudioContext) {
    var audioContext = new webkitAudioContext();
  
    var audioSource;
    var analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.connect(audioContext.destination);
  }

  var frameBufferL = [];
  var frameBufferR = [];
  var frameBufferLR;
  var frequencyData = [];
  var channels = 1;
  var vMath = VVVV.Utils.VMath;

  this.evaluate = function() {
    var audio;
    if(audioIn.pinIsChanged()) {
      audio = audioIn.getValue(0);
      if (audio === undefined) return;

      if (window.webkitAudioContext) {
        audioSource = audioContext.createMediaElementSource(audio);
        audioSource.connect(analyser);
        frameBufferLR = new Uint8Array(1024);
      }
      else {
        audio.addEventListener('metadataloaded', function(e) {
          channels = e.mozChannels;
          frameBufferLR = new Uint8Array(1024 * channels);
        }, false);
        
        // fetch waveform Audio Data API style
        audio.addEventListener('MozAudioAvailable', function(e) {
          frameBufferLR = e.frameBuffer;
        }, false);
      }
    }
    
    if (spreadCountIn.pinIsChanged()) {
      frequencyData.length = parseInt(spreadCountIn.getValue(0));
    }
    
    // fetch waveform Web Audio API style
    if (window.webkitAudioContext) {
      analyser.getByteTimeDomainData(frameBufferLR);
    }
    
    // split signal
    if (frameBufferLR && frameBufferLR.length>0) {
      for (var i=0; i<frameBufferLR.length/channels; i++) {
        frameBufferL[i] = frameBufferLR[i*channels];
        frameBufferR[i] = frameBufferLR[i*channels+1];
      }
    }
    
    // resample framebuffer
    var binSize = parseInt(frameBufferR.length/frequencyData.length);
    for (var i=0; i<frequencyData.length; i++) {
      if (window.webkitAudioContext)
        frequencyData[i] = vMath.map(frameBufferR[i*binSize], 0, 255, -.5, .5, vMath.MapModeEnum.FLOAT);
      else
        frequencyData[i] = frameBufferR[i*binSize] * 0.5;
    }
      
    lOut.setSliceCount(frequencyData.length);
    rOut.setSliceCount(frequencyData.length);

    for (var i = 0; i < frequencyData.length; i++) {
      var mappedValue = frequencyData[i];
      lOut.setValue(i, mappedValue);
      rOut.setValue(i, mappedValue);
    }
  };
};
VVVV.Nodes.ScopeSpread.prototype = new VVVV.Core.Node();