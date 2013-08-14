// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

VVVV.Types = {}

VVVV.MousePositions = {'_all': {'x': 0.0, 'y': 0.0, 'wheel': 0.0, 'lb': 0.0, 'mb': 0.0, 'rb': 0.0}}

VVVV.Types.Color = function(r, g, b, a) {
  this.rgba = [r, g, b, a];
  
  this.toString = function() {
    return "r="+(r*100)+"% "+"g="+(g*100)+"% "+"b="+(b*100)+"% "+"a="+(a*100)+"%";
  }
}

var PinDirection = { Input : 0,Output : 1,Configuration : 2 };

VVVV.PinTypes.Generic = {
  typeName: "Generic",
  defaultValue: undefined
}

VVVV.Core = {	
  
  Pin: function(pinname,direction, init_values, node, reset_on_disconnect, type) {
    this.direction = direction;
    this.pinname = pinname;
    this.links = [];
    this.values = [];
    this.node = node;
    this.changed = true;
    this.active = false;
    this.reset_on_disconnect = reset_on_disconnect || false;
    this.slavePin = undefined;
    this.masterPin = undefined;
    this.connectionChangedHandlers = {};
    
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
      var that = this;
      if (this.direction==PinDirection.Output) {
        var linkCount = this.links.length;
        for (var j=0; j<linkCount; j++) {
          this.links[j].toPin.setValue(i, v);
        }
      }
      if (this.slavePin) {
        this.slavePin.setValue(i, v);
      }
      if (this.node.isIOBox && this.pinname=='Descriptive Name') {
        if (this.node.parentPatch.domInterface)
          this.node.parentPatch.domInterface.connect(this.node);
        else if (this.node.parentPatch.parentPatch)
          this.node.registerInterfacePin();
      }
    }
    
    this.markPinAsChanged = function() {
      this.changed = true;
      this.node.dirty = true;
      var that = this;
      if (this.direction==PinDirection.Output) {
        var linkCount = this.links.length;
        for (var i=0; i<linkCount; i++) {
          this.links[i].toPin.markPinAsChanged();
        }
      }
      if (this.slavePin) {
        this.slavePin.markPinAsChanged();
      }
    }
    
    this.pinIsChanged = function() {
      var ret = this.changed;
      this.changed = false;
      return ret;
    }
	
    this.isConnected = function() {
      return (this.links.length > 0 || (this.masterPin && this.masterPin.isConnected()));
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
      if (this.direction==PinDirection.Output) {
  	    var linkCount = this.links.length;
        for (var i=0; i<linkCount; i++) {
          this.links[i].toPin.setSliceCount(len);
        }
      }
      if (this.slavePin) {
        this.slavePin.setSliceCount(len);
      }
    }
    
    this.setType = function(newType) {
      if (newType.typeName == this.typeName)
        return;
      var that = this;
      delete this.connectionChangedHandlers['nodepin'];
      delete this.connectionChangedHandlers['webglresource'];
      _(newType.connectionChangedHandlers).each(function(handler, key) {
        that.connectionChangedHandlers[key] = newType.connectionChangedHandlers[key];
      });
      this.typeName = newType.typeName;
      this.defaultValue = newType.defaultValue;
      
      if (this.direction == PinDirection.Input && this.defaultValue) {
        this.setValue(0, this.defaultValue());
        this.setSliceCount(1);
      }
      
      if (newType.reset_on_disconnect!=undefined)
        this.reset_on_disconnect = newType.reset_on_disconnect;
    }
    
    if (type==undefined)
      type = VVVV.PinTypes.Generic;
    this.setType(type);
    
    if (init_values && init_values.length>0) // override PinType's default value with values from constructor, if it isn't []
      this.values = init_values.slice(0); // use slice(0) to create a copy of the array
    
    this.reset = function() {
      console.log('resetting '+this.pinname);
      if (this.defaultValue) {
        this.setValue(0, this.defaultValue());
        this.setSliceCount(1);
      }
      else
        this.values = init_values.slice(0);
      this.markPinAsChanged();
    }
    
    this.connectionChanged = function() {
      var that = this;
      _(this.connectionChangedHandlers).each(function(handler) {
        that.f = handler;
        that.f();
      });
    }
  },
  
  Node: function(id, nodename, parentPatch) {
  
    this.nodename = nodename;
    this.id = id;
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.isIOBox = false;
    this.isShader = false;
    
    this.setupObject = function() { // had to put this into a method to allow Patch to "derive" from Node. Really have to understand this javascript prototype thing some day ...
      this.inputPins = {};
      this.outputPins = {};
      this.invisiblePins = {} ;
	
	    this.defaultPinValues = {};
	  };
	  this.setupObject();
    
    this.auto_evaluate = false;
    this.delays_output = false;
    
    this.dirty = true;
    
    this.parentPatch = parentPatch;
    if (parentPatch)
      this.parentPatch.nodeMap[id] = this;
	  
    this.addDefault = function(pinname, value) {
      this.defaultPinValues[pinname] = value;
    }
    
    this.addInputPin = function(pinname, value, _reserved, reset_on_disconnect, type) {
      pin = new VVVV.Core.Pin(pinname,PinDirection.Input, value, this, reset_on_disconnect, type);
      this.inputPins[pinname] = pin;
      if (this.parentPatch)
        this.parentPatch.pinMap[this.id+'_in_'+pinname] = pin;
      this.applyPinValuesFromXML(pinname);
      return pin;
    }
 
    this.addOutputPin = function(pinname, value, _reserved, type) {
      pin = new VVVV.Core.Pin(pinname,PinDirection.Output, value, this, false, type);
      this.outputPins[pinname] = pin;
      if (this.parentPatch)
        this.parentPatch.pinMap[this.id+'_out_'+pinname] = pin;
      return pin;
    }
    
    this.addInvisiblePin = function(pinname, value) {
      pin = new VVVV.Core.Pin(pinname,PinDirection.Configuration, value, this);
      this.invisiblePins[pinname] = pin;
      this.parentPatch.pinMap[this.id+'_inv_'+pinname] = pin;
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
        case "Color": 
          return this.inputPins["Color Input"];
        case "Node":
          return this.inputPins["Input Node"];
      }
      return undefined;
    }
    
    this.IOBoxOutputPin = function() {
      switch (this.IOBoxType()) {
        case "Value Advanced":
          return this.outputPins["Y Output Value"];
        case "String": 
          return this.outputPins["Output String"];
        case "Color": 
          return this.outputPins["Color Output"];
        case "Node":
          return this.outputPins["Output Node"];
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
      
      if (this.isSubpatch) {
        return "||"+this.nodename.match(/(.+)\.v4p$/)[1];
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
      if (this.height==100 || this.isSubpatch)
        return 18;
      else
        return Math.max(18, this.height/15);
    }
    
    this.getUpstreamNodes = function() {
      var ret = [];
      _(this.inputPins).each(function(p) {
        if (p.links.length>0)
          ret.push(p.links[0].fromPin.node);
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
          else {
            if (p.links[j].toPin.slavePin) {
              // enter subpatch
              ret = ret.concat(p.links[j].toPin.slavePin.node.findDownstreamNodes(name));
            }
            else if (p.links[j].toPin.node.isIOBox && p.links[j].toPin.node.IOBoxOutputPin().slavePin) {
              // leave subpatch
              ret = ret.concat(p.links[j].toPin.node.IOBoxOutputPin().slavePin.node.findDownstreamNodes(name));
            }
            else
              ret = ret.concat(p.links[j].toPin.node.findDownstreamNodes(name));
          }
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
    
    this.applyPinValuesFromXML = function(pinname) {
      if (!this.inputPins[pinname])
        return;
      var pin = this.inputPins[pinname];
      var values = this.defaultPinValues[pinname];
      if (values != undefined) {
        // this checks for the case when complex input pins have a value of "||" when not connected.
        // this should not override the default value set by the node with ""
        if (!pin.reset_on_disconnect || values.length>1 || values[0]!="") {
          for (var i=0; i<values.length; i++) {
            if (pin.values[i]!=values[i])
              pin.setValue(i, values[i]);
          }
          pin.setSliceCount(values.length);
        }
      }
    }
    
    this.registerInterfacePin = function() {
      var that = this;
      if (this.isIOBox) {
        if (this.parentPatch.parentPatch && this.invisiblePins["Descriptive Name"].getValue(0)!="") {
          var pinname = this.invisiblePins["Descriptive Name"].getValue(0);
          this.IOBoxInputPin().connectionChangedHandlers['subpatchpins'] = function() {
            if (this.links.length>0 && this.masterPin) {
               if (VVVV_ENV=='development') console.log('deleting '+pinname+' input pin because node has input connection...');
               for (var i=0; i<this.masterPin.links.length; i++) {
                 this.masterPin.links[i].destroy();
               }
               delete that.parentPatch.inputPins[pinname];
               this.masterPin = undefined;
            }
            if (!that.IOBoxOutputPin().slavePin) {
              if (VVVV_ENV=='development') console.log('interfacing output pin detected: '+pinname);
              var pin = that.parentPatch.outputPins[pinname];
              if (pin==undefined)
                var pin = that.parentPatch.addOutputPin(pinname, that.IOBoxOutputPin().values);
              that.IOBoxOutputPin().slavePin = pin;
              pin.masterPin = that.IOBoxOutputPin();
            }
            else if (that.IOBoxOutputPin().slavePin.pinname!=pinname) { // rename subpatch pin
              if (VVVV_ENV=='development') console.log('renaming '+that.IOBoxOutputPin().slavePin.pinname+" to "+pinname);
              that.parentPatch.outputPins[pinname] = that.parentPatch.outputPins[that.IOBoxOutputPin().slavePin.pinname];
              delete that.parentPatch.outputPins[that.IOBoxOutputPin().slavePin.pinname];
              that.IOBoxOutputPin().slavePin.pinname = pinname;
            }
          }
          this.IOBoxInputPin().connectionChanged();
          
          this.IOBoxOutputPin().connectionChangedHandlers['subpatchpins'] = function() {
            if (this.links.length>0 && this.slavePin) {
               if (VVVV_ENV=='development') console.log('deleting '+pinname+' output pin because node '+that.id+' has output connection...');
               for (var i=0; i<this.slavePin.links.length; i++) {
                 this.slavePin.links[i].destroy();
               }
               delete that.parentPatch.outputPins[pinname];
               this.slavePin = undefined;
            }
            if (!that.IOBoxInputPin().masterPin) {
              if (VVVV_ENV=='development') console.log('interfacing input pin detected: '+pinname);
              var pin = that.parentPatch.inputPins[pinname];
              if (pin==undefined) {
                if (VVVV_ENV=='development') console.log('creating new input pin at parent patch, using IOBox values');
                var pin = that.parentPatch.addInputPin(pinname, that.IOBoxInputPin().values, null, false);
              }
              else {
                slicecount = pin.getSliceCount();
                for (var i=0; i<slicecount; i++) {
                  that.IOBoxInputPin().setValue(i, pin.getValue(i));
                }
                if (slicecount>0)
                  that.IOBoxInputPin().setSliceCount(pin.getSliceCount());
              }
              pin.slavePin = that.IOBoxInputPin();
              that.IOBoxInputPin().masterPin = pin;
            }
            else if (that.IOBoxInputPin().masterPin.pinname!=pinname) { // rename subpatch pin
              console.log('renaming '+that.IOBoxInputPin().masterPin.pinname+" to "+pinname);
              that.parentPatch.inputPins[pinname] = that.parentPatch.inputPins[that.IOBoxInputPin().masterPin.pinname];
              delete that.parentPatch.inputPins[that.IOBoxInputPin().masterPin.pinname];
              that.IOBoxInputPin().masterPin.pinname = pinname;
            }
          }
          this.IOBoxOutputPin().connectionChanged();
        }
      }
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
      this.fromPin.node.parentPatch.linkList.splice(this.fromPin.node.parentPatch.linkList.indexOf(this),1);
    }
  },


  Patch: function(ressource, success_handler, error_handler) {
    
    this.ressource = ressource;
    this.vvvv_version = "45_26.1";
    
    this.pinMap = {};
    this.nodeMap = {};
    this.nodeList = [];
    this.linkList = [];
    
    this.success = success_handler;
    this.error = error_handler;
    
    this.XMLCode = '';
    this.VVVVConnector = undefined;
    
    var print_timing = false;
    
    function splitValues(v) {
      if (v==undefined)
        return [];
      if (this.vvvv_version<="45_26") { // legacy code
        if (/\|/.test(v))
          separator = "|";
        else
          separator = ",";
        return v.split(separator).filter(function(d,i) { return d!=""});
      }
      
      var result = [];
      var currSlice = '';
      var insideValue = false;
      var len = v.length;
      for (var i=0; i<len; i++) {
        if (v[i]==',' && !insideValue) {
          result.push(currSlice);
          currSlice = '';
        }
        else if (v[i]=='|')
          insideValue = !insideValue;
        else
          currSlice += v[i];
      }
      result.push(currSlice);
      return result;
    }
    
    if (this.vvvv_version<="45_26") {
      var oldLinks = {};
      var newLinks = {};
      var oldNodes = {};
      var newNodes = {};
    }
    
    var thisPatch = this;
    
    this.doLoad = function(xml) {
      var p = this;
      do {
        p.dirty = true;
      }
      while (p=p.parentPatch);
      
      var version_match = /^<!DOCTYPE\s+PATCH\s+SYSTEM\s+"(.+)\\(.+)\.dtd/.exec(xml);
      if (version_match)
        thisPatch.vvvv_version = version_match[2].replace(/[a-zA-Z]+/, '_');
      
      // this is kind of a hacky way to determine, if the incoming XML is the complete patch, or a patch change
      var syncmode = 'diff';
      if (/\s<PATCH/.test(xml) || thisPatch.vvvv_version<="45_26") {
        syncmode = 'complete';
        if (VVVV_ENV=='development') console.log('complete: '+this.nodename);
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
        
      var nodesLoading = 0;

      $(xml).find('node').each(function() {
        
        // in case of renaming a node, delete the old one first
        if ($(this).attr('createme')=='pronto' && thisPatch.nodeMap[$(this).attr('id')]!=undefined) {
          var n = thisPatch.nodeMap[$(this).attr('id')];
          if (VVVV_ENV=='development') console.log("node renamed, so deleting node "+n.id+' / '+n.nodename);
          
          _(n.inputPins).each(function(p) {
            _(p.links).each(function (link) {
              link.destroy();
              link.fromPin.connectionChanged();
            });
          })
          
          _(n.outputPins).each(function(p) {
            _(p.links).each(function (link) {
              link.destroy();
              link.toPin.connectionChanged();
              link.toPin.markPinAsChanged();
              if (link.toPin.reset_on_disconnect)
                link.toPin.reset();
            });
          })
          
          thisPatch.nodeList.splice(thisPatch.nodeList.indexOf(n),1);
          delete thisPatch.nodeMap[n.id];
        }
        
        if ($(this).attr('componentmode')=="InABox")
          $bounds = $(this).find('bounds[type="Box"]').first();
        else
          $bounds = $(this).find('bounds[type="Node"]').first();
        
        var nodeExists = thisPatch.nodeMap[$(this).attr('id')]!=undefined;
        if (!nodeExists) {
          nodename = $(this).attr('systemname')!="" ? $(this).attr('systemname') : $(this).attr('nodename');
          if (nodename==undefined)
            return;       
          if (VVVV.NodeLibrary[nodename.toLowerCase()]!=undefined) {
            var n = new VVVV.NodeLibrary[nodename.toLowerCase()]($(this).attr('id'), thisPatch);
            
            // load 3rd party libs, if required for this node
            if (VVVV.NodeLibrary[nodename.toLowerCase()].requirements) {
              thisPatch.pause = true; // pause patch evaluation
              _(VVVV.NodeLibrary[nodename.toLowerCase()].requirements).each(function(libname) {
                if (VVVV.LoadedLibs[libname]===undefined)
                  VVVV.loadScript(VVVV.ThirdPartyLibs[libname], function() {
                    thisPatch.pause = false; // resume patch evaluation
                  });
              });
            }
          }
          else if (/.fx$/.test($(this).attr('filename'))) {
            var n = new VVVV.Nodes.GenericShader($(this).attr('id'), thisPatch);
            n.isShader = true;
            n.shaderFile = $(this).attr('filename').replace(/\\/g, '/').replace(/\.fx$/, '.vvvvjs.fx').replace('lib/nodes/', '');
            n.nodename = nodename;
          }
          else {
            if (/.v4p$/.test($(this).attr('filename'))) {
              thisPatch.pause = true;
              nodesLoading++;
              var n = new VVVV.Core.Patch($(this).attr('filename'),
                function() {
                  thisPatch.pause = false;
                  nodesLoading--;
                  if (VVVV_ENV=='development') console.log(n.nodename+'invoking update links')
                  updateLinks(xml);
                  if (thisPatch.VVVVConnector)
                    thisPatch.VVVVConnector.addPatch(n);
                  if (n.auto_evaluate) {
                    var p = thisPatch;
                    do {
                      p.auto_evaluate = true;
                    }
                    while (p = p.parentPatch);
                  }
                  thisPatch.afterUpdate();
                },
                function() {
                  n.not_implemented = true;
                  VVVV.onNotImplemented(nodename);
                }
              );
              n.setupObject();
              n.isSubpatch = true;
              n.parentPatch = thisPatch;
              n.id = $(this).attr('id');
              thisPatch.nodeMap[n.id] = n;
            }
            else {
              var n = new VVVV.Core.Node($(this).attr('id'), nodename, thisPatch);
              n.not_implemented = true;
              if (syncmode=='diff' && VVVV.Config.auto_undo == true)
                thisPatch.VVVVConnector.sendUndo();
              VVVV.onNotImplemented(nodename);
            }
          }
          if (VVVV_ENV=='development') console.log('inserted new node '+n.nodename);
        }
        else
          n = thisPatch.nodeMap[$(this).attr('id')];
          
        if (n.auto_evaluate) { // as soon as the patch contains a single auto-evaluate node, it is also an auto evaluating subpatch
          var p = thisPatch;
          do {
            p.auto_evaluate = true;
          }
          while (p = p.parentPatch);
        }
          
        if ($(this).attr('deleteme')=='pronto') {
          if (VVVV_ENV=='development') console.log('removing node '+n.id);
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
          if (values!=undefined) {
            if (values.length > 0)
              n.addDefault(pinname, values);
          }
          
          // if the output pin already exists (because the node created it), skip
          if (n.outputPins[pinname]!=undefined)
            return;
            
          // the input pin already exists (because the node created it), don't add it, but set values, if present in the xml
          if (n.inputPins[pinname]!=undefined) {
            if (!n.inputPins[pinname].isConnected()) {
              n.applyPinValuesFromXML(pinname);
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
  		    
          //Check for non implemented nodes
          if (($(this).attr('visible')==1 && $(this).attr('pintype')!='Configuration') || n.isSubpatch) {
            if ($(this).attr('pintype')=="Output" || $(xml).find('link[srcnodeid='+n.id+']').filter("link[srcpinname='"+pinname.replace(/[\[\]]/,'')+"']").length > 0) {
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
            if (VVVV_ENV=='development') console.log('removing node '+n.id);
            thisPatch.nodeList.splice(thisPatch.nodeList.indexOf(n),1);
            delete thisPatch.nodeMap[n.id];
          }
        });
        oldNodes = {};
        _(newNodes).each(function(n, id) {
          oldNodes[id] = n;
        });
      }
    
      if (nodesLoading===0)
        updateLinks(xml);
        
      function updateLinks(xml) {
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
          if (VVVV_ENV=='development') console.log('removing '+link.fromPin.pinname+' -> '+link.toPin.pinname);
          var fromPin = link.fromPin;
          var toPin = link.toPin;
          link.destroy();
          fromPin.connectionChanged();
          toPin.connectionChanged();
          toPin.markPinAsChanged();
          if (toPin.reset_on_disconnect)
            toPin.reset();
        });
        
        $(xml).find('link[deleteme!="pronto"]').each(function() {
          var srcPin = thisPatch.pinMap[$(this).attr('srcnodeid')+'_out_'+$(this).attr('srcpinname')];
          var dstPin = thisPatch.pinMap[$(this).attr('dstnodeid')+'_in_'+$(this).attr('dstpinname')];
          
  				// add pins which are neither defined in the node, nor defined in the xml, but only appeare in the links (this is the case with shaders)
          if (srcPin==undefined && thisPatch.nodeMap[$(this).attr('srcnodeid')])
            srcPin = thisPatch.nodeMap[$(this).attr('srcnodeid')].addOutputPin($(this).attr('srcpinname'), undefined);
          if (dstPin==undefined && thisPatch.nodeMap[$(this).attr('dstnodeid')])
            dstPin = thisPatch.nodeMap[$(this).attr('dstnodeid')].addInputPin($(this).attr('dstpinname'), undefined);
            
          if (srcPin && dstPin) {
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
          }
        });
        
        if (syncmode=='complete') {
          _(oldLinks).each(function(l, key) {
            if (newLinks[key]==undefined) {
              if (VVVV_ENV=='development') console.log('removing '+l.fromPin.pinname+' -> '+l.toPin.pinname);
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
      
    }
    
    this.getSubPatches = function() {
      var ret = [];
      for (var i=0; i<this.nodeList.length; i++) {
        if (this.nodeList[i].isSubpatch) {
          ret.push(this.nodeList[i]);
          ret = ret.concat(this.nodeList[i].getSubPatches());
        }
      }
      return ret;
    }
    
    
    this.afterEvaluate = function() {
      
    }
    
    this.afterUpdate = function() {
      
    }
    
    this.evaluate = function() {
      if (this.pause) // this.pause might be true, if there is a thirdparty lib loaded currently, it will be fase again, when loading is complete
        return;
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
        
        if (node.dirty || node.auto_evaluate || node.isSubpatch) {
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
      this.nodename = ressource;
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
      var that = this;
      VVVV.Editors["Connector"].host = ressource;
      VVVV.Editors["Connector"].enable(this, {
        success: function() {
          if (that.success) that.success();
        },
        error: function() {
          if (that.error) that.error();
        }
      });
    }
    else {
      this.doLoad(ressource);
      if (this.success)
        this.success();
    }
    
    // bind the #-shortcuts
    
    function checkLocationHash() {
      if (!VVVV.Editors["Connector"].isConnected() && (window.location.hash=='#sync/'+thisPatch.ressource || window.location.hash=='#syncandview/'+thisPatch.ressource)) {
        console.log('enabling devel env');
        VVVV.Editors["Connector"].disable();
        VVVV.Editors["Connector"].host = 'ws://localhost';
        VVVV.Editors["Connector"].enable(thisPatch);
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
VVVV.Core.Patch.prototype = new VVVV.Core.Node();