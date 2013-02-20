// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: FileTexture (Canvas VVVVjs)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.FileTextureCanvas = function(id, graph) {
  this.constructor(id, "FileTexture (HTML5 VVVVjs)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = true;
  
  var filenameIn = this.addInputPin('Filename', [], this);
  
  var textureOut = this.addOutputPin('Texture Out', [], this);
  var widthOut = this.addOutputPin('Width', [0], this);
  var heightOut = this.addOutputPin('Height', [0], this);
  var runningOut = this.addOutputPin('Up and Running', [0], this);
  
  var images = [];
  var textureLoaded = false;
  
  this.evaluate = function() {

    var maxSpreadSize = this.getMaxInputSliceCount();
    var i;

    if (filenameIn.pinIsChanged()) {
      for (i=0; i<maxSpreadSize; i++) {
        if (images[i] === undefined)
          images[i] = new Image();
        if (images[i].src!=filenameIn.getValue(i)) {
          images[i].loaded = false;
          var that = this;
          var img = images[i];
          images[i].onload = (function(j) {
            return function() {
              images[j].loaded = true;
              textureLoaded = true;
            };
          })(i);
          images[i].src = filenameIn.getValue(i);
          runningOut.setValue(i, 0);
          textureOut.setValue(i, images[i]);
        }
      }
      images.length = maxSpreadSize;
      textureOut.setSliceCount(maxSpreadSize);
      widthOut.setSliceCount(maxSpreadSize);
      heightOut.setSliceCount(maxSpreadSize);
      runningOut.setSliceCount(maxSpreadSize);
    }
    
    if (textureLoaded) {
      for (i = 0; i < maxSpreadSize; i++) {
        textureOut.setValue(i, images[i]);
        widthOut.setValue(i, images[i].width);
        heightOut.setValue(i, images[i].height);
        runningOut.setValue(i, images[i].loaded ? 1:0);
      }
      textureLoaded = false;
    }
    
  };
};
VVVV.Nodes.FileTextureCanvas.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: FileStream (Canvas VVVVjs)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.FileStreamCanvas = function(id, graph) {
  this.constructor(id, "FileStream (HTML5 VVVVjs)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  
  this.auto_evaluate = true;
  
  var networkStates = [ 'NETWORK_EMPTY', 'NETWORK_IDLE', 'NETWORK_LOADING', 'NETWORK_NO_SOURCE' ];
  var readyStates = [ 'HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA', 'HAVE_CURRENT_DATA' ];
  
  var playIn = this.addInputPin('Play', [1], this);
  var loopIn = this.addInputPin('Loop', [0], this);
  var startTimeIn = this.addInputPin('Start Time', [0.0], this);
  var endTimeIn = this.addInputPin('End Time', [-1.0], this);
  var doSeekIn = this.addInputPin('Do Seek', [0], this);
  var seekPosIn = this.addInputPin('Seek Position', [0.0], this);
  var filenameIn = this.addInputPin('Filename', ['http://html5doctor.com/demos/video-canvas-magic/video.ogg'], this);
  
  var videoOut = this.addOutputPin('Video', [], this);
  var audioOut = this.addOutputPin('Audio', [], this);               // this might be just the same output as the video out for now, since there's no audio tag support yet.
  var durationOut = this.addOutputPin('Duration', [0.0], this);
  var positionOut = this.addOutputPin('Position', [0.0], this);
  var widthOut = this.addOutputPin('Video Width', [0.0], this);
  var heightOut = this.addOutputPin('Video Height', [0.0], this);
  var networkStatusOut = this.addOutputPin('Network Status', [''], this);
  var readyStatusOut = this.addOutputPin('Ready Status', [''], this);
  
  var streams = [];

  function createVideo (i) {
    if (streams[i] === undefined) {
      var $video = $('<video style="display:none"><source src="" type=video/ogg></video>');
      $('body').append($video);
      streams[i] = $video[0];
      streams[i].volume = 0;
      var updateStatus = (function(j) {
        return function() {

        };
      })(i);
      streams[i].onprogress = updateStatus;
      streams[i].oncanplay = updateStatus;
      streams[i].oncanplaythrough = updateStatus;
    }
    if (filenameIn.getValue(i)!=streams[i].currentSrc) {
      $(streams[i]).find('source').first().attr('src', filenameIn.getValue(i));
      streams[i].load();
      if (playIn.getValue(i)>0.5)
        streams[i].play();
      else
        streams[i].pause();

      streams[i].loaded = true;
      videoOut.setValue(i, streams[i]);
      audioOut.setValue(i, streams[i]);
    }
  }

  function createAudio (i) {
    if (streams[i] === undefined) {
      var audio = new Audio();
      document.body.appendChild(audio);
      streams[i] = audio;
      streams[i].volume = 0;
      var updateStatus = (function(j) {
        return function() {

        };
      })(i);
      streams[i].onprogress = updateStatus;
      streams[i].oncanplay = updateStatus;
      streams[i].oncanplaythrough = updateStatus;
    }
    if (filenameIn.getValue(i)!=streams[i].currentSrc) {
      streams[i].src = filenameIn.getValue(i);
      streams[i].load();
      if (playIn.getValue(i)>0.5)
        streams[i].play();
      else
        streams[i].pause();

      streams[i].loaded = true;
      videoOut.setValue(i, streams[i]);
      audioOut.setValue(i, streams[i]);
    }
  }
  
  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();
    var stream;
    var i;
    if (filenameIn.pinIsChanged()) {
      for (i = 0; i<maxSpreadSize; i++) {
        var filename = filenameIn.getValue(i);

        if (filename === undefined) continue;

        var strings = filename.split(".");
        var extension = strings[strings.length-1];

        switch(extension) {
          case "avi":
          case "mp4":
            createVideo(i);
            break;
          case "mp3":
          case "ogg":
            createAudio(i);
            break;
          default:
            console.log("Sorry, unsupported file type in "+this.nodename);
        }
      }
    }
    
    if (playIn.pinIsChanged()) {
      for (i = 0; i<maxSpreadSize; i++) {
        stream = streams[i];
        if (stream === undefined) continue;
        
        if (playIn.getValue(i)>0.5)
          stream.play();
        else
          stream.pause();
      }
    }
    
    if (doSeekIn.pinIsChanged()) {
      for (i = 0; i < maxSpreadSize; i++) {
        stream = streams[i];
        if (stream === undefined) continue;

        if (streams[i%streams.length].loaded && doSeekIn.getValue(i) >= 0.5) {
          streams[i%streams.length].currentTime = parseFloat(seekPosIn.getValue(i));
          if (playIn.getValue(i) > 0.5)
            stream.play();
        }
      }
    }
    
    for (i = 0; i < maxSpreadSize; i++) {
      stream = streams[i];
      if (stream === undefined) continue;

      if (!stream.paused) {
        // videoOut.setValue(i, stream);
        // audioOut.setValue(i, stream);
        if (durationOut.getValue(i)!=stream.duration)
          durationOut.setValue(i, stream.duration);
        positionOut.setValue(i, stream.currentTime);
        var endTime = parseFloat(endTimeIn.getValue(i));
        var startTime = parseFloat(startTimeIn.getValue(i));
        if (streams[i].currentTime<startTime)
          streams[i].currentTime = startTime;
        if (streams[i].currentTime>=streams[i].duration || (endTime>=0 && streams[i].currentTime>=endTime)) {
          if (loopIn.getValue(i) >= 0.5)
            streams[i].currentTime = startTime;
          else
            streams[i].pause();
        }
      }
      if (streams[i].videoWidth!=widthOut.getValue(i) || streams[i].videoHeight!=heightOut.getValue(i)) {
        widthOut.setValue(i, streams[i].videoWidth);
        heightOut.setValue(i, streams[i].videoHeight);
      }
      if (networkStatusOut.getValue(i)!=networkStates[streams[i].networkState])
        networkStatusOut.setValue(i, networkStates[streams[i].networkState]);
      if (readyStatusOut.getValue(i)!=readyStates[streams[i].readyState])
        readyStatusOut.setValue(i, readyStates[streams[i].readyState]);
    }
    
    videoOut.setSliceCount(maxSpreadSize);
    audioOut.setSliceCount(maxSpreadSize);
    
  };
};
VVVV.Nodes.FileStreamCanvas.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: AudioOut (HTML5 VVVVjs)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AudioOutHTML5 = function(id, graph) {
  this.constructor(id, "AudioOut (HTML5 VVVVjs)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  
  var audioIn = this.addInputPin('Audio', [], this);
  var volumeIn = this.addInputPin('Volume', [0.5], this);
  
  this.evaluate = function() {

    var maxSpreadSize = this.getMaxInputSliceCount();
    
    if (volumeIn.pinIsChanged()) {
      for (var i=0; i<maxSpreadSize; i++) {
        audioIn.getValue(i).volume = Math.max(0.0, Math.min(1.0, parseFloat(volumeIn.getValue(i))));
      }
    }
    
  };
};
VVVV.Nodes.AudioOutHTML5.prototype = new VVVV.Core.Node();