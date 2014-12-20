// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

(function($) {

/**
 * The HTML5Texture Pin Type
 * @mixin
 * @property {String} typeName "HTML5Texture"
 * @property {Boolean} reset_on_disconnect true
 * @property {Function} defaultValue function returning "Empty Texture"
 */
VVVV.PinTypes.HTML5Texture = {
  typeName: "HTML5Texture",
  reset_on_disconnect: true,
  defaultValue: function() {
    return "Empty Texture";
  }
}

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
  
  var filenameIn = this.addInputPin('Filename', [], VVVV.PinTypes.String);
  
  var textureOut = this.addOutputPin('Texture Out', [], VVVV.PinTypes.HTML5Texture);
  var widthOut = this.addOutputPin('Width', [0], VVVV.PinTypes.Value);
  var heightOut = this.addOutputPin('Height', [0], VVVV.PinTypes.Value);
  var runningOut = this.addOutputPin('Up and Running', [0], VVVV.PinTypes.Value);
  
  var images = [];
  var textureLoaded = false;
  
  this.evaluate = function() {
  
    var maxSpreadSize = this.getMaxInputSliceCount();
    
    if (filenameIn.pinIsChanged()) { 
      for (var i=0; i<maxSpreadSize; i++) {
        var filename = VVVV.Helpers.prepareFilePath(filenameIn.getValue(i), this.parentPatch);
        if (filename.indexOf('http://')===0 && VVVV.ImageProxyPrefix!==undefined)
          filename = VVVV.ImageProxyPrefix+encodeURI(filename);
        if (images[i]==undefined || images[i].origSrc!=filename) {
          images[i] = new Image();
          images[i].loaded = false;
          images[i].origSrc = filename;
          var that = this;
          var img = images[i];
          images[i].onload = (function(j) {
            return function() {
              images[j].loaded = true;
              textureLoaded = true;
            }
          })(i);
          images[i].src = filename;
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
      for (var i=0; i<maxSpreadSize; i++) {
        textureOut.setValue(i, images[i]);
        widthOut.setValue(i, images[i].width);
        heightOut.setValue(i, images[i].height);
        runningOut.setValue(i, images[i].loaded ? 1:0);
      }
      textureLoaded = false;
    }
    
  }
}
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
  
  var playIn = this.addInputPin('Play', [1], VVVV.PinTypes.Value);
  var loopIn = this.addInputPin('Loop', [0], VVVV.PinTypes.Value);
  var startTimeIn = this.addInputPin('Start Time', [0.0], VVVV.PinTypes.Value);
  var endTimeIn = this.addInputPin('End Time', [-1.0], VVVV.PinTypes.Value);
  var doSeekIn = this.addInputPin('Do Seek', [0], VVVV.PinTypes.Value);
  var seekPosIn = this.addInputPin('Seek Position', [0.0], VVVV.PinTypes.Value);
  var filenameIn = this.addInputPin('Filename', ['http://html5doctor.com/demos/video-canvas-magic/video.ogg'], VVVV.PinTypes.String);
  
  var videoOut = this.addOutputPin('Video', [], this);
  var audioOut = this.addOutputPin('Audio', [], this);               // this might be just the same output as the video out for now, since there's no audio tag support yet.
  var durationOut = this.addOutputPin('Duration', [0.0], VVVV.PinTypes.Value);
  var positionOut = this.addOutputPin('Position', [0.0], VVVV.PinTypes.Value);
  var widthOut = this.addOutputPin('Video Width', [0.0], VVVV.PinTypes.Value);
  var heightOut = this.addOutputPin('Video Height', [0.0], VVVV.PinTypes.Value);
  var networkStatusOut = this.addOutputPin('Network Status', [''], VVVV.PinTypes.String);
  var readyStatusOut = this.addOutputPin('Ready Status', [''], VVVV.PinTypes.String);
  
  var videos = [];
  
  this.evaluate = function() {
  
    var maxSpreadSize = this.getMaxInputSliceCount();
    
    if (filenameIn.pinIsChanged()) { 
      for (var i=0; i<maxSpreadSize; i++) {
        filename = VVVV.Helpers.prepareFilePath(filenameIn.getValue(i), this.parentPatch);
        if (videos[i]==undefined) {
          var $video = $('<video style="display:none"><source src="" type=video/ogg></video>');
          $('body').append($video);
          videos[i] = $video[0];
          videos[i].volume = 0;
          var updateStatus = (function(j) {
            return function() {
              
            }
          })(i);
          videos[i].onprogress = updateStatus;
          videos[i].oncanplay = updateStatus;
          videos[i].oncanplaythrough = updateStatus;
        }
        if (filename!=videos[i].currentSrc) {
          $(videos[i]).find('source').first().attr('src', filename);
          videos[i].load();
          if (playIn.getValue(i)>0.5)
            videos[i].play();
          else
            videos[i].pause();
          
          videos[i].loaded = true;
          videoOut.setValue(i, videos[i]);
          audioOut.setValue(i, videos[i]);
        }
      }
    }
    
    if (playIn.pinIsChanged()) {
      for (var i=0; i<maxSpreadSize; i++) {
        if (playIn.getValue(i)>0.5)
          videos[i].play();
        else
          videos[i].pause();
      }
    }
    
    if (doSeekIn.pinIsChanged()) {
      for (var i=0; i<maxSpreadSize; i++) {
        if (videos[i%videos.length].loaded && doSeekIn.getValue(i)>=.5) {
          videos[i%videos.length].currentTime = seekPosIn.getValue(i);
          if (playIn.getValue(i)>.5)
            videos[i].play();
        }
      }
    }
    
    for (var i=0; i<maxSpreadSize; i++) {
      if (!videos[i].paused) {
        videoOut.setValue(i, videos[i]);
        audioOut.setValue(i, videos[i]);
        if (durationOut.getValue(i)!=videos[i].duration)
          durationOut.setValue(i, videos[i].duration);
        positionOut.setValue(i, videos[i].currentTime);
        var endTime = endTimeIn.getValue(i);
        var startTime = startTimeIn.getValue(i);
        if (videos[i].currentTime<startTime)
          videos[i].currentTime = startTime;
        if (videos[i].currentTime>=videos[i].duration || (endTime>=0 && videos[i].currentTime>=endTime)) {
          if (loopIn.getValue(i)>=.5)
            videos[i].currentTime = startTime;
          else
            videos[i].pause();
        }
      }
      if (videos[i].videoWidth!=widthOut.getValue(i) || videos[i].videoHeight!=heightOut.getValue(i)) {
        widthOut.setValue(i, videos[i].videoWidth);
        heightOut.setValue(i, videos[i].videoHeight);
      }
      if (networkStatusOut.getValue(i)!=networkStates[videos[i].networkState])
        networkStatusOut.setValue(i, networkStates[videos[i].networkState]);
      if (readyStatusOut.getValue(i)!=readyStates[videos[i].readyState])
        readyStatusOut.setValue(i, readyStates[videos[i].readyState]);
    }
    
    videoOut.setSliceCount(maxSpreadSize);
    audioOut.setSliceCount(maxSpreadSize);
    
  }
}
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
  var volumeIn = this.addInputPin('Volume', [0.5], VVVV.PinTypes.Value);
  
  this.evaluate = function() {
  
    var maxSpreadSize = this.getMaxInputSliceCount();
    
    if (volumeIn.pinIsChanged()) {
      for (var i=0; i<maxSpreadSize; i++) {
        audioIn.getValue(i).volume = Math.max(0.0, Math.min(1.0, volumeIn.getValue(i)));
      }
    }
    
  }
}
VVVV.Nodes.AudioOutHTML5.prototype = new VVVV.Core.Node();

}(vvvvjs_jquery));
