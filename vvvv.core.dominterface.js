

VVVV.Core.DOMInterface = {

  populateIOBoxes: function(graph) {
    var that = this;
    _(graph.nodeList).each(function(n) {
      if (n.isIOBox) {
        if (n.getUpstreamNodes().length==0) {
          if (n.inputPins["Descriptive Name"]==undefined)
            return;
          selector = n.inputPins["Descriptive Name"].getValue(0);
          if (selector!="") {
            that.setIOBoxByDOM(selector, n);
          }
        }
      }
    });
  }, 
  
  processOutputIOBoxes: function(graph) {
    var that = this;
    _(graph.nodeList).each(function(n) {
      if (n.getDownstreamNodes().length==0) {
        if (n.isIOBox) {
          if (n.inputPins["Descriptive Name"]==undefined)
            return;
          selector = n.inputPins["Descriptive Name"].getValue(0);
          if (selector!="") {
            that.setDOMByIOBox(selector, n);
          }
        }
      }
    });
  },
  
  
  setIOBoxByDOM: function(selector, node) {
    $(selector).each(function(i) {
      var value;
      switch (this.nodeName) {
        case "INPUT": value = $(this).val();
          break;
        default: value = $(this).text();
      }
      node.IOBoxInputPin().setValue(i, value);
    });
  },
  
  setDOMByIOBox: function(selector, node) {
    var values = node.IOBoxInputPin().values;
    $(selector).each(function(i) {
      switch (this.nodeName) {
        case "INPUT": value = $(this).val(values[i]);
          break;
        default: value = $(this).html(values[i]);
      }
    });
  }

}