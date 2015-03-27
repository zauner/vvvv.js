// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

(function($) {

VVVV.Types.HTMLLayer = function(tagName) {

  this.tagName = tagName;
  this.styles = {};
  this.attributes = {};
  if (this.tagName) {
    this.element = $('<'+this.tagName+'>');
    this.element.data('vvvvjslayer', this);
  }
  else
    this.element = undefined;
  this.children = [emptyHTMLLayer];
  this.parent = emptyHTMLLayer;
  this.text = "";
  this.position = 0;
  this.style = defaultHTMLStyle;

  this.set_style_properties = {};

  this.apply = function() {
    if (!this.element)
      return;
    var $el = $(this.element);
    //if (!this.children[0].element)
      $el.text(this.text);
    //else if ($el.text()!="")
    //  $el.text("");
    for (var attrName in this.attributes) {
      $el.attr(attrName, this.attributes[attrName]);
    }

    for (var stylename in this.set_style_properties) {
      if (this.set_style_properties[stylename]==true && !this.style.style_properties[stylename]) {
        $el.css(stylename, "");
        this.set_style_properties[stylename] = false;
      }
    }
    this.style.apply(this);
    
    if (this.parent.tagName) {
      if (this.parent.element[0]!=this.element[0].parentElement) {
        this.parent.element.append(this.element);
      }
    }
    else if (this.element[0].parentElement!=document.body) {
      $('body').append(this.element);
    }

  }

  this.changeTagName = function(tagName) {
    this.tagName = tagName;
    var $newElement = $('<'+this.tagName+'>');
    $newElement.before(this.element);
    this.element.children().detach().appendTo($newElement);
    this.element.remove();
    this.element = $newElement;
  }
  
  this.setPosition = function(pos) {
    this.position = pos;
    if ((this.element.next().length>0 && this.element.next().data('vvvvjslayer') && this.position > this.element.next().data('vvvvjslayer').position)
      || (this.element.prev().length>0 && this.element.prev().data('vvvvjslayer') && this.position < this.element.prev().data('vvvvjslayer').position)) {
      var that = this;
      var i=0;
      var children = this.element.parent().children();
      var found = false;
      for (var i=0; i<children.length; i++) {
        var el = children.eq(i);
        if (that.position < el.data('vvvvjslayer').position || !el.data('vvvvjslayer')) {
          el.before(that.element);
          found = true;
          break;
        }
      }
      if (!found) {
        this.element.parent().append(this.element);
      }
    }
  }
}

var emptyHTMLLayer = new VVVV.Types.HTMLLayer();

VVVV.PinTypes.HTMLLayer = {
  typeName: "HTMLLayer",
  reset_on_disconnect: true,
  defaultValue: function() {
    return emptyHTMLLayer
  }
}

VVVV.Types.HTMLStyle = function() {
  this.style_properties = {};
  this.inherited_properties = {};

  this.set_properties = {};

  this.apply = function(layer) {
    var $el = $(layer.element);
    for (var stylename in this.inherited_properties) {
      $el.css(stylename, this.inherited_properties[stylename]);
      layer.set_style_properties[stylename] = true;
    }
    for (var stylename in this.style_properties) {
      $el.css(stylename, this.style_properties[stylename]);
      layer.set_style_properties[stylename] = true;
    }
  }

  this.copy_properties = function(other_style) {
    for (var stylename in other_style.style_properties) {
      this.inherited_properties[stylename] = other_style.style_properties[stylename];
    }
    for (var stylename in other_style.inherited_properties) {
      this.inherited_properties[stylename] = other_style.inherited_properties[stylename];
    }

    // clear inherited properties which have been removed upstream
    for (var stylename in this.inherited_properties) {
      if (!other_style.style_properties[stylename] && !other_style.inherited_properties[stylename]) {
        delete this.inherited_properties[stylename];
      }
    }
  }
}

var defaultHTMLStyle = new VVVV.Types.HTMLStyle();

VVVV.PinTypes.HTMLStyle = {
  typeName: "HTMLStyle",
  reset_on_disconnect: true,
  defaultValue: function() {
    return defaultHTMLStyle;
  }
}

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
  {nodename: "Checkbox", tagname: "input type='checkbox'", pins: [{name: 'name', value: '', type: VVVV.PinTypes.String, attribute: true, attribute: true}, {name: 'value', value: '1', type: VVVV.PinTypes.String, attribute: true}]},
  {nodename: "RadioButton", tagname: "input type='radio'", pins: [{name: 'name', value: '', type: VVVV.PinTypes.String, attribute: true}, {name: 'value', value: '1', type: VVVV.PinTypes.String, attribute: true}]},
  {nodename: "Button", tagname: "input type='button'", pins: [{name: 'name', value: '', type: VVVV.PinTypes.String, attribute: true}, {name: 'value', value: 'Push me', type: VVVV.PinTypes.String, attribute: true}]},
  //{nodename: "SelectBox", tagname: "select", pins: [{name: 'name', value: '', type: VVVV.PinTypes.String, attribute: true}, {name: 'Option Labels', value: 'Option 1', type: VVVV.PinTypes.String}, {name: 'Option Values', value: '1', type: VVVV.PinTypes.String}, {name: 'Selected Index', value: 0, type: VVVV.PinTypes.Value}]}
  {nodename: "SelectBox", tagname: "select", pins: [{name: 'name', value: '', type: VVVV.PinTypes.String, attribute: true}]},
  {nodename: "SelectOption", tagname: "option", pins: [{name: 'value', value: '', type: VVVV.PinTypes.String, attribute: true}]}
]

element_node_defs.forEach(function(element_node_def) {

  VVVV.Nodes[element_node_def.nodename+"HTML"] = function(id, graph) {
    this.constructor(id, element_node_def.nodename+" (HTML)", graph);

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
    var posIn = this.addInputPin("Element Position", [0], VVVV.PinTypes.Value);
    var attributePins = [];
    var staticAttributePins = [];
    for (var i=0; i<element_node_def.pins.length; i++) {
      if (element_node_def.pins[i].type && element_node_def.pins[i].attribute==true)
        staticAttributePins.push(this.addInputPin(element_node_def.pins[i].name, [element_node_def.pins[i].value], element_node_def.pins[i].type));
      else
        this.addInputPin(element_node_def.pins[i].name, [element_node_def.pins[i].value], element_node_def.pins[i].type)
    }

    var layersOut = this.addOutputPin("Layers Out", [], VVVV.PinTypes.HTMLLayer);

    var layers = [];

    this.initialize = function() {
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
      if (attributeNamesIn.pinIsChanged())
        this.initialize();

      var maxSpreadSize = this.getMaxInputSliceCount();

      for (var i=0; i<maxSpreadSize; i++) {
        if (layers[i]==undefined) {
          layers[i] = new VVVV.Types.HTMLLayer(nameIn ? nameIn.getValue(i) : tagName);
        }

        if (nameIn && layers[i].tagName!=nameIn.getValue(i))
          layers[i].changeTagName(nameIn.getValue(i));

        layers[i].text = textIn.getValue(i);
        layers[i].parent = parentIn.getValue(i);
        for (var j=0; j<attributePins.length; j++) {
          layers[i].attributes[attributePins[j].pinname] = attributePins[j].getValue(i);
        }
        for (var j=0; j<staticAttributePins.length; j++) {
          layers[i].attributes[staticAttributePins[j].pinname] = staticAttributePins[j].getValue(i);
        }

        layers[i].style = styleIn.getValue(i);

        layers[i].apply();
        layers[i].setPosition(posIn.getValue(i));

        layersOut.setValue(i, layers[i]);
      }
      
      // remove untracked elements
      for (var i=maxSpreadSize; i<layers.length; i++) {
        layers[i].element.remove();
      }
      
      layers.length = maxSpreadSize;
      layersOut.setSliceCount(maxSpreadSize);

    }
    
    this.destroy = function() {
      for (var i=0; i<layers.length; i++) {
        layers[i].element.remove();
      }
    }
  }
  VVVV.Nodes[element_node_def.nodename+'HTML'].prototype = new VVVV.Core.Node();
});


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: GetElement (HTML)
 Author(s): Matthias Zauner
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GetElementHTML = function(id, graph) {
  this.constructor(id, "GetElement (HTML)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [],
    credits: [],
    compatibility_issues: []
  };

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
VVVV.Nodes.GetElementHTML.prototype = new VVVV.Core.Node();


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

  var elementIn = this.addInputPin("Element", [], VVVV.PinTypes.HTMLLayer);
  var spaceIn = this.addInputPin("Space", ["Browser Pixels"], VVVV.PinTypes.Enum);
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
      pos.left = (pos.left/window.innerWidth) * 2.0 - 1.0;
      pos.top = ((pos.top/window.innerHeight) * 2.0 - 1.0) * -1;
    }
    xOut.setValue(idx, pos.left);
    yOut.setValue(idx, pos.top);
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
VVVV.Nodes.GetPositionHTML.prototype = new VVVV.Core.Node();

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

  var elementIn = this.addInputPin("Element", [], VVVV.PinTypes.HTMLLayer);
  
  var valueOut = this.addOutputPin("Output", [0], VVVV.PinTypes.String);

  var handlers = [];
  var targets = [];
  
  var setSlices = [];

  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();
    
    var thatNode = this;
    
    if (elementIn.isConnected() && elementIn.getValue(0).tagName!='') {
      for (var i=0; i<maxSpreadSize; i++) {
        if (targets[i]!=undefined && (targets[i]!=elementIn.getValue(i).element[0])) {
          $(targets[i]).unbind("change input paste keyup", handlers[i]);
          handlers[i] = undefined;
        }
        if (handlers[i]==undefined) {
          targets[i] = elementIn.getValue(i).element[0];
          (function(j) {
            handlers[j] = function(e) {
              var v = "";
              if ($(this).prop('tagName')=="SELECT")
                v = $(this).find("option:selected").attr('value');
              else if ($(this).prop('tagName')=="INPUT" && $(this).prop('type')=="checkbox")
                v = $(this).is(":checked") ? $(this).attr('value') : "";
              else if ($(this).prop('tagName')=="INPUT" && $(this).prop('type')=="radio")
                v = $(this).is(":checked") ? $(this).attr('value') : "";
              else if ($(this).prop('tagName')=="INPUT")
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
VVVV.Nodes.GetValueHTML.prototype = new VVVV.Core.Node();


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

    var elementIn = this.addInputPin("Element", [], VVVV.PinTypes.HTMLLayer);
    
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
      
      if (elementIn.isConnected() && elementIn.getValue(0).tagName!='') {
        for (var i=0; i<maxSpreadSize; i++) {
          if (eventIn)
            eventCode = eventIn.getValue(i);
          if (targets[i]!=undefined && (targets[i]!=elementIn.getValue(i).element[0] || eventTypes[i]!=eventCode)) {
            $(targets[i]).unbind(eventTypes[i], handlers[i]);
            handlers[i] = undefined;
          }
          if (handlers[i]==undefined) {
            targets[i] = elementIn.getValue(i).element[0];
            eventTypes[i] = eventCode;
            (function(j) {
              handlers[j] = function(e) {
                setSlices.push(j);
                doReset = false;
              }
            }(i));
            $(targets[i]).bind(eventTypes[i], handlers[i]);
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
  VVVV.Nodes["On"+event_node_def.name+"HTML"].prototype = new VVVV.Core.Node();

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
VVVV.Nodes.StyleHTML.prototype = new VVVV.Core.Node();

var style_node_definitions = [
  {name: "Background", pins: [{name: "background-color", type: VVVV.PinTypes.Color, is_property: true}]},
  {name: "Border", pins: [{name: "border-width", value: 1, unit: "px", type: VVVV.PinTypes.Value, is_property: true}, {name: "border-color", type: VVVV.PinTypes.Color, is_property: true}, {name: "border-style", value: "solid", type: VVVV.PinTypes.Enum, enumOptions: ['solid', 'dashed', 'dotted'], is_property: true}]},
  {name: "Padding", pins: [{name: "padding-left", value: 1, unit: "px", type: VVVV.PinTypes.Value, is_property: true}, {name: "padding-top", value: 1, unit: "px", type: VVVV.PinTypes.Value, is_property: true}, {name: "padding-right", value: 1, unit: "px", type: VVVV.PinTypes.Value, is_property: true}, {name: "padding-bottom", value: 1, unit: "px", type: VVVV.PinTypes.Value, is_property: true}, ]},
  {name: "Margin", pins: [{name: "margin-left", value: 1, unit: "px", type: VVVV.PinTypes.Value, is_property: true}, {name: "margin-top", value: 1, unit: "px", type: VVVV.PinTypes.Value, is_property: true}, {name: "margin-right", value: 1, unit: "px", type: VVVV.PinTypes.Value, is_property: true}, {name: "margin-bottom", value: 1, unit: "px", type: VVVV.PinTypes.Value, is_property: true}, ]},
  {name: "Font", pins: [{name: "color", type: VVVV.PinTypes.Color, is_property: true}, {name: "font-family", value: "inherit", type: VVVV.PinTypes.String, is_property: true}, {name: "font-weight", value: "inherit", type: VVVV.PinTypes.Enum, is_property: true, enumOptions: ["inherit", "normal", "light", "bold"]}, {name: "text-decoration", value: "inherit", type: VVVV.PinTypes.Enum, is_property: true, enumOptions: ["inherit", "none", "underline", "line-through"]}]},
  {name: "FontSize", pins: [{name: "font-size", value: 12, unit: "px", type: VVVV.PinTypes.Value, is_property: true}]}
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
  VVVV.Nodes[style_node_def.name+"HTML"].prototype = new VVVV.Core.Node();
  
});


}(vvvvjs_jquery));
