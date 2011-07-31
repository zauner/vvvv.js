// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

VVVV = {}
VVVV.Types = {}

VVVV.Types.Color = function(r, g, b, a) {
  this.rgba = [r, g, b, a];
  
  this.toString = function() {
    return "r="+(r*100)+"% "+"g="+(g*100)+"% "+"b="+(b*100)+"% "+"a="+(a*100)+"%";
  }
}

VVVV.Core = {

  Pin: function(pinname, values, node) {
    this.pinname = pinname;
    this.links = [];
    this.values = values;
    this.node = node;
    this.changed = true;
    this.active = false;
    
    this.getValue = function(i) {
      return this.values[i%this.values.length];
    }
    
    this.setValue = function(i, v) {
      this.values[i] = v;
      this.changed = true;
      _(this.links).each(function(l) {
        l.toPin.values[i] = v;
        l.toPin.changed = true;
      });
    }
    
    this.pinIsChanged = function() {
      var ret = this.changed;
      this.changed = false;
      return ret;
    }
    
    this.getSliceCount = function() {
      return this.values.length;
    }
	
	this.setSliceCount = function(len) {
      this.values.length = len;	   
	   _(this.links).each(function(l) {
        l.toPin.values.length = len;
        l.toPin.changed = true;
      });
    }
  },
  
  Node: function(id, nodename, patch) {
  
    this.nodename = nodename;
    this.id = id;
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.isIOBox = false;
    this.isShader = false;
    
    this.inputPins = {};
    this.outputPins = {};
    this.invisiblePins = {};
	
	
    
    this.patch = patch;
    if (patch)
      this.patch.nodeMap[id] = this;
    
    this.addInputPin = function(pinname, value) {
      pin = new VVVV.Core.Pin(pinname, value, this);
      this.inputPins[pinname] = pin;
      this.patch.pinMap[this.id+'_'+pinname] = pin;
      return pin;
    }
 
    this.addOutputPin = function(pinname, value) {
      pin = new VVVV.Core.Pin(pinname, value, this);
      this.outputPins[pinname] = pin;
      this.patch.pinMap[this.id+'_'+pinname] = pin;
      return pin;
    }
    
    this.addInvisiblePin = function(pinname, value) {
      pin = new VVVV.Core.Pin(pinname, value, this);
      this.invisiblePins[pinname] = pin;
      this.patch.pinMap[this.id+'_'+pinname] = pin;
      return pin;
    }
    
    this.IOBoxType = function() {
      match = /^IOBox \((.*)\)/.exec(this.nodename);
      if (match && match.length>1)
        return match[1];
      return "";
    }
    
    this.IOBoxInputPin = function() {
      switch (this.IOBoxType()) {
        case "Value Advanced":
          return this.inputPins["Y Input Value"];
        case "String": 
          return this.inputPins["Input String"];
      }
      return undefined;
    }
    
    this.IOBoxOutputPin = function() {
      switch (this.IOBoxType()) {
        case "Value Advanced":
          return this.outputPins["Y Output Value"];
        case "String": 
          return this.outputPins["Output String"];
      }
      return undefined;
    }
    
    this.IOBoxRows = function() {
		if (this.invisiblePins["Rows"])
			return this.invisiblePins["Rows"].getValue(0);
		else
			return 1;
    }
    
    this.isComment = function() {
      return this.isIOBox && _(this.outputPins).size()==0 && this.invisiblePins.length==1
    }
    
    this.label = function() {
      if (this.isIOBox) {
        return this.IOBoxInputPin().getValue(0);
      }
      
      label = this.nodename.replace(/\s\(.+\)/, '');
      switch (label) {
        case "Add": return "+"; 
        case "Subtract": return "-";
        case "Multiply": return "*"; 
        case "Divide": return "/";
        case "EQ": return "=";
        default: return label;
      }
      
    }
    
    this.getWidth = function() {
      var ret;
      if (this.width==100 || this.width==0)
        ret = Math.max(18, (this.label().length+2)*6);
      else
        ret = this.width/15;
      ret = Math.max(ret, (_(this.inputPins).size()-1)*12+4);
      return ret;
    }
    
    this.getHeight = function() {
      if (this.height==100)
        return 18;
      else
        return Math.max(18, this.height/15);
    }
    
    this.getUpstreamNodes = function() {
      var ret = [];
      _(this.inputPins).each(function(p) {
        for (var j=0; j<p.links.length; j++) {
          ret.push(p.links[j].fromPin.node);
        }
      });
      return ret;
    }
    
    this.getDownstreamNodes = function() {
      var ret = [];
      _(this.outputPins).each(function(p) {
        for (var j=0; j<p.links.length; j++) {
          ret.push(p.links[j].toPin.node);
        }
      });
      return ret;
    }
    
    this.getMaxInputSliceCount = function() {
      var ret = 1;
      _(this.inputPins).each(function(p) {
		if (p.values.length == 0) { ret = 0; }
        if (p.values.length>ret && ret > 0)
          ret = p.values.length;
      });
      return ret;
    }
	
	this.setup = function() 
	{
		//Add descriptive name for all nodes
		this.addInvisiblePin("Descriptive Name",[""]);
	}
    
    this.initialize = function() {
		
    }
	   
    this.evaluate = function() {
      var that = this;
      _(this.outputPins).each(function(p) {
        p.setValue(0, "not calculated");
      });
    }

  },
  
  Link: function(fromPin, toPin) {
    this.fromPin = fromPin;
    this.toPin = toPin;
    
    this.fromPin.links.push(this);
    this.toPin.links.push(this);
  },


  Patch: function(ressource, success_handler) {
    this.pinMap = {};
    this.nodeMap = {};
    this.nodeList = [];
    this.linkList = [];
    
    this.success = success_handler;
    
    function splitValues(v) {
      if (v==undefined)
        return [];
      if (/\|/.test(v))
        separator = "|";
      else
        separator = ",";
      return v.split(separator).filter(function(d,i) { return d!=""});
    }
    
    var thisPatch = this;
    
    function doLoad(xml) {
    
      $windowBounds = $(xml).find('bounds[type="Window"]').first();
      if ($windowBounds.length>0) {
        thisPatch.width = $windowBounds.attr('width')/15;
        thisPatch.height = $windowBounds.attr('height')/15;
      }
      else {
        thisPatch.width = 500;
        thisPatch.height = 500;
      }
      
      $(xml).find('node').each(function() {
        if ($(this).attr('componentmode')=="InABox")
          $bounds = $(this).find('bounds[type="Box"]').first();
        else
          $bounds = $(this).find('bounds[type="Node"]').first();
          
        nodename = $(this).attr('systemname')!="" ? $(this).attr('systemname') : $(this).attr('nodename');
        if (nodename==undefined)
          return;
        thisPatch.width = Math.max(thisPatch.width, $bounds.attr('left')/15+100);
        thisPatch.height = Math.max(thisPatch.height, $bounds.attr('top')/15+25);

        if (VVVV.NodeLibrary[nodename]!=undefined)
          var n = new VVVV.NodeLibrary[nodename]($(this).attr('id'), thisPatch);
        else
          var n = new VVVV.Core.Node($(this).attr('id'), nodename, thisPatch);
        n.x = $bounds.attr('left')/15;
        n.y = $bounds.attr('top')/15;
        n.width = $bounds.attr('width');
        n.height = $bounds.attr('height');
        
        if (/^IOBox/.test(nodename))
          n.isIOBox = true;
        if (/\.fx$/.test($(this).attr('nodename')))
          n.isShader = true;
		  
		//To add anything which relates to all nodes
		n.setup();
        
        // PINS
        var that = this;
        $(this).find('pin').each(function() {
          pinname = $(this).attr('pinname');
          values = splitValues($(this).attr('values'));
          
          // if the output pin already exists (because the node created it), skip
          if (n.outputPins[pinname]!=undefined)
            return;
            
          // the input pin already exists (because the node created it), don't add it, but set values, if present in the xml
          if (n.inputPins[pinname]!=undefined) {
            if (values!=undefined)
              n.inputPins[pinname].values = values;
            return;
          }
		  
		  //Also set config (invisible pins)
		  if (n.invisiblePins[pinname]!=undefined) {
            if (values!=undefined)
              n.invisiblePins[pinname].values = values;
            return;
          }
		  
        });
        
        n.initialize();
        thisPatch.nodeList.push(n);
        
      });
    
      // add pins which are either defined in the node, nor defined in the xml, but only appeare in the links (this is the case with shaders)
      $(xml).find('link').each(function() {
        srcPin = thisPatch.pinMap[$(this).attr('srcnodeid')+'_'+$(this).attr('srcpinname')];
        dstPin = thisPatch.pinMap[$(this).attr('dstnodeid')+'_'+$(this).attr('dstpinname')];
        
        if (srcPin==undefined)
          srcPin = thisPatch.nodeMap[$(this).attr('srcnodeid')].addOutputPin($(this).attr('srcpinname'), undefined);
        if (dstPin==undefined)
          dstPin = thisPatch.nodeMap[$(this).attr('dstnodeid')].addInputPin($(this).attr('dstpinname'), undefined);
        
        thisPatch.linkList.push(new VVVV.Core.Link(srcPin, dstPin));
      });
    }
    
    
    this.afterEvaluate = function() {
      
    }
    
    
    this.evaluate = function() {
      var todoNodes = {};
      for (var i=0; i<this.nodeList.length; i++) {
        todoNodes[this.nodeList[i].id] = this.nodeList[i];
      }
      
      function evaluateSubGraph(node) {
      
        //console.log("starting with "+node.nodename);
        var upstreamNodesInvalid = false;
        upstreamNodes = node.getUpstreamNodes();
        _(upstreamNodes).each(function(upnode) {
          //console.log('testing '+upnode.nodename);
          if (todoNodes[upnode.id]!=undefined) {
            upstreamNodesInvalid = true;
            //console.log(upnode.nodename+' is still invalid ..');
          }
        });
        if (upstreamNodesInvalid) {
          //console.log('upstream nodes still invalid');
          return false;
        }
        //console.log('upstream nodes valid, calculating and deleting '+node.nodename);
        
        node.evaluate();
        _(node.inputPins).each(function(inPin) {
          inPin.changed = false;
        });
        
        
        /*
         *_(node.getDownstreamNodes()).each(function(downnode) {
         *  evaluateSubGraph(downnode);
         *});
         */

        
        delete todoNodes[node.id];
        return true;
      }
      
      while (_(todoNodes).size() > 0) {
        _(todoNodes).each(function(n, id, index) {
          evaluateSubGraph(n);
        });
      }
      
      this.afterEvaluate();
      
    }
    
    
    if (/\.v4p$/.test(ressource)) {
      var that = this;
      $.ajax({
        url: ressource,
        type: 'get',
        dataType: 'text',
        success: function(r) {
          doLoad(r);
          if (that.success)
            that.success();
        }
      });
    }
    else {
      doLoad(ressource);
      if (this.success)
        this.success();
    }
    
    
  }
}