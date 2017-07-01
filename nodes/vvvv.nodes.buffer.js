// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }
define(function(require,exports) {

var Node = require('core/vvvv.core.node');
var VVVV = require('core/vvvv.core.defines');

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: AsString (Buffer)
 Author(s): 'Matthias Zauner'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AsStringBuffer = function(id, graph) {
  this.constructor(id, "AsString (Buffer)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  // input pins
  var bufferIn = this.addInputPin('Buffer', [], VVVV.PinTypes.Buffer);
  var encodingIn = this.addInputPin('Encoding', ['utf-8'], VVVV.PinTypes.Enum);
  encodingIn.enumOptions = ['utf-8', 'base64'];

  // output pins
  var stringOut = this.addOutputPin('String', [''], VVVV.PinTypes.String);

  var decoder;

  this.evaluate = function() {
    if (VVVVContext.name=='browser' && encodingIn.pinIsChanged() && encodingIn.getValue(0)!='base64')
      decoder = new TextDecoder(encodingIn.getValue(0));

    if (!bufferIn.isConnected()) {
      stringOut.setSliceCount(1);
      stringOut.setValue(0, "");
      return;
    }

    var maxSliceCount = this.getMaxInputSliceCount();
    var i = maxSliceCount;
    while (i--) {
      if (bufferIn.getValue(i)=="EMPTY BUFFER") {
        stringOut.setValue(i, "");
        continue;
      }
      if (VVVVContext.name=='nodejs')
        stringOut.setValue(i, bufferIn.getValue(i).toString(encodingIn.getValue(i)));
      else {
        if (encodingIn.getValue(i)=='base64') {
          var binary = '';
          var bytes = new Uint8Array( bufferIn.getValue(i) );
          var len = bytes.byteLength;
          for (var j = 0; j < len; j++) {
              binary += String.fromCharCode( bytes[ j ] );
          }
          stringOut.setValue(i, btoa(binary));
        }
        else
          stringOut.setValue(i, decoder.decode(bufferIn.getValue(i)));
      }
    }
    stringOut.setSliceCount(maxSliceCount);
  }

}
VVVV.Nodes.AsStringBuffer.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: AsBuffer (String)
 Author(s): 'Matthias Zauner'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AsBufferString = function(id, graph) {
  this.constructor(id, "AsBuffer (String)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  // input pins
  var stringIn = this.addInputPin('String', [], VVVV.PinTypes.String);
  var encodingIn = this.addInputPin('Encoding', ['utf-8'], VVVV.PinTypes.Enum);
  encodingIn.enumOptions = ['utf-8', 'base64'];

  // output pins
  var bufferOut = this.addOutputPin('Buffer', [], VVVV.PinTypes.Buffer);

  var encoder;

  this.initialize = function() {
    if (VVVVContext.name=='browser')
      encoder = new TextEncoder();
  }

  this.evaluate = function() {
    var maxSliceCount = this.getMaxInputSliceCount();
    var i = maxSliceCount;
    while (i--) {
      if (VVVVContext.name=='nodejs')
        bufferOut.setValue(i, Buffer.from(stringIn.getValue(i), encodingIn.getValue(i)));
      else {
        if (encodingIn.getValue(i)=="base64") {
          var binary_string =  atob(stringIn.getValue(i));
          var len = binary_string.length;
          var bytes = new Uint8Array( len );
          for (var j = 0; j < len; j++)        {
              bytes[j] = binary_string.charCodeAt(j);
          }
          bufferOut.setValue(i, bytes.buffer);
        }
        else
          bufferOut.setValue(i, encoder.encode(stringIn.getValue(i)).buffer);
      }
    }
    bufferOut.setSliceCount(maxSliceCount);
  }

}
VVVV.Nodes.AsBufferString.prototype = new Node();

});
