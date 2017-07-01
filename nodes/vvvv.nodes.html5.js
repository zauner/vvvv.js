// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }
define(function(require,exports) {

var Node = require('core/vvvv.core.node');
var VVVV = require('core/vvvv.core.defines');
var $ = require('jquery');

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
  this.environments = ['browser'];

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
VVVV.Nodes.FileTextureCanvas.prototype = new Node();

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
  this.environments = ['browser'];

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
VVVV.Nodes.FileStreamCanvas.prototype = new Node();



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

  this.environments = ['browser'];

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
VVVV.Nodes.AudioOutHTML5.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: StoreFile (HTML5)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.StoreFile = function(id, graph) {
  this.constructor(id, "StoreFile (HTML5)", graph);

  this.environments = ['browser'];

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  var fileIn = this.addInputPin('File In', [], VVVV.PinTypes.HTMLFile);
  var destFileNameIn = this.addInputPin('Destination Path', ['file.dat'], VVVV.PinTypes.String);
  var doWriteIn = this.addInputPin('DoWrite', [0], VVVV.PinTypes.Value);

  var progressOut = this.addOutputPin('Progress', [0.0], VVVV.PinTypes.Value);

  var that = this;
  var offset = 0;
  var file = undefined;
  var fileIdx = 0;
  var chunkIdx;
  function processNextChunk() {
    if (offset>=file.size) {
      fileIdx++;
      transferNextFile();
      return;
    }
    var fr = new FileReader();
    fr.onloadend = function() {
      that.parentPatch.serverSync.sendBinaryBackendMessage(that, this.result, {fileIdx: fileIdx, filename: destFileNameIn.getValue(fileIdx), offset: offset});
      if (offset < file.size) {
        offset += 1024 * 1024;
      }
    }
    fr.readAsArrayBuffer(file.slice(offset, offset + 1024*1024));
  }

  function transferNextFile() {
    if (fileIdx>=fileIn.getSliceCount())
      return;
    file = fileIn.getValue(fileIdx);
    if (file=="No File")
      return;
    offset = 0;
    chunkIdx = 0;
    processNextChunk();
  }

  this.evaluate = function() {
    var that = this;
    if (fileIn.pinIsChanged()) {
      progressOut.setValue(0, 0);
      progressOut.setSliceCount(fileIn.getSliceCount());
    }
    if (fileIn.isConnected() && doWriteIn.getValue(0)>=0.5) {
      progressOut.setSliceCount(fileIn.getSliceCount());
      for (var i=0; i<fileIn.getSliceCount(); i++) {
        progressOut.setValue(i, 0);
      }
      fileIdx = 0;
      transferNextFile();
    }
    else {
      //progressOut.setValue(0, 0);
      //progressOut.setSliceCount(1);
    }
  }


  this.handleBackendMessage = function(message, meta_data) {
    fs = window.server_req('fs');
    if (VVVVContext.name=='nodejs') {
      var that = this;
      var f;
      if (meta_data.offset>0)
        f = fs.appendFile;
      else
        f = fs.writeFile;
      f(VVVV.Helpers.prepareFilePath(meta_data.filename, this.parentPatch), new Buffer(message.buffer), function() {
        that.parentPatch.serverSync.socket.send(JSON.stringify({patch: that.parentPatch.getPatchIdentifier(), node: that.id, message: "OK"}));
      });
    }
    else {
      progressOut.setValue(fileIdx, Math.min(1.0, offset/file.size));
      processNextChunk();
    }
  }
  }
  VVVV.Nodes.StoreFile.prototype = new Node();


  /*
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   NODE: AsBuffer (HTML File)
   Author(s): Matthias Zauner
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  */

  VVVV.Nodes.AsBufferHTMLFile = function(id, graph) {
    this.constructor(id, "AsBuffer (HTML File)", graph);

    this.meta = {
      authors: ['Matthias Zauner'],
      original_authors: [],
      credits: [],
      compatibility_issues: []
    };
    this.environments = ['browser'];

    this.auto_nil = false;

    var fileIn = this.addInputPin("File", [], VVVV.PinTypes.HTMLFile);
    var offsetIn = this.addInputPin("Offset", [0], VVVV.PinTypes.Value);
    var lengthIn = this.addInputPin("Length", [-1], VVVV.PinTypes.Value);

    var bufferOut = this.addOutputPin("Buffer", [], VVVV.PinTypes.Buffer);
    var onReadOut = this.addOutputPin("OnRead", [0], VVVV.PinTypes.Value);
    onReadOut.auto_reset = true;

    var files = [];

    this.evaluate = function() {
      var maxSpreadSize = this.getMaxInputSliceCount();
      var thatNode = this;

      for (var i=0; i<maxSpreadSize; i++) {
        if (fileIn.getValue(i)!='No File') {
          if (fileIn.getValue(i)!==files[i]) {
            (function(j) {
              var fr = new FileReader();
              fr.onloadend = function() {
                bufferOut.setValue(j, this.result);
                onReadOut.setValue(j, 1);
              }
              var offset = offsetIn.getValue(j);
              var length = lengthIn.getValue(j);
              if (length<0)
                length = fileIn.getValue(j).size;
              fr.readAsArrayBuffer(fileIn.getValue(j).slice(offset, offset + length));
            })(i);
            files[i] = fileIn.getValue(i);
            onReadOut.setValue(i, 0);
          }
        }
        else {
          bufferOut.setValue(i, 'EMPTY BUFFER');
        }
      }
      files.length = maxSpreadSize;
      bufferOut.setSliceCount(maxSpreadSize);
      onReadOut.setSliceCount(maxSpreadSize);

    }

    this.destroy = function() {

    }
  }
  VVVV.Nodes.AsBufferHTMLFile.prototype = new Node();


  /*
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   NODE: Directory (HTML5)
   Author(s): Matthias Zauner
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  */

  VVVV.Nodes.Directory = function(id, graph) {
    this.constructor(id, "Directory (HTML5)", graph);

    this.environments = ['nodejs'];

    this.meta = {
      authors: ['Matthias Zauner'],
      original_authors: ['woei'],
      credits: [],
      compatibility_issues: []
    };

    var directoryIn = this.addInputPin('Directory Name', [''], VVVV.PinTypes.String);
    var createIn = this.addInputPin('Create', [0], VVVV.PinTypes.Value);
    var removeIn = this.addInputPin('Remove', [0], VVVV.PinTypes.Value);
    var newNameIn = this.addInputPin('New Name', [''], VVVV.PinTypes.String);
    var renameIn = this.addInputPin('Rename', [0], VVVV.PinTypes.Value);
    var checkExistenceIn = this.addInputPin('Check Existence', [0], VVVV.PinTypes.Value);

    var existsOut = this.addOutputPin("Exists", [0], VVVV.PinTypes.Value);
    var successOut = this.addOutputPin('Success', [0], VVVV.PinTypes.Value);
    successOut.auto_reset = true;
    var errorOut = this.addOutputPin('Error', [0], VVVV.PinTypes.Value);
    errorOut.auto_reset = true;

    var fs = undefined;
    this.initialize = function() {
      fs = window.server_req('fs');
    }

    // taken from http://stackoverflow.com/a/32197381
    var deleteFolderRecursive = function(path) {
      if (path=="/" || path=="")
        return;
      if( fs.existsSync(path) ) {
        fs.readdirSync(path).forEach(function(file,index){
          var curPath = path + "/" + file;
          if(fs.lstatSync(curPath).isDirectory()) { // recurse
            deleteFolderRecursive(curPath);
          } else { // delete file
            fs.unlinkSync(curPath);
          }
        });
        fs.rmdirSync(path);
        return true;
      }
      else
        return false;
    };

    this.evaluate = function() {
      var that = this;
      if (createIn.getValue(0)>=0.5 && directoryIn.getValue(0)!='') {
        fs.mkdir(VVVV.Helpers.prepareFilePath(directoryIn.getValue(0), this.parentPatch), function(err) {
          if (err) {
            console.log(err);
            errorOut.setValue(0, 1);
          }
          else {
            successOut.setValue(0, 1);
          }
          that.parentPatch.mainloop.requestEvaluate();
        });
      }

      if (removeIn.getValue(0)>=0.5 && directoryIn.getValue(0)!='') {
        if (deleteFolderRecursive(VVVV.Helpers.prepareFilePath(directoryIn.getValue(0), this.parentPatch))) {
          successOut.setValue(0, 1);
          that.parentPatch.mainloop.requestEvaluate();
        }
        else
          errorOut.setValue(0, 1);
      }

      if (checkExistenceIn.getValue(0)>=0.5 && directoryIn.getValue(0)!='') {
        try {
          if (fs.statSync(VVVV.Helpers.prepareFilePath(directoryIn.getValue(0), this.parentPatch)).isDirectory())
            existsOut.setValue(0, 1);
          else
            existsOut.setValue(0, 0);
        } catch (e) {
          if (e.code === 'ENOENT') {
            existsOut.setValue(0, 0);
          }
        }
      }
    }

  }
  VVVV.Nodes.Directory.prototype = new Node();


  /*
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   NODE: File (HTML5)
   Author(s): Matthias Zauner
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  */

  VVVV.Nodes.File = function(id, graph) {
    this.constructor(id, "File (HTML5)", graph);

    this.environments = ['nodejs'];

    this.meta = {
      authors: ['Matthias Zauner'],
      original_authors: [],
      credits: [],
      compatibility_issues: []
    };

    var filenameIn = this.addInputPin('File Name', [''], VVVV.PinTypes.String);
    var removeIn = this.addInputPin('Remove', [0], VVVV.PinTypes.Value);
    var newNameIn = this.addInputPin('New Name', [''], VVVV.PinTypes.String);
    var renameIn = this.addInputPin('Rename', [0], VVVV.PinTypes.Value);
    var checkExistenceIn = this.addInputPin('Check Existence', [0], VVVV.PinTypes.Value);

    var existsOut = this.addOutputPin("Exists", [0], VVVV.PinTypes.Value);
    var successOut = this.addOutputPin('Success', [0], VVVV.PinTypes.Value);
    successOut.auto_reset = true;
    var errorOut = this.addOutputPin('Error', [0], VVVV.PinTypes.Value);
    errorOut.auto_reset = true;

    var fs = undefined;
    this.initialize = function() {
      fs = window.server_req('fs');
    }

    this.evaluate = function() {
      var that = this;

      if (filenameIn.pinIsChanged()) {
        for (var i=0; i<filenameIn.getSliceCount(); i++) {
          successOut.setValue(i, 0);
          errorOut.setValue(i, 0);
          existsOut.setValue(i, 0);
        }
      }

      for (var i=0; i<filenameIn.getSliceCount(); i++) {
        if (removeIn.getValue(i)>=0.5 && filenameIn.getValue(i)!='') {
          (function(j) {
            fs.unlink(VVVV.Helpers.prepareFilePath(filenameIn.getValue(j), this.parentPatch), function(err) {
              if (err) {
                console.log(err);
                errorOut.setValue(j, 1);
              }
              else {
                successOut.setValue(j, 1);
              }
              that.parentPatch.mainloop.requestEvaluate();
            });
          })(i);
        }

        if (checkExistenceIn.getValue(i)>=0.5 && filenameIn.getValue(i)!='') {
          try {
            if (fs.statSync(VVVV.Helpers.prepareFilePath(filenameIn.getValue(i), this.parentPatch)).isFile())
              existsOut.setValue(i, 1);
          } catch (e) {
            if (e.code === 'ENOENT') {
              existsOut.setValue(i, 0);
            }
          }
        }
      }
      successOut.setSliceCount(filenameIn.getSliceCount());
      errorOut.setSliceCount(filenameIn.getSliceCount());
      existsOut.setSliceCount(filenameIn.getSliceCount());
    }

  }
  VVVV.Nodes.File.prototype = new Node();


  /*
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   NODE: Dir (HTML5)
   Author(s): Matthias Zauner
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  */

  VVVV.Nodes.Dir = function(id, graph) {
    this.constructor(id, "Dir (HTML5)", graph);

    this.environments = ['nodejs'];

    this.meta = {
      authors: ['Matthias Zauner'],
      original_authors: ['VVVV Group'],
      credits: [],
      compatibility_issues: []
    };

    //var maskIn = this.addInputPin('Mask', ['*.*'], VVVV.PinTypes.String);
    var directoryIn = this.addInputPin('Directory', ['.'], VVVV.PinTypes.String);
    //var inclideSubDirsIn = this.addInputPin('Include Subdirectories', [0], VVVV.PinTypes.Value);
    var updateIn = this.addInputPin('Update', [0], VVVV.PinTypes.Value);

    var filenamesOut = this.addOutputPin("Filenames", [''], VVVV.PinTypes.String);
    var shortFilenamesOut = this.addOutputPin('Short Filenames', [''], VVVV.PinTypes.String);
    var fileCountOut = this.addOutputPin('File Count', [0], VVVV.PinTypes.Value);

    var fs = undefined;
    var path = undefined;
    this.initialize = function() {
      fs = window.server_req('fs');
    }

    this.evaluate = function() {
      if (updateIn.getValue(0)>0.5) {
        var sliceIdx = 0;
        for (var i=0; i<directoryIn.getSliceCount(); i++) {
          var files = fs.readdirSync(VVVV.Helpers.prepareFilePath(directoryIn.getValue(i), this.parentPatch));
          var fileCount = 0;
          for (var j=0; j<files.length; j++) {
            var stats = fs.statSync(VVVV.Helpers.prepareFilePath(directoryIn.getValue(i), this.parentPatch)+'/'+files[j]);
            if (stats.isFile()) {
              filenamesOut.setValue(sliceIdx, directoryIn.getValue(i)+'/'+files[j]);
              shortFilenamesOut.setValue(sliceIdx, files[j]);
              sliceIdx++;
              fileCount++;
            }
          }
          fileCountOut.setValue(i, fileCount);
        }
        filenamesOut.setSliceCount(sliceIdx);
        shortFilenamesOut.setSliceCount(sliceIdx);
        fileCountOut.setSliceCount(directoryIn.getSliceCount());
      }
    }

  }
  VVVV.Nodes.Dir.prototype = new Node();

});
