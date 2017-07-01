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
 NODE: Element (HTML)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

var element_node_defs = [
  {nodename: "Element", tagname: "div", pins: [], dynamic: true},
  {nodename: "Link", tagname: "a", pins: [{name: 'href', type: VVVV.PinTypes.String, value: '#', attribute: true}]},
  {nodename: "Image", tagname: "img", pins: [{name: 'src', type: VVVV.PinTypes.String, value: '', attribute: true}]},
  {nodename: "TextInput", tagname: "input type='text'", pins: [{name: 'name', value: '', type: VVVV.PinTypes.String, attribute: true}, {name: 'value', value: '', type: VVVV.PinTypes.String, attribute: true}]},
  {nodename: "TextArea", tagname: "textarea", pins: [{name: 'name', value: '', type: VVVV.PinTypes.String, attribute: true}]},
  {nodename: "Checkbox", tagname: "input type='checkbox'", pins: [{name: 'name', value: '', type: VVVV.PinTypes.String, attribute: true, attribute: true}, {name: 'value', value: '1', type: VVVV.PinTypes.String, attribute: true}]},
  {nodename: "RadioButton", tagname: "input type='radio'", pins: [{name: 'name', value: '', type: VVVV.PinTypes.String, attribute: true}, {name: 'value', value: '1', type: VVVV.PinTypes.String, attribute: true}]},
  {nodename: "Button", tagname: "input type='button'", pins: [{name: 'name', value: '', type: VVVV.PinTypes.String, attribute: true}, {name: 'value', value: 'Push me', type: VVVV.PinTypes.String, attribute: true}]},
  {nodename: "RangeSlider", tagname: "input type='range'", pins:[{name: 'name', value: '', type: VVVV.PinTypes.String, attribute: true}, {name: 'value', value: 0, type: VVVV.PinTypes.Value, attribute: true}, {name: 'min', value: 0, type: VVVV.PinTypes.Value, attribute: true}, {name: 'max', value: 10, type: VVVV.PinTypes.Value, attribute: true}, {name: 'step', value: 1, type: VVVV.PinTypes.Value, attribute: true}]},
  //{nodename: "SelectBox", tagname: "select", pins: [{name: 'name', value: '', type: VVVV.PinTypes.String, attribute: true}, {name: 'Option Labels', value: 'Option 1', type: VVVV.PinTypes.String}, {name: 'Option Values', value: '1', type: VVVV.PinTypes.String}, {name: 'Selected Index', value: 0, type: VVVV.PinTypes.Value}]}
  {nodename: "SelectBox", tagname: "select", pins: [{name: 'name', value: '', type: VVVV.PinTypes.String, attribute: true}]},
  {nodename: "SelectOption", tagname: "option", pins: [{name: 'value', value: '', type: VVVV.PinTypes.String, attribute: true}]},
  {nodename: "FileInput", tagname: "input type='file' multiple", pins: [{name: 'name', value: '', type: VVVV.PinTypes.String, attribute: true}]},
  {nodename: "ColorInput", tagname: "input type='color'", pins: [{name: 'name', value: '', type: VVVV.PinTypes.String, attribute: true}, {name: 'value', value: '', type: VVVV.PinTypes.String, attribute: true}]},
  {nodename: "DateInput", tagname: "input type='date'", pins: [{name: 'name', value: '', type: VVVV.PinTypes.String, attribute: true}, {name: 'value', value: '', type: VVVV.PinTypes.String, attribute: true}]}
]

