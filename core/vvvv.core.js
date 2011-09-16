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

var PinDirection = { Input : 0,Output : 1,Configuration : 2 };

VVVV.Core = {	
  
  Pin: function(pinname,direction, values, node) {
    this.direction = direction;
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
      this.node.dirty = true;
      _(this.links).each(function(l) {
        l.toPin.values[i] = v;
        l.toPin.changed = true;
        l.toPin.node.dirty = true;
      });
    }
    
    this.pinIsChanged = function() {
      var ret = this.changed;
      this.changed = false;
      return ret;
    }
	
    this.isConnected = function() {
      return this.links.length > 0 ? true : false;
    }
    
    this.getSliceCount = function() {
      return this.values.length;
    }
	
    this.setSliceCount = function(len) {
      this.values.length = len;
      this.changed = true;	  
      this.node.dirty = true; 
	   _(this.links).each(function(l) {
        l.toPin.values.length = len;
        l.toPin.changed = true;
        l.toPin.node.dirty = true;
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
    this.invisiblePins = {} ;
	
	  this.defaultPinValues = {};
    
    this.auto_evaluate = false;
    this.delays_output = false;
    
    this.dirty = true;
    
    this.patch = patch;
    if (patch)
      this.patch.nodeMap[id] = this;
	  
    this.addDefault = function(pinname, value) {
      this.defaultPinValues[pinname] = value;
    }
    
    this.addInputPin = function(pinname, value) {
      pin = new VVVV.Core.Pin(pinname,PinDirection.Input, value, this);
      this.inputPins[pinname] = pin;
      this.patch.pinMap[this.id+'_'+pinname] = pin;
      if (this.defaultPinValues[pinname] != undefined) {
        pin.values = this.defaultPinValues[pinname];
      }
      return pin;
    }
 
    this.addOutputPin = function(pinname, value) {
      pin = new VVVV.Core.Pin(pinname,PinDirection.Output, value, this);
      this.outputPins[pinname] = pin;
      this.patch.pinMap[this.id+'_'+pinname] = pin;
      return pin;
    }
    
    this.addInvisiblePin = function(pinname, value) {
      pin = new VVVV.Core.Pin(pinname,PinDirection.Configuration, value, this);
      this.invisiblePins[pinname] = pin;
      this.patch.pinMap[this.id+'_'+pinname] = pin;
      if (this.defaultPinValues[pinname] != undefined) {
        pin.values = this.defaultPinValues[pinname];
      }
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
      var ret = 0;
      _(this.inputPins).each(function(p) {
        if (p.values.length>ret)
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
    
    var print_timing = false;
    
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

        if (VVVV.NodeLibrary[nodename.toLowerCase()]!=undefined)
          var n = new VVVV.NodeLibrary[nodename.toLowerCase()]($(this).attr('id'), thisPatch);
        else
          var n = new VVVV.Core.Node($(this).attr('id'), nodename, thisPatch);
        n.x = $bounds.attr('left')/15;
        n.y = $bounds.attr('top')/15;
        n.width = $bounds.attr('width');
        n.height = $bounds.attr('height');
        
        if (/^iobox/.test(nodename.toLowerCase()))
          n.isIOBox = true;
        if (/\.fx$/.test($(this).attr('nodename')))
          n.isShader = true;
		  
        //To add anything which relates to all nodes
        n.setup();
        
        var that = this;

        // PINS
        $(this).find('pin').each(function() {
          var pinname = $(this).attr('pinname');
          var values = splitValues($(this).attr('values'));
		  
          //Get all defaults from xml
          if (n.defaultPinValues[pinname] == undefined) {
            if (values!=undefined) {
              if (values.length > 0)
                n.addDefault(pinname, values);
            }
          }
          
          // if the output pin already exists (because the node created it), skip
          if (n.outputPins[pinname]!=undefined)
            return;
            
          // the input pin already exists (because the node created it), don't add it, but set values, if present in the xml
          if (n.inputPins[pinname]!=undefined) {
            if (values!=undefined)
              n.inputPins[pinname].values = values;
            return;
          }
          
          // the input pin already exists (because the node created it), don't add it, but set values, if present in the xml
          if (n.invisiblePins[pinname]!=undefined) {
            if (values!=undefined)
              n.invisiblePins[pinname].values = values;
            return;
          }
  		    
          //CXheck for non implemented nodes
          if ($(this).attr('visible')==1 || $(this).attr('slicecount')!=undefined) {
            if ($(xml).find('link[srcnodeid='+n.id+']').filter('link[srcpinname='+pinname.replace(/[\[\]]/,'')+']').length > 0) {
              if (n.outputPins[pinname] == undefined) {
                //Add as output list if not already there
                n.addOutputPin(pinname, values);
              }
            }
            else {
              if (n.inputPins[pinname] == undefined && n.invisiblePins[pinname] == undefined) {
                //Add as intput is neither in invisible/input list
                n.addInputPin(pinname, values);
              }
            }
          }
          else {
            if (n.inputPins[pinname] == undefined && n.invisiblePins[pinname] == undefined) {
              //Add as invisible pin
              n.addInvisiblePin(pinname, values);
            }
          }
              
        });
        
        //Initialize node
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
      if (print_timing)
        var start = new Date().getTime();
      var invalidNodes = {};
      var terminalNodes = {}
      for (var i=0; i<this.nodeList.length; i++) {
        if (this.nodeList[i].getDownstreamNodes().length==0 || this.nodeList[i].auto_evaluate || this.nodeList[i].delays_output) {
          terminalNodes[this.nodeList[i].id] = this.nodeList[i];
        }
        invalidNodes[this.nodeList[i].id] = this.nodeList[i];
      }
      if (print_timing)
        console.log('building node maps: '+(new Date().getTime() - start)+'ms')
      
      
      function evaluateSubGraph(node) {
        //console.log("starting with "+node.nodename+" ("+node.id+")");

        upstreamNodes = node.getUpstreamNodes();
        _(upstreamNodes).each(function(upnode) {
          if (invalidNodes[upnode.id]!=undefined && !upnode.delays_output) {
            evaluateSubGraph(upnode);
          }
        });
        
        if (node.dirty || node.auto_evaluate) {
          if (print_timing)
            var start = new Date().getTime();
          node.evaluate();
          if (print_timing)
            console.log(node.nodename+' / '+node.id+': '+(new Date().getTime() - start)+'ms')
          node.dirty = false;
          
          _(node.inputPins).each(function(inPin) {
            inPin.changed = false;
          });
        }
        delete invalidNodes[node.id];
        
        return true;
      }
      
      _(terminalNodes).each(function(n, id, index) {
        //console.log('starting anew '+n.nodename);
        if (invalidNodes[n.id]!=undefined)
          evaluateSubGraph(n);
      });
      
      if (print_timing)
        var start = new Date().getTime();
      this.afterEvaluate();
      if (print_timing)
        console.log('patch rendering: '+(new Date().getTime() - start)+'ms')
      
      print_timing = false;
    }
    
    $(window).keydown(function(e) {
  
      // ctrl + alt + T to print execution times
      if (e.which==84 && e.altKey && e.ctrlKey)
        print_timing = true;
    });
    
    
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