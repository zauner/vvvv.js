

VVVV.Core.DOMInterface = function(graph) {

  var inputIOBoxes = {};
  var outputIOBoxes = {};
  
  _(graph.nodeList).each(function(n) {
    if (n.isIOBox) {
      if (n.inputPins["Descriptive Name"]==undefined)
        return;
      var match = /([^\/]+)(\/(event|attribute|style)\/(.+))?/.exec(n.inputPins["Descriptive Name"].getValue(0));
      if (match==null)
        return;
      var iobox = {
        'selector': match[1],
        'property_class': match[3],
        'property': match[4],
        'values': [],
        'node': n
      }
      if (n.getUpstreamNodes().length==0)
        inputIOBoxes[match[0]] = iobox;
      else if (n.getDownstreamNodes().length==0)
        outputIOBoxes[match[0]] = iobox;
    }
  });

  this.attachEvents= function() {
    var that = this;
    _(inputIOBoxes).each(function(iobox) {
      if (iobox.property_class=="event") {
        $(iobox.selector).each(function(i) {
          iobox.values[i] = 0;
          $(this).bind(iobox.property, function() {
            iobox.values[i] = 1;
            return false;
          });
        });
      }
    });
  }

  this.populateIOBoxes= function() {
    var that = this;
    _(inputIOBoxes).each(function(iobox) {
      switch (iobox.property_class) {
        case "event":
          for (var i=0; i<iobox.values.length; i++) {
            if (iobox.node.IOBoxInputPin().values[i]==undefined || iobox.values[i]!=iobox.node.IOBoxInputPin().values[i]) {
              iobox.node.IOBoxInputPin().setValue(i, iobox.values[i]);
            }
          }
          break;
        default:
          that.fetchValuesFromDOM(iobox);
          for (var i=0; i<iobox.values.length; i++) {
            if (iobox.node.IOBoxInputPin().getValue(i)!=iobox.values[i]) {
              iobox.node.IOBoxInputPin().setValue(i, iobox.values[i]);
            }
          }
      }
    });
  }
  
  this.processOutputIOBoxes= function() {
    var that = this;
    _(outputIOBoxes).each(function(iobox) {
      switch (iobox.property_class) {
        //case "event":
        //  for (var i=0; i<iobox.values.length; i++) {
        //    iobox.node.IOBoxInputPin().setValue(i, iobox.values[i]);
        //  }
        //  break;
        default:
          that.setDOMByIOBox(iobox);
      }
    });
    
    // reset event ioboxes
    
    _(inputIOBoxes).each(function(iobox) {
      if (iobox.property_class=="event") {
        for (var i=0; i<iobox.values.length; i++) {
          iobox.values[i] = 0;
        }
      }
    });
  }
  
  
  // helper
  
  this.fetchValuesFromDOM = function(iobox) {
    $(iobox.selector).each(function(i) {
      var value;
      
      if (iobox.property_class==undefined) {
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
      
      if (iobox.property_class=="attribute") {
        value = $(this).attr(iobox.property);
      }
      
      if (iobox.property_class=="style") {
        value = $(this).css(iobox.property);
      }
      
      iobox.values[i] = value;
    });
  }
  
  this.setDOMByIOBox= function(iobox) {
    if (!iobox.node.IOBoxOutputPin().pinIsChanged())
      return;
    var values = iobox.node.IOBoxInputPin().values;
    var elemCount = $(iobox.selector).length;
    if (iobox.property_class==undefined)
      $(iobox.selector).empty();
    for (var i=0; i<Math.max(values.length, elemCount); i++) {
      var j = i%elemCount;
      var k = i%values.length;
      
      if (iobox.property_class==undefined) {
        switch (this.nodeName) {
          case "INPUT": $(iobox.selector).eq(j).val($(iobox.selector).eq(j).val()+values[k]);
            break;
          default: $(iobox.selector).eq(j).html($(iobox.selector).eq(j).html()+values[k]);
        }
      }
      
      if (iobox.property_class=="attribute") {
        $(iobox.selector).eq(j).attr(iobox.property, values[k]);
      }
      
      if (iobox.property_class=="style") {
        $(iobox.selector).eq(j).css(iobox.property, values[k]);
      }
    }
    
  }
  
  this.attachEvents();

}