element_node_defs.forEach(function(element_node_def) {

  VVVV.Nodes[element_node_def.nodename+"HTML"] = function(id, graph) {
    this.constructor(id, element_node_def.nodename+" (HTML)", graph);

    this.environments = ['browser'];
    this.auto_nil = false;

    this.meta = {
      authors: ['Matthias Zauner'],
      original_authors: [],
      credits: [],
      compatibility_issues: []
    };

    var attributeNamesIn = this.addInvisiblePin("Attribute Names", [""], VVVV.PinTypes.String);

    var styleIn = this.addInputPin("Style In", [], VVVV.PinTypes.HTMLStyle);
    var tagName ='';
    var nameIn = undefined;
    if (element_node_def.dynamic)
      nameIn = this.addInputPin("Tag Name", ["div"], VVVV.PinTypes.String);
    else
      tagName = element_node_def.tagname;
    var parentIn = this.addInputPin("Parent", [], VVVV.PinTypes.HTMLLayer);
    var textIn = this.addInputPin("Text", [""], VVVV.PinTypes.String);
    //var idIn = this.addInputPin("ID", [""], VVVV.PinTypes.String);
    //var classIn = this.addInputPin("Class", [""], VVVV.PinTypes.String);
    //var posIn = this.addInputPin("Element Position", [0], VVVV.PinTypes.Value);
    var attributePins = [];
    var staticAttributePins = [];
    for (var i=0; i<element_node_def.pins.length; i++) {
      if (element_node_def.pins[i].type && element_node_def.pins[i].attribute==true)
        staticAttributePins.push(this.addInputPin(element_node_def.pins[i].name, [element_node_def.pins[i].value], element_node_def.pins[i].type));
      else
        this.addInputPin(element_node_def.pins[i].name, [element_node_def.pins[i].value], element_node_def.pins[i].type)
    }
    var enabledIn = this.addInputPin("Enabled", [1], VVVV.PinTypes.Value);

    var layersOut = this.addOutputPin("Layers Out", [], VVVV.PinTypes.HTMLLayer);

    var layers = [];

    this.configure = function() {
      var attribNames = [];
      var regex = new RegExp(/([a-z]+)/g);
      var match;
      while (match = regex.exec(attributeNamesIn.getValue(0))) {
        attribNames.push(match[0]);
      }
      for (var i=0; i<attribNames.length; i++) {
        if (!this.inputPins[attribNames[i]]) {
          attributePins.push(this.addInputPin(attribNames[i], [""], VVVV.PinTypes.String));
        }
        else if (this.inputPins[attribNames[i]].unvalidated) {
          attributePins.push(this.inputPins[attribNames[i]]);
          var savedValues = this.inputPins[attribNames[i]].values.slice();
          this.inputPins[attribNames[i]].setType(VVVV.PinTypes.String);
          if (!this.inputPins[attribNames[i]].isConnected())
            this.inputPins[attribNames[i]].values = savedValues;
        }
      }
      for (var i=0; i<attributePins.length; i++) {
        if (attribNames.indexOf(attributePins[i].pinname)<0) {
          this.removeInputPin(attributePins[i].pinname);
          for (var j=0; j<layers.length; j++) {
            delete layers[j].attributes[attributePins[i].pinname];
          }
        }
      }

    }

    this.evaluate = function() {
      var maxSpreadSize = this.getMaxInputSliceCount();

      if (this.hasNilInputs()) {
        for (var i=0; i<layers.length; i++) {
          if (layers[i].element)
            layers[i].disable();
        }
        layers.length = 0;
        layersOut.setSliceCount(0);
        return;
      }

      for (var i=0; i<maxSpreadSize; i++) {
        var fresh = false;

        if (layers[i]==undefined) {
          layers[i] = new VVVV.Types.HTMLLayer(nameIn ? nameIn.getValue(i) : tagName);
          layers[i].originNode = this;
          fresh = true;
        }

        if (enabledIn.getValue(i)>=0.5) {

          if (layers[i].enabled==false && parentIn.getValue(i).enabled) {
            layers[i].enable();
            fresh = true;
          }

          if (layers[i].enabled && !parentIn.getValue(i).enabled)
            layers[i].disable();

          if (layers[i].enabled) {
            if (nameIn && layers[i].tagName!=nameIn.getValue(i))
              layers[i].changeTagName(nameIn.getValue(i));

            if (fresh || textIn.pinIsChanged())
              layers[i].setText(textIn.getValue(i));
            if (fresh || parentIn.pinIsChanged())
              layers[i].setParent(parentIn.getValue(i));
            for (var j=0; j<attributePins.length; j++) {
              if (fresh || attributePins[j].pinIsChanged()) {
                layers[i].setAttribute(attributePins[j].pinname, attributePins[j].getValue(i));
                if (attributePins[j].pinname=="value" && $(layers[i].element).prop('tagName')=="INPUT")
                  $(layers[i].element).change();
              }
            }
            for (var j=0; j<staticAttributePins.length; j++) {
              if (fresh || staticAttributePins[j].pinIsChanged()) {
                layers[i].setAttribute(staticAttributePins[j].pinname, staticAttributePins[j].getValue(i));
                if (staticAttributePins[j].pinname=="value" && $(layers[i].element).prop('tagName')=="INPUT")
                  $(layers[i].element).change();
              }
            }

            if (fresh || styleIn.pinIsChanged())
              layers[i].setStyle(styleIn.getValue(i));
          }
          layers[i].freshlyEnabled = fresh;
        }
        else {
          if (layers[i] && layers[i].enabled==true) {
            layers[i].disable();
          }
        }
        layersOut.setValue(i, layers[i]);
      }

      // remove untracked elements
      for (var i=maxSpreadSize; i<layers.length; i++) {
        if (layers[i].element) {
          layers[i].disable();
        }
      }

      layers.length = maxSpreadSize;
      layersOut.setSliceCount(maxSpreadSize);

    }

    this.destroy = function() {
      for (var i=0; i<layers.length; i++) {
        if (layers[i].enabled)
          layers[i].element.remove();
      }
    }
  }
  VVVV.Nodes[element_node_def.nodename+'HTML'].prototype = new Node();
});


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Group (HTML)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GroupHTML = function(id, graph) {
  this.constructor(id, "Group (HTML)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.environments = ['browser'];

  var parentIn = this.addInputPin("Parent", [], VVVV.PinTypes.HTMLLayer);
  var slotStyleIn = this.addInputPin("Slot Style In", [], VVVV.PinTypes.HTMLStyle);
  var outputCountIn = this.addInvisiblePin("Output Count", [2], VVVV.PinTypes.Value);

  var outPins = [];

  var layers = [];

  this.configure = function() {
    var outputCount = Math.max(2, outputCountIn.getValue(0));
    for (var i=outPins.length; i<outputCount; i++) {
      outPins.push(this.addOutputPin("Element Slot "+(i+1), [], VVVV.PinTypes.HTMLLayer));
    }
    for (var i=outPins.length-1; i>=outputCount; i--) {
      this.removeOutputPin(outPins[i].pinname);
    }
    outPins.length = outputCount;
  }

  this.evaluate = function() {

    var sliceCount = parentIn.getSliceCount();

    for (var i=0; i<sliceCount; i++) {
      for (var j=0; j<outPins.length; j++) {
        var layer = outPins[j].values[i];
        if (!layer)
          layer = new VVVV.Types.HTMLLayer("span");
        if (layer.enabled && !parentIn.getValue(i).enabled)
          layer.disable();
        else if (!layer.enabled && parentIn.getValue(i).enabled)
          layer.enable();
        if (layer.enabled)
          layer.setStyle(slotStyleIn.getValue(0));
        layer.setParent(parentIn.getValue(i));
        outPins[j].setValue(i, layer);
      }
    }

    for (var i=0; i<outPins.length; i++) {
      for (var j=outPins[i].values.length-1; j>=sliceCount; j--) {
        if (outPins[i].values[j].element)
          outPins[i].values[j].element.remove();
      }
      outPins[i].setSliceCount(sliceCount);
    }
  }

  this.destroy = function() {
    for (var i=0; i<outPins.length; i++) {
      for (var j=0; j<outPins[i].values.length; j++) {
        outPins[i].values[j].element.remove();
      }
    }
  }
}
VVVV.Nodes.GroupHTML.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: GetElement (HTML)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GetElementHTML = function(id, graph) {
  this.constructor(id, "GetElement (HTML)", graph);

  this.environments = ['browser'];

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.environments = ['browser'];

  var selectorIn = this.addInputPin("Selector", [""], VVVV.PinTypes.String);
  var parentIn = this.addInputPin("Parent", [], VVVV.PinTypes.HTMLLayer);
  var refreshIn = this.addInputPin("Refresh", [0], VVVV.PinTypes.Value);

  var layersOut = this.addOutputPin("Layers Out", [], VVVV.PinTypes.HTMLLayer);
  var binSizeOut = this.addOutputPin("Bin Size", [-1], VVVV.PinTypes.Value);

  var layers = [];

  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();

    var $parent;
    if (parentIn.isConnected())
      $parent = parentIn.getValue(0).element;
    else
      $parent = $(document);

    var selectorCount = selectorIn.getSliceCount();
    var idx = 0;
    for (var i=0; i<selectorCount; i++) {
      var selector = selectorIn.getValue(i);
      if (selector=="")
        continue;
      var binSize = 0;
      $parent.find(selector).each(function() {
        if (layers[idx]==undefined) {
          layers[idx] = new VVVV.Types.HTMLLayer();
        }
        layers[idx].tagName = $(this).prop('tagName');
        layers[idx].element = $(this);
        layersOut.setValue(idx, layers[idx]);
        idx++;
        binSize++;
      });

      binSizeOut.setValue(i, binSize);
    }

    layers.length = idx;
    layersOut.setSliceCount(idx);
    binSizeOut.setSliceCount(selectorCount);
  }
}
VVVV.Nodes.GetElementHTML.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: GetPosition (HTML)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GetPositionHTML = function(id, graph) {
  this.constructor(id, "GetPosition (HTML)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.auto_nil = false;
  this.environments = ['browser'];

  var elementIn = this.addInputPin("Element", [], VVVV.PinTypes.HTMLLayer);
  var spaceIn = this.addInputPin("Space", ["Document Pixels"], VVVV.PinTypes.Enum);
  spaceIn.enumOptions = ["Document Pixels", "Document [-1, +1]", "Parent Element Pixels"];

  var xOut = this.addOutputPin("X", [0], VVVV.PinTypes.Value);
  var yOut = this.addOutputPin("Y", [0], VVVV.PinTypes.Value);

  var observers = [];
  var targets = [];

  function updatePosition(el, idx) {
    var pos;
    if (spaceIn.getValue(idx)==spaceIn.enumOptions[0] || spaceIn.getValue(idx)==spaceIn.enumOptions[1])
      pos = $(el).offset();
    else
      pos = $(el).position();
    if (spaceIn.getValue(idx)==spaceIn.enumOptions[1]) {
      pos.left = (pos.left/window.outerWidth) * 2.0 - 1.0;
      pos.top = ((pos.top/window.outerHeight) * 2.0 - 1.0) * -1;
    }
    xOut.setValue(idx, pos.left);
    yOut.setValue(idx, pos.top);
  }

  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();

    if (elementIn.isConnected() && !this.hasNilInputs() && elementIn.getValue(0).tagName!='') {
      for (var i=0; i<maxSpreadSize; i++) {
        if (targets[i]!=undefined && elementIn.getValue(i).enabled && targets[i]!=elementIn.getValue(i).element[0]) {
          observers[i].disconnect();
          observers[i] = undefined;
        }
        if (observers[i]==undefined && elementIn.getValue(i).enabled) {
          (function(j) {
            observers[j] = new MutationObserver(function(mutations) {
              updatePosition(targets[j], j);
            })
          }(i));
          targets[i] = elementIn.getValue(i).element[0];
          $(targets[i]).parents().each(function() {
            observers[i].observe(this, {attributes: true, attributeFilter: ['style']});
          });
          observers[i].observe(targets[i], {attributes: true, attributeFilter: ['style']});
        }
        updatePosition(targets[i], i);
      }

      observers.length = maxSpreadSize;
      targets.length = maxSpreadSize;
      xOut.setSliceCount(maxSpreadSize);
      yOut.setSliceCount(maxSpreadSize);
    }
    else {
      observers.forEach(function(o) {
        o.disconnect();
      })
      observers.length = 0;
      targets.length = 0;
      xOut.setValue(0, 0);
      yOut.setValue(0, 0);
      xOut.setSliceCount(1);
      yOut.setSliceCount(1);
    }
  }

  this.destroy = function() {
    observers.forEach(function(o) {
      o.disconnect();
    })
  }
}
VVVV.Nodes.GetPositionHTML.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: SetPosition (HTML)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.PositionHTML = function(id, graph) {
  this.constructor(id, "Position (HTML)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.environments = ['browser'];

  var styleIn = this.addInputPin("Style In", [], VVVV.PinTypes.HTMLStyle);
  //var spaceIn = this.addInputPin("Space", ["Pixels"], VVVV.PinTypes.Enum);
  //spaceIn.enumOptions = ["Pixels", "Document [-1, +1]"];
  var absoluteIn = this.addInputPin("Absolute Position", [1], VVVV.PinTypes.Value);

  var xIn = this.addInputPin("X", [0], VVVV.PinTypes.Value);
  var yIn = this.addInputPin("Y", [0], VVVV.PinTypes.Value);

  var styleOut = this.addOutputPin("Style Out", [], VVVV.PinTypes.HTMLStyle);

  var styles = [];

  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSpreadSize; i++) {
      if (!styles[i]) {
        styles[i] = new VVVV.Types.HTMLStyle();
      }
      styles[i].copy_properties(styleIn.getValue(i));

      if (absoluteIn.getValue(i)>=0.5) {
        styles[i].style_properties['position'] = 'absolute';
        styles[i].style_properties['left'] = xIn.getValue(i)+'px';
        styles[i].style_properties['top'] = yIn.getValue(i)+'px';
        delete styles[i].style_properties['margin-left'];
        delete styles[i].style_properties['margin-right'];
      }
      else {
        delete styles[i].style_properties['position'];
        delete styles[i].style_properties['left'];
        delete styles[i].style_properties['top']
        styles[i].style_properties['margin-left'] = xIn.getValue(i)+'px';
        styles[i].style_properties['margin-top'] = yIn.getValue(i)+'px';
      }

      styleOut.setValue(i, styles[i]);
    }

    styles.length = maxSpreadSize;
    styleOut.setSliceCount(maxSpreadSize);
  }
}
VVVV.Nodes.PositionHTML.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Transform (HTML)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.TransformHTML = function(id, graph) {
  this.constructor(id, "Transform (HTML)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.environments = ['browser'];

  var styleIn = this.addInputPin("Style In", [], VVVV.PinTypes.HTMLStyle);
  var transformIn = this.addInputPin("Transform In", [], VVVV.PinTypes.Transform);

  var styleOut = this.addOutputPin("Style Out", [], VVVV.PinTypes.HTMLStyle);

  var styles = [];

  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();
    var str, j, t;

    for (var i=0; i<maxSpreadSize; i++) {
      if (!styles[i]) {
        styles[i] = new VVVV.Types.HTMLStyle();
      }
      styles[i].copy_properties(styleIn.getValue(i));

      str = 'matrix3d(';
      t = transformIn.getValue(i);
      for (j=0; j<15; j++) {
        str += t[j]+",";
      }
      str += t[j]+")";

      styles[i].style_properties['transform'] = str;

      styleOut.setValue(i, styles[i]);
    }

    styles.length = maxSpreadSize;
    styleOut.setSliceCount(maxSpreadSize);
  }
}
VVVV.Nodes.TransformHTML.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: GetValue (HTML)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GetValueHTML = function(id, graph) {
  this.constructor(id, "GetValue (HTML)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.auto_nil = false;
  this.environments = ['browser'];

  var elementIn = this.addInputPin("Element", [], VVVV.PinTypes.HTMLLayer);

  var valueOut = this.addOutputPin("Output", [0], VVVV.PinTypes.String);

  var handlers = [];
  var targets = [];

  var setSlices = [];

  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();

    var thatNode = this;

    if (elementIn.isConnected() && !this.hasNilInputs() && elementIn.getValue(0).tagName!='') {
      for (var i=0; i<maxSpreadSize; i++) {
        if (targets[i]!=undefined && (!elementIn.getValue(i).enabled || targets[i]!=elementIn.getValue(i).element[0]) || elementIn.getValue(i).freshlyEnabled) {
          $(targets[i]).unbind("change input paste keyup", handlers[i]);
          handlers[i] = undefined;
          elementIn.getValue(i).freshlyEnabled = false;
        }
        if (!elementIn.getValue(i).enabled)
          targets[i] = undefined;
        if (elementIn.getValue(i).enabled && handlers[i]==undefined) {
          targets[i] = elementIn.getValue(i).element[0];
          (function(j) {
            handlers[j] = function(e) {
              var v = "";
              if ($(this).prop('tagName')=="SELECT")
                v = $(this).find("option:selected").attr('value');
              else if ($(this).prop('tagName')=="INPUT" && $(this).prop('type')=="checkbox")
                v = $(this).is(":checked") ? $(this).attr('value') : "";
              else if ($(this).prop('tagName')=="INPUT" && $(this).prop('type')=="radio") {
                if ($(this).attr('name')!="" && $(this).is(':checked')) {
                  $("input[type='radio'][name='"+$(this).attr('name')+"']").not(':checked').trigger('change')
                }
                v = $(this).is(":checked") ? $(this).attr('value') : "";
              }
              else if ($(this).prop('tagName')=="INPUT" || $(this).prop('tagName')=="TEXTAREA")
                v = $(this).val();
              if (v==undefined)
                v = "";
              setSlices.push({sliceIdx: j, value: v});
              thatNode.dirty = true;
            }
          }(i));
          $(targets[i]).bind("change input paste keyup", handlers[i]);
          handlers[i].call(targets[i]);
        }
      }

      handlers.length = maxSpreadSize;
      targets.length = maxSpreadSize;
      valueOut.setSliceCount(maxSpreadSize);
    }
    else {
      for (var i=0; i<targets.length; i++) {
        $(targets[i]).unbind("change input paste keyup", handlers[i]);
      }
      handlers.length = 0;
      targets.length = 0;
      valueOut.setValue(0, "");
      valueOut.setSliceCount(1);
    }

    if (setSlices.length>0) {
      var i = setSlices.length;
      while (i--) {
        valueOut.setValue(setSlices[i].sliceIdx, setSlices[i].value);
      }
      setSlices.length = 0;
      thatNode.dirty = false;
    }
  }

  this.destroy = function() {
    for (var i=0; i<targets.length; i++) {
      $(targets[i]).unbind("change input paste keyup", handlers[i]);
    }
  }
}
VVVV.Nodes.GetValueHTML.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: SetValue (HTML)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SetValueHTML = function(id, graph) {
  this.constructor(id, "SetVAlue (HTML)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  this.environments = ['browser'];

  var elementIn = this.addInputPin("Element", [], VVVV.PinTypes.HTMLLayer);
  var valueIn = this.addInputPin("Value", [''], VVVV.PinTypes.String);
  var doSetIn = this.addInputPin("DoSet", [0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();

    var thatNode = this;

    if (elementIn.isConnected() && elementIn.getValue(0).tagName!='') {
      for (var i=0; i<maxSpreadSize; i++) {
        if (doSetIn.getValue(i)<0.5)
          continue;
        var $el = elementIn.getValue(i);
        if (!$el.enabled)
          continue;
        if ($el.element.prop("type")=="radio") {
          var radiobuttons = undefined;
          if ($el.element.attr('name')!="")
            radiobuttons = $("input[type='radio'][name='"+$el.element.attr('name')+"']");
          else
            radiobuttons = $el.element;
          radiobuttons.each(function() {
            if ($(this).attr('value')==valueIn.getValue(i))
              $(this).attr('checked', 'checked');
            else
              $(this).removeAttr('checked');
            $(this).trigger('change');
          });
        }
        else if ($el.element.prop("type")=="checkbox") {
          if ($el.element.attr('value')==valueIn.getValue(i))
            $el.element.attr('checked', 'checked');
          else
            $el.element.removeAttr('checked');
          $el.element.trigger('change');
        }
        else {
          $el.element.val(valueIn.getValue(i));
          $el.element.trigger('change');
        }
      }
    }
  }

  this.destroy = function() {

  }
}
VVVV.Nodes.SetValueHTML.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: GetFile (HTML)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GetFileHTML = function(id, graph) {
  this.constructor(id, "GetFile (HTML)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };
  this.environments = ['browser'];

  this.auto_nil = false;

  var elementIn = this.addInputPin("Element", [], VVVV.PinTypes.HTMLLayer);

  var fileOut = this.addOutputPin("File", ['No File'], VVVV.PinTypes.HTMLFile);
  var filenameOut = this.addOutputPin("Filename", [''], VVVV.PinTypes.String);
  var filesizeOut = this.addOutputPin("File Size", [0], VVVV.PinTypes.Value);
  var fileCountOut = this.addOutputPin("File Count", [1], VVVV.PinTypes.Value);

  var handlers = [];
  var targets = [];

  var needsUpdate = false;

  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();

    var thatNode = this;

    if (elementIn.isConnected() && !this.hasNilInputs()) {
      for (var i=0; i<maxSpreadSize; i++) {
        if (targets[i]!=undefined && (!elementIn.getValue(i).enabled || targets[i]!=elementIn.getValue(i).element[0]) || elementIn.getValue(i).freshlyEnabled) {
          $(targets[i]).unbind("change", handlers[i]);
          handlers[i] = undefined;
          elementIn.getValue(i).freshlyEnabled = false;
        }
        if (!elementIn.getValue(i).enabled)
          targets[i] = undefined;
        if (elementIn.getValue(i).enabled && handlers[i]==undefined) {
          targets[i] = elementIn.getValue(i).element[0];
          (function(j) {
            handlers[j] = function(e) {
              needsUpdate = true;
              thatNode.dirty = true;
            }
          }(i));
          $(targets[i]).bind("change", handlers[i]);
          $(targets[i]).data("check", "brock");
          handlers[i].call(targets[i]);
        }
      }

      handlers.length = maxSpreadSize;
      targets.length = maxSpreadSize;
    }
    else {
      for (var i=0; i<targets.length; i++) {
        $(targets[i]).unbind("change", handlers[i]);
      }
      handlers.length = 0;
      targets.length = 0;
      fileOut.setValue(0, "No File");
      fileOut.setSliceCount(1);
      filenameOut.setValue(0, '');
      filenameOut.setSliceCount(1);
      filesizeOut.setValue(0, 0);
      filesizeOut.setSliceCount(1);
      fileCountOut.setValue(0, 0);
      fileCountOut.setSliceCount(1);
    }

    if (needsUpdate) {
      var outIdx = 0;
      for (var i=0; i<maxSpreadSize; i++) {
        var fileList = elementIn.getValue(i).element[0].files;
        if (elementIn.getValue(i).enabled && fileList.length>0) {
          var k;
          for (k=0; k<fileList.length; k++) {
            fileOut.setValue(outIdx, fileList[k]);
            filenameOut.setValue(outIdx, fileList[k].name);
            filesizeOut.setValue(outIdx, fileList[k].size);
            outIdx++;
          }
          fileCountOut.setValue(i, k);
        }
        else {
          fileOut.setValue(outIdx, "No File");
          filenameOut.setValue(outIdx, "");
          filesizeOut.setValue(outIdx, 0);
          fileCountOut.setValue(i, 0);
          outIdx++;
        }
      }
      fileOut.setSliceCount(outIdx);
      filenameOut.setSliceCount(outIdx);
      filesizeOut.setSliceCount(outIdx);
      fileCountOut.setSliceCount(maxSpreadSize);
      needsUpdate = false;
      thatNode.dirty = false;
    }
  }

  this.destroy = function() {
    for (var i=0; i<targets.length; i++) {
      $(targets[i]).unbind("change", handlers[i]);
    }
  }
}
VVVV.Nodes.GetFileHTML.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: OnEvent (HTML)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

var event_node_defs = [
  {name: 'Event', code: 'click', dynamic: true},
  {name: 'Click', code: 'click'},
  {name: 'MouseDown', code: 'mousedown'},
  {name: 'MouseUp', code: 'mouseup'},
  {name: 'MouseOver', code: 'mouseover'},
  {name: 'MouseEnter', code: 'mouseenter'},
  {name: 'MouseLeave', code: 'mouseleave'},
  {name: 'Change', code: 'change'},
  {name: 'Focus', code: 'focus'},
  {name: 'Blur', code: 'blur'}
];

event_node_defs.forEach(function(event_node_def) {

  VVVV.Nodes['On'+event_node_def.name+'HTML'] = function(id, graph) {
    this.constructor(id, "On"+event_node_def.name+" (HTML)", graph);

    this.meta = {
      authors: ['Matthias Zauner'],
      original_authors: [],
      credits: [],
      compatibility_issues: []
    };

    this.auto_evaluate = true;
    this.auto_nil = false;
    this.environments = ['browser'];

    var elementIn = this.addInputPin("Element", [], VVVV.PinTypes.HTMLLayer);
    var preventDefaultIn = this.addInputPin("Prevent Default", [0], VVVV.PinTypes.Value);

    var eventCode = '';
    var eventIn = undefined;
    if (event_node_def.dynamic)
      var eventIn = this.addInputPin("Event", ["click"], VVVV.PinTypes.String);
    else
      eventCode = event_node_def.code;

    var onEventOut = this.addOutputPin("OnEvent", [0], VVVV.PinTypes.Value);

    var handlers = [];
    var targets = [];
    var eventTypes = [];

    var setSlices = [];
    var doReset = false;

    this.evaluate = function() {
      var maxSpreadSize = this.getMaxInputSliceCount();

      if (elementIn.isConnected() && !this.hasNilInputs() && elementIn.getValue(0).tagName!='') {
        for (var i=0; i<maxSpreadSize; i++) {
          if (eventIn)
            eventCode = eventIn.getValue(i);
          if (targets[i]!=undefined && (!elementIn.getValue(i).enabled || targets[i]!=elementIn.getValue(i).element[0] || eventTypes[i]!=eventCode)) {
            $(targets[i]).unbind(eventTypes[i], handlers[i]);
            handlers[i] = undefined;
          }
          if (!elementIn.getValue(i).enabled)
            targets[i] = undefined;
          if (elementIn.getValue(i).enabled && handlers[i]==undefined) {
            targets[i] = elementIn.getValue(i).element[0];
            eventTypes[i] = eventCode;
            (function(j) {
              handlers[j] = function(e) {
                setSlices.push(j);
                doReset = false;
                if (preventDefaultIn.getValue(j)>.5) {
                  e.preventDefault();
                  return false;
                }
              }
            }(i));
            $(targets[i]).bind(eventTypes[i], handlers[i]);
            onEventOut.setValue(i, 0);
          }
        }

        handlers.length = maxSpreadSize;
        targets.length = maxSpreadSize;
        eventTypes.length = maxSpreadSize;
        onEventOut.setSliceCount(maxSpreadSize);
      }
      else {
        for (var i=0; i<targets.length; i++) {
          $(targets[i]).unbind(eventTypes[i], handlers[i]);
        }
        handlers.length = 0;
        targets.length = 0;
        onEventOut.setValue(0, 0);
        onEventOut.setSliceCount(1);
      }

      if (doReset) {
        var i = onEventOut.getSliceCount();
        while (i--) {
          onEventOut.setValue(i, 0);
        }
        doReset = false;
      }
      if (setSlices.length>0) {
        var i = setSlices.length;
        while (i--) {
          onEventOut.setValue(setSlices[i], 1);
        }
        setSlices.length = 0;
        doReset = true;
      }
    }

    this.destroy = function() {
      for (var i=0; i<handlers.length; i++) {
        $(targets[i]).unbind(eventTypes[i], handlers[i]);
      }
    }
  }
  VVVV.Nodes["On"+event_node_def.name+"HTML"].prototype = new Node();

});


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Style (HTML)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.StyleHTML = function(id, graph) {
  this.constructor(id, "Style (HTML)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.environments = ['browser'];

  var styleIn = this.addInputPin("Style In", [], VVVV.PinTypes.HTMLStyle);
  var nameIn = this.addInputPin("Property Name", [], VVVV.PinTypes.String);
  var valueIn = this.addInputPin("Property Value", [], VVVV.PinTypes.String);

  var styleOut = this.addOutputPin("Style Out", [], VVVV.PinTypes.HTMLStyle);

  var styles = [];

  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();

    var property_distribution = [];

    for (var i=0; i<maxSpreadSize; i++) {
      if (!styles[i]) {
        styles[i] = new VVVV.Types.HTMLStyle();
      }
      styles[i].copy_properties(styleIn.getValue(i));

      if (nameIn.getValue(i)!="") {
        styles[i].style_properties[nameIn.getValue(i)] = valueIn.getValue(i);
        if (!property_distribution[i])
          property_distribution[i] = {};
        property_distribution[i][nameIn.getValue(i)] = true;
      }
      styleOut.setValue(i, styles[i]);
    }

    // clean style_properties from removed properties
    for (var i=0; i<maxSpreadSize; i++) {
      for (stylename in styles[i].style_properties) {
        if (!property_distribution[i][stylename])
          delete styles[i].style_properties[stylename];
      }
    }

    styleOut.setSliceCount(maxSpreadSize);
  }
}
VVVV.Nodes.StyleHTML.prototype = new Node();

var style_node_definitions = [
  {name: "Background", pins: [{name: "background-color", type: VVVV.PinTypes.Color, is_property: true}]},
  {name: "Border", pins: [{name: "border-width", value: 1, unit: "px", type: VVVV.PinTypes.Value, is_property: true}, {name: "border-color", type: VVVV.PinTypes.Color, is_property: true}, {name: "border-style", value: "solid", type: VVVV.PinTypes.Enum, enumOptions: ['solid', 'dashed', 'dotted'], is_property: true}]},
  {name: "Padding", pins: [{name: "padding-left", value: 1, unit: "px", type: VVVV.PinTypes.Value, is_property: true}, {name: "padding-top", value: 1, unit: "px", type: VVVV.PinTypes.Value, is_property: true}, {name: "padding-right", value: 1, unit: "px", type: VVVV.PinTypes.Value, is_property: true}, {name: "padding-bottom", value: 1, unit: "px", type: VVVV.PinTypes.Value, is_property: true}, ]},
  {name: "Margin", pins: [{name: "margin-left", value: 1, unit: "px", type: VVVV.PinTypes.Value, is_property: true}, {name: "margin-top", value: 1, unit: "px", type: VVVV.PinTypes.Value, is_property: true}, {name: "margin-right", value: 1, unit: "px", type: VVVV.PinTypes.Value, is_property: true}, {name: "margin-bottom", value: 1, unit: "px", type: VVVV.PinTypes.Value, is_property: true}, ]},
  {name: "Font", pins: [{name: "color", type: VVVV.PinTypes.Color, is_property: true}, {name: "font-family", value: "inherit", type: VVVV.PinTypes.String, is_property: true}, {name: "font-weight", value: "inherit", type: VVVV.PinTypes.Enum, is_property: true, enumOptions: ["inherit", "normal", "light", "bold"]}, {name: "text-decoration", value: "inherit", type: VVVV.PinTypes.Enum, is_property: true, enumOptions: ["inherit", "none", "underline", "line-through"]}]},
  {name: "FontSize", pins: [{name: "font-size", value: 12, unit: "px", type: VVVV.PinTypes.Value, is_property: true}]},
  {name: "InlineBox", pins: [{name: "width", value: 100, unit: "px", type: VVVV.PinTypes.Value, is_property: true}, {name: "height", value: 100, unit: "px", type: VVVV.PinTypes.Value, is_property: true},{name: "display", value: "inline-block", type: VVVV.PinTypes.String, is_property: true}]},
]

style_node_definitions.forEach(function(style_node_def) {

  VVVV.Nodes[style_node_def.name+"HTML"] = function(id, graph) {
    this.constructor(id, style_node_def.name+" (HTML)", graph);

    this.meta = {
      authors: ['Matthias Zauner'],
      original_authors: [],
      credits: [],
      compatibility_issues: []
    };

    this.environments = ['browser'];

    var styleIn = this.addInputPin("Style In", [], VVVV.PinTypes.HTMLStyle);

    var propertyPins = [];
    for (var i=0; i<style_node_def.pins.length; i++) {
      var v = [];
      if (style_node_def.pins[i].value)
        v.push(style_node_def.pins[i].value)
      var pin = this.addInputPin(style_node_def.pins[i].name, v, style_node_def.pins[i].type);
      if (style_node_def.pins[i].unit)
        pin.unit = style_node_def.pins[i].unit;
      if (style_node_def.pins[i].enumOptions) {
        pin.enumOptions = [];
        for (var j=0; j<style_node_def.pins[i].enumOptions.length; j++) {
          pin.enumOptions[j] = style_node_def.pins[i].enumOptions[j];
        }
      }
      if (style_node_def.pins[i].is_property)
        propertyPins.push(pin);
    }

    var styleOut = this.addOutputPin("Style Out", [], VVVV.PinTypes.HTMLStyle);

    var styles = [];

    var rgba = [];

    this.evaluate = function() {
      var maxSpreadSize = this.getMaxInputSliceCount();

      var property_distribution = [];

      for (var i=0; i<maxSpreadSize; i++) {
        if (!styles[i]) {
          styles[i] = new VVVV.Types.HTMLStyle();
        }
        styles[i].copy_properties(styleIn.getValue(i));

        for (var j=0; j<propertyPins.length; j++) {
          var v;
          if (propertyPins[j].typeName=="Color") {
            rgba[0] = parseInt(propertyPins[j].getValue(i).rgba[0] * 256);
            rgba[1] = parseInt(propertyPins[j].getValue(i).rgba[1] * 256);
            rgba[2] = parseInt(propertyPins[j].getValue(i).rgba[2] * 256);
            rgba[3] = propertyPins[j].getValue(i).rgba[3];
            v = "rgba("+rgba.join(',')+")";
          }
          else
            v = propertyPins[j].getValue(i);
          if (v!="") {
            if (propertyPins[j].unit)
              v += propertyPins[j].unit;
            styles[i].style_properties[propertyPins[j].pinname] = v;

            if (!property_distribution[i])
              property_distribution[i] = {};
            property_distribution[i][propertyPins[j].pinname] = true;
          }
          else {
            if (property_distribution[i])
              property_distribution[i][propertyPins[j].pinname] = false;
          }
        }
        styleOut.setValue(i, styles[i]);
      }

      // clean style_properties from removed properties
      for (var i=0; i<maxSpreadSize; i++) {
        for (stylename in styles[i].style_properties) {
          if (property_distribution[i] && !property_distribution[i][stylename])
            delete styles[i].style_properties[stylename];
        }
      }

      styleOut.setSliceCount(maxSpreadSize);
    }
  }
  VVVV.Nodes[style_node_def.name+"HTML"].prototype = new Node();

});

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: ApplyStyle (HTML)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.ApplyStyleHTML = function(id, graph) {
  this.constructor(id, "ApplyStyle (HTML)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.environments = ['browser'];

  var styleIn = this.addInputPin("Style", [], VVVV.PinTypes.HTMLStyle);
  var elementIn = this.addInputPin("Element", [], VVVV.PinTypes.HTMLLayer);

  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();

    var element;
    for (var i=0; i<maxSpreadSize; i++) {
      element = elementIn.getValue(i);
      element.style = styleIn.getValue(i);
      element.style.apply(element);
    }
  }
}
VVVV.Nodes.ApplyStyleHTML.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: GetText (HTML)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GetTextHTML = function(id, graph) {
  this.constructor(id, "GetText (HTML)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.environments = ['browser'];

  var elementIn = this.addInputPin("Element", [], VVVV.PinTypes.HTMLLayer);

  var textOut = this.addOutputPin("Text", [''], VVVV.PinTypes.String);

  var observers = [];
  var targets = [];

  function updateText(el, idx) {
    var text = '';
    $(el).contents().each(function() {
      if (this.nodeType==3)
        text += this.data;
    })
    textOut.setValue(idx, text);
  }

  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();

    if (elementIn.isConnected() && elementIn.getValue(0).tagName!='') {
      for (var i=0; i<maxSpreadSize; i++) {
        if (targets[i]!=undefined && targets[i]!=elementIn.getValue(i).element[0]) {
          observers[i].disconnect();
          observers[i] = undefined;
        }
        if (observers[i]==undefined) {
          (function(j) {
            observers[j] = new MutationObserver(function(mutations) {
              updateText(targets[j], j);
            })
          }(i));
          targets[i] = elementIn.getValue(i).element[0];
          observers[i].observe(targets[i], {childList: true, characterData: true});
        }
        updateText(targets[i], i);
      }

      observers.length = maxSpreadSize;
      targets.length = maxSpreadSize;
      textOut.setSliceCount(maxSpreadSize);
    }
    else {
      observers.forEach(function(o) {
        o.disconnect();
      })
      observers.length = 0;
      targets.length = 0;
      textOut.setValue(0, '');
      textOut.setSliceCount(1);
    }
  }

  this.destroy = function() {
    observers.forEach(function(o) {
      o.disconnect();
    })
  }
}
VVVV.Nodes.GetTextHTML.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: SetText (HTML)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SetTextHTML = function(id, graph) {
  this.constructor(id, "SetText (HTML)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.environments = ['browser'];

  var elementIn = this.addInputPin("Element", [], VVVV.PinTypes.HTMLLayer);
  var textIn = this.addInputPin("Text", [], VVVV.PinTypes.String);

  this.evaluate = function() {
    var maxSpreadSize = elementIn.getSliceCount();

    if (!elementIn.isConnected() || elementIn.getValue(0).tagName=='')
      return;

    var e;
    for (var i=0; i<maxSpreadSize; i++) {
      e = elementIn.getValue(i).element;
      if (e.contents().length>0 && e.contents().first()[0].nodeType==3)
        e.contents().first()[0].data = textIn.getValue(0);
      else
        e.prepend(document.createTextNode(textIn.getValue(0)));
    }
  }
}
VVVV.Nodes.SetTextHTML.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: GetAttribute (HTML)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GetAttributeHTML = function(id, graph) {
  this.constructor(id, "GetAttribute (HTML)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.environments = ['browser'];

  var elementIn = this.addInputPin("Element", [], VVVV.PinTypes.HTMLLayer);
  var attributeIn = this.addInputPin("Attribute Name", [''], VVVV.PinTypes.String);
  var binSizeIn = this.addInputPin("Attribute Bin Size", [-1], VVVV.PinTypes.Value);

  var valueOut = this.addOutputPin("Attribute Value", [''], VVVV.PinTypes.String);

  var observers = [];
  var targets = [];
  var attributes = [];
  var slices = [];

  function updateAttributes(el, idx) {
    for (var i=0; i<attributes[idx].length; i++) {
      valueOut.setValue(slices[idx][i], $(targets[idx]).attr(attributes[idx][i]) || $(targets[idx]).prop(attributes[idx][i]) || '');
    }
  }

  this.evaluate = function() {
    var observedAttribsChanged = attributeIn.pinIsChanged() || binSizeIn.pinIsChanged();

    var attrIdx = 0;
    var attrCount = attributeIn.getSliceCount();
    var posBinSize = binSizeIn.getValue(0) >= 0;
    var elementCount = elementIn.getSliceCount();
    if (elementIn.isConnected() && elementIn.getValue(0).tagName!='') {
      for (var i=0; i<elementCount; i++) {
        if (targets[i]!=undefined && (targets[i]!=elementIn.getValue(i).element[0] || observedAttribsChanged)) {
          observers[i].disconnect();
          observers[i] = undefined;
        }
        if (observers[i]==undefined) {
          (function(j) {
            observers[j] = new MutationObserver(function(mutations) {
              updateAttributes(targets[j], j);
            })
          }(i));
          targets[i] = elementIn.getValue(i).element[0];
          if (posBinSize)
            attrCount = binSizeIn.getValue(i);
          attributes[i] = [];
          slices[i] = [];
          for (var j=0; j<attrCount; j++) {
            attributes[i].push(attributeIn.getValue(attrIdx));
            slices[i].push(attrIdx++);
          }
          observers[i].observe(targets[i], {attributes: true, attributeFilter: attributes[i]});
          updateAttributes(targets[i], i);
          valueOut.setSliceCount(attrIdx);
        }
      }

      observers.length = elementCount;
      targets.length = elementCount;
      attributes.length = elementCount;
      slices.length = elementCount;
    }
    else {
      observers.forEach(function(o) {
        o.disconnect();
      })
      observers.length = 0;
      targets.length = 0;
      attributes.length = 0;
      slices.length = 0;
      valueOut.setValue(0, '');
      valueOut.setSliceCount(1);
    }
  }

  this.destroy = function() {
    observers.forEach(function(o) {
      o.disconnect();
    })
  }
}
VVVV.Nodes.GetAttributeHTML.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: SetAttribute (HTML)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SetAttributeHTML = function(id, graph) {
  this.constructor(id, "SetAttribute (HTML)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

  this.environments = ['browser'];

  var elementIn = this.addInputPin("Element", [], VVVV.PinTypes.HTMLLayer);
  var nameIn = this.addInputPin("Attribute Name", [''], VVVV.PinTypes.String);
  var valueIn = this.addInputPin("Attribute Value", [''], VVVV.PinTypes.String);
  var binSizeIn = this.addInputPin("Attribute BinSize", [-1], VVVV.PinTypes.Value);

  this.evaluate = function() {
    var maxSpreadSize = elementIn.getSliceCount();

    if (!elementIn.isConnected() || elementIn.getValue(0).tagName=='')
      return;

    var attrIdx = 0;
    var attrCount = Math.max(nameIn.getSliceCount(), valueIn.getSliceCount());
    var posBinSize = binSizeIn.getValue(0) >= 0;
    var elementCount = elementIn.getSliceCount();

    var e;
    for (var i=0; i<elementCount; i++) {
      e = elementIn.getValue(i).element;
      if (posBinSize)
        attrCount = binSizeIn.getValue(i);
      for (var j=0; j<attrCount; j++) {
        if (nameIn.getValue(attrIdx)!='') {
          e.attr(nameIn.getValue(attrIdx), valueIn.getValue(attrIdx));
          attrIdx++;
        }
      }
    }
  }
}
VVVV.Nodes.SetAttributeHTML.prototype = new Node();


});
