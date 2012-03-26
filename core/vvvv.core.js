// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

VVVV = {}
VVVV.Types = {}

VVVV.MousePositions = {'_all': {'x': 0.0, 'y': 0.0, 'lb': 0.0, 'mb': 0.0, 'rb': 0.0}}

VVVV.Types.Color = function(r, g, b, a) {
  this.rgba = [r, g, b, a];
  
  this.toString = function() {
    return "r="+(r*100)+"% "+"g="+(g*100)+"% "+"b="+(b*100)+"% "+"a="+(a*100)+"%";
  }
}

var PinDirection = { Input : 0,Output : 1,Configuration : 2 };

VVVV.Core = {	
  
  Pin: function(pinname,direction, values, node, reset_on_disconnect) {
    this.direction = direction;
    this.pinname = pinname;
    this.links = [];
    this.values = values.slice(0); // use slice(0) to create a copy of the array
    this.node = node;
    this.changed = true;
    this.active = false;
    this.reset_on_disconnect = reset_on_disconnect || false;
    
    this.getValue = function(i, binSize) {
      if (!binSize || binSize==1)
        return this.values[i%this.values.length];
      var ret = [];
      for (var j=0; j<binSize; j++) {
        ret.push(this.values[(i*binSize+j)%this.values.length]);
      }
      return ret;
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
      if (this.node.isIOBox && this.pinname=='Descriptive Name' && this.node.patch.domInterface) {
        this.node.patch.domInterface.connect(this.node);
      }
    }
    
    this.markPinAsChanged = function() {
      this.changed = true;
      this.node.dirty = true;
      _(this.links).each(function(l) {
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
      if (this.values.length==len)
        return;
      this.values.length = len;
      this.changed = true;	  
      this.node.dirty = true; 
	   _(this.links).each(function(l) {
        l.toPin.values.length = len;
        l.toPin.changed = true;
        l.toPin.node.dirty = true;
      });
    }
    
    this.reset = function() {
      this.values = values.slice(0);
      this.markPinAsChanged();
    }
    
    this.connectionChanged = function() {
      
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
    
    this.addInputPin = function(pinname, value, _reserved, reset_on_disconnect) {
      pin = new VVVV.Core.Pin(pinname,PinDirection.Input, value, this, reset_on_disconnect);
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
    
    this.findDownstreamNodes = function(name) {
      var ret = [];
    	_(this.outputPins).each(function(p) {
        for (var j=0; j<p.links.length; j++) {
          if (p.links[j].toPin.node.nodename==name)
            ret.push(p.links[j].toPin.node);
          else
            ret = ret.concat(p.links[j].toPin.node.findDownstreamNodes(name));
    	  }
    	});
    	return ret;
    }
    
    this.getMaxInputSliceCount = function() {
      var ret = 0;
      _(this.inputPins).each(function(p) {
        if (p.getSliceCount()>ret)
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
    
    this.destroy = function() {
      this.fromPin.links.splice(this.fromPin.links.indexOf(this), 1);
      this.toPin.links.splice(this.toPin.links.indexOf(this), 1);
      this.fromPin.node.patch.linkList.splice(this.fromPin.node.patch.linkList.indexOf(this));
    }
  },


  Patch: function(ressource, success_handler) {
    
    this.ressource = ressource;
    this.vvvv_version = "45_26.1";
    
    this.pinMap = {};
    this.nodeMap = {};
    this.nodeList = [];
    this.linkList = [];
    
    this.success = success_handler;
    
    this.XMLCode = '';
    this.VVVVConnector = new VVVV.Core.VVVVConnector(this);
    
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
    
    if (this.vvvv_version<="45_26") {
      var oldLinks = {};
      var newLinks = {};
      var oldNodes = {};
      var newNodes = {};
    }
    
    var thisPatch = this;
    
    this.doLoad = function(xml) {
      
      var version_match = /^<!DOCTYPE\s+PATCH\s+SYSTEM\s+"(.+\\)*(.+)\.dtd/.exec(xml);
      if (version_match)
        thisPatch.vvvv_version = version_match[2].replace(/[a-zA-Z]+/, '_');
      
      // this is kind of a hacky way to determine, if the incoming XML is the complete patch, or a patch change
      var syncmode = 'diff';
      if (/\s<PATCH/.test(xml) || thisPatch.vvvv_version<="45_26") {
        syncmode = 'complete';
        console.log('complete');
        thisPatch.XMLCode = xml;
      }
    
      $windowBounds = $(xml).find('bounds[type="Window"]').first();
      if ($windowBounds.length>0) {
        thisPatch.width = $windowBounds.attr('width')/15;
        thisPatch.height = $windowBounds.attr('height')/15;
      }
      else {
        thisPatch.width = 500;
        thisPatch.height = 500;
      }
      
      if (syncmode=='complete')
        newNodes = {};

      $(xml).find('node').each(function() {
        if ($(this).attr('componentmode')=="InABox")
          $bounds = $(this).find('bounds[type="Box"]').first();
        else
          $bounds = $(this).find('bounds[type="Node"]').first();
        
        var nodeExists = thisPatch.nodeMap[$(this).attr('id')]!=undefined;
        if (!nodeExists) {
          nodename = $(this).attr('systemname')!="" ? $(this).attr('systemname') : $(this).attr('nodename');
          if (nodename==undefined)
            return;       
          if (VVVV.NodeLibrary[nodename.toLowerCase()]!=undefined)
            var n = new VVVV.NodeLibrary[nodename.toLowerCase()]($(this).attr('id'), thisPatch);
          else if (/.fx$/.test($(this).attr('filename'))) {
            var n = new VVVV.Nodes.GenericShader($(this).attr('id'), thisPatch);
            n.isShader = true;
            n.shaderFile = $(this).attr('filename').replace(/\\/g, '/').replace(/\.fx$/, '.vvvvjs.fx').replace('lib/nodes/', '');
            n.nodename = nodename;
          }
          else
            var n = new VVVV.Core.Node($(this).attr('id'), nodename, thisPatch);
          console.log('inserted new node '+n.nodename);
        }
        else
          n = thisPatch.nodeMap[$(this).attr('id')];
          
        if ($(this).attr('deleteme')=='pronto') {
          console.log('removing node '+n.id);
          thisPatch.nodeList.splice(thisPatch.nodeList.indexOf(n),1);
          delete thisPatch.nodeMap[n.id];
        }
        
        if ($bounds.length>0) {
          if ($bounds.attr('left')) {
            n.x = $bounds.attr('left')/15;
            n.y = $bounds.attr('top')/15;
            thisPatch.width = Math.max(thisPatch.width, n.x+100);
            thisPatch.height = Math.max(thisPatch.height, n.y+25);
          }
          if ($bounds.attr('width')) {
            n.width = $bounds.attr('width');
            n.height = $bounds.attr('height');
          }
        }
        
        if (/^iobox/.test(n.nodename.toLowerCase()))
          n.isIOBox = true;
		  
        //To add anything which relates to all nodes
        if (!nodeExists)
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
            if (values!=undefined && !n.inputPins[pinname].isConnected()) {
              for (var i=0; i<values.length; i++) {
                if (n.inputPins[pinname].values[i]!=values[i])
                  n.inputPins[pinname].setValue(i, values[i]);
              }
              n.inputPins[pinname].setSliceCount(values.length);
            }
            return;
          }
          
          // the input pin already exists (because the node created it), don't add it, but set values, if present in the xml
          if (n.invisiblePins[pinname]!=undefined) {
            if (values!=undefined) {
              for (var i=0; i<values.length; i++) {
                if (n.invisiblePins[pinname].values[i]!=values[i])
                  n.invisiblePins[pinname].setValue(i, values[i]);
              }
              n.invisiblePins[pinname].setSliceCount(values.length);
            }
            return;
          }
  		    
          //CXheck for non implemented nodes
          if ($(this).attr('visible')==1 && $(this).attr('pintype')!='Configuration') {
            if ($(this).attr('pintype')=="Output" || $(xml).find('link[srcnodeid='+n.id+']').filter('link[srcpinname='+pinname.replace(/[\[\]]/,'')+']').length > 0) {
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
        if (!nodeExists) {
          n.initialize();
          thisPatch.nodeList.push(n);
        }
        
        if (syncmode=='complete')
          newNodes[n.id] = n;
        
      });
      
      if (syncmode=='complete') {
        _(oldNodes).each(function(n, id) {
          if (newNodes[id]==undefined) {
            console.log('removing node '+n.id);
            thisPatch.nodeList.splice(thisPatch.nodeList.indexOf(n),1);
            delete thisPatch.nodeMap[n.id];
          }
        });
        oldNodes = {};
        _(newNodes).each(function(n, id) {
          oldNodes[id] = n;
        });
      }
    
      if (syncmode=='complete')
        newLinks = {};
      
      // first delete marked links 
      $(xml).find('link[deleteme="pronto"]').each(function() {
        var link = false;
        for (var i=0; i<thisPatch.linkList.length; i++) {
          if (thisPatch.linkList[i].fromPin.node.id==$(this).attr('srcnodeid') &&
              thisPatch.linkList[i].fromPin.pinname==$(this).attr('srcpinname') &&
              thisPatch.linkList[i].toPin.node.id==$(this).attr('dstnodeid') &&
              thisPatch.linkList[i].toPin.pinname==$(this).attr('dstpinname')) {
            link = thisPatch.linkList[i];
          }
        }
        try {
          console.log('removing '+link.fromPin.pinname+' -> '+link.toPin.pinname);
          var fromPin = link.fromPin;
          var toPin = link.toPin;
          link.destroy();
          fromPin.connectionChanged();
          toPin.connectionChanged();
          toPin.markPinAsChanged();
          if (toPin.reset_on_disconnect)
            toPin.reset();
        }
        catch (e) { alert("Oh, there went something wrong when deleting the link. Don't worry, your work is safe. You just might want to reload the page."); }
      });
      
      $(xml).find('link[deleteme!="pronto"]').each(function() {
        var srcPin = thisPatch.pinMap[$(this).attr('srcnodeid')+'_'+$(this).attr('srcpinname')];
        var dstPin = thisPatch.pinMap[$(this).attr('dstnodeid')+'_'+$(this).attr('dstpinname')];
        
				// add pins which are neither defined in the node, nor defined in the xml, but only appeare in the links (this is the case with shaders)
        if (srcPin==undefined)
          srcPin = thisPatch.nodeMap[$(this).attr('srcnodeid')].addOutputPin($(this).attr('srcpinname'), undefined);
        if (dstPin==undefined)
          dstPin = thisPatch.nodeMap[$(this).attr('dstnodeid')].addInputPin($(this).attr('dstpinname'), undefined);
          
        var link = false;
        for (var i=0; i<thisPatch.linkList.length; i++) {
          if (thisPatch.linkList[i].fromPin.node.id==srcPin.node.id &&
					    thisPatch.linkList[i].fromPin.pinname==srcPin.pinname &&
							thisPatch.linkList[i].toPin.node.id==dstPin.node.id &&
							thisPatch.linkList[i].toPin.pinname==dstPin.pinname) {
            link = thisPatch.linkList[i];
					}
        }

        if (!link) {
          link = new VVVV.Core.Link(srcPin, dstPin);
          srcPin.connectionChanged();
          dstPin.connectionChanged();
          thisPatch.linkList.push(link);
          for (var i=0; i<srcPin.values.length; i++) {
            dstPin.setValue(i, srcPin.getValue(i));
          }
          dstPin.setSliceCount(srcPin.getSliceCount());
        }
          
        if (syncmode=='complete')
          newLinks[srcPin.node.id+'_'+srcPin.pinname+'-'+dstPin.node.id+'_'+dstPin.pinname] = link;
      });
      
      if (syncmode=='complete') {
        _(oldLinks).each(function(l, key) {
          if (newLinks[key]==undefined) {
            console.log('removing '+l.fromPin.pinname+' -> '+l.toPin.pinname);
            var fromPin = l.fromPin;
            var toPin = l.toPin;
            l.destroy();
            fromPin.connectionChanged();
            toPin.connectionChanged();
            toPin.markPinAsChanged();
            if (toPin.reset_on_disconnect)
              toPin.reset();
          }
        });
        oldLinks = {};
        _(newLinks).each(function(l, key) {
          oldLinks[key] = l;
        });
      }
      
    }
    
    
    this.afterEvaluate = function() {
      
    }
    
    this.afterUpdate = function() {
      
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
    
    // actually load the patch, depending on the type of resource
    
    if (/\.v4p[^<>\s]*$/.test(ressource)) {
      var that = this;
      $.ajax({
        url: ressource,
        type: 'get',
        dataType: 'text',
        success: function(r) {
          that.doLoad(r);
          if (that.success)
            that.success();
          that.afterUpdate();
        }
      });
    }
    else if (/^ws:\/\//.test(ressource)) {
      this.VVVVConnector.host = ressource;
      this.VVVVConnector.enable();
    }
    else {
      this.doLoad(ressource);
      if (this.success)
        this.success();
    }
    
    // bind the #-shortcuts
    
    function checkLocationHash() {
      if (!thisPatch.VVVVConnector.isConnected() && (window.location.hash=='#sync/'+thisPatch.ressource || window.location.hash=='#syncandview/'+thisPatch.ressource)) {
        console.log('enabling devel env');
        thisPatch.VVVVConnector.host = 'ws://localhost';
        thisPatch.VVVVConnector.enable();
      }
      if (!thisPatch.vvvviewer && (window.location.hash=='#view/'+thisPatch.ressource || window.location.hash=='#syncandview/'+thisPatch.ressource)) {
        thisPatch.vvvviewer = new VVVV.VVVViewer(thisPatch);
      }
    }
    checkLocationHash();
    
    $(window).bind('hashchange', function() {
      checkLocationHash();
    });
    
    
  }
  
  
}