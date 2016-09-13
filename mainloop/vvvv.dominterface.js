
(function($) {

VVVV.Core.DOMInterface = function(patch) {

  var inputConnectors = {};
  var outputConnectors = {};
  patch.domInterface = this;
  
  this.connect = function(node) {
    _(inputConnectors).each(function(ioboxConn, key) {
      if (ioboxConn.node.id == node.id) {
        if (ioboxConn.property_class == "event")
          $(ioboxConn.selector).unbind(ioboxConn.property);
        delete inputConnectors[key];
      }
    });
    _(outputConnectors).each(function(ioboxConn, key) {
      if (ioboxConn.node.id == node.id)
        delete outputConnectors[key];
    });
    
    var match = /([^\/]+)(\/(event|attribute|style)\/(.+))?/.exec(node.invisiblePins["Descriptive Name"].getValue(0));
    if (match==null)
      return;
    var ioboxConn = {
      'selector': match[1],
      'property_class': match[3],
      'property': match[4],
      'values': [],
      'node': node
    }
    if ($(ioboxConn.selector).length == 0)
      return;
    if (node.getUpstreamNodes().length==0)
      inputConnectors[match[0]] = ioboxConn;
    else if (node.getDownstreamNodes().length==0)
      outputConnectors[match[0]] = ioboxConn;
      
    attachEvent(ioboxConn);
  }
  
  function attachEvent(ioboxConn) {
    if (ioboxConn.property_class=="event") {
      var selector = ioboxConn.selector;
      if (selector=='window')
        selector = window;
      if (selector=='document')
        selector = document;
      $(selector).each(function(i) {
        ioboxConn.values[i] = 0;
        $(this).bind(ioboxConn.property, function() {
          ioboxConn.values[i] = 1;
          return false;
        });
      });
    }
  }
  
  var that = this;
  _(patch.nodeList).each(function(n) {
    if (n.isIOBox) {
      if (n.invisiblePins["Descriptive Name"]==undefined)
        return;
      that.connect(n);
      n.IOBoxInputPin().connectionChanged = function() {
        that.connect(n);
      }
    }
  });

  this.populateInputConnectors= function() {
    var that = this;
    var connectorName;
    var ioboxConn;
    for (connectorName in inputConnectors) {
      ioboxConn = inputConnectors[connectorName];
      switch (ioboxConn.property_class) {
        case "event":
          if (ioboxConn.values.length!=ioboxConn.node.IOBoxInputPin().values.length)
            ioboxConn.node.IOBoxInputPin().setSliceCount(ioboxConn.values.length);
          for (var i=0; i<ioboxConn.values.length; i++) {
            if (ioboxConn.node.IOBoxInputPin().values[i]==undefined || ioboxConn.values[i]!=ioboxConn.node.IOBoxInputPin().values[i]) {
              ioboxConn.node.IOBoxInputPin().setValue(i, ioboxConn.values[i]);
            }
          }
          break;
        default:
          that.fetchValuesFromDOM(ioboxConn);
          if (ioboxConn.values.length!=ioboxConn.node.IOBoxInputPin().values.length)
            ioboxConn.node.IOBoxInputPin().setSliceCount(ioboxConn.values.length);
          for (var i=0; i<ioboxConn.values.length; i++) {
            if (ioboxConn.node.IOBoxInputPin().getValue(i)!=ioboxConn.values[i]) {
              ioboxConn.node.IOBoxInputPin().setValue(i, ioboxConn.values[i]);
            }
          }
      }
    }
  }
  
  this.processOutputConnectors= function() {
    var that = this;
    var connectorName;
    for (connectorName in outputConnectors) {
      switch (outputConnectors[connectorName].property_class) {
        //case "event":
        //  for (var i=0; i<ioboxConn.values.length; i++) {
        //    ioboxConn.node.IOBoxInputPin().setValue(i, ioboxConn.values[i]);
        //  }
        //  break;
        default:
          that.setDOMByIOBox(outputConnectors[connectorName]);
      }
    }
    
    // reset event ioboxConnes
    
    for (connectorName in inputConnectors) {
      if (inputConnectors[connectorName].property_class=="event") {
        for (var i=0; i<inputConnectors[connectorName].values.length; i++) {
          inputConnectors[connectorName].values[i] = 0;
        }
      }
    }
  }
  
  
  // helper
  
  this.fetchValuesFromDOM = function(ioboxConn) {
    ioboxConn.values.length = 0;
    $(ioboxConn.selector).each(function(i) {
      var value;
      
      if (ioboxConn.property_class==undefined) {
        switch (this.nodeName) {
          case "INPUT":
            if ($(this).attr('type')=='text')
              value = $(this).val();
            if ($(this).attr('type')=='checkbox')
              value = $(this).attr('checked') ? 1 : 0;
            break;
          default: value = $(this).text();
        }
      }
      
      if (ioboxConn.property_class=="attribute") {
        value = $(this).attr(ioboxConn.property);
      }
      
      if (ioboxConn.property_class=="style") {
        value = $(this).css(ioboxConn.property);
      }
      
      ioboxConn.values[i] = value;
    });
  }
  
  this.setDOMByIOBox= function(ioboxConn) {
    var pin = ioboxConn.node.IOBoxOutputPin();
    if (!pin.pinIsChanged())
      return;
    var values = pin.getValue(0, pin.getSliceCount());
    var elemCount = $(ioboxConn.selector).length;
    if (ioboxConn.property_class==undefined) {
      $(ioboxConn.selector).empty();
      $(ioboxConn.selector).val('');
    }
    for (var i=0; i<Math.max(values.length, elemCount); i++) {
      var j = i%elemCount;
      var k = i%values.length;
      var $elem = $(ioboxConn.selector).eq(j);
      if ($elem.length==0)
        continue;
      if (ioboxConn.property_class==undefined) {
        switch ($elem[0].nodeName) {
          case "INPUT": $elem.val($(ioboxConn.selector).eq(j).val()+values[k]);
            break;
          default: $elem.html($(ioboxConn.selector).eq(j).html()+values[k]);
        }
      }
      
      if (ioboxConn.property_class=="attribute") {
        $elem.attr(ioboxConn.property, values[k]);
      }
      
      if (ioboxConn.property_class=="style") {
        $elem.css(ioboxConn.property, values[k]);
      }
    }
    
  }

}

}(vvvvjs_jquery));
