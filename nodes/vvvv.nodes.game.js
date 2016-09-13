// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

(function($) {

VVVV.Types.Scene = function(data) {
  this.data = data;
  }
  
VVVV.PinTypes.Scene = {
  typeName: "Scene",
  reset_on_disconnect: true,
  defaultValue: function() {
    return "No Scene"
  }
}
  


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: SceneFile (Game Scene)
 Author(s): David Gann

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SceneFile = function(id, graph) {
  this.constructor(id, "SceneFile (Game Scene)", graph);

  this.auto_nil = false;

  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };


  var filenamePin = this.addInputPin("File Name", ["http://localhost"], VVVV.PinTypes.String);
  var Update= this.addInputPin('Update', [0], VVVV.PinTypes.Value);
  
  var SceneOut = this.addOutputPin("Scene Out", [], VVVV.PinTypes.Scene);
  var SceneElements = this.addOutputPin("Scene Elements", [" "], VVVV.PinTypes.String);
  var Success = this.addOutputPin("Success", [], VVVV.PinTypes.Value);

  var HasLoaded = 0;
   var prevFilenames = [];
   var filename = [];
   var xhr = [];
  
   var SceneElementArray = [];
  
  this.evaluate = function() {
      
    if (filenamePin.pinIsChanged()){
      this.initialize();}
 
   var maxCount = filenamePin.getSliceCount();
  
      for (var i=0; i<maxCount; i++) { 
            if (prevFilenames[i] != filenamePin.getValue(i) | HasLoaded[i] == 0 | Update.getValue(i) == 1) {
                filename[i] = VVVV.Helpers.prepareFilePath(filenamePin.getValue(i), this.parentPatch);
                (function(i) {
                  xhr[i] = new XMLHttpRequest();
                  //xhr[i].responseType = 'arraybuffer';
                  xhr[i].open("GET", filename[i], true);
                  xhr[i].onreadystatechange = function (oEvent) {
                     if (xhr[i].readyState === 4) { 
                        if (xhr[i].status === 200) { 
                          var data = JSON.parse(xhr[i].responseText);
                          console.log(JSON.stringify(data));
                            if(i==0){
                                Object.keys(data).forEach(function(k) {
                                    SceneElementArray.push(k);
                                });
                            }
                            sceneData = new VVVV.Types.Scene(data);
                            SceneOut.setValue(i,sceneData);
                            HasLoaded[i]=1;
                            Success.setValue(i,1);
                        } else {
                          console.log("Error loading SceneFile", xhr[i].status);
                          Success.setValue(i,0);
                        }
                     }
                  };
                  xhr[i].send(null);
               })(i); 
             }
             prevFilenames[i] = filenamePin.getValue(i); 
        }   //end of inner for loop
        for (var t = 0; t < filenamePin.getSliceCount(); t++){
            SceneElements.setValue(i,SceneElementArray[t]);
        }
        SceneOut.setSliceCount(maxCount);
     }
  }
 VVVV.Nodes.SceneFile.prototype = new VVVV.Core.Node();
 
 /*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: ElementBuffer (Game Scene)
 Author(s): David Gann

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.ElementBuffer = function(id, graph) {
  this.constructor(id, "ElementBuffer (Game Scene)", graph);

  this.auto_nil = false;

  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };


  var SceneIn = this.addInputPin("Scene", [], VVVV.PinTypes.Scene);
  var selectorIn = this.addInputPin("Selector", [""], VVVV.PinTypes.String);

  var BufferOut = this.addOutputPin("Buffer", [], VVVV.PinTypes.Buffer);
  var offset = this.addOutputPin("offset", [0], VVVV.PinTypes.Value);
  var binSize = this.addOutputPin("BinSize", [1], VVVV.PinTypes.Value);
  var TypeIndex = this.addOutputPin("TypeIndex", [0], VVVV.PinTypes.Value);
  
    Object.byString = function(o, s) {
        s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
        s = s.replace(/^\./, '');           // strip a leading dot
        var a = s.split('.');
        for (var i = 0, n = a.length; i < n; ++i) {
            var k = a[i];
            if (k in o) {
                o = o[k];
            } else {
                return;
            }
        }
        return o;
    }

  
  var binsizeArray = [];
  var idArray = [];
  
  this.evaluate = function() {
      
    if (SceneIn.pinIsChanged()){
      this.initialize();}
 
    var selector = selectorIn.getValue(0);
    var offsetKey = "data."+selector+".offset";
    var countKey = "data."+selector+".count";
    var idKey = "data."+selector+".id";
    var bufferKey = "data."+selector+".buffer";
    
    var maxCount = SceneIn.getSliceCount();
   
    var buffer = [];
    for (var i=0; i<maxCount; i++) {  
        var scene = SceneIn.getValue(i); 
        if(scene !== undefined){
            var offset = Object.byString(scene, offsetKey)
            var count = Object.byString(scene, countKey)
            var id = Object.byString(scene, idKey)
            var buffer = Object.byString(scene, bufferKey)
        }
        //console.log("scene " + i + " , object scene: " + JSON.stringify(scene)); 
                            //var botanyBufferLength = data.botany.buffer.length;
                            
                            //for (var i=0; i<botanyBufferLength; i++) {
                            // }
                            //Create Output Pin and assign data
                            var VectorSize=3;
                            var buffer = new VVVV.Types.Buffer(VectorSize, buffer);
                            BufferOut.setValue(i,buffer);         
                        
        }   //end of inner for loop

    
     }
  }
  VVVV.Nodes.ElementBuffer.prototype = new VVVV.Core.Node();

}(vvvvjs_jquery));