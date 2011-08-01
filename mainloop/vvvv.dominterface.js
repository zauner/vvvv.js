

VVVV.Core.DOMInterface = function(patch) {

  var inputConnectors = {};
  var outputConnectors = {};
  
  _(patch.nodeList).each(function(n) {
    if (n.isIOBox) {
      if (n.invisiblePins["Descriptive Name"]==undefined)
        return;
      var match = /([^\/]+)(\/(event|attribute|style)\/(.+))?/.exec(n.invisiblePins["Descriptive Name"].getValue(0));
      if (match==null)
        return;
      var ioboxConn = {
        'selector': match[1],
        'property_class': match[3],
        'property': match[4],
        'values': [],
        'node': n
      }
      if (n.getUpstreamNodes().length==0)
        inputConnectors[match[0]] = ioboxConn;
      else if (n.getDownstreamNodes().length==0)
        outputConnectors[match[0]] = ioboxConn;
    }
  });

  this.attachEvents= function() {
    var that = this;
    _(inputConnectors).each(function(ioboxConn) {
      if (ioboxConn.property_class=="event") {
        $(ioboxConn.selector).each(function(i) {
          ioboxConn.values[i] = 0;
          $(this).bind(ioboxConn.property, function() {
            ioboxConn.values[i] = 1;
            return false;
          });
        });
      }
    });
  }

  this.populateInputConnectors= function() {
    var that = this;
    _(inputConnectors).each(function(ioboxConn) {
      switch (ioboxConn.property_class) {
        case "event":
          for (var i=0; i<ioboxConn.values.length; i++) {
            if (ioboxConn.node.IOBoxInputPin().values[i]==undefined || ioboxConn.values[i]!=ioboxConn.node.IOBoxInputPin().values[i]) {
              ioboxConn.node.IOBoxInputPin().setValue(i, ioboxConn.values[i]);
            }
          }
          break;
        default:
          that.fetchValuesFromDOM(ioboxConn);
          for (var i=0; i<ioboxConn.values.length; i++) {
            if (ioboxConn.node.IOBoxInputPin().getValue(i)!=ioboxConn.values[i]) {
              ioboxConn.node.IOBoxInputPin().setValue(i, ioboxConn.values[i]);
            }
          }
      }
    });
  }
  
  this.processOutputConnectors= function() {
    var that = this;
    _(outputConnectors).each(function(ioboxConn) {
      switch (ioboxConn.property_class) {
        //case "event":
        //  for (var i=0; i<ioboxConn.values.length; i++) {
        //    ioboxConn.node.IOBoxInputPin().setValue(i, ioboxConn.values[i]);
        //  }
        //  break;
        default:
          that.setDOMByIOBox(ioboxConn);
      }
    });
    
    // reset event ioboxConnes
    
    _(inputConnectors).each(function(ioboxConn) {
      if (ioboxConn.property_class=="event") {
        for (var i=0; i<ioboxConn.values.length; i++) {
          ioboxConn.values[i] = 0;
        }
      }
    });
  }
  
  
  // helper
  
  this.fetchValuesFromDOM = function(ioboxConn) {
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
    if (!ioboxConn.node.IOBoxOutputPin().pinIsChanged())
      return;
    var values = ioboxConn.node.IOBoxInputPin().values;
    var elemCount = $(ioboxConn.selector).length;
    if (ioboxConn.property_class==undefined) {
      $(ioboxConn.selector).empty();
      $(ioboxConn.selector).val('');
    }
    for (var i=0; i<Math.max(values.length, elemCount); i++) {
      var j = i%elemCount;
      var k = i%values.length;
      var $elem = $(ioboxConn.selector).eq(j);
      
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
  
  this.attachEvents();

}
