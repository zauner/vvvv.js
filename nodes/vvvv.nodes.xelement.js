// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

(function($) {

VVVV.Types.XElement = function() {
  this.name = "root";
  this.data = '';
}

VVVV.PinTypes.XElement = {
  typeName: "XElement",
  reset_on_disconnect: true,
  defaultValue: function() {
    return new VVVV.Types.XElement();
  }
}

VVVV.PinTypes.XAttribute = {
  typeName: "XAttribute",
  reset_on_disconnect: true,
  defaultValue: function() {
    return {};
  }
}

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: AsXElement (JSON)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'herbst'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AsXElementJSON = function(id, graph) {
  this.constructor(id, "AsXElement (JSON)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['herbst'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  // input pins
  var jsonIn = this.addInputPin('JSON', ['{"vvvv.js":"awesome"}'], VVVV.PinTypes.String);

  // output pins
  var elementOut = this.addOutputPin('Output Node', [], VVVV.PinTypes.XElement);
  var successOut = this.addOutputPin('Success', [0], VVVV.PinTypes.Value)

  var element = new VVVV.Types.XElement();
  var success = 0;

  this.evaluate = function() {

    try {
      element.data = JSON.parse(jsonIn.getValue(0));
      success = 1;
    }
    catch (ex) {
      element.data = {};
      success = 0;
    }

    elementOut.setValue(0, element);
    successOut.setValue(0, success);
  }

}
VVVV.Nodes.AsXElementJSON.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Element (XElement Split)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'herbst'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.ElementXElementSplit = function(id, graph) {
  this.constructor(id, "Element (XElement Split)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['herbst'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  // input pins
  var elementIn = this.addInputPin('Element', [], VVVV.PinTypes.XElement);

  // output pins
  var nameOut = this.addOutputPin('Name', [''], VVVV.PinTypes.String);
  var valueOut = this.addOutputPin('Value', [''], VVVV.PinTypes.String);
  var deepValueOut = this.addOutputPin('Deep Value', [''], VVVV.PinTypes.String);
  var childrenOut = this.addOutputPin('Children', [], VVVV.PinTypes.XElement);
  var childrenBinSizeOut = this.addOutputPin('Children Bin Size', [0], VVVV.PinTypes.Value);
  var attributeOut = this.addOutputPin('Attributes', [], VVVV.PinTypes.XAttribute);
  var attributeBinSizeOut = this.addOutputPin('Attributes Bin Size', [0], VVVV.PinTypes.Value);

  this.evaluate = function() {

    var elementCount = elementIn.getSliceCount();
    var childIdx = 0;
    for (var i=0; i<elementCount; i++) {
      var element = elementIn.getValue(i);
      nameOut.setValue(i, element.name);
      var childrenBinSize = 0;
      if (element.data instanceof Array) {
        valueOut.setValue(i, '');
        for (var j=0; j<element.data.length; j++) {
          var c;
          if (childrenOut.getSliceCount()<=childIdx)
            c = new VVVV.Types.XElement();
          else
            c = childrenOut.getValue(childIdx);
          c.name = "item";
          c.data = element.data[j];
          childrenOut.setValue(childIdx, c);
          childIdx++;
          childrenBinSize++;
        }
      }
      else if (typeof element.data == 'object') {
        valueOut.setValue(i, '');
        for (var childName in element.data) {
          var c;
          if (childrenOut.getSliceCount()<=childIdx)
            c = new VVVV.Types.XElement();
          else
            c = childrenOut.getValue(childIdx);
          c.name = childName;
          c.data = element.data[childName];
          childrenOut.setValue(childIdx, c);
          childIdx++;
          childrenBinSize++;
        }
      }
      else {
        valueOut.setValue(i, element.data);
      }
      childrenBinSizeOut.setValue(i, childrenBinSize);
    }

    nameOut.setSliceCount(elementCount);
    valueOut.setSliceCount(elementCount);
    childrenOut.setSliceCount(childIdx);
    childrenBinSizeOut.setSliceCount(elementCount);
  }

}
VVVV.Nodes.ElementXElementSplit.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: GetElements (XElement ByName)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'herbst'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GetElementsByName = function(id, graph) {
  this.constructor(id, "GetElements (XElement ByName)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['herbst'],
    credits: [],
    compatibility_issues: ['no bin size output']
  };

  this.auto_evaluate = false;

  // input pins
  var elementIn = this.addInputPin('Element', [], VVVV.PinTypes.XElement);
  var nameIn = this.addInputPin('Name', ['myChildTagName'], VVVV.PinTypes.String);

  // output pins
  var elementsOut = this.addOutputPin('Elements', [], VVVV.PinTypes.XElement);

  var matchCount = 0;
  function findElementByName(element, name) {
    if (element.data instanceof Array) {
      for (var i=0; i<element.data.length; i++) {
        findElementByName(element.data[i], name);
      }
    }
    else if (typeof element.data == 'object') {
      for (var childName in element.data) {
        if (childName==name) {
          if (elementsOut.getSliceCount()<=matchCount)
            var c = new VVVV.Types.XElement();
          else
            var c = elementsOut.getValue(matchCount);
          c.name = childName;
          c.data = element.data[childName];
          elementsOut.setValue(matchCount, c);
          matchCount++;
        }
        findElementByName(element.data[childName], name);
      }
    }
  }

  this.evaluate = function() {
    var maxSliceCount = this.getMaxInputSliceCount();

    matchCount = 0;
    for (var i=0; i<maxSliceCount; i++) {
      findElementByName(elementIn.getValue(i), nameIn.getValue(i));
    }
    elementsOut.setSliceCount(matchCount);

  }

}
VVVV.Nodes.GetElementsByName.prototype = new VVVV.Core.Node();


}(vvvvjs_jquery));
