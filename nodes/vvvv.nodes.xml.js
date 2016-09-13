// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

(function($) {


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: XPath (XML)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.XPathXML = function(id, graph) {
  this.constructor(id, "XPath (XML)", graph);
  
  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['XML Index Output Pin not implemented', 'Query Index Output Pin not implemented']
  };
  
  this.auto_evaluate = false;
  
  // input pins
  var xmlinputIn = this.addInputPin('XML Input', ['text'], VVVV.PinTypes.String);
  var xpathqueryIn = this.addInputPin('XPath Query', ['text'], VVVV.PinTypes.String);
  var baseelementIn = this.addInputPin('Base Element', ['text'], VVVV.PinTypes.String);

  // output pins
  var outputOut = this.addOutputPin('Output', ['text'], VVVV.PinTypes.String);
  var xmlindexOut = this.addOutputPin('XML Index', [0], VVVV.PinTypes.Value);
  var queryindexOut = this.addOutputPin('Query Index', [0], VVVV.PinTypes.Value);
  
  var doc;

  this.evaluate = function() {
    var xmlinput = xmlinputIn.getValue(0);
    var xpathquery = xpathqueryIn.getValue(0);
    var baseelement = baseelementIn.getValue(0);

    if (xmlinputIn.pinIsChanged()) {
      doc = new DOMParser().parseFromString(xmlinput,'text/xml');
    }
    var res = doc.evaluate(xpathquery, doc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    var i=0;
    var v;
    while (v = res.iterateNext()) {
      if (v.value)
        outputOut.setValue(i, v.value);
      else if (v.data)
        outputOut.setValue(i, v.data);
      else
        outputOut.setValue(i, "");
      i++;
    }
    
    xmlindexOut.setValue(i, 0);
    queryindexOut.setValue(i, 0);
    
    // you also might want to do stuff like this:
    outputOut.setSliceCount(i);
    xmlindexOut.setSliceCount(1);
    queryindexOut.setSliceCount(1);
  }

}
VVVV.Nodes.XPathXML.prototype = new VVVV.Core.Node();

}(vvvvjs_jquery));