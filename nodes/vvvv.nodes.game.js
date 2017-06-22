// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }
define(function(require,exports) {

var Node = require('core/vvvv.core.node');
var VVVV = require('core/vvvv.core.defines');

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
  var Success = this.addOutputPin("Success", [0.0], VVVV.PinTypes.Value);


  var HasLoaded = 0;
   var prevFilenames = [];
   var filename = [];
   var xhr = [];

   var SceneElementArray = [];
  var SuccessLoad = [];
  this.evaluate = function() {

   // if (filenamePin.pinIsChanged()){
    //  this.initialize();}

   var maxCount = filenamePin.getSliceCount();

      for (var i=0; i<maxCount; i++) {

          //Success.setValue(i,0);

            if (prevFilenames[i] != filenamePin.getValue(i) | HasLoaded[i] == 0 | Update.getValue(i) == 1) {
                filename[i] = VVVV.Helpers.prepareFilePath(filenamePin.getValue(i), this.parentPatch);
                (function(i) {
                  xhr[i] = new XMLHttpRequest();
                  //xhr[i].responseType = 'arraybuffer';
                  xhr[i].open("GET", filename[i], true);
                  xhr[i].onreadystatechange = function() {
                     if (xhr[i].readyState === 4) {
                        if (xhr[i].status === 200) {
                          var data = JSON.parse(xhr[i].responseText);


                            var sceneData = new VVVV.Types.Scene(data);
                            var key = Object.keys(data);
                            SceneOut.setValue(i,sceneData);
                            SceneElements.setValue(i,key, key.length);
                            Success.setValue(i,1);
                            HasLoaded[i]=1;
                            SuccessLoad[i] = 1;
                        } else {
                          console.log("Error loading SceneFile", xhr[i].status);
                          Success.setValue(i,0);
                        }
                     }
                  };
                  xhr[i].send(null);
               })(i);
             }
             else{Success.setValue(i,0);}
             prevFilenames[i] = filenamePin.getValue(i);
        }   //end of inner for loop

        SceneOut.setSliceCount(maxCount);
     }
  }
 VVVV.Nodes.SceneFile.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: AnimationFile (Game Animation)
 Author(s): David Gann

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AnimationFile = function(id, graph) {
  this.constructor(id, "AnimationFile (Game Animation)", graph);

  this.auto_nil = false;

  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };


  var filenamePin = this.addInputPin("File Name", ["http://localhost"], VVVV.PinTypes.String);
  var Update= this.addInputPin('Update', [0], VVVV.PinTypes.Value);

  var SceneOut = this.addOutputPin("Scene Out", [], VVVV.PinTypes.Animation);
  var SceneElements = this.addOutputPin("Animation Elements", [" "], VVVV.PinTypes.String);
  var Success = this.addOutputPin("Success", [0.0], VVVV.PinTypes.Value);


  var HasLoaded = 0;
   var prevFilenames = [];
   var filename = [];
   var xhr = [];

   var SceneElementArray = [];
  var SuccessLoad = [];
  this.evaluate = function() {

   // if (filenamePin.pinIsChanged()){
    //  this.initialize();}

   var maxCount = filenamePin.getSliceCount();

      for (var i=0; i<maxCount; i++) {

          //Success.setValue(i,0);

            if (prevFilenames[i] != filenamePin.getValue(i) | HasLoaded[i] == 0 | Update.getValue(i) == 1) {
                filename[i] = VVVV.Helpers.prepareFilePath(filenamePin.getValue(i), this.parentPatch);
                (function(i) {
                  xhr[i] = new XMLHttpRequest();
                  //xhr[i].responseType = 'arraybuffer';
                  xhr[i].open("GET", filename[i], true);
                  xhr[i].onreadystatechange = function() {
                     if (xhr[i].readyState === 4) {
                        if (xhr[i].status === 200) {
                          var data = JSON.parse(xhr[i].responseText);
                          Object.keys(data).forEach(function(k) {
                                    SceneElementArray.push(k);
                                });

                            sceneData = new VVVV.Types.Scene(data);
                            SceneOut.setValue(i,sceneData);
                            Success.setValue(i,1);
                            HasLoaded[i]=1;
                            SuccessLoad[i] = 1;
                        } else {
                          console.log("Error loading SceneFile", xhr[i].status);
                          Success.setValue(i,0);
                        }
                     }
                  };
                  xhr[i].send(null);
               })(i);
             }
             else{Success.setValue(i,0);}
             prevFilenames[i] = filenamePin.getValue(i);
        }   //end of inner for loop
        for (var t = 0; t < maxCount; t++){
            //SceneElements.setValue(i,SceneElementArray[t]);
            //Success.setValue(t,SuccessLoad[t] );
        }
        SceneOut.setSliceCount(maxCount);
     }
  }
 VVVV.Nodes.AnimationFile.prototype = new Node();

 /*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE:AnimationBuffer (Game Animation Buffer)
 Author(s): David Gann

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AnimationBuffer = function(id, graph) {
  this.constructor(id, "AnimationBuffer (Game Animation Buffer)", graph);

  this.auto_nil = false;

  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };


  var SceneIn = this.addInputPin("Scene", [], VVVV.PinTypes.Scene);
  var selectorIn = this.addInputPin("Selector", [""], VVVV.PinTypes.String);
  var AnimationIdIn = this.addInputPin("Animation Index", ["0"], VVVV.PinTypes.Value);
  var TimeIn = this.addInputPin("Time", ["0.0"], VVVV.PinTypes.Value);
  var ObjectCountIn = this.addInputPin("Object Count", ["40"], VVVV.PinTypes.Value);

  var m1_out = this.addOutputPin("Buffer Matrix Row 1", [], VVVV.PinTypes.SceneBuffer);
  var m2_out = this.addOutputPin("Buffer Matrix Row 2", [], VVVV.PinTypes.SceneBuffer);
  var m3_out = this.addOutputPin("Buffer Matrix Row 3", [], VVVV.PinTypes.SceneBuffer);
  var m4_out = this.addOutputPin("Buffer Matrix Row 4", [], VVVV.PinTypes.SceneBuffer);
  var colorOut = this.addOutputPin("ColorOut", [], VVVV.PinTypes.SceneBuffer);

  var BinSizeOut = this.addOutputPin("BufferSize", [0], VVVV.PinTypes.Value);
  var offsetOut = this.addOutputPin("offset", [0], VVVV.PinTypes.Value);
  var countOut = this.addOutputPin("count", [1], VVVV.PinTypes.Value);
  var AssetIndex = this.addOutputPin("Asset id", [0], VVVV.PinTypes.Value);
  var BufferId = this.addOutputPin("Buffer id", [0], VVVV.PinTypes.Value);
  var ChangedOut = this.addOutputPin("Buffer Changed", [0], VVVV.PinTypes.Value);

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


  var lastBuffer = [];

  this.evaluate = function() {

    var changed = [];
    //if (SceneIn.pinIsChanged()){
    //  this.initialize();}


    var maxCount = selectorIn.getSliceCount();
    var offsetArray = [];
    var countArray = [];
    var idArray = [];
    var buffer = [];
    var bufferIDArray = [];
    var offsetCountArr = [];
    var m1frame = [];
    var m2frame = [];
    var m3frame = [];
    var m4frame = [];
    var colorframe = [];
    var m1buffer = [];
    var m2buffer = [];
    var m3buffer = [];
    var m4buffer = [];
    var colorbuffer = [];

        for (var i=0; i<maxCount; i++) {
            var selector = selectorIn.getValue(i);
            var offsetKey = "data."+selector+".animation_offset";
            var countKey = "data."+selector+".frame_count";
            var idKey = "data."+selector+".animation_id";
            var m1Key = "data."+selector+".matrix_row1";
            var m2Key = "data."+selector+".matrix_row2";
            var m3Key = "data."+selector+".matrix_row3";
            var m4Key = "data."+selector+".matrix_row4";
            var colorKey = "data."+selector+".color";
            var bufferID = [];
            var scene = SceneIn.getValue(0);
               //  console.log(JSON.stringify(scene));
            if(scene !== undefined){
                var offset = Object.byString(scene, offsetKey);
                var count = Object.byString(scene, countKey);
                var id = Object.byString(scene, idKey);

                var m1 = Object.byString(scene, m1Key);
                var m2 = Object.byString(scene, m2Key);
                var m3 = Object.byString(scene, m3Key);
                var m4 = Object.byString(scene, m4Key);

                var color = Object.byString(scene, colorKey);

                for (var k=0; k<offset.length; k++) {
                                    bufferID[k]=i;
                                 }

                if(m1.length == 0){
                var m1 = [0.0,0.0,0.0];
                var m2 = [0.0,0.0,0.0];
                var m3 = [0.0,0.0,0.0];
                var m4 = [0.0,0.0,0.0];
                offset = 0;
                count = 1;
                id = 0;
                }

            offsetArray.push(offset);
            countArray.push(count);
            idArray.push(id);
            var offsetCount = [].concat.apply([], offset);

            offsetCountArr.push(offsetCount);

            bufferIDArray.push(bufferID);

            var VectorSize=4;
            var AnimationIndex = Math.floor(AnimationIdIn.getValue(i));
            var ObjectCount = ObjectCountIn.getValue(i);
            var Time = TimeIn.getValue(i);
            var index_offset = offset[AnimationIndex] * 4 * ObjectCount  + Math.floor(Time * count[AnimationIndex]) * 4 * ObjectCount ; //LAST FOCUS HERE
            var index_max = index_offset+ 4*ObjectCount;
            //Subbuffer
                for (var j=0; j<4 * ObjectCount; j++) {
                            m1frame.push(m1[j + index_offset]);
                            m2frame.push(m2[j + index_offset]);
                            m3frame.push(m3[j + index_offset]);
                            m4frame.push(m4[j + index_offset]);
                            colorframe.push(color[j%color.length]);
                }
            //buffer array


            }
            else{
             var m1Output = new VVVV.Types.SceneBuffer(4, [0.0,0.0,0.0,0.0], 0, 1, 0);
            var m2Output = new VVVV.Types.SceneBuffer(4, [0.0,0.0,0.0,0.0], 0, 1, 0);
            var m3Output = new VVVV.Types.SceneBuffer(4, [0.0,0.0,0.0,0.0], 0, 1, 0);
            var m4Output = new VVVV.Types.SceneBuffer(4, [0.0,0.0,0.0,0.0], 0, 1, 0);

            var offsetCount = [0.0];
            }
            //conced buffer from buffer array
            var m1bufferConc = [].concat.apply([], m1frame);
            var m2bufferConc = [].concat.apply([], m2frame);
            var m3bufferConc = [].concat.apply([], m3frame);
            var m4bufferConc = [].concat.apply([], m4frame);
            var colorbufferConc = [].concat.apply([], colorframe);


            var m1Output = new VVVV.Types.SceneBuffer(4, m1bufferConc, offset, count, id);
            var m2Output = new VVVV.Types.SceneBuffer(4, m2bufferConc, offset, count, id);
            var m3Output = new VVVV.Types.SceneBuffer(4, m3bufferConc, offset, count, id);
            var m4Output = new VVVV.Types.SceneBuffer(4, m4bufferConc, offset, count, id);
            var colorOutput = new VVVV.Types.SceneBuffer(4, colorbufferConc, offset, count, id);


             m1_out.setValue(0,m1Output);
            m2_out.setValue(0,m2Output);
            m3_out.setValue(0,m3Output);
            m4_out.setValue(0,m4Output);
            colorOut.setValue(0,colorOutput);

            if(buffer[i] !== lastBuffer[i] && lastBuffer[i] !== undefined){
                changed[i]=1;
            }
            if(buffer == lastBuffer[i]){
                changed[i]=0;
            }
            lastBuffer[i] = buffer;

            if(offsetCount.length !== undefined){
            BinSizeOut.setValue(i, offsetCount.length);
            }else{BinSizeOut.setValue(i, 0); }

            ChangedOut.setValue(i, changed[i]);
        }   //end of inner for loop


        var offsetArrayJoin = [].concat.apply([], offsetArray);
        var countArrayJoin = [].concat.apply([], countArray);
        var idArrayJoin = [].concat.apply([], idArray);
        var bufferIDJoin = [].concat.apply([], bufferIDArray);
        var indexCount = offsetArrayJoin.length;



        for (var j=0; j<indexCount; j++) {
            offsetOut.setValue(j, parseFloat(offsetArrayJoin[j]));
            countOut.setValue(j, parseFloat(countArrayJoin[j]));
            AssetIndex.setValue(j, parseFloat(idArrayJoin[j]));
            BufferId.setValue(j, parseFloat(bufferIDJoin[j]));

        }
    }

  }
  VVVV.Nodes.AnimationBuffer.prototype = new Node();

 /*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE:BotanyBuffer (Game Botany Buffer)
 Author(s): David Gann

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.BotanyBuffer = function(id, graph) {
  this.constructor(id, "BotanyBuffer (Game Botany Buffer)", graph);

  this.auto_nil = false;

  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };


  var SceneIn = this.addInputPin("Scene", [], VVVV.PinTypes.Scene);
  var selectorIn = this.addInputPin("Selector", [""], VVVV.PinTypes.String);
  var AnimationIdIn = this.addInputPin("Animation Index", ["0"], VVVV.PinTypes.Value);
  var TimeIn = this.addInputPin("Time", ["0.0"], VVVV.PinTypes.Value);
  var ObjectCountIn = this.addInputPin("Object Count", ["40"], VVVV.PinTypes.Value);

  var m1_out = this.addOutputPin("Buffer Matrix Row 1", [], VVVV.PinTypes.SceneBuffer);
  var m2_out = this.addOutputPin("Buffer Matrix Row 2", [], VVVV.PinTypes.SceneBuffer);
  var m3_out = this.addOutputPin("Buffer Matrix Row 3", [], VVVV.PinTypes.SceneBuffer);
  var m4_out = this.addOutputPin("Buffer Matrix Row 4", [], VVVV.PinTypes.SceneBuffer);
  var colorOut = this.addOutputPin("ColorOut", [], VVVV.PinTypes.SceneBuffer);
  var BillboardOut = this.addOutputPin("BillboardOut", [], VVVV.PinTypes.SceneBuffer);

  var BinSizeOut = this.addOutputPin("BufferSize", [0], VVVV.PinTypes.Value);
  var offsetOut = this.addOutputPin("offset", [0], VVVV.PinTypes.Value);
  var countOut = this.addOutputPin("count", [1], VVVV.PinTypes.Value);
  var AssetIndex = this.addOutputPin("Asset id", [0], VVVV.PinTypes.Value);
  var BufferId = this.addOutputPin("Buffer id", [0], VVVV.PinTypes.Value);
  var ChangedOut = this.addOutputPin("Buffer Changed", [0], VVVV.PinTypes.Value);

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


  var lastBuffer = [];

  this.evaluate = function() {

    var changed = [];
    //if (SceneIn.pinIsChanged()){
    //  this.initialize();}


    var maxCount = selectorIn.getSliceCount();
    var offsetArray = [];
    var countArray = [];
    var idArray = [];
    var buffer = [];
    var bufferIDArray = [];
    var offsetCountArr = [];
    var m1frame = [];
    var m2frame = [];
    var m3frame = [];
    var m4frame = [];
    var colorframe = [];
    var billboardframe = [];


        for (var i=0; i<maxCount; i++) {
            var selector = selectorIn.getValue(i);
            var offsetKey = "data."+selector+".animation_offset";
            var countKey = "data."+selector+".frame_count";
            var idKey = "data."+selector+".animation_id";
            var m1Key = "data."+selector+".matrix_row1";
            var m2Key = "data."+selector+".matrix_row2";
            var m3Key = "data."+selector+".matrix_row3";
            var m4Key = "data."+selector+".matrix_row4";
            var colorKey = "data."+selector+".color";
            var billboardKey = "data."+selector+".billboards";
            var bufferID = [];
            var scene = SceneIn.getValue(0);
            //  console.log(JSON.stringify(scene));
            if(scene !== undefined){
                var offset = Object.byString(scene, offsetKey);
                var count = Object.byString(scene, countKey);
                var id = Object.byString(scene, idKey);

                var m1 = Object.byString(scene, m1Key);
                var m2 = Object.byString(scene, m2Key);
                var m3 = Object.byString(scene, m3Key);
                var m4 = Object.byString(scene, m4Key);

                var color = Object.byString(scene, colorKey);

                var billboard = Object.byString(scene, billboardKey);

                for (var k=0; k<offset.length; k++) {
                                    bufferID[k]=i;
                                 }

                if(m1.length == 0){
                var m1 = [0.0,0.0,0.0];
                var m2 = [0.0,0.0,0.0];
                var m3 = [0.0,0.0,0.0];
                var m4 = [0.0,0.0,0.0];
                offset = 0;
                count = 1;
                id = 0;
                }

            offsetArray.push(offset);
            countArray.push(count);
            idArray.push(id);
            var offsetCount = [].concat.apply([], offset);

            offsetCountArr.push(offsetCount);

            bufferIDArray.push(bufferID);

            var VectorSize=4;
            var AnimationIndex = Math.floor(AnimationIdIn.getValue(i));
            var ObjectCount = ObjectCountIn.getValue(i);
            var Time = TimeIn.getValue(i);
            var index_offset = offset[AnimationIndex] * 4 * ObjectCount  + Math.floor(Time * count[AnimationIndex]) * 4 * ObjectCount ; //LAST FOCUS HERE
            var index_max = index_offset+ 4*ObjectCount;
            //Subbuffer
                for (var j=0; j<4 * ObjectCount; j++) {
                            m1frame.push(m1[j + index_offset]);
                            m2frame.push(m2[j + index_offset]);
                            m3frame.push(m3[j + index_offset]);
                            m4frame.push(m4[j + index_offset]);
                            colorframe.push(color[j%color.length]);

                }

                for (var j=0; j< billboard.length; j++) {
                            billboardframe.push(billboard[j]);
                }
            //buffer array


            }
            else{
             var m1Output = new VVVV.Types.SceneBuffer(4, [0.0,0.0,0.0,0.0], 0, 1, 0);
            var m2Output = new VVVV.Types.SceneBuffer(4, [0.0,0.0,0.0,0.0], 0, 1, 0);
            var m3Output = new VVVV.Types.SceneBuffer(4, [0.0,0.0,0.0,0.0], 0, 1, 0);
            var m4Output = new VVVV.Types.SceneBuffer(4, [0.0,0.0,0.0,0.0], 0, 1, 0);

            var offsetCount = [0.0];
            }
            //conced buffer from buffer array


            if(buffer[i] !== lastBuffer[i] && lastBuffer[i] !== undefined){
                changed[i]=1;
            }
            if(buffer == lastBuffer[i]){
                changed[i]=0;
            }
            lastBuffer[i] = buffer;

            if(offsetCount.length !== undefined){
            BinSizeOut.setValue(i, offsetCount.length);
            }else{BinSizeOut.setValue(i, 0); }

            ChangedOut.setValue(i, changed[i]);
        }   //end of inner for loop

        var m1bufferConc = [].concat.apply([], m1frame);
        var m2bufferConc = [].concat.apply([], m2frame);
        var m3bufferConc = [].concat.apply([], m3frame);
        var m4bufferConc = [].concat.apply([], m4frame);
        var colorbufferConc = [].concat.apply([], colorframe);
        var billboardConc = [].concat.apply([], billboardframe);


        var m1Output = new VVVV.Types.SceneBuffer(4, m1bufferConc, offset, count, id);
        var m2Output = new VVVV.Types.SceneBuffer(4, m2bufferConc, offset, count, id);
        var m3Output = new VVVV.Types.SceneBuffer(4, m3bufferConc, offset, count, id);
        var m4Output = new VVVV.Types.SceneBuffer(4, m4bufferConc, offset, count, id);
        var colorOutput = new VVVV.Types.SceneBuffer(4, colorbufferConc, offset, count, id);
        var billboardOutput = new VVVV.Types.SceneBuffer(3, billboardConc, offset, count, id);


         m1_out.setValue(0,m1Output);
        m2_out.setValue(0,m2Output);
        m3_out.setValue(0,m3Output);
        m4_out.setValue(0,m4Output);
        colorOut.setValue(0,colorOutput);
        BillboardOut.setValue(0,billboardOutput);

        var offsetArrayJoin = [].concat.apply([], offsetArray);
        var countArrayJoin = [].concat.apply([], countArray);
        var idArrayJoin = [].concat.apply([], idArray);
        var bufferIDJoin = [].concat.apply([], bufferIDArray);
        var indexCount = offsetArrayJoin.length;



        for (var j=0; j<indexCount; j++) {
            offsetOut.setValue(j, parseFloat(offsetArrayJoin[j]));
            countOut.setValue(j, parseFloat(countArrayJoin[j]));
            AssetIndex.setValue(j, parseFloat(idArrayJoin[j]));
            BufferId.setValue(j, parseFloat(bufferIDJoin[j]));

        }
    }

  }
  VVVV.Nodes.BotanyBuffer.prototype = new Node();


 /*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: ElementBuffer (Game Scene Buffer)
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

  var BufferOut = this.addOutputPin("Buffer", [], VVVV.PinTypes.SceneBuffer);
  var BinSizeOut = this.addOutputPin("BufferSize", [0], VVVV.PinTypes.Value);
  var offsetOut = this.addOutputPin("offset", [0], VVVV.PinTypes.Value);
  var countOut = this.addOutputPin("count", [1], VVVV.PinTypes.Value);
  var AssetIndex = this.addOutputPin("Asset id", [0], VVVV.PinTypes.Value);
  var BufferId = this.addOutputPin("Buffer id", [0], VVVV.PinTypes.Value);
  var ChangedOut = this.addOutputPin("Buffer Changed", [0], VVVV.PinTypes.Value);

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


  var lastBuffer = [];

  this.evaluate = function() {

    var changed = [];
    //if (SceneIn.pinIsChanged()){
    //  this.initialize();}
    var selector = selectorIn.getValue(0);
    var offsetKey = "data."+selector+".offset";
    var countKey = "data."+selector+".count";
    var idKey = "data."+selector+".id";
    var bufferKey = "data."+selector+".buffer";

    var maxCount = SceneIn.getSliceCount();
    var offsetArray = [];
    var countArray = [];
    var idArray = [];
    var buffer = [];
    var bufferIDArray = [];
    var offsetCountArr = [];
        for (var i=0; i<maxCount; i++) {
            var bufferID = [];
            var scene = SceneIn.getValue(i);
            if(scene !== undefined){
                var offset = Object.byString(scene, offsetKey);
                var count = Object.byString(scene, countKey);
                var id = Object.byString(scene, idKey);

                var buffer = Object.byString(scene, bufferKey);

                for (var k=0; k<offset.length; k++) {
                                    bufferID[k]=i;
                                 }

                if(buffer.length == 0){
                var buffer = [0.0,0.0,0.0];
                }
            }
            offsetArray.push(offset);
            countArray.push(count);
            idArray.push(id);
            var offsetCount = [].concat.apply([], offset);

            offsetCountArr.push(offsetCount);

            bufferIDArray.push(bufferID);
            var VectorSize=3;
            var bufferOut = new VVVV.Types.SceneBuffer(VectorSize, buffer, offset, count, id);
            BufferOut.setValue(i,bufferOut);
            if(buffer[i] !== lastBuffer[i] && lastBuffer[i] !== undefined){
                changed[i]=1;
            }
            if(buffer == lastBuffer[i]){
                changed[i]=0;
            }
            lastBuffer[i] = buffer;

            if(offsetCount.length !== undefined){
            BinSizeOut.setValue(i, offsetCount.length);
            }else{BinSizeOut.setValue(i, 0); }

            ChangedOut.setValue(i, changed[i]);
        }   //end of inner for loop


        var offsetArrayJoin = [].concat.apply([], offsetArray);
        var countArrayJoin = [].concat.apply([], countArray);
        var idArrayJoin = [].concat.apply([], idArray);
        var bufferIDJoin = [].concat.apply([], bufferIDArray);
        var indexCount = offsetArrayJoin.length;



        for (var j=0; j<indexCount; j++) {
            offsetOut.setValue(j, parseFloat(offsetArrayJoin[j]));
            countOut.setValue(j, parseFloat(countArrayJoin[j]));
            AssetIndex.setValue(j, parseFloat(idArrayJoin[j]));
            BufferId.setValue(j, parseFloat(bufferIDJoin[j]));

        }
    }

  }
  VVVV.Nodes.ElementBuffer.prototype = new Node();


  /*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: TranslateBuffer (Game Buffer)
 Author(s): David Gann

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.TransformBuffer = function(id, graph) {
  this.constructor(id, "TransformBuffer (Game Buffer)", graph);

  this.auto_nil = false;

  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };


  var BufferIn = this.addInputPin("Buffer", [], VVVV.PinTypes.SceneBuffer);
  var OffsetIn = this.addInputPin("Translate XYZ", [0.0,0.0,0.0], VVVV.PinTypes.Value);
  var ScaleIn = this.addInputPin("Scale XYZ", [1.0], VVVV.PinTypes.Value);
  var MergeIn = this.addInputPin("Merge", [0.0], VVVV.PinTypes.Value);
  var ApplyIn = this.addInputPin("Apply", [0.0], VVVV.PinTypes.Value);

  var BufferOut = this.addOutputPin("Buffer", [], VVVV.PinTypes.SceneBuffer);


  this.evaluate = function() {

//    if (OffsetIn.pinIsChanged()){
//      this.initialize();}
    if(ApplyIn.getValue(0) == 1 | BufferIn.pinIsChanged() | OffsetIn.pinIsChanged() | ScaleIn.pinIsChanged()){
    var maxCount = Math.max(BufferIn.getSliceCount(), OffsetIn.getSliceCount()/3);
        var mergeBuffer = [];
        for (var i=0; i<maxCount; i++) {
            var Buffer = BufferIn.getValue(i);
                    var Offset = OffsetIn.getValue(i,3);
                    var Scale = ScaleIn.getValue(i,3);
                if(MergeIn.getValue(0) == 0) {
                    var newBuffer = [];
                    if(Buffer.data.length !== undefined | Buffer.data.length !== 0){
                        for (var j=0; j<Buffer.data.length; j++) {
                            var Product = Buffer.data[j]  * Scale[j%Scale.length];
                            Product += Offset[j%Offset.length];
                            newBuffer[j] = Product;
                        }
                    var bufferOut = new VVVV.Types.SceneBuffer(Buffer.VectorSize, newBuffer, Buffer.offset, Buffer.count, Buffer.id);
                    BufferOut.setValue(i, bufferOut);
                    }
                }
                else{       //Merging all Buffers
                    console.log("entering merge");
                    if(Buffer.data.length !== undefined | Buffer.data.length !== 0){
                        for (var j=0; j<Buffer.data.length; j++) {
                            var Product = Buffer.data[j]  * Scale[j%Scale.length];
                            Product += Offset[j%Offset.length];
                            mergeBuffer.push(Product);
                        }

                    }
                } //end of else
            }//end of inner for loop
            if(MergeIn.getValue(0) !== 0) {
                var bufferOut = new VVVV.Types.SceneBuffer(Buffer.VectorSize, mergeBuffer, 0, mergeBuffer.length, 0);
                BufferOut.setValue(0, bufferOut);
                BufferOut.setSliceCount(1);
            }
        }
     }
  }
  VVVV.Nodes.TransformBuffer.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: MergeBuffers (Game Buffer)
 Author(s): David Gann

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.MergeBuffers = function(id, graph) {
  this.constructor(id, "MergeBuffers (Game Buffer)", graph);

  this.auto_nil = false;

  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };


  var BufferIn = this.addInputPin("Buffer", [], VVVV.PinTypes.SceneBuffer);
  var IdIn = this.addInputPin("Id", [], VVVV.PinTypes.Value);
  var VectorSize = this.addInputPin('VectorSize', [3], VVVV.PinTypes.Value);
  var ApplyIn = this.addInputPin("Apply", [], VVVV.PinTypes.Value);

  var BufferOut = this.addOutputPin("Buffer", [], VVVV.PinTypes.SceneBuffer);
  var CountOut = this.addOutputPin("Count", [], VVVV.PinTypes.Value);

  var BufferOutput = [];
  var OutputBuffer = [];
  this.evaluate = function() {

//    if (OffsetIn.pinIsChanged()){
//      this.initialize();}
    //if(BufferIn.pinIsChanged() || ApplyIn.getValue(0) == 1 ){
    var maxCount = BufferIn.getSliceCount();
    var IdInCount = IdIn.getSliceCount();
        for (var j=0; j<IdInCount; j++) {
            var id = IdIn.getValue(j);
            BufferOutput[j] = [];
            for (var i=0; i<maxCount; i++) {
                    var Buffer = BufferIn.getValue(i);
                    var index = Buffer.id.indexOf(id);
                    if(index !== -1){
                        var offset = Buffer.offset[index];
                        var count = Buffer.count[index];
                        var vecSize = Buffer.VectorSize;
                        var bufferStream = Buffer.data.slice(offset*vecSize, offset*vecSize+count*vecSize);
                        BufferOutput[j].push(bufferStream);
                        }
                    }
                    var mergedBuffer = [].concat.apply([], BufferOutput[j]);
                    OutputBuffer[j] = new VVVV.Types.SceneBuffer(VectorSize.getValue(0), mergedBuffer, 0, mergedBuffer.length, 0);
                    BufferOut.setValue(j, OutputBuffer[j]);
                    CountOut.setValue(j, mergedBuffer.length / VectorSize.getValue(0));
                }
                BufferOut.setSliceCount(IdInCount);
                console.log("BufferOutput" + BufferOutput[0]);
            //}//end of inner for loop
        }
  }
  VVVV.Nodes.MergeBuffers.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: GetMatrixBuffers (Transform Buffers 4x4)
 Author(s): David Gann
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GetMatrixBuffers = function(id, graph) {
  this.constructor(id, "GetMatrixBuffers (Transform Buffer)", graph);

  this.meta = {
    authors: ['David Gann'],
    original_authors: ['David Gann'],
    credits: [],
    compatibility_issues: []
  };



  var trIn = this.addInputPin("Transform In", [], VVVV.PinTypes.Transform);

  var BufferOut1 = this.addOutputPin("Buffer1", [], VVVV.PinTypes.SceneBuffer);
  var BufferOut2 = this.addOutputPin("Buffer2", [], VVVV.PinTypes.SceneBuffer);
  var BufferOut3 = this.addOutputPin("Buffer3", [], VVVV.PinTypes.SceneBuffer);
  var BufferOut4 = this.addOutputPin("Buffer4", [], VVVV.PinTypes.SceneBuffer);

  var transforms = [];
  var matrix_array = [];



  this.evaluate = function() {

    var maxSize = this.getMaxInputSliceCount();

    if (maxSize>transforms.length) {
      var i=transforms.length;
      while (i++<maxSize) {
        transforms.push(mat4.create());
      }
    }
    else if (maxSize<transforms.length) {
      transforms.length = maxSize;
    }

  var MatBuffer1 = [];
  var MatBuffer2 = [];
  var MatBuffer3 = [];
  var MatBuffer4 = [];
    for (var i=0; i<maxSize; i++) {


      var matrix = trIn.getValue(i);


      for (var j=0; j<4; j++) {
         MatBuffer1.push(matrix[j]);
         MatBuffer2.push(matrix[j+4]);
         MatBuffer3.push(matrix[j+8]);
         MatBuffer4.push(matrix[j+12]);
      }

    }
    var matrix_values = [].concat.apply([], matrix_array);
    var OutputBuffer1 = new VVVV.Types.SceneBuffer(4, MatBuffer1, 0, MatBuffer1.length, 0);
    var OutputBuffer2 = new VVVV.Types.SceneBuffer(4, MatBuffer2, 0, MatBuffer2.length, 0);
    var OutputBuffer3 = new VVVV.Types.SceneBuffer(4, MatBuffer3, 0, MatBuffer3.length, 0);
    var OutputBuffer4 = new VVVV.Types.SceneBuffer(4, MatBuffer4, 0, MatBuffer4.length, 0);
    BufferOut1.setValue(0, OutputBuffer1);
    BufferOut2.setValue(0, OutputBuffer2);
    BufferOut3.setValue(0, OutputBuffer3);
    BufferOut4.setValue(0, OutputBuffer4);
  }

}
VVVV.Nodes.GetMatrixBuffers.prototype = new Node();


  /*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Buffer (Game Buffer Value)
 Author(s): David Gann

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Buffer = function(id, graph) {
  this.constructor(id, "Buffer (Game Buffer Value)", graph);

  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };


  var BufferIn = this.addInputPin('Buffer', [0], VVVV.PinTypes.Value);
  var ApplyIn = this.addInputPin("Apply", [0.0], VVVV.PinTypes.Value);
  var VectorSize = this.addInputPin('VectorSize', [3], VVVV.PinTypes.Value);

  var BufferOut = this.addOutputPin("Buffer", [], VVVV.PinTypes.SceneBuffer);

  var oldBuffer = [];
  var Buffer = [];
  this.evaluate = function() {
        var MaxCount = BufferIn.getSliceCount();
        if(ApplyIn.getValue(0)==1){
              for(var i = 0; i < MaxCount; i++) {
              Buffer[i] = BufferIn.getValue(i);
              }
        oldBuffer = Buffer;
        var OutputBuffer = new VVVV.Types.SceneBuffer(VectorSize.getValue(0), Buffer, 0, Buffer.length, -1);
        BufferOut.setValue(0, OutputBuffer);
        }   //end of inner for loop
    }
  }
  VVVV.Nodes.Buffer.prototype = new Node();

    /*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: GetBuffer (Game Buffer)
 Author(s): David Gann

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GetBuffer = function(id, graph) {
  this.constructor(id, "GetBuffer (Game Buffer)", graph);

  this.auto_nil = false;

  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };


  var BufferIn = this.addInputPin("Buffer", [], VVVV.PinTypes.SceneBuffer);
  var IndexIn = this.addInputPin("Index", [0.0], VVVV.PinTypes.Value);

  var ApplyIn = this.addInputPin("Apply", [0.0], VVVV.PinTypes.Value);

  var BufferOut = this.addOutputPin("BufferOut", [0.0], VVVV.PinTypes.Value);

  this.evaluate = function() {

//    if (OffsetIn.pinIsChanged()){
//      this.initialize();}
    if(ApplyIn.getValue(0) == 1 | IndexIn.pinIsChanged()){

                var Buffer = BufferIn.getValue(IndexIn.getValue(0));
                var length = Buffer.data.length;
                if(length !== undefined | length !== 0){
                    BufferOut.setSliceCount(length);
                    for (var i=0; i<Buffer.data.length; i++) {
                        BufferOut.setValue(i,Buffer.data[i]);
                    }
                }
        }
     }
  }
  VVVV.Nodes.GetBuffer.prototype = new Node();



/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: TerrainPicking (Game Collision)
 Author(s): 'David Gann'
 Original Node Author(s): '000.graphics'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

//Loads files that contain the heightmap as binary (0-255). Performs UV Collision Detection for 3d Points Input, using only the x and z value of the input.
//Y of Heightmap at Input X Z is output and normal of coresponding polygon.
//

VVVV.Nodes.TerrainPicking = function(id, graph) {
  this.constructor(id, "TerrainPicking (Game Collision)", graph);

  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = true;

  // input pins
   var RayOrigin = this.addInputPin('RayOrigin', [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var RayDirection = this.addInputPin('RayDirection', [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var BufferIn = this.addInputPin("Buffer", [], VVVV.PinTypes.SceneBuffer);
   var GridIndices = this.addInputPin('GridIndices', [0.0], VVVV.PinTypes.Value);
   var GridPositions = this.addInputPin('GridPositions', [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var grid_scale = this.addInputPin('GridScaleXY', [16.0,16.0], VVVV.PinTypes.Value);
   var GridRes = this.addInputPin('GridResolutionXY', [128.0,128.0], VVVV.PinTypes.Value);
   var HeightMapRes = this.addInputPin('HeigthMapRes', [128.0,128.0], VVVV.PinTypes.Value);
   var WorldDimension = this.addInputPin('WorldDimensionXY', [1000.0,1000.0], VVVV.PinTypes.Value);
   var HFactor = this.addInputPin('HeigthFactor', [0.25], VVVV.PinTypes.Value);

  // output pins
  var CollisionOut = this.addOutputPin('CollisionOut', [0.0,0.0,0.0], VVVV.PinTypes.Value);
  var CollissionY = this.addOutputPin('CollisionY', [0.0], VVVV.PinTypes.Value);
  var CollisionNormal = this.addOutputPin('CollisionNormal', [0.0,1.0,0.0], VVVV.PinTypes.Value);

  var Buffer = []; // input buffers
   var multiarray = [];

   var pA = [];
   var pB = [];
   var pC = [];

   var TileIndices = [];

    ///ray-triangle intersection from https://github.com/substack/ray-triangle-intersection/blob/master/index.js
    function cross(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2],
        bx = b[0], by = b[1], bz = b[2]

    out[0] = ay * bz - az * by
    out[1] = az * bx - ax * bz
    out[2] = ax * by - ay * bx
    return out
    }

    function dot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
    }

    function sub(out, a, b) {
        out[0] = a[0] - b[0]
        out[1] = a[1] - b[1]
        out[2] = a[2] - b[2]
        return out
    }

    var EPSILON = 0.000001;
    var edge1 = [0,0,0];
    var edge2 = [0,0,0];
    var tvec = [0,0,0];
    var pvec = [0,0,0];
    var qvec = [0,0,0];
    var out = [0,0,0];

   function intersectTriangle (out, pt, dir, tri) {
        sub(edge1, tri[1], tri[0]);
        sub(edge2, tri[2], tri[0]);
        cross(pvec, dir, edge2);
        var det = dot(edge1, pvec);
        //if (det < EPSILON) return null;
        sub(tvec, pt, tri[0]);
        var u = dot(tvec, pvec);
        //if (u < 0 || u > det) return null;
        cross(qvec, tvec, edge1);
        var v = dot(dir, qvec);
        //if (v < 0 || u + v > det) return null;

        var t = dot(edge2, qvec) / det;
        out[0] = pt[0] + t * dir[0];
        out[1] = pt[1] + t * dir[1];
        out[2] = pt[2] + t * dir[2];
        return out;
    }
    //unused but keep for later use
   function raytraceGrid(x0, x1, y0, y1)
{
    var dx = Math.abs(x1 - x0);
    var dy = Math.abs(y1 - y0);

    var x = Math.floor(x0);
    var y = Math.floor(y0);

    var dt_dx = 1.0 / dx;
    var dt_dy = 1.0 / dy;

    var t = 0;

    var n = 1;
    var x_inc, y_inc;
    var t_next_vertical, t_next_horizontal;

    if (dx == 0)
    {
        x_inc = 0;
        t_next_horizontal = dt_dx; // infinity
    }
    else if (x1 > x0)
    {
        x_inc = 1;
        n += Math.floor(x1) - x;
        t_next_horizontal = (Math.floor(x0) + 1 - x0) * dt_dx;
    }
    else
    {
        x_inc = -1;
        n += x - Math.floor(x1);
        t_next_horizontal = (x0 - Math.floor(x0)) * dt_dx;
    }

    if (dy == 0)
    {
        y_inc = 0;
        t_next_vertical = dt_dy; // infinity
    }
    else if (y1 > y0)
    {
        y_inc = 1;
        n += Math.floor(y1) - y;
        t_next_vertical = (Math.floor(y0) + 1 - y0) * dt_dy;
    }
    else
    {
        y_inc = -1;
        n += y - Math.floor(y1);
        t_next_vertical = (y0 - Math.floor(y0)) * dt_dy;
    }
    var Indices = [];
    var j = 0;
    for (var i = n; i > 0; --i)
    {
        Indices.push(x);
        Indices.push(y);   //visit(x, y);

        if (t_next_vertical < t_next_horizontal)
        {
            y += y_inc;
            t = t_next_vertical;
            t_next_vertical += dt_dy;
        }
        else
        {
            x += x_inc;
            t = t_next_horizontal;
            t_next_horizontal += dt_dx;
        }
    }
    return Indices;
}

  this.evaluate = function() {

    //console.log(maxCount);


    var grid_scaleX = grid_scale.getValue(0);
    var grid_scaleZ = grid_scale.getValue(1);


    //Array Loop
    for (var i=0; i<BufferIn.getSliceCount(); i++) {
        Buffer[i] = BufferIn.getValue(i);
        //console.log(JSON.stringify(Buffer[i].data));
        var bufferlength = Buffer[i].data.length;
        TileIndices[i] = GridIndices.getValue(i);
            if(bufferlength !== undefined | bufferlength !== 0){
                      multiarray[i] = Buffer[i].data;
            }else{multiarray[i] = 0.0;}
    }

    var WorldDimX = WorldDimension.getValue(0)  ;
    var WorldDimZ = WorldDimension.getValue(1)  ;
    var WorldResX = GridRes.getValue(0);
    var WorldResZ = GridRes.getValue(1);
    var ColumnCount = HeightMapRes.getValue(0);
    var RowCount = HeightMapRes.getValue(1);
    var Factor = HFactor.getValue(0);
    var maxCount = RayOrigin.getSliceCount()/3;
    var y_dif = 0.0; //difference between heigthmap y and current ray step



      /////////////////////////////////////////////////////////////////Position Loop
    var  previousPoint = [0.0,0.0,0.0];
    var previousPointX = 0.0;
    var previousPointZ  = 0.0;
    var Point = [0.0,0.0,0.0];
    var count = 0.0;
    for (var i=0; i<maxCount; i++) {
        var Origin = RayOrigin.getValue(i, 3);
        var Dir = RayDirection.getValue(i, 3);
        var t = 0;
        var loop = true;
        while (t < 3000 && loop == true){
            var RayPosX = Origin[0] + Dir[0] * t;
            var RayPosY = Origin[1] + Dir[1] * t;
            var RayPosZ = Origin[2] + Dir[2] * t;
            // normalized world position and index
             CollissionY.setValue(t*3, RayPosX);CollissionY.setValue(t*3+1, RayPosY);CollissionY.setValue(t*3+2, RayPosZ);
            var posX = (RayPosX+WorldDimX/2.0) / WorldDimX;
            var posZ = (RayPosZ+WorldDimZ/2.0) / WorldDimZ;
            var indexX = Math.floor(WorldResX*posX + 0.5);
            var indexZ = Math.floor(WorldResZ* posZ + 0.5);

            //World Grid Index
            var IndexInGrid = WorldResZ*indexZ+indexX;
            //normalized Position and Index in Subgrid (current heigthmap tile)
            var pTnX = (posX - indexX*(1/WorldResX))*WorldResX+0.5;
            var pTnZ = (posZ - indexZ*(1/WorldResZ))*WorldResZ+0.5;
            //Quad Index
            var SubIndexX = Math.floor((ColumnCount-1)*pTnX); //got rid of +0.5
            var SubIndexZ = Math.floor((RowCount-1)-(RowCount-1)*pTnZ);  //var SubIndexZ = Math.floor((RowCount-1)-(RowCount-1)*pTnZ);
            //Calculate on which of the 2 Polygon Triangles on the Quad is the Position

            var QuadScaleX = 1/(ColumnCount-1);
            var QuadScaleZ = 1/(RowCount-1);
            var QuadCenterX = SubIndexX * QuadScaleX + QuadScaleX/2;
            var QuadCenterZ = SubIndexZ * QuadScaleZ + QuadScaleZ/2;
            //bottom left and top right vertice to calculate m of linear equation

            var multiarrayIndex = TileIndices.indexOf(IndexInGrid);

            if(multiarrayIndex != -1){
                //console.log(multiarrayIndex);
            var x1 = (QuadCenterX - QuadScaleX/2) * grid_scaleX - grid_scaleX/2 + GridPositions.getValue(multiarrayIndex*3);
            var z1 = - (QuadCenterZ + QuadScaleZ/2) * grid_scaleZ +grid_scaleZ/2 + GridPositions.getValue(multiarrayIndex*3+2);
            var x2 = (QuadCenterX + QuadScaleX/2) * grid_scaleX - grid_scaleX/2 + GridPositions.getValue(multiarrayIndex*3);
            var z2 = - (QuadCenterZ - QuadScaleZ/2) * grid_scaleZ +grid_scaleZ/2 + GridPositions.getValue(multiarrayIndex*3+2);

            //calculate z on the diagonal that separates the two triangles in the quad
            // loosly leaning on https://lwjglgamedev.gitbooks.io/3d-game-development-with-lwjgl/content/chapter15/chapter15.html

            var z_diagonal = ((z1 - z2) / (x1 - x2)) * (RayPosX - x1) + z1;

            // Vertex Indices Calculated from Quad Indices - Orderer is top left, top right, bottom left, bottom right
            var VertexIndices = [SubIndexX    + SubIndexZ*RowCount,
                                 SubIndexX +1 + SubIndexZ*RowCount,
                                 SubIndexX    + (SubIndexZ+1)*RowCount,
                                 SubIndexX +1 + (SubIndexZ+1)*RowCount];
                             ////- gives better result but produce error on edges


            var HeigthFactor = Factor;


                //Scale it back from normalization into Tile Grid Space and get the Height Values from Byte Array
                if(z_diagonal >= RayPosZ) {

                //vertex bottom right
                pA[0]= (QuadCenterX - QuadScaleX/2) * grid_scaleX - grid_scaleX/2 + GridPositions.getValue(multiarrayIndex*3);
                pA[1]= multiarray[multiarrayIndex][VertexIndices[2]] * HeigthFactor;
                pA[2]= - (QuadCenterZ + QuadScaleZ/2) * grid_scaleZ +grid_scaleZ/2 + GridPositions.getValue(multiarrayIndex*3+2);
                //vertex top left
                pB[0]= (QuadCenterX + QuadScaleX/2) * grid_scaleX - grid_scaleX/2 + GridPositions.getValue(multiarrayIndex*3);
                pB[1]= multiarray[multiarrayIndex][VertexIndices[1]] * HeigthFactor;
                pB[2]= - (QuadCenterZ - QuadScaleZ/2) * grid_scaleZ +grid_scaleZ/2 + GridPositions.getValue(multiarrayIndex*3+2);
                //vertex bottom right
                pC[0]= (QuadCenterX + QuadScaleX/2) * grid_scaleX - grid_scaleX/2 + GridPositions.getValue(multiarrayIndex*3);
                pC[1]= multiarray[multiarrayIndex][VertexIndices[3]] * HeigthFactor;
                pC[2]= - (QuadCenterZ + QuadScaleZ/2) * grid_scaleZ +grid_scaleZ/2 + GridPositions.getValue(multiarrayIndex*3+2);
                var status = true;
                }
                if(z_diagonal < RayPosZ){

                //vertex bottom left
                pA[0]= (QuadCenterX - QuadScaleX/2) * grid_scaleX - grid_scaleX/2 + GridPositions.getValue(multiarrayIndex*3);
                pA[1]= multiarray[multiarrayIndex][VertexIndices[2]] * HeigthFactor;
                pA[2]= - (QuadCenterZ + QuadScaleZ/2) * grid_scaleZ +grid_scaleZ/2 + GridPositions.getValue(multiarrayIndex*3+2);
                //vertex top right
                pB[0]= (QuadCenterX + QuadScaleX/2) * grid_scaleX - grid_scaleX/2 + GridPositions.getValue(multiarrayIndex*3);
                pB[1]= multiarray[multiarrayIndex][VertexIndices[1]] * HeigthFactor;
                pB[2]= - (QuadCenterZ - QuadScaleZ/2) * grid_scaleZ +grid_scaleZ/2 + GridPositions.getValue(multiarrayIndex*3+2);
                //vertex bottom right
                pC[0]= (QuadCenterX - QuadScaleX/2) * grid_scaleX - grid_scaleX/2 + GridPositions.getValue(multiarrayIndex*3);
                pC[1]= multiarray[multiarrayIndex][VertexIndices[0]] * HeigthFactor;
                pC[2]= - (QuadCenterZ - QuadScaleZ/2) * grid_scaleZ +grid_scaleZ/2 + GridPositions.getValue(multiarrayIndex*3+2);
                var status = false;
                }

            // Plane equation ax+by+cz+d=0
           // var pt = [Pos.getValue(i*3), 0.0, Pos.getValue(i*3+2)];
            var pt = [pTnX* grid_scaleX - grid_scaleX/2 + QuadScaleX + GridPositions.getValue(multiarrayIndex*3),
                        0.0,
                     pTnZ* grid_scaleZ -grid_scaleZ/2 + QuadScaleZ + GridPositions.getValue(multiarrayIndex*3+2)];
            var dir = [0.0,1000.0,0.0];
            var tri = [pA,pB,pC];
            //var out = [0,0,0];
            Point = intersectTriangle(out, pt, dir, tri);
            var y_dif =  RayPosY - Point[1];

            if (y_dif< 0.0){
                    CollisionOut.setValue(i*3,Point[0]);
                    CollisionOut.setValue(i*3+1,Point[1]);
                    CollisionOut.setValue(i*3+2,Point[2]);
                    loop = false;
            }
            //console.log(' pt ' + pt + ' dir ' + dir + ' tri  ' + tri + ' out  ' + out);
            if(Point == null) { Point = [-1,-1,-1];}
             }
        if (y_dif< 41){
        t = t+1; }else{t = t + 40;}
        previousPoint = Point;
        previousPointX = Point[0];
        previousPointZ = Point[2];
        }
    }
        //CollissionY.setSliceCount((t+1)*3);

    ////////////////////////////////////////////////////////////

    }

}
VVVV.Nodes.TerrainPicking.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: TerrainCollision (game)
 Author(s): 'David Gann'
 Original Node Author(s): '000.graphics'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

//Loads files that contain the heightmap as binary (0-255). Performs UV Collision Detection for 3d Points Input, using only the x and z value of the input.
//Y of Heightmap at Input X Z is output and normal of coresponding polygon.
//

VVVV.Nodes.TerrainCollisionGame = function(id, graph) {
  this.constructor(id, "TerrainCollision (game buffer)", graph);

  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = true;

  // input pins
   var Pos = this.addInputPin('PositionXYZ', [0.0,0.0,0.0], VVVV.PinTypes.Value);

   var GridPositions = this.addInputPin('GridPositions', [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var GridIndices = this.addInputPin('GridIndices', [0.0], VVVV.PinTypes.Value);
   var BufferIn = this.addInputPin("Buffer", [], VVVV.PinTypes.SceneBuffer);
   var grid_scale = this.addInputPin('GridScaleXY', [16.0,16.0], VVVV.PinTypes.Value);
   var GridRes = this.addInputPin('GridResolutionXY', [128.0,128.0], VVVV.PinTypes.Value);
   var HeightMapRes = this.addInputPin('HeigthMapRes', [128.0,128.0], VVVV.PinTypes.Value);
   var WorldDimension = this.addInputPin('WorldDimensionXY', [1000.0,1000.0], VVVV.PinTypes.Value);
   var HFactor = this.addInputPin('HeigthFactor', [0.25], VVVV.PinTypes.Value);
  // output pins
  var VertexPos = this.addOutputPin('VertexPos3D', [0.0,0.0,0.0], VVVV.PinTypes.Value);
  var CollissionY = this.addOutputPin('CollisionY', [0.0], VVVV.PinTypes.Value);
  var CollisionNormal = this.addOutputPin('CollisionNormal', [0.0,1.0,0.0], VVVV.PinTypes.Value);

  var HasLoaded = [0,0,0,0,0,0,0,0,0];
   var xhr = [];
   var multiarray = [];
   var Buffer = [];
   var pA = [];
   var pB = [];
   var pC = [];

   var TileIndices = [];

    ///ray-triangle intersection from https://github.com/substack/ray-triangle-intersection/blob/master/index.js
    function cross(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2],
        bx = b[0], by = b[1], bz = b[2]

    out[0] = ay * bz - az * by
    out[1] = az * bx - ax * bz
    out[2] = ax * by - ay * bx
    return out
    }

    function dot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
    }

    function sub(out, a, b) {
        out[0] = a[0] - b[0]
        out[1] = a[1] - b[1]
        out[2] = a[2] - b[2]
        return out
    }

    var EPSILON = 0.000001;
    var edge1 = [0,0,0];
    var edge2 = [0,0,0];
    var tvec = [0,0,0];
    var pvec = [0,0,0];
    var qvec = [0,0,0];
    var out = [0,0,0];

   function intersectTriangle (out, pt, dir, tri) {
        sub(edge1, tri[1], tri[0]);
        sub(edge2, tri[2], tri[0]);
        cross(pvec, dir, edge2);
        var det = dot(edge1, pvec);
        //if (det < EPSILON) return null;
        sub(tvec, pt, tri[0]);
        var u = dot(tvec, pvec);
        //if (u < 0 || u > det) return null;
        cross(qvec, tvec, edge1);
        var v = dot(dir, qvec);
        //if (v < 0 || u + v > det) return null;

        var t = dot(edge2, qvec) / det;
        out[0] = pt[0] + t * dir[0];
        out[1] = pt[1] + t * dir[1];
        out[2] = pt[2] + t * dir[2];
        return out;
    }

  this.evaluate = function() {

    //console.log(maxCount);


    var grid_scaleX = grid_scale.getValue(0);
    var grid_scaleZ = grid_scale.getValue(1);


    //Array Loop
        for (var i=0; i<BufferIn.getSliceCount(); i++) {
        Buffer[i] = BufferIn.getValue(i);
        //console.log(JSON.stringify(Buffer[i].data));
        var bufferlength = Buffer[i].data.length;
        TileIndices[i] = GridIndices.getValue(i);
            if(bufferlength !== undefined | bufferlength !== 0){
                      multiarray[i] = Buffer[i].data;
            }else{multiarray[i] = 0.0;}
    }




    var WorldDimX = WorldDimension.getValue(0)  ;
    var WorldDimZ = WorldDimension.getValue(1)  ;
    var WorldResX = GridRes.getValue(0);
    var WorldResZ = GridRes.getValue(1);
    var ColumnCount = HeightMapRes.getValue(0);
    var RowCount = HeightMapRes.getValue(1);
    var Factor = HFactor.getValue(0);
    var maxCount = Pos.getSliceCount()/3;


    //Position Loop
    if(Buffer != undefined){



    for (var i=0; i<maxCount; i++) {

        // normalized world position and index
        var posX = (Pos.getValue(i*3)+WorldDimX/2.0) / WorldDimX;
        var posZ = (Pos.getValue(i*3+2)+WorldDimZ/2.0) / WorldDimZ;
        var indexX = Math.floor(WorldResX*posX + 0.5);
        var indexZ = Math.floor(WorldResZ* posZ + 0.5);
        //World Grid Index
        var IndexInGrid = WorldResZ*indexZ+indexX;

        //normalized Position and Index in Subgrid (current heigthmap tile)
        var pTnX = (posX - indexX*(1/WorldResX))*WorldResX+0.5;
        var pTnZ = (posZ - indexZ*(1/WorldResZ))*WorldResZ+0.5;

        //Quad Index
        var SubIndexX = Math.floor((ColumnCount-1)*pTnX); //got rid of +0.5
        var SubIndexZ = Math.floor((RowCount-1)-(RowCount-1)*pTnZ);  //var SubIndexZ = Math.floor((RowCount-1)-(RowCount-1)*pTnZ);
        //Calculate on which of the 2 Polygon Triangles on the Quad is the Position

        var QuadScaleX = 1/(ColumnCount-1);
        var QuadScaleZ = 1/(RowCount-1);
        var QuadCenterX = SubIndexX * QuadScaleX + QuadScaleX/2;
        var QuadCenterZ = SubIndexZ * QuadScaleZ + QuadScaleZ/2;
        //bottom left and top right vertice to calculate m of linear equation

        var multiarrayIndex = TileIndices.indexOf(IndexInGrid);

        var x1 = (QuadCenterX - QuadScaleX/2) * grid_scaleX - grid_scaleX/2 + GridPositions.getValue(multiarrayIndex*3);
        var z1 = - (QuadCenterZ + QuadScaleZ/2) * grid_scaleZ +grid_scaleZ/2 + GridPositions.getValue(multiarrayIndex*3+2);
        var x2 = (QuadCenterX + QuadScaleX/2) * grid_scaleX - grid_scaleX/2 + GridPositions.getValue(multiarrayIndex*3);
        var z2 = - (QuadCenterZ - QuadScaleZ/2) * grid_scaleZ +grid_scaleZ/2 + GridPositions.getValue(multiarrayIndex*3+2);

        //calculate z on the diagonal that separates the two triangles in the quad
        // loosly leaning on https://lwjglgamedev.gitbooks.io/3d-game-development-with-lwjgl/content/chapter15/chapter15.html

        var z_diagonal = ((z1 - z2) / (x1 - x2)) * (Pos.getValue(i*3) - x1) + z1;

        // Vertex Indices Calculated from Quad Indices - Orderer is top left, top right, bottom left, bottom right
        var VertexIndices = [SubIndexX    + SubIndexZ*RowCount,
                             SubIndexX +1 + SubIndexZ*RowCount,
                             SubIndexX    + (SubIndexZ+1)*RowCount,
                             SubIndexX +1 + (SubIndexZ+1)*RowCount];
                         ////- gives better result but produce error on edges


        var HeigthFactor = Factor;
        var PosWX = Pos.getValue(i*3);
        var PosWZ = Pos.getValue(i*3+2);


        if(multiarrayIndex !== -1){
            //Scale it back from normalization into Tile Grid Space and get the Height Values from Byte Array
            if(z_diagonal >= Pos.getValue(i*3+2)) {

            //vertex bottom right
            pA[0]= (QuadCenterX - QuadScaleX/2) * grid_scaleX - grid_scaleX/2 + GridPositions.getValue(multiarrayIndex*3);
            pA[1]= multiarray[multiarrayIndex][VertexIndices[2]] * HeigthFactor;
            pA[2]= - (QuadCenterZ + QuadScaleZ/2) * grid_scaleZ +grid_scaleZ/2 + GridPositions.getValue(multiarrayIndex*3+2);
            //vertex top left
            pB[0]= (QuadCenterX + QuadScaleX/2) * grid_scaleX - grid_scaleX/2 + GridPositions.getValue(multiarrayIndex*3);
            pB[1]= multiarray[multiarrayIndex][VertexIndices[1]] * HeigthFactor;
            pB[2]= - (QuadCenterZ - QuadScaleZ/2) * grid_scaleZ +grid_scaleZ/2 + GridPositions.getValue(multiarrayIndex*3+2);
            //vertex bottom right
            pC[0]= (QuadCenterX + QuadScaleX/2) * grid_scaleX - grid_scaleX/2 + GridPositions.getValue(multiarrayIndex*3);
            pC[1]= multiarray[multiarrayIndex][VertexIndices[3]] * HeigthFactor;
            pC[2]= - (QuadCenterZ + QuadScaleZ/2) * grid_scaleZ +grid_scaleZ/2 + GridPositions.getValue(multiarrayIndex*3+2);
            var status = true;
            }
            if(z_diagonal < Pos.getValue(i*3+2)){

            //vertex bottom left
            pA[0]= (QuadCenterX - QuadScaleX/2) * grid_scaleX - grid_scaleX/2 + GridPositions.getValue(multiarrayIndex*3);
            pA[1]= multiarray[multiarrayIndex][VertexIndices[2]] * HeigthFactor;
            pA[2]= - (QuadCenterZ + QuadScaleZ/2) * grid_scaleZ +grid_scaleZ/2 + GridPositions.getValue(multiarrayIndex*3+2);
            //vertex top right
            pB[0]= (QuadCenterX + QuadScaleX/2) * grid_scaleX - grid_scaleX/2 + GridPositions.getValue(multiarrayIndex*3);
            pB[1]= multiarray[multiarrayIndex][VertexIndices[1]] * HeigthFactor;
            pB[2]= - (QuadCenterZ - QuadScaleZ/2) * grid_scaleZ +grid_scaleZ/2 + GridPositions.getValue(multiarrayIndex*3+2);
            //vertex bottom right
            pC[0]= (QuadCenterX - QuadScaleX/2) * grid_scaleX - grid_scaleX/2 + GridPositions.getValue(multiarrayIndex*3);
            pC[1]= multiarray[multiarrayIndex][VertexIndices[0]] * HeigthFactor;
            pC[2]= - (QuadCenterZ - QuadScaleZ/2) * grid_scaleZ +grid_scaleZ/2 + GridPositions.getValue(multiarrayIndex*3+2);
            var status = false;
            }
        //console.log(posX + ' ' + posZ + ' ' + indexX + ' ' + indexZ + ' ' + 'SubIndexX, Y, IndexinGrid '+ SubIndexX + ' ' + SubIndexZ +  ' '+ IndexInGrid + ' PtXZ' + pTnX + ' ' + pTnZ + 'vIndices' + VertexIndices + ' status ' +status);
        VertexPos.setValue(i*9, pA[0]);VertexPos.setValue(i*9+1, pA[1]);VertexPos.setValue(i*9+2, pA[2]);
        VertexPos.setValue(i*9+3, pB[0]);VertexPos.setValue(i*9+4, pB[1]);VertexPos.setValue(i*9+5, pB[2]);
        VertexPos.setValue(i*9+6, pC[0]);VertexPos.setValue(i*9+7, pC[1]);VertexPos.setValue(i*9+8, pC[2]);

        //console.log('pA '+ pA + 'pB ' + pB +  'pC ' + pC);
        // Plane equation ax+by+cz+d=0
       // var pt = [Pos.getValue(i*3), 0.0, Pos.getValue(i*3+2)];
        var pt = [pTnX* grid_scaleX - grid_scaleX/2 + QuadScaleX + GridPositions.getValue(multiarrayIndex*3),
                    0.0,
                 pTnZ* grid_scaleZ -grid_scaleZ/2 + QuadScaleZ + GridPositions.getValue(multiarrayIndex*3+2)];
        var dir = [0.0,1000.0,0.0];
        var tri = [pA,pB,pC];
        //var out = [0,0,0];
        var Point = intersectTriangle(out, pt, dir, tri);
        //console.log(' pt ' + pt + ' dir ' + dir + ' tri  ' + tri + ' out  ' + out);
        if(Point == null) { Point = [-1,-1,-1];}

        //var y = Point[1];

        CollissionY.setValue(i*3, Point[0]);CollissionY.setValue(i*3+1, Point[1]);CollissionY.setValue(i*3+2, Point[2]);
        }
        else{
        //if position is not on active tiles then set y to 0
        CollissionY.setValue(i*3, 0);CollissionY.setValue(i*3+1, 0);CollissionY.setValue(i*3+2, 0);
        //CollissionY.setValue(i*3, 0);
        }

        }
        CollissionY.setSliceCount(maxCount*3);
    }
    else{
        //if position is not on active tiles then set y to 0
        CollissionY.setValue(0, 0);
        CollissionY.setSliceCount(1);
        }

    }

}
VVVV.Nodes.TerrainCollisionGame.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Move (game collision)
 Author(s): 'David Gann'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Move = function(id, graph) {
  this.constructor(id, "Move (Game Collsion)", graph);

  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = true;

  // input pins
   var PosIn = this.addInputPin("Position", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var InitPos = this.addInputPin("Initial Position", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var MaxSpeed = this.addInputPin("Max Speed", [1.0], VVVV.PinTypes.Value);
   var MaxAge = this.addInputPin("Max Age", [100], VVVV.PinTypes.Value);

   var Create = this.addInputPin("Create", [0], VVVV.PinTypes.Value);

   var DestroyIndex = this.addInputPin("Destroy Index", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var Destroy = this.addInputPin("Destroy", [0], VVVV.PinTypes.Value);

   var NewVel = this.addInputPin("Update Velocity", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var UpdateIndex = this.addInputPin("Update Index", [0], VVVV.PinTypes.Value);
   var Update = this.addInputPin("Update", [0], VVVV.PinTypes.Value);

  // output pins
  var PositionXYZ = this.addOutputPin('PositionXYZ', [0.0,0.0,0.0], VVVV.PinTypes.Value);
  var VelocityXYZ = this.addOutputPin('VelocityXYZ', [0.0,0.0,0.0], VVVV.PinTypes.Value);
  var AgeOut = this.addOutputPin('Age', [0], VVVV.PinTypes.Value);

  var Pos = [];
  var Vel = [];
  var Age = [];
  //var MaxAgeArray = [];
  var NormalizedXYZ = [];
  var len = [];
  var xyz = [];
  var PosInXYZ = [];
  var PosInXYZ2 = [];
  var InitPosXYZ = [];
  var PrevPos = [0.0,0.0,0.0];
  var PrevDest = [0.0,0.0,0.0];
  var PrevDestX = [0.0];
  var PrevDestY = [0.0];
  var PrevDestZ = [0.0];
  var PrevPosX = [0.0];
  var PrevPosY = [0.0];
  var PrevPosZ = [0.0];
  var DestX = [0.0];
  var DestY = [0.0];
  var DestZ = [0.0];
  var PrevLen = [0.0];
  var Arrived = [false];
  // evaluate() will be called each frame
  // (if the input pins have changed, or the nodes is flagged as auto-evaluating)
  this.evaluate = function() {

    var maxInit= Math.max(InitPos.getSliceCount()/3,MaxSpeed.getSliceCount()/3);
    if(Create.getValue(0)==1) {
    for (var i=0; i<maxInit; i++) {
      var ModI = InitPos.getSliceCount()/3;
      InitPosXYZ[i*3] = InitPos.getValue(i*3);
      InitPosXYZ[i*3+1] = InitPos.getValue(i*3+1);
      InitPosXYZ[i*3+2] = InitPos.getValue(i*3+2);
      Pos.push(InitPosXYZ[i*3]);
      Pos.push(InitPosXYZ[i*3+1]);
      Pos.push(InitPosXYZ[i*3+2]);
      Vel.push(0.0);
      Vel.push(0.0);
      Vel.push(0.0);
     }
    }

    if(Update.getValue(0)==1){
        for(var j=0; j<UpdateIndex.getSliceCount(); j++){
            Vel[UpdateIndex.getValue(j)*3]= NewVel.getValue(j*3);
            Vel[UpdateIndex.getValue(j)*3+1]= NewVel.getValue(j*3+1);
            Vel[UpdateIndex.getValue(j)*3+2]= NewVel.getValue(j*3+2);
        }
    }

    if(Destroy.getValue(0)==1){
        for(var k=0; k<DestroyIndex.getSliceCount(); k++){
            Pos.splice([DestroyIndex[k]*3],3);

            Vel.splice([DestroyIndex[k]*3],3);

            Age.splice([DestroyIndex[k]],1);

            //MaxAgeArray.splice([DestroyIndex[k]],1);
        }
    }
    var maxSize= Math.max(Pos.length/3,Vel.length/3);
//    var AgeCount=0;
//    var AgedIndices=[];

    //Mainloop
    if(maxSize != 0 || Create.getValue(0)==1){
        for(var n=0; n<maxSize; n++){
              DestX[n] = PosIn.getValue(n*3 );
              DestY[n] = PosIn.getValue(n*3+1);
              DestZ[n] = PosIn.getValue(n*3+2);
              if (DestX[n] != PrevDestX[n] | DestY[n] != PrevDestY[n] | DestZ[n] != PrevDestZ[n]) {
                 Arrived[n] = false;
              }


              xyz[n*3]= DestX[n] - Pos[n*3];
              xyz[n*3+1]=  DestY[n] - Pos[n*3+1];
              xyz[n*3+2]= DestZ[n] - Pos[n*3+2];
              len[n] = Math.sqrt(xyz[n*3]*xyz[n*3] + 0.0 + xyz[n*3+2]*xyz[n*3+2]);
               //console.log(len);
              if(len != 0){
              NormalizedXYZ[n*3] =   (xyz[n*3]/len[n])*MaxSpeed.getValue(n); //X
              NormalizedXYZ[n*3+1] =   (xyz[n*3+1]/len[n])*MaxSpeed.getValue(n);  //Y
              NormalizedXYZ[n*3+2] =   (xyz[n*3+2]/len[n])*MaxSpeed.getValue(n);  //Z
              } else{
              NormalizedXYZ[n*3] =   0.0; //STOP?
              NormalizedXYZ[n*3+1] =   0.0;
              NormalizedXYZ[n*3+2] =   0.0;
              }
            //}


            var t_destx = xyz[n*3] / Vel[n*3] ;
            var t_desty = xyz[n*3+1] / Vel[n*3+1] ;
            var t_destz = xyz[n*3+2] / Vel[n*3+2] ;
            var tmax = Math.max(t_destx, t_desty, t_destz);
            //The Stop Case
            if (Arrived[n] = true && tmax <= 1.0 && tmax >= 0.0 && tmax != Number.NEGATIVE_INFINITY && tmax != Number.POSITIVE_INFINITY && tmax != undefined){
                Pos[n*3] = DestX[n];
                Pos[n*3+1] = DestY[n];
                Pos[n*3+2] = DestZ[n];
                Arrived[n] = true;
                //console.log(tmax);
            }else             //The Move Case
            {
                Vel[n*3] =   NormalizedXYZ[n*3];
                Vel[n*3+1] =   NormalizedXYZ[n*3+1];
                Vel[n*3+2] =   NormalizedXYZ[n*3+2];

                Pos[n*3] = Pos[n*3]+ Vel[n*3];
                Pos[n*3+1] = Pos[n*3+1]+ Vel[n*3+1];
                Pos[n*3+2] = Pos[n*3+2]+ Vel[n*3+2];


                PrevDestX[n] = DestX[n];
                PrevDestY[n] = DestY[n]; //PosIn.getValue(n*3 % maxInit+1);
                PrevDestZ[n] = DestZ[n];

                PrevLen[n] = len[n];
            }

        }




        //updated array length
        maxSize= Math.max(Pos.length/3,Vel.length/3);
        for(var l=0; l<maxSize; l++){

            PositionXYZ.setValue(l*3, Pos[l*3]);
            PositionXYZ.setValue(l*3+1, Pos[l*3+1]);
            PositionXYZ.setValue(l*3+2, Pos[l*3+2]);

            VelocityXYZ.setValue(l*3, -(Vel[l*3]));
            VelocityXYZ.setValue(l*3+1,(Vel[l*3+1]));
            VelocityXYZ.setValue(l*3+2, -(Vel[l*3+2]));

            //AgeOut.setValue(l,Age[l]);

        }
    }
    else {
        PositionXYZ.setValue(0,0.0);
        PositionXYZ.setValue(1,0.0);
        PositionXYZ.setValue(2,0.0);

        VelocityXYZ.setValue(0,0.0);
        VelocityXYZ.setValue(1,0.0);
        VelocityXYZ.setValue(2,0.0);

        //AgeOut.setValue(0,0.0);
    }

    PositionXYZ.setSliceCount(Pos.length);
    VelocityXYZ.setSliceCount(Vel.length);
   // AgeOut.setSliceCount(Age.length);

  }

}
VVVV.Nodes.Move.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: CollisionBoxPoint (Game Collision )
 Author(s): 'David Gann'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.CollisionBoxPoint = function(id, graph) {
  this.constructor(id, "CollisionBoxPoint (Game Collision)", graph);

  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = true;
  this.auto_nil = true;

  // input pins
   var PointPosition = this.addInputPin("PointPosition", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var BoxPosition = this.addInputPin("BoxPosition", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var BoxScale = this.addInputPin("BoxScale", [0.0,0.0,0.0], VVVV.PinTypes.Value);


  // output pins
  var PointColide = this.addOutputPin('PointColide', [0], VVVV.PinTypes.Value);
  var PointIndex = this.addOutputPin('PointIndex', [0], VVVV.PinTypes.Value);
  var BoxColide = this.addOutputPin('BoxColide', [0], VVVV.PinTypes.Value);
  var BoxIndex = this.addOutputPin('BoxIndex', [0], VVVV.PinTypes.Value);


  // evaluate() will be called each frame
  // (if the input pins have changed, or the nodes is flagged as auto-evaluating)
  this.evaluate = function() {
    var maxsizePoint =  PointPosition.getSliceCount()/3;
    var maxsizeBox =  BoxPosition.getSliceCount()/3;
    var iidx = 0;
    var idx = 0;
    var BoxAccumulate = Array.apply(null, Array(maxsizeBox)).map(Number.prototype.valueOf,0);
    var PointIndexArray = [];
    var piix = 0;
    var BoxIndexArray = [];
    var biix = 0;
    for (var i=0; i<maxsizePoint; i++) {
        var pointX = PointPosition.getValue(iidx);
        var pointY = PointPosition.getValue(iidx+1);
        var pointZ = PointPosition.getValue(iidx+2);

        var PointAccumulate = 0;


      for (var j=0; j<maxsizeBox; j++) {
        var minX = BoxPosition.getValue(idx) - BoxScale.getValue(idx) /2 ;
        var minY = BoxPosition.getValue(1+idx) - BoxScale.getValue(1+idx) /2 ;
        var minZ = BoxPosition.getValue(2+idx) - BoxScale.getValue(3+idx) /2 ;
        var maxX = BoxPosition.getValue(idx) + BoxScale.getValue(idx) /2 ;
        var maxY = BoxPosition.getValue(1+idx) + BoxScale.getValue(1+idx) /2 ;
        var maxZ = BoxPosition.getValue(2+idx) + BoxScale.getValue(3+idx) /2 ;

        if((pointX >= minX && pointX <= maxX) &&
           (pointY >= minY && pointY <= maxY) &&
           (pointZ >= minZ && pointZ <= maxZ)) {
           PointAccumulate++;
           BoxAccumulate[j] = BoxAccumulate[j]+1;
           PointIndexArray.push(i);
           BoxIndexArray.push(j);
           BoxIndex.setValue(biix, BoxIndexArray[biix]);
           PointIndex.setValue(piix, PointIndexArray[piix]);


           biix++;
           piix++;

        }

        BoxColide.setValue(j, BoxAccumulate[j]);
        idx=idx+3;
      }
      PointColide.setValue(i, PointAccumulate);

      iidx=iidx+3;

    }



    PointColide.setSliceCount(maxsizePoint);
    BoxColide.setSliceCount(maxsizeBox);
    BoxIndex.setSliceCount(BoxIndexArray.length);
    PointIndex.setSliceCount(PointIndexArray.length);
  }

}
VVVV.Nodes.CollisionBoxPoint.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: CollisionBoxBox (Game Collision)
 Author(s): 'David Gann'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.CollisionBoxBox = function(id, graph) {
  this.constructor(id, "CollisionBoxBox (Game Collision)", graph);

  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = true;
  this.auto_nil = true;

  // input pins
   var Box1Position = this.addInputPin("Box1Position", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var Box1Scale = this.addInputPin("Box1Scale", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var Box2Position = this.addInputPin("Box2Position", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var Box2Scale = this.addInputPin("Box2Scale", [0.0,0.0,0.0], VVVV.PinTypes.Value);


  // output pins
  var Box1Colide = this.addOutputPin('Box1Colide', [0], VVVV.PinTypes.Value);
  var Box1Index = this.addOutputPin('Box1Index', [0], VVVV.PinTypes.Value);
  var Box2Colide = this.addOutputPin('Box2Colide', [0], VVVV.PinTypes.Value);
  var Box2Index = this.addOutputPin('Box2Index', [0], VVVV.PinTypes.Value);


  // evaluate() will be called each frame
  // (if the input pins have changed, or the nodes is flagged as auto-evaluating)
  this.evaluate = function() {
    var maxsizeBox1 =  Box1Position.getSliceCount()/3;
    var maxsizeBox2 =  Box2Position.getSliceCount()/3;
    var iidx = 0;
    var idx = 0;
    var Box1Accumulate = 0;
    var Box2Accumulate = Array.apply(null, Array(maxsizeBox2)).map(Number.prototype.valueOf,0);
    var Box1IndexArray = [];
    var b1iix = 0;
    var Box2IndexArray = [];
    var b2iix = 0;

    for (var i=0; i<maxsizeBox1; i++) {
        var minX1 = Box1Position.getValue(iidx) - Box1Scale.getValue(iidx) /2 ;
        var minY1 = Box1Position.getValue(1+iidx) - Box1Scale.getValue(1+iidx) /2 ;
        var minZ1 = Box1Position.getValue(2+iidx) - Box1Scale.getValue(3+iidx) /2 ;
        var maxX1 = Box1Position.getValue(iidx) + Box1Scale.getValue(iidx) /2 ;
        var maxY1 = Box1Position.getValue(1+iidx) + Box1Scale.getValue(1+iidx) /2 ;
        var maxZ1 = Box1Position.getValue(2+iidx) + Box1Scale.getValue(3+iidx) /2 ;

        var Box1Accumulate = 0;


      for (var j=0; j<maxsizeBox2; j++) {
        var minX2 = Box2Position.getValue(idx) - Box2Scale.getValue(idx) /2 ;
        var minY2 = Box2Position.getValue(1+idx) - Box2Scale.getValue(1+idx) /2 ;
        var minZ2 = Box2Position.getValue(2+idx) - Box2Scale.getValue(3+idx) /2 ;
        var maxX2 = Box2Position.getValue(idx) + Box2Scale.getValue(idx) /2 ;
        var maxY2 = Box2Position.getValue(1+idx) + Box2Scale.getValue(1+idx) /2 ;
        var maxZ2 = Box2Position.getValue(2+idx) + Box2Scale.getValue(3+idx) /2 ;

        if((minX1 <= maxX2 && maxX1 >= minX2) &&
           (minY1 <= maxY2 && maxY1 >= minY2) &&
           (minZ1 <= maxZ2 && maxZ1 >= minZ2)) {
           Box1Accumulate++;
           Box2Accumulate[j] = Box2Accumulate[j]+1;
           Box1IndexArray.push(i);
           Box2IndexArray.push(j);
           Box1Index.setValue(b1iix, Box1IndexArray[b1iix]);
           Box2Index.setValue(b2iix, Box2IndexArray[b2iix]);


           b1iix++;
           b2iix++;

        }

        Box2Colide.setValue(j, Box2Accumulate[j]);
        idx=idx+3;
      }
      Box1Colide.setValue(i, Box1Accumulate);

      iidx=iidx+3;

    }



    Box1Colide.setSliceCount(maxsizeBox1);
    Box2Colide.setSliceCount(maxsizeBox2);
    Box2Index.setSliceCount(Box2IndexArray.length);
    Box1Index.setSliceCount(Box1IndexArray.length);
  }

}
VVVV.Nodes.CollisionBoxBox.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: CollisionBoxSweep (Game Collision)
 Author(s): 'David Gann'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.CollisionBoxSweep = function(id, graph) {
  this.constructor(id, "CollisionBoxSweep (Game Collision)", graph);

  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = true;

  // input pins
   var Box1Position = this.addInputPin("Box1Position", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var Box1Velocity = this.addInputPin("Box1Velocity", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var Box1Scale = this.addInputPin("Box1Scale", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var Box2Position = this.addInputPin("Box2Position", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var Box2Velocity = this.addInputPin("Box2Velocity", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var Box2Scale = this.addInputPin("Box2Scale", [0.0,0.0,0.0], VVVV.PinTypes.Value);


  // output pins
  var Box1Colide = this.addOutputPin('Box1Colide', [0], VVVV.PinTypes.Value);
  var Box1Index = this.addOutputPin('Box1Index', [0], VVVV.PinTypes.Value);

  var Box2Colide = this.addOutputPin('Box2Colide', [0], VVVV.PinTypes.Value);
  var Box2Index = this.addOutputPin('Box2Index', [0], VVVV.PinTypes.Value);

  var NormalsOut = this.addOutputPin('NormalsOut', [0.0,0.0,0.0], VVVV.PinTypes.Value);
  var CollisionTime = this.addOutputPin('CollisionTime', [0.0], VVVV.PinTypes.Value);
  var Collide = this.addOutputPin('Collide', [0], VVVV.PinTypes.Value);



  // evaluate() will be called each frame
  // (if the input pins have changed, or the nodes is flagged as auto-evaluating)
  this.evaluate = function() {

    if(Box1Position.getSliceCount() >= 3){ var maxsizeBox1 =  Box1Position.getSliceCount()/3; }
    else {var maxsizeBox1 = 3;}
    if(Box2Position.getSliceCount() >= 3){var maxsizeBox2 =  Box2Position.getSliceCount()/3;}
    else {var maxsizeBox2 = 3;}


    var iidx = 0;
    var idx = 0;
    var Box1Accumulate = 0;
    var Box2Accumulate = Array.apply(null, Array(maxsizeBox2)).map(Number.prototype.valueOf,0);
    var Box1IndexArray = [];
    var b1iix = 0;
    var Box2IndexArray = [];
    var normalArray = [];
    var niix = 0;
    var CollisionTimeArray = [];
    var Collision = 0;

    for (var i=0; i<maxsizeBox1; i++) {
        var minX1 = Box1Position.getValue(iidx) - Box1Scale.getValue(iidx) /2 ;
        var minY1 = Box1Position.getValue(1+iidx) - Box1Scale.getValue(1+iidx) /2 ;
        var minZ1 = Box1Position.getValue(2+iidx) - Box1Scale.getValue(3+iidx) /2 ;
        var maxX1 = Box1Position.getValue(iidx) + Box1Scale.getValue(iidx) /2 ;
        var maxY1 = Box1Position.getValue(1+iidx) + Box1Scale.getValue(1+iidx) /2 ;
        var maxZ1 = Box1Position.getValue(2+iidx) + Box1Scale.getValue(3+iidx) /2 ;
        var Box1Accumulate = 0;

      for (var j=0; j<maxsizeBox2; j++) {
        var minX2 = Box2Position.getValue(idx) - Box2Scale.getValue(idx) /2 ;
        var minY2 = Box2Position.getValue(1+idx) - Box2Scale.getValue(1+idx) /2 ;
        var minZ2 = Box2Position.getValue(2+idx) - Box2Scale.getValue(3+idx) /2 ;
        var maxX2 = Box2Position.getValue(idx) + Box2Scale.getValue(idx) /2 ;
        var maxY2 = Box2Position.getValue(1+idx) + Box2Scale.getValue(1+idx) /2 ;
        var maxZ2 = Box2Position.getValue(2+idx) + Box2Scale.getValue(3+idx) /2 ;

        var vX = -1*(Box1Velocity.getValue(iidx) - Box2Velocity.getValue(idx));
        var vY = -1*(Box1Velocity.getValue(iidx+1) - Box2Velocity.getValue(idx+1));
        var vZ = -1*(Box1Velocity.getValue(iidx+2) - Box2Velocity.getValue(idx+2));

        if (vX==0.0){vX=0.00000000001;}
        if (vY==0.0){vY=0.00000000001;}
        if (vZ==0.0){vZ=0.00000000001;}

        var normalDirX=1; var normalDirY=1; var normalDirZ=1;

        if(vX > 0){
            var EarlyTimeX = (minX2 - maxX1) / vX;
            var LateTimeX = (maxX2 - minX1) / vX;
            var normalDirX = 1;
        }
        else if(vX < 0){
            var EarlyTimeX = (maxX2 - minX1) / vX;
            var LateTimeX = (minX2 - maxX1) / vX;
            var normalDirX = -1;
        }

        if(vY > 0){
            var EarlyTimeY = (minY2 - maxY1) / vY;
            var LateTimeY = (maxY2 - minY1) / vY;
            var normalDirY = 1;
        }
        else if(vY < 0){
            var EarlyTimeY = (maxY2 - minY1) / vY;
            var LateTimeY = (minY2 - maxY1) / vY;
            var normalDirY = -1;
        }
        if(vZ > 0){
            var EarlyTimeZ = (minZ2 - maxZ1) / vZ;
            var LateTimeZ = (maxZ2 - minZ1) / vZ;
            var normalDirZ = 1;
        }
        else if(vZ < 0){
            var EarlyTimeZ = (maxZ2 - minZ1) / vZ;
            var LateTimeZ = (minZ2 - maxZ1) / vZ;
            var normalDirZ = -1;
        }



        //Now earliest and latest collision Time unit from all axis
        var T0 = Math.max(EarlyTimeX,EarlyTimeY,EarlyTimeZ);
        var T1 = Math.min(LateTimeX,LateTimeY,LateTimeZ);

        //Collision  if(T0 <= T1 && T0>=0 && T0 <=1 )

       // if (T0 > T1 || EarlyTimeX <= 0.0 && EarlyTimeY <= 0.0 && EarlyTimeZ <= 0.0 || EarlyTimeX >= 1.0 && EarlyTimeY >= 1.0 && EarlyTimeZ >= 1.0)
        //{
        //}
        if(T0 <= T1 && T0>0 && T0 < 1 ){
           Collision = 1;
           Box1Accumulate++;
           Box2Accumulate[j] = Box2Accumulate[j]+1;
           Box1IndexArray.push(i);
           Box2IndexArray.push(j);
           Box1Index.setValue(b1iix, Box1IndexArray[b1iix]);
           Box2Index.setValue(b1iix, Box2IndexArray[b1iix]);
           CollisionTimeArray.push(T0);

           CollisionTime.setValue(b1iix, CollisionTimeArray[b1iix]);

           if(EarlyTimeX>EarlyTimeY && EarlyTimeX>EarlyTimeZ) {var normal=[1.0*normalDirX,0,0];}
           if(EarlyTimeY>EarlyTimeX && EarlyTimeY>EarlyTimeZ) {var normal=[0,1.0*normalDirY,0];}
           if(EarlyTimeZ>EarlyTimeX && EarlyTimeZ>EarlyTimeY) {var normal=[0,0,1.0*normalDirZ];}

           normalArray.push(normal[0]);normalArray.push(normal[1]);normalArray.push(normal[2]);
           NormalsOut.setValue(niix, normalArray[niix]);
           NormalsOut.setValue(niix+1, normalArray[niix+1]);
           NormalsOut.setValue(niix+2, normalArray[niix+2]);

           b1iix++;

           niix=niix+3;
        }
        Box2Colide.setValue(j, Box2Accumulate[j]);
        idx=idx+3;
      }
      Box1Colide.setValue(i, Box1Accumulate);
      Collide.setValue(0, Collision);


      iidx=iidx+3;
    }
    Box1Colide.setSliceCount(maxsizeBox1);
    Box2Colide.setSliceCount(maxsizeBox2);

    if (b1iix==0){
        Box2Index.setSliceCount(1);
        Box1Index.setSliceCount(1);
        NormalsOut.setSliceCount(3);
        CollisionTime.setSliceCount(1);
    }
    else {
        Box2Index.setSliceCount(Box2IndexArray.length);
        Box1Index.setSliceCount(Box1IndexArray.length);
        NormalsOut.setSliceCount(normalArray.length);
        CollisionTime.setSliceCount(CollisionTimeArray.length);
    }


  }

}
VVVV.Nodes.CollisionBoxSweep.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Trajectory (Game Collision)
 Author(s): 'David Gann'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Trajectory = function(id, graph) {
  this.constructor(id, "Trajectory (Game Collision)", graph);

  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = true;

  // input pins
   var InitPos = this.addInputPin("Initial Position", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var InitVel = this.addInputPin("Initial Velocity", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var MaxAge = this.addInputPin("Max Age", [100], VVVV.PinTypes.Value);

   var Create = this.addInputPin("Create", [0], VVVV.PinTypes.Value);

   var DestroyIndex = this.addInputPin("Destroy Index", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var Destroy = this.addInputPin("Destroy", [0], VVVV.PinTypes.Value);

   var NewVel = this.addInputPin("Update Velocity", [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var UpdateIndex = this.addInputPin("Update Index", [0], VVVV.PinTypes.Value);
   var Update = this.addInputPin("Update", [0], VVVV.PinTypes.Value);

  // output pins
  var PositionXYZ = this.addOutputPin('PositionXYZ', [0.0,0.0,0.0], VVVV.PinTypes.Value);
  var VelocityXYZ = this.addOutputPin('VelocityXYZ', [0.0,0.0,0.0], VVVV.PinTypes.Value);
  var AgeOut = this.addOutputPin('Age', [0], VVVV.PinTypes.Value);

  var Pos = [];
  var Vel = [];
  var Age = [];
  var MaxAgeArray = [];
  // evaluate() will be called each frame
  // (if the input pins have changed, or the nodes is flagged as auto-evaluating)
  this.evaluate = function() {

    var maxInit= Math.max(InitPos.getSliceCount()/3,InitVel.getSliceCount()/3);
    if(Create.getValue(0)==1) {
    for (var i=0; i<maxInit; i++) {
      Pos.push(InitPos.getValue(i*3));
      Pos.push(InitPos.getValue(i*3+1));
      Pos.push(InitPos.getValue(i*3+2));

      Vel.push(InitVel.getValue(i*3));
      Vel.push(InitVel.getValue(i*3+1));
      Vel.push(InitVel.getValue(i*3+2));
      Age.push(0);
      MaxAgeArray.push(MaxAge.getValue(i));

     }
    }

    if(Update.getValue(0)==1){
        for(var j=0; j<UpdateIndex.getSliceCount(); j++){
            Vel[UpdateIndex.getValue(j)*3]= NewVel.getValue(j*3);
            Vel[UpdateIndex.getValue(j)*3+1]= NewVel.getValue(j*3+1);
            Vel[UpdateIndex.getValue(j)*3+2]= NewVel.getValue(j*3+2);
        }
    }

    if(Destroy.getValue(0)==1){
        for(var k=0; k<DestroyIndex.getSliceCount(); k++){
            Pos.splice([DestroyIndex[k]*3],3);

            Vel.splice([DestroyIndex[k]*3],3);

            Age.splice([DestroyIndex[k]],1);

            MaxAgeArray.splice([DestroyIndex[k]],1);
        }
    }
    var maxSize= Math.max(Pos.length/3,Vel.length/3);
    var AgeCount=0;
    var AgedIndices=[];

    //Mainloop
    if(maxSize != 0 || Create.getValue(0)==1){
        for(var n=0; n<maxSize; n++){
            Pos[n*3] = Pos[n*3]+ Vel[n*3];
            Pos[n*3+1] = Pos[n*3+1]+ Vel[n*3+1];
            Pos[n*3+2] = Pos[n*3+2]+ Vel[n*3+2];
            Age[n] = Age[n]+1;
            if(Age[n]>= MaxAgeArray[n]){
                AgeCount=AgeCount+1;
                AgedIndices.push(n);
             }

        }

        if(AgeCount !== 0){
        for(var a=0; a<AgeCount; a++){

                Pos.splice(AgedIndices[a]*3,3);
                Vel.splice(AgedIndices[a]*3,3);
                Age.splice(AgedIndices[a],1);
                MaxAgeArray.splice(AgedIndices[a],1); ///doesnt remove array correctly?
             }

        }


        //updated array length
        maxSize= Math.max(Pos.length/3,Vel.length/3);
        for(var l=0; l<maxSize; l++){

            PositionXYZ.setValue(l*3, Pos[l*3]);
            PositionXYZ.setValue(l*3+1, Pos[l*3+1]);
            PositionXYZ.setValue(l*3+2, Pos[l*3+2]);

            VelocityXYZ.setValue(l*3, -(Vel[l*3]));
            VelocityXYZ.setValue(l*3+1,(Vel[l*3+1]));
            VelocityXYZ.setValue(l*3+2, -(Vel[l*3+2]));

            AgeOut.setValue(l,Age[l]);

        }
    }
    else {
        PositionXYZ.setValue(0,0.0);
        PositionXYZ.setValue(1,0.0);
        PositionXYZ.setValue(2,0.0);

        VelocityXYZ.setValue(0,0.0);
        VelocityXYZ.setValue(1,0.0);
        VelocityXYZ.setValue(2,0.0);

        AgeOut.setValue(0,0.0);
    }

    PositionXYZ.setSliceCount(Pos.length);
    VelocityXYZ.setSliceCount(Vel.length);
    AgeOut.setSliceCount(Age.length);

  }

}
VVVV.Nodes.Trajectory.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: CollisionResponse (Game)
 Author(s): 'David Gann'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.CollisionResponse = function(id, graph) {
  this.constructor(id, "CollisionResponse (Game Collision)", graph);

  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = true;

  // input pins
   var Velocity = this.addInputPin('Velocity', [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var Normals = this.addInputPin('CollisionNormals', [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var CollisionTime = this.addInputPin('CollisionTime', [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var typeIn = this.addInputPin('ResponseType', ['deflect'], VVVV.PinTypes.Enum);
   typeIn.enumOptions = ["deflect", "slide"];
   var Collide= this.addInputPin('Collide', [0], VVVV.PinTypes.Value);

  // output pins
  var UpdatedVelocity = this.addOutputPin('UpdatedVelocityXYZ', [0.0,0.0,0.0], VVVV.PinTypes.Value);


  this.evaluate = function() {



    if (Collide.getValue(0)==1){
    var maxCount= Velocity.getSliceCount()/3;

        for (var i=0; i<maxCount; i++) {
        var remainingtime = 1.0-CollisionTime.getValue(i);


        if (typeIn.getValue(i)=='deflect'){
            var velX = -Velocity.getValue(i*3); //* remainingtime;
            var velY = -Velocity.getValue(i*3+1); //* remainingtime;
            var velZ = -Velocity.getValue(i*3+2); //* remainingtime;
            if(Math.abs(Normals.getValue(i*3))>0.0){
                velX = -velX;
                }
            if(Math.abs(Normals.getValue(i*3+1))>0.0){
                velY = -velY;
                }
            if(Math.abs(Normals.getValue(i*3+2))>0.0){
                velZ = -velZ;
                }
            }


        if (typeIn.getValue(i)=='slide' || typeIn.getValue()==''){
            var velX = -Velocity.getValue(i*3); //* remainingtime;
            var velY = -Velocity.getValue(i*3+1); //* remainingtime;
            var velZ = -Velocity.getValue(i*3+2);

            var impulseX = -(velX*Normals.getValue(i*3))*Normals.getValue(i*3);
            var impulseY = -(velY*Normals.getValue(i*3+1))*Normals.getValue(i*3+1);
            var impulseZ = -(velZ*Normals.getValue(i*3+2))*Normals.getValue(i*3+2);

            velX += impulseX;
            velY += impulseY;
            velZ += impulseZ;
            }

             UpdatedVelocity.setValue(i*3, velX);
             UpdatedVelocity.setValue(i*3+1, velY);
             UpdatedVelocity.setValue(i*3+2, velZ);
        }
             UpdatedVelocity.setSliceCount(i*3);
        }
        else {
             UpdatedVelocity.setValue(0,0.0);UpdatedVelocity.setValue(1,0.0);UpdatedVelocity.setValue(2,0.0);
             UpdatedVelocity.setSliceCount(3);
        }
    }

}
VVVV.Nodes.CollisionResponse.prototype = new Node();



/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: RayTriangleIntersect (Game Collision)
 Author(s): 'David Gann'
 Original Node Author(s): ''
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.RayTriangleIntersect = function(id, graph) {
  this.constructor(id, "RayTriangleIntersect (Game Collision)", graph);

  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = true;

  // input pins
   var Mesh = this.addInputPin("Mesh", [], VVVV.PinTypes.WebGlResource);
   var Vertices = this.addInputPin('Vertices', [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var Indices = this.addInputPin('Indices', [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var RayOrigin = this.addInputPin('RayOrigin', [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var RayDirection = this.addInputPin('RayDirection', [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var applyIn = this.addInputPin('ApplyMesh', [1], VVVV.PinTypes.Value);

  // output pins
  var Intersect = this.addOutputPin('Intersect', [0], VVVV.PinTypes.Value);
  var IntersectPoint = this.addOutputPin('IntersectPoint', [0.0,0.0,0.0], VVVV.PinTypes.Value);


  ///ray-triangle intersection from https://github.com/substack/ray-triangle-intersection/blob/master/index.js
    function cross(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2],
        bx = b[0], by = b[1], bz = b[2]

    out[0] = ay * bz - az * by
    out[1] = az * bx - ax * bz
    out[2] = ax * by - ay * bx
    return out
    }

    function dot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
    }

    function sub(out, a, b) {
        out[0] = a[0] - b[0]
        out[1] = a[1] - b[1]
        out[2] = a[2] - b[2]
        return out
    }

    var EPSILON = 0.0001;//var EPSILON = 0.000001;
    var edge1 = [0,0,0];
    var edge2 = [0,0,0];
    var tvec = [0,0,0];
    var pvec = [0,0,0];
    var qvec = [0,0,0];
    var out = [0,0,0];


    function intersectTriangle (out, pt, dir, tri) {

        sub(edge1, tri[1], tri[0]);
        sub(edge2, tri[2], tri[0]);
        cross(pvec, dir, edge2);

        var det = dot(edge1, pvec);
        //if (det < EPSILON) console.log("null1"); return null;
        sub(tvec, pt, tri[0]);
        var u = dot(tvec, pvec);
        //if (u < 0 || u > det) console.log("null2"); return null;
        cross(qvec, tvec, edge1);
        var v = dot(dir, qvec);
        //if (v < 0 || u + v > det) console.log("null3"); return null;

        var t = dot(edge2, qvec) / det;
        out[0] = pt[0] + t * dir[0];
        out[1] = pt[1] + t * dir[1];
        out[2] = pt[2] + t * dir[2];
        return out;
    }


  var Indices = [];
  var VertexList = [];

  this.evaluate = function() {

  if (applyIn.getValue(0)>=.5) {
    if (Mesh.isConnected()) {
          var Geometry = Mesh.getValue(0);
          Indices = Geometry.indexBuffer;
          VertexList = Geometry.vertexBuffer.subBuffers.POSITION.data;

    }
  }
  //console.log(Indices); console.log(VertexList);
  var pt = [RayOrigin.getValue(0), RayOrigin.getValue(1), RayOrigin.getValue(2)];
  var dir = [RayDirection.getValue(0), RayDirection.getValue(1), RayDirection.getValue(2)];

  var tri = [[Vertices.getValue(0), Vertices.getValue(1), Vertices.getValue(2)],
             [Vertices.getValue(3), Vertices.getValue(4), Vertices.getValue(5)],
             [Vertices.getValue(6), Vertices.getValue(7), Vertices.getValue(8)]];

  var Point = intersectTriangle(out, pt, dir, tri);
  if(Point == null) { Point = [-1,-1,-1];}



  IntersectPoint.setValue(0, Point[0]);
  IntersectPoint.setValue(1, Point[1]);
  IntersectPoint.setValue(2, Point[2]);

  }


}
VVVV.Nodes.RayTriangleIntersect.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: TerrainGrid (Game)
 Author(s): 'David Gann'
 Original Node Author(s): '000.graphics'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

//Create a Position and Index Grid for Dynamic Loading of HeightMap Based MultiGridded Terrain
//Only usefull with a set of indexed heightmap textures

VVVV.Nodes.TerrainGridGame = function(id, graph) {
  this.constructor(id, "TerrainGrid (Game)", graph);

  this.meta = {
    authors: ['David Gann'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = true;

  // input pins
   var Position = this.addInputPin('PositionXYZ', [0.0,0.0,0.0], VVVV.PinTypes.Value);
   var GridRes = this.addInputPin('GridResolutionXY', [128.0,128.0], VVVV.PinTypes.Value);
   var WorldDimension = this.addInputPin('WorldDimensionXY', [1000.0,1000.0], VVVV.PinTypes.Value);
   var ViewRadius = this.addInputPin('ViewRadius', [1.0], VVVV.PinTypes.Value);

  // output pins
  var GridXYZ = this.addOutputPin('GridXYZ', [0.0,0.0,0.0], VVVV.PinTypes.Value);
  var GridScaleXZ = this.addOutputPin('GridScaleXZ', [1.0,1.0], VVVV.PinTypes.Value);
  var GridIndex = this.addOutputPin('GridIndex', [0.0], VVVV.PinTypes.Value);

  //create arrays with 0s for the first evaluation frame
  var prevIndexArr = Array.apply(null, Array(ViewRadius.getValue(0)*8+1)).map(Number.prototype.valueOf,0);
  var prevXArr = Array.apply(null, Array(ViewRadius.getValue(0)*8+1)).map(Number.prototype.valueOf,0);
  var prevYArr = Array.apply(null, Array(ViewRadius.getValue(0)*8+1)).map(Number.prototype.valueOf,0);


  this.evaluate = function() {
    var IndexArr = [];
    var xArr = [];
    var yArr = [];
    var grid_scaleX = WorldDimension.getValue(0)/GridRes.getValue(0);
    var grid_scaleY = WorldDimension.getValue(1)/GridRes.getValue(1);

    var posX = (Position.getValue(0)+WorldDimension.getValue(0)/2.0) / WorldDimension.getValue(0);
    var posY = (Position.getValue(2)+WorldDimension.getValue(1)/2.0) / WorldDimension.getValue(1);
    var indexX = Math.floor(GridRes.getValue(0)*posX + 0.5);
    var indexY = Math.floor(GridRes.getValue(1)* posY + 0.5);


    //get surounding indices and positions from grid
    var  k = 0;
    for (var x = -ViewRadius.getValue(0); x < ViewRadius.getValue(0)+1; x++){
       for (var y = -ViewRadius.getValue(0); y < ViewRadius.getValue(0)+1; y++){
        var iX = indexX + x
        var iY = indexY + y;
        var gridPosX = (iX * grid_scaleX)-WorldDimension.getValue(0)/2.0;
        var gridPosY = (iY * grid_scaleY)-WorldDimension.getValue(1)/2.0;
        xArr.push(gridPosX);
        yArr.push(gridPosY);

        //GridXYZ.setValue(k*3, gridPosX);
        //GridXYZ.setValue(k*3+1, 0.0);
        //GridXYZ.setValue(k*3+2, gridPosY);
        //var IndexInGrid = (GridRes.getValue(1)-iY)*GridRes.getValue(0)-iX;
        var IndexInGrid = GridRes.getValue(1)*iY+iX;

        IndexArr.push(IndexInGrid);
        //GridIndex.setValue(k, IndexInGrid);
        k = k+1;
       }
    }

    GridScaleXZ.setValue(0,grid_scaleX);
    GridScaleXZ.setValue(1,grid_scaleY);

    //Index and Position Sorting to avoid relaoding of Textures
    var deletedIndices = [];
    var newIndices = [];


    if (prevIndexArr != IndexArr){

        for (var i = 0; i < ViewRadius.getValue(0)*8+1; i++){
            if(prevIndexArr.indexOf(IndexArr[i])==-1){
               newIndices.push(i);
            }
            if(IndexArr.indexOf(prevIndexArr[i])==-1){
               deletedIndices.push(i); ;
            }
        }

        for(var j = 0; j < deletedIndices.length; j++){
          prevIndexArr[deletedIndices[j]]  = IndexArr[newIndices[j]];
          prevXArr[deletedIndices[j]]  = xArr[newIndices[j]];
          prevYArr[deletedIndices[j]]  = yArr[newIndices[j]];
        }
    }

    //finaly write sorted array to output
    for (var i = 0; i < ViewRadius.getValue(0)*8+1; i++){
        GridIndex.setValue(i, prevIndexArr[i]);

        GridXYZ.setValue(i*3, prevXArr[i]);
        GridXYZ.setValue(i*3+1, 0.0);
        GridXYZ.setValue(i*3+2, prevYArr[i]);

    }


    }

}
VVVV.Nodes.TerrainGridGame.prototype = new Node();



});
