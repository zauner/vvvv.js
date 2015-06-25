// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

(function($) {

VVVV.MousePositions = {'_all': {'x': [0.0], 'y': [0.0], 'wheel': [0.0], 'lb': [0.0], 'mb': [0.0], 'rb': [0.0]}}

/**
 * @const
 * @property {Integer} Input 0
 * @property {Integer} Output 1
 * @property {Integer} Configuration 2
 */
VVVV.PinDirection = { Input : 0,Output : 1,Configuration : 2 };

/**
 * The default pin type, used if no further specified
 * @memberof VVVV.PinTypes
 * @mixin
 * @property {String} typeName Generic
 * @property {Boolean} reset_on_disconnect true
 * @property {String} defaultValue '0'
 */
VVVV.PinTypes.Generic = {
  typeName: "Generic",
  reset_on_disconnect: true,
  defaultValue: function() { return '0' }
}

/**
 * Value Pin Type
 * @memberof VVVV.PinTypes
 * @mixin
 * @property {String} typeName Value
 * @property {Boolean} reset_on_disconnect false
 * @property {String} defaultValue 0
 * @property {Boolean} primitive true
 */
VVVV.PinTypes.Value = {
  typeName: "Value",
  reset_on_disconnect: false,
  defaultValue: function() { return 0 },
  primitive: true
}

/**
 * String Pin Type
 * @memberof VVVV.PinTypes
 * @mixin
 * @property {String} typeName String
 * @property {Boolean} reset_on_disconnect false
 * @property {String} defaultValue ''
 * @property {Boolean} primitive true
 */
VVVV.PinTypes.String = {
  typeName: "String",
  reset_on_disconnect: false,
  defaultValue: function() { return '' },
  primitive: true
}

/**
 * Enum Pin Type
 * @memberof VVVV.PinTypes
 * @mixin
 * @property {String} typeName Enum
 * @property {Boolean} reset_on_disconnect false
 * @property {String} defaultValue ''
 * @property {Boolean} primitive true
 */
VVVV.PinTypes.Enum = {
  typeName: "Enum",
  reset_on_disconnect: false,
  defaultValue: function() { return '' },
  primitive: true
}

/**
 * Contains various unsorted helper methods
 * @namespace
 */
VVVV.Helpers = {

  /**
   * Translates a verbous operator (from the nodename) to a symbol
   * @param {String} l The verbous operator
   * @return {String} the operator symbol
   */
  translateOperators: function(l) {
    l = l.replace("Add", "+");
    l = l.replace("Subtract", "-");
    l = l.replace("Multiply", "*");
    l = l.replace("Divide", "/");
    l = l.replace("EQ", "=");
    l = l.replace("GT", ">");
    l = l.replace("GTE", ">=");
    l = l.replace("LT", "<");
    l = l.replace("LTE", "<=");
    return l;
  },

  /**
   * Translates a relative path to an absolute one (usable by the browser) and replaces variables %VVVV% and %PAGE%
   * @param {String} path the relative path
   * @param {VVVV.Core.Patch} patch the patch which the above path is relative to
   * @return {String} the absolute path, usable by the browser
   */
  prepareFilePath: function(path, patch) {
    path = path.replace(/\\/g, '/');
    if (path.match(/^%VVVV%/)) // VVVV.js system path
      return path.replace('%VVVV%', VVVV.Root);

    if (path.match(/^%PAGE%/)) // hosting HTML page path
      return path.replace('%PAGE%', location.pathname);

    if (path.match(/^(\/|.+:\/\/)/)) // path starting with / or an URL protocol (http://, ftp://, ..)
      return path;

    if (patch)
      return patch.getAbsolutePath()+path;
    else
      return path;
  },

  /**
   * Helper function that helps creating a dynamic number of input pins
   * see e.g. Add (Value) for usage
   * @param {VVVV.Core.Node} node the node the pins should be added to/removed from
   * @param {Array} pins the array which holds the VVVV.Core.Pin objects; will be modified by the function
   * @param {Integer} count the desired number of pins
   * @param {Function} create_callback the function which actually creates the pin
   */
  dynamicPins: function(node, pins, count, create_callback) {
    var currentCount = pins.length;
    for (var i=currentCount; i<count; i++) {
      pins[i] = create_callback.call(node, i);
    }
    for (var i=count; i<pins.length; i++) {
      node.removeInputPin(pins[i].pinname);
    }
    pins.length = count;
    node.parentPatch.afterUpdate();
  }
}

/** @namespace */
VVVV.Core = {

  /**
   * @class
   * @constructor
   * @param {String} pinname Pin Name
   * @param {String} direction see {@link VVVV.PinDirection}
   * @param {Array} init_values the array of initial values
   * @param {VVVV.Core.Node} node the node this pin is attached to
   * @param {Object} [type] the PinType, default is {@link VVVV.PinTypes.Generic), see {@link VVVV.PinTypes}
   */
  Pin: function(pinname,direction, init_values, node, type) {
    /** see {@link VVVV.PinDirection} */
    this.direction = direction;
    /** @member */
    this.pinname = pinname;
    /** @member */
    this.links = [];
    /** @member */
    this.values = [];
    this.values.changedAt = 0;
    /** @member */
    this.node = node;
    /** @member */
    this.active = false;
    this.reset_on_disconnect = false;
    /** if the pin is a subpatch's input pin, the slavePin is the corresponding IOBox input pin INSIDE the subpatch */
    this.slavePin = undefined;
    /** if the pin is a subpatch's output pin, the masterPin is the corresponding IOBox output pin INSIDE the subpatch */
    this.masterPin = undefined;
    /** contains a row of named callback functions, each fired if the pin's connection has changed */
    this.connectionChangedHandlers = {};
    /** contains the options used if the pin is of type {@link VVVV.PinTypes.Enum} */
    this.enumOptions = [];

    /**
     * retreives pin's slices
     * @param {Integer} i the slice/bin number
     * @param {Integer} [binSize] the bin size, default is 1
     * @return if binSize is 1, the value of the slice is returned; if binSize is > 1, an array with the slice values is returned
     */
    this.getValue = function(i, binSize) {
      if (!binSize || binSize==1)
        return this.values[i%this.values.length];
      var ret = [];
      for (var j=0; j<binSize; j++) {
        ret.push(this.values[(i*binSize+j)%this.values.length]);
      }
      return ret;
    }

    /**
     * set a pin's slice value; if an output pin, it also sets the values of connected input pins. If the pin is a subpatch input pin, it also sets the slavePin inside the subpatch
     * @param {Integer} i the slice number
     * @param v the value to set
     * @param {Boolean} [stopPropagation] default is false; if true, the function does not update slavePins to avoid infinite loops; this parameter should not be used in node implementations
     */
    this.setValue = function(i, v) {
      if (this.direction==VVVV.PinDirection.Output || !this.isConnected()) {
        if (!this.typeName || !VVVV.PinTypes[this.typeName].primitive || this.values[i]!=v)
          this.markPinAsChanged();
        this.values[i] = v;
      }

      if (this.node.isIOBox && this.pinname=='Descriptive Name' && this.node.invisiblePins["Descriptive Name"]) {
        if (this.node.parentPatch.domInterface)
          this.node.parentPatch.domInterface.connect(this.node);
        else if (this.node.parentPatch.parentPatch)
          this.node.registerInterfacePin();
      }
    }

    /**
     * used to mark a pin as changed without actually using {@link VVVV.Core.Pin#setValue}
     */
    this.markPinAsChanged = function() {
      if (this.node.parentPatch.mainloop)
        this.values.changedAt = this.node.parentPatch.mainloop.frameNum;
    }

    /**
     * used to find out if a pin has changed since last evaluation
     * @return {Boolean} true if changed, false if not changed
     */
    this.pinIsChanged = function() {
      if (this.node.parentPatch.mainloop)
        return (this.values.changedAt == this.node.parentPatch.mainloop.frameNum);
      return true;
    }

    this.connect = function(other_pin) {
      this.values = other_pin.values;
      if (this.direction==VVVV.PinDirection.Output) { // this is the case when a subpatch output pin gets connected to the interface pin in the subpatch
        var linkCount = this.links.length;
        for (var i=0; i<linkCount; i++) {
          this.links[i].toPin.values = this.values;
        }
      }
      if (this.slavePin)
        this.slavePin.values = this.values;
      this.markPinAsChanged();
    }

    this.disconnect = function() {
      if (this.typeName=="Color") {
        var v = [];
        for (var i=0; i<this.values.length; i++) {
          v[i] = new VVVV.Types.Color("0,0,0,0");
          this.values[i].copy_to(v[i]);
        }
        this.values = v;
      }
      else
        this.values = this.values.slice(0);
      if (this.slavePin)
        this.slavePin.values = this.values;
      this.markPinAsChanged();
    }

    /**
     * used do find out if a pin is connected
     * @return true, if there are incoming or outgoing links to or from this pin (and its masterPin, if preset)
     */
    this.isConnected = function() {
      return (this.links.length > 0 || (this.masterPin && this.masterPin.isConnected()) || (this.slavePin && this.slavePin.links.length>0));
    }

    /**
     * @return {Integer} the number of slices
     */
    this.getSliceCount = function() {
      return this.values.length;
    }

	  /**
	   * sets the number of slices; also sets the slice number of connected downstream pins and the slavePin if present; absolutely necessary if the slice number decreases
	   * @param {Integer} len the slice count
	   */
    this.setSliceCount = function(len) {
      if (len<0) len = 0;
      if (this.values.length==len)
        return;
      if (this.direction==VVVV.PinDirection.Output || !this.isConnected()) {
        this.values.length = len;
      }
      this.markPinAsChanged();
    }

    /**
     * used to change the pin's type during runtime. Also sets the value to the new pin type's default value
     * @param {Object} newType the new type, see {@link VVVV.PinTypes}
     */
    this.setType = function(newType) {
      if (newType.typeName == this.typeName)
        return;
      var that = this;
      //delete this.connectionChangedHandlers['nodepin'];
      delete this.connectionChangedHandlers['webglresource'];
      _(newType.connectionChangedHandlers).each(function(handler, key) {
        that.connectionChangedHandlers[key] = newType.connectionChangedHandlers[key];
      });
      this.typeName = newType.typeName;
      this.defaultValue = newType.defaultValue;

      if (this.direction == VVVV.PinDirection.Input && this.defaultValue && !this.isConnected()) {
        this.setValue(0, this.defaultValue());
        this.setSliceCount(1);
      }

      if (newType.reset_on_disconnect!=undefined)
        this.reset_on_disconnect = newType.reset_on_disconnect;
    }

    if (type==undefined)
      type = VVVV.PinTypes.Generic;
    if (type == VVVV.PinTypes.Generic)
      this.unvalidated = true;
    this.setType(type);

    if (init_values && init_values.length>0) { // override PinType's default value with values from constructor, if it isn't []
      var i = init_values.length;
      while (i--) {
        this.setValue(i, init_values[i]);
      }
    }

    this.reset = function() {
      this.values = [];
      if (this.slavePin) this.slavePin.values = this.values;
      if (this.defaultValue) {
        this.setValue(0, this.defaultValue());
        this.setSliceCount(1);
      }
      else {
        this.values = init_values.slice(0);
        this.markPinAsChanged();
      }
      this.markPinAsChanged();
    }

    /**
     * called when the pin gets connected or disconnected; subsequently calls the callbacks registered in {@link VVVV.Core.Pin#connectionChangedHandlers}
     */
    this.connectionChanged = function() {
      var that = this;
      _(this.connectionChangedHandlers).each(function(handler) {
        handler.call(that);
      });
    }

    /**
     *
     */

    this.generateStaticCode = function(checkForChanges) {
      var subcode = "";
      var dirtycode = "if (";
      var nilcode = "if (";
      for (var j=0; j<this.values.incomingPins.length; j++) {
        var pin = this.values.incomingPins[j];
        dirtycode += "patch.nodeMap["+pin.node.id+"].inputPins['"+pin.pinname+"'].pinIsChanged() || ";
        nilcode += "patch.nodeMap["+pin.node.id+"].inputPins['"+pin.pinname+"'].values[0]==undefined || ";
        subcode = "Math.max(patch.nodeMap["+pin.node.id+"].inputPins['"+pin.pinname+"'].getSliceCount(), "+subcode;
      }
      dirtycode += "false) {\n";
      nilcode += "false) { patch.nodeMap["+this.node.id+"].outputPins['Output'].setSliceCount(0); }\n else {";
      subcode += "0)";
      for (var j=0; j<this.values.incomingPins.length-1; j++) {
        subcode += ")";
      }
      subcode += ";\n";
      var code = nilcode;
      if (checkForChanges)
        code += dirtycode;
      code += "  var iii = ";
      code += subcode;
      code += "  patch.nodeMap["+this.node.id+"].outputPins['Output'].setSliceCount(iii);";
      code += "  while (iii--) {\n";
      code += "    patch.nodeMap["+this.node.id+"].outputPins['Output'].setValue(iii, "+this.values.code+");\n";
      code += "  }\n";
      if (checkForChanges)
        code += "}\n"; // dirty check
      code += "}\n";   // nil check
      return code;
    }
  },

  /**
   * @class
   * @constructor
   * @param {Integer} id the Node ID
   * @param {String} nodename the Node Name
   * @param {VVVV.Core.Patch} [parentPatch] the {@link VVVV.Core.Patch} the node is nested
   */
  Node: function(id, nodename, parentPatch) {

    /** the nodename; might be e.g. a name in format NodeName (Category), SomeShader.fx or a path/to/a/subpatch.v4p */
    this.nodename = nodename;
    /** the node ID */
    this.id = id;
    /** X position in pixels inside the parent patch */
    this.x = 0;
    /** Y position in pixels inside the parent patch */
    this.y = 0;
    /** Node width (in a weird unit); use {@link VVVV.Core.Node.getWidth()} for pixel value */
    this.width = 0;
    /** Node width (in a weird unit); use {@link VVVV.Core.Node.getHeight()} for pixel value */
    this.height = 0;
    /** flag indicating whether a node is an IOBox */
    this.isIOBox = false;
    /** flag indicating whether a node is a shader node */
    this.isShader = false;
    /** the number of subsequent resources (subpatches, shaders, 3rd party libs, etc.) that are currently being loaded. Is 0 if nothing is pending */
    this.resourcesPending = 0;
    /** flag indicating if this node should automatically output nil on all output pins, if a nil value is on any input pin */
    this.auto_nil = true;

    this.setupObject = function() { // had to put this into a method to allow Patch to "derive" from Node. Really have to understand this javascript prototype thing some day ...
      this.inputPins = {};
      this.outputPins = {};
      this.invisiblePins = {} ;

	    this.defaultPinValues = {};
	  };
	  this.setupObject();

    /** a flag indicating if this node should evaluate each frame, no matter if it's marked dirty or not */
    this.auto_evaluate = false;
    this.delays_output = false;

    /** a flag indicating if any of this node's input pins has changed */
    this.dirty = true;

    /** the patch containing this node */
    this.parentPatch = parentPatch;
    if (parentPatch)
      this.parentPatch.nodeMap[id] = this;

	  /**
	   * saves a pin value coming from the patch XML for later use
	   * @param {String} pinname the pin's name
	   * @param {Array} value the array of values (slices)
	   */
    this.addDefault = function(pinname, value) {
      this.defaultPinValues[pinname] = value;
    }

    /**
     * Creates a new input pin and adds it to the node. If pin values from the XML have been registered through {@link VVVV.Core.Node.addDefault},
     * these values are assigned
     * @param {String} pinname the new pin's name
     * @param {Array} value the default spread
     * @param {Object} type see {@link VVVV.PinTypes}
     * @return {VVVV.Core.Pin} the new {@link VVVV.Core.Pin}
     */
    this.addInputPin = function(pinname, value, type) {
      type = type || VVVV.PinTypes.Generic;
      var pin = new VVVV.Core.Pin(pinname,VVVV.PinDirection.Input, value, this, type);
      this.inputPins[pinname] = pin;
      if (this.parentPatch)
        this.parentPatch.pinMap[this.id+'_in_'+pinname] = pin;
      this.applyPinValuesFromXML(pinname);
      return pin;
    }

    /**
     * Creates a new output pin and adds it to the node.
     * @param {String} pinname the new pin's name
     * @param {Array} value the default spread
     * @param {Object} type see {@link VVVV.PinTypes}
     * @return {VVVV.Core.Pin} the new {@link VVVV.Core.Pin}
     */
    this.addOutputPin = function(pinname, value, type) {
      type = type || VVVV.PinTypes.Generic;
      var pin = new VVVV.Core.Pin(pinname,VVVV.PinDirection.Output, value, this, type);
      this.outputPins[pinname] = pin;
      if (this.parentPatch)
        this.parentPatch.pinMap[this.id+'_out_'+pinname] = pin;
      return pin;
    }

    /**
     * deletes an input pin and all incoming links
     * @param pinname the name of the pin to delete
     */
    this.removeInputPin = function(pinname) {
      if (!this.inputPins[pinname]) return;
      var l = this.inputPins[pinname].links[0];
      if (l) {
        l.fromPin.connectionChanged();
        l.destroy();
      }
      delete this.inputPins[pinname];
      this.dirty = true;
    }

    /**
     * deletes an output pin and all outgoing links
     * @param pinname the name of the pin to delete
     */
    this.removeOutputPin = function(pinname) {
      if (!this.outputPins[pinname]) return;
      var n = this.outputPins[pinname].links.length;
      for (var i=0; i<n; i++) {
        var l = this.outputPins[pinname].links[i];
        l.toPin.connectionChanged();
        l.destroy();
      }
      delete this.outputPins[pinname];
      this.dirty = true;
    }

    /**
     * Creates a new invisible/config pin and adds it to the node. If pin values from the XML have been registered through {@link VVVV.Core.Node.addDefault},
     * these values are assigned
     * @param {String} pinname the new pin's name
     * @param {Array} value the default spread
     * @param {Object} type see {@link VVVV.PinTypes}
     * @return {VVVV.Core.Pin} the new {@link VVVV.Core.Pin}
     */
    this.addInvisiblePin = function(pinname, value, type) {
      type = type || VVVV.PinTypes.Generic;
      var pin = new VVVV.Core.Pin(pinname,VVVV.PinDirection.Configuration, value, this, type);
      this.invisiblePins[pinname] = pin;
      this.parentPatch.pinMap[this.id+'_inv_'+pinname] = pin;
      if (this.defaultPinValues[pinname] != undefined) {
        pin.values = this.defaultPinValues[pinname];
        pin.markPinAsChanged();
      }
      return pin;
    }

	  /**
	   * Helper to get the type of IOBox (e.g. Value Advanced, String, Color)
	   * @return {String} the type of IOBox
	   */
    this.IOBoxType = function() {
      var match = /^IOBox \((.*)\)/.exec(this.nodename);
      if (match && match.length>1)
        return match[1];
      return "";
    }

    /**
     * Returns the input pin of the IOBox which is represented by the IOBox label
     * @return {VVVV.Core.Pin} the pin represented by the IOBox label, see {@link VVVV.Core.Pin}
     */
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

    /**
     * Returns the output pin of the IOBox which is represented by the IOBox label
     * @return {VVVV.Core.Pin} the pin represented by the IOBox label, see {@link VVVV.Core.Pin}
     */
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

    /**
     * Returns the number of visible rows of an IOBox. This is basically a convenience method for getting the value of the "Rows" pin
     * @return {Integer} the number of visible rows
     */
    this.IOBoxRows = function() {
		if (this.invisiblePins["Rows"])
			return this.invisiblePins["Rows"].getValue(0);
		else
			return 1;
    }

    /**
     * Tells, if a node is a comment node. Reverse engineering revealed that this is the case, if a String IOBox has no output
     * pins. Maybe better ask someone who actually knows.
     * @return {Boolean} true, if the node is a comment, false otherwise.
     */
    this.isComment = function() {
      return this.isIOBox && _(this.outputPins).size()==0
    }

    /**
     * Returns the text shown inside a node box in the editor. In case of an IOBox this is the result of {@link VVVV.Core.Node.IOBoxInputPin};
     * in case of a subpatch this is "|| SubPatchName" (the .v4p extension stripped); in case of a normal node, this is the node name.
     * @return {String} the node's representative label
     */
    this.label = function() {
      if (this.isIOBox) {
        if (this.IOBoxInputPin().getValue(0))
          return this.IOBoxInputPin().getValue(0).toString();
        return '';
      }

      if (this.isSubpatch) {
        return "||"+this.nodename.match(/([^\/]+)\.v4p$/)[1];
      }

      var label = this.nodename.replace(/\s\(.+\)/, '');
      var label = VVVV.Helpers.translateOperators(label);
      return label;
    }

    /**
     * Returns the node with in pixels, used for displaying the patch
     * @return {Integer} the node width in pixels
     */
    this.getWidth = function() {
      var ret;
      if (this.width==100 || this.width==0) {
        if (this.isIOBox)
          ret = 60;
        else
          ret = Math.max(18, (this.label().length+2)*6);
      }
      else
        ret = this.width/15;
      ret = Math.max(ret, (_(this.inputPins).size()-1)*12+4);
      return ret;
    }

    /**
     * Returns the node height in pixels, used for displaying the patch
     * @return {Integer} the node height in pixels
     */
    this.getHeight = function() {
      if (this.isIOBox && this.height==100)
        return 18 * this.IOBoxRows();
      if (this.height==100 || this.isSubpatch)
        return 18;
      else
        return Math.max(18, this.height/15);
    }

    /**
     * Returns all nodes which are connected to a node's input pins
     * @return {Array} an Array of {@link VVVV.Core.Node} objects
     */
    this.getUpstreamNodes = function() {
      var ret = [];
      _(this.inputPins).each(function(p) {
        if (p.links.length>0)
          ret.push(p.links[0].fromPin.node);
      });
      return ret;
    }

    /**
     * Returns all nodes which are connected to a node's output pins
     * @return {Array} an Array of {@link VVVV.Core.Node} objects
     */
    this.getDownstreamNodes = function() {
      var ret = [];
      _(this.outputPins).each(function(p) {
        for (var j=0; j<p.links.length; j++) {
          ret.push(p.links[j].toPin.node);
        }
      });
      return ret;
    }

    /**
     * Finds all nodes with a certain name, the node's data eventually flows into.
     * @param {String} name the name of the node to search for
     * @result {Array} an Array of {@link VVVV.Core.Node} objects matching the search
     */
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

    /**
     * Tells, if a node has any nil inputs
     * @return true, if any of the input pins are true, false otherwise
     */
    this.hasNilInputs = function() {
      var result = false
      _(this.inputPins).each(function(p) {
        if (p.getSliceCount()==0 || p.values[0]==undefined)
          result = true;
      });
      return result;
    }

    /**
     * Returns true if any of the input (or invisible) pins is changed
     */
    this.isDirty = function() {
      if (this.dirty)
        return true;
      var pinname;
      for (pinname in this.inputPins) {
        if (this.inputPins[pinname].pinIsChanged())
          return true;
      }
      for (pinname in this.invisiblePins) {
        if (this.invisiblePins[pinname].pinIsChanged())
          return true;
      }
      return false;
    }

    /**
     * Returns the maximum number of slices of a node's input pins
     * @return the maximum number of slices
     */
    this.getMaxInputSliceCount = function() {
      var ret = 0;
      var pinname;
      for (pinname in this.inputPins) {
        if (this.inputPins[pinname].getSliceCount()>ret)
          ret = this.inputPins[pinname].values.length;
      }
      return ret;
    }

    /**
     * Applies values from the patch XML to an input pin, if present
     * @param {String} pinname the name of the pin
     */
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
            if (pin.values[i]!=values[i]) {
              if (pin.typeName=="Color")
                pin.setValue(i, new VVVV.Types.Color(values[i]));
              else if(pin.typeName=="Value")
                pin.setValue(i, parseFloat(values[i]));
              else
                pin.setValue(i, values[i]);
            }
          }
          pin.setSliceCount(values.length);
        }
      }
    }

    /**
     * Called, if an IOBox's Descriptive Name inside a subpatch changes, this method creates and updates the subpatch's in and output
     * pins. Subsequently triggers connection changed events for the IOBox's input and output pins.
     */
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
               this.disconnect();
               that.parentPatch.removeInputPin(pinname);
               this.masterPin = undefined;
            }
            if (that.IOBoxOutputPin().links.length==0) {
              if (!that.IOBoxOutputPin().slavePin) {
                if (VVVV_ENV=='development') console.log('interfacing output pin detected: '+pinname);
                var pin = that.parentPatch.outputPins[pinname];
                if (pin==undefined) {
                  var pin = that.parentPatch.addOutputPin(pinname, that.IOBoxOutputPin().values);
                }

                pin.setType(VVVV.PinTypes[that.IOBoxOutputPin().typeName]);

                that.IOBoxOutputPin().slavePin = pin;
                pin.masterPin = that.IOBoxOutputPin();
                pin.connect(that.IOBoxOutputPin())
              }
              else if (that.IOBoxOutputPin().slavePin.pinname!=pinname) { // rename subpatch pin
                if (VVVV_ENV=='development') console.log('renaming '+that.IOBoxOutputPin().slavePin.pinname+" to "+pinname);
                that.parentPatch.outputPins[pinname] = that.parentPatch.outputPins[that.IOBoxOutputPin().slavePin.pinname];
                that.parentPatch.removeOutputPin(that.IOBoxOutputPin().slavePin.pinname);
                that.IOBoxOutputPin().slavePin.pinname = pinname;
              }
            }
            this.node.parentPatch.parentPatch.afterUpdate();
          }
          this.IOBoxInputPin().connectionChanged();

          this.IOBoxOutputPin().connectionChangedHandlers['subpatchpins'] = function() {
            if (this.links.length>0 && this.slavePin) {
               if (VVVV_ENV=='development') console.log('deleting '+pinname+' output pin because node '+that.id+' has output connection...');
               for (var i=0; i<this.slavePin.links.length; i++) {
                 this.slavePin.links[i].destroy();
               }
               this.slavePin.disconnect(); // not really necessary, as the slavepin gets removed anyway
               that.parentPatch.removeOutputPin(pinname);
               this.slavePin = undefined;
            }
            if (that.IOBoxInputPin().links.length==0) {
              if (!that.IOBoxInputPin().masterPin) {
                if (VVVV_ENV=='development') console.log('interfacing input pin detected: '+pinname);
                var pin = that.parentPatch.inputPins[pinname];
                if (pin==undefined) {
                  if (VVVV_ENV=='development') console.log('creating new input pin at parent patch, using IOBox values');
                  var pin = that.parentPatch.addInputPin(pinname, that.IOBoxInputPin().values);
                }

                var savedValues = pin.values.slice();
                pin.setType(VVVV.PinTypes[that.IOBoxInputPin().typeName]);
                if ((pin.unvalidated && VVVV.PinTypes[pin.typeName].primitive) && !pin.isConnected()) {
                  if (pin.typeName[0]=='V') {
                    for (var i=0; i<savedValues.length; i++) {
                      pin.values[i] = parseFloat(savedValues[i]);
                    }
                  }
                  else
                    pin.values = savedValues;
                  pin.markPinAsChanged();
                }
                pin.unvalidated = false;

                pin.slavePin = that.IOBoxInputPin();
                that.IOBoxInputPin().masterPin = pin;
                that.IOBoxInputPin().connect(pin);
              }
              else if (that.IOBoxInputPin().masterPin.pinname!=pinname) { // rename subpatch pin
                console.log('renaming '+that.IOBoxInputPin().masterPin.pinname+" to "+pinname);
                that.parentPatch.inputPins[pinname] = that.parentPatch.inputPins[that.IOBoxInputPin().masterPin.pinname];
                that.parentPatch.removeInputPin(that.IOBoxInputPin().masterPin.pinname);
                that.IOBoxInputPin().masterPin.pinname = pinname;
              }
            }
            this.node.parentPatch.parentPatch.afterUpdate();
          }
          this.IOBoxOutputPin().connectionChanged();
        }
      }
    }

    /**
     * Method called immediatly after node creation for setting up common node settings
     */
    this.setup = function()
    {
      //Add descriptive name for all nodes
      this.addInvisiblePin("Descriptive Name",[""], VVVV.PinTypes.String);
    }

	  /**
	   * Method called AFTER a node's pins have been created and populated with values from patch XML, and BEFORE node links are created.
	   * This method should be overwritten by any Node implementation and is useful for e.g. creating dynamic number of input pins and
	   * other initialising code which should run before first call of {@link VVVV.Core.Node.evaluate}.
	   * @abstract
	   */
    this.initialize = function() {

    }

	  /**
	   * Method called each frame, if a node is marked dirty or {@link VVVV.Core.Node.auto_evaluate} is true. This method should
	   * be overwritten by any Node implementation and usually holds the node's main logic.
	   * @abstract
	   */
    this.evaluate = function() {
      var that = this;
      _(this.outputPins).each(function(p) {
        p.setValue(0, "not calculated");
      });
    }

    /**
     * sets all output pin values to nil, if at least one input pin value is nil, and the node is acting auto_nil
     * @return true, if the output pins were set to nil, false otherwise
     */
    this.dealWithNilInput = function() {
      if (this.auto_nil && !this.isSubpatch && this.hasNilInputs()) {
        for(pinname in this.outputPins) {
          this.outputPins[pinname].setSliceCount(0);
        }
        return true;
      }
      return false;
    }

    /**
     * Method called when a node is being deleted. Should be overwritten by any Node implementation to free resources and gracefully
     * shut itself down
     * @abstract
     */
    this.destroy = function() {
      if (this.isIOBox) {
        if (this.IOBoxInputPin().masterPin) {
          this.parentPatch.removeInputPin(this.IOBoxInputPin().masterPin.pinname);
          this.parentPatch.parentPatch.afterUpdate();
        }
        if (this.IOBoxOutputPin().slavePin) {
          this.parentPatch.removeOutputPin(this.IOBoxOutputPin().slavePin.pinname);
          this.parentPatch.parentPatch.afterUpdate();
        }
      }
    }

    /**
     * Creates the XML code representing the node and its pins. Called by {@link VVVV.Core.Patch.toXML} on serializing a patch and
     * directly by the editor when nodes are being copied to clipboard
     * @return {String} the node's XML code
     */
    this.serialize = function() {
      var $node = $("<NODE>");
      $node.attr("id", this.id);
      $node.attr("nodename", this.nodename);
      $node.attr("systemname", this.nodename);
      if (this.shaderFile) {
        $node.attr("filename", this.shaderFile.replace(".vvvvjs.fx", ".fx").replace("%VVVV%/effects", "%VVVV%/lib/nodes/effects"));
      }
      if (this.isSubpatch) {
        $node.attr("filename", this.nodename);
        $node.attr("systemname", this.nodename.match("(.*)\.v4p$")[1])
      }
      if (this.isIOBox)
        $node.attr("componentmode", "InABox");
      else
        $node.attr("componentmode", "Hidden");

      var $bounds = $("<BOUNDS>");
      if (this.isIOBox)
        $bounds.attr("type", "Box");
      else
        $bounds.attr("type", "Node");
      $bounds.attr("left", parseInt(this.x * 15));
      $bounds.attr("top", parseInt(this.y * 15));
      $bounds.attr("width", parseInt(this.width));
      $bounds.attr("height", parseInt(this.height));
      $node.append($bounds);

      var that = this;

      _(this.inputPins).each(function(p) {
        var $pin = $("<PIN>");
        $pin.attr("pinname", p.pinname);
        $pin.attr("visible", "1");
        if ((!p.isConnected() || p.masterPin) && VVVV.PinTypes[p.typeName].primitive && that.defaultPinValues[p.pinname]) {
          $pin.attr("values", _(that.defaultPinValues[p.pinname]).map(function(v) { return "|"+v.toString().replace(/\|/g, "||")+"|"; }).join(","));
        }
        $node.append($pin);
      })

      _(this.invisiblePins).each(function(p) {
        var $pin = $("<PIN>");
        $pin.attr("pinname", p.pinname);
        $pin.attr("visible", "0");
        if (VVVV.PinTypes[p.typeName].primitive) {
          $pin.attr("values", _(p.values).map(function(v) { return "|"+v.toString().replace(/\|/g, "||")+"|"; }).join(","));
        }
        $node.append($pin);
      })

      return $node;
    }

  },

  /**
   * @class
   * @constructor
   * @param {VVVV.Core.Pin} fromPin the output pin which is the source of the connection
   * @param {VVVV.Core.Pin} toPin the input pin which is the destination of the connection
   */
  Link: function(fromPin, toPin) {
    this.fromPin = fromPin;
    this.toPin = toPin;

    this.fromPin.links.push(this);
    this.toPin.links.push(this);

    /**
     * deletes resources associated with a link
     */
    this.destroy = function() {
      this.fromPin.links.splice(this.fromPin.links.indexOf(this), 1);
      this.toPin.links.splice(this.toPin.links.indexOf(this), 1);
      this.fromPin.node.parentPatch.linkList.splice(this.fromPin.node.parentPatch.linkList.indexOf(this),1);

      this.toPin.disconnect();
      if (this.toPin.reset_on_disconnect)
        this.toPin.reset();
      else {
        this.toPin.node.defaultPinValues[this.toPin.pinname] = [];
        var i = this.toPin.getSliceCount();
        while (i--) {
          this.toPin.node.defaultPinValues[this.toPin.pinname][i] = this.toPin.values[i];
        }
      }
    }

    /**
     * Returns the XML string representing the link. Used for saving the patch and copying to clipboard
     */
    this.serialize = function() {
      // calling it LONK instead of LINK here, because jquery does not make a closing tag for LINK elements
      // renaming it to LINK later ...
      var $link = $("<LONK>");
      $link.attr("srcnodeid", this.fromPin.node.id);
      $link.attr("srcpinname", this.fromPin.pinname);
      $link.attr("dstnodeid", this.toPin.node.id);
      $link.attr("dstpinname", this.toPin.pinname);
      return $link;
    }
  },

  /**
   * @class
   * @constructor
   * @param {String} ressource either a path/to/some/patch.v4p or VVVV XML code
   * @param {Function} success_handler called after the patch (and all sub components) has completely loaded and is ready
   * @param {Function} error_handler called if an error occured, most likey because the .v4p file was not found
   * @param {VVVV.Core.Patch} [parentPatch] the parent patch, if it's a subpatch
   * @param {Integer} id the patch's ID in the parent patch, if it's a subpatch
   */
  Patch: function(ressource, success_handler, error_handler, parentPatch, id) {

    this.ressource = ressource;
    this.vvvv_version = "45_26.1";
    /** the diameter of the patch / the maximum X and Y coordinates of all nodes in a patch */
    this.boundingBox = {width: 0, height: 0};
    /** @member*/
    this.windowWidth = 500;
    /** @member */
    this.windowHeight = 500;

    /** a hash table containing the pins of all nodes inside a patch, indexed with [node_id]_[in|out|inv]_[pinname] */
    this.pinMap = {};
    /** a hash table containing all nodes inside a patch, indexed with the node ID */
    this.nodeMap = {};
    /** an array containing all nodes inside a patch */
    this.nodeList = [];
    /** an array containing all links inside a patch */
    this.linkList = [];
    /** an array containing all pins (except connected input pins) **/
    this.pinList = [];
    /** the flattened, compiled function calling all nodes in the correct order. Should not be written manually, but only updated using {@link VVVV.Core.Patch.compile} */
    this.compiledFunc = undefined;

    /** The {@link VVVV.MainLoop} Object running this patch */
    this.mainloop = undefined;

    this.success = success_handler;
    this.error = error_handler;

    this.editor = undefined;

    this.setupObject();

    if (parentPatch)
      this.parentPatch = parentPatch;
    if (id)
      this.id = id;

    var print_timing = false;

    /**
     * Returns the patch's absolute path, usable for the browser
     * @return {String} the absolute path
     */
    this.getAbsolutePath = function() {
      var path = this.getRelativePath();
      if (this.parentPatch)
        path = this.parentPatch.getAbsolutePath()+path;
      return path;
    }

    /**
     * Returns a patch's relative path, as it is specified in the paret patch
     * @return {String} the patch's path relative to its parent patch
     */
    this.getRelativePath = function() {
      var match = this.nodename.match(/(.*\/)?[^/]+\.v4p/);
      return match[1] || '';
    }

    /**
     * Called when a patch is deleted. Deletes all containing nodes.
     */
    this.destroy = function() {
      for (var i=0; i<this.nodeList.length; i++) {
        this.nodeList[i].destroy();
        delete this.nodeMap[this.nodeList[i].id];
        delete this.nodeList[i];
      }
    }

    /**
     * Creates an array of slices out of pin value string coming from a patch XML
     * @param {String} v the pin value string from the XML
     */
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
        else if (v[i]=='|') {
          if (v[i+1]!='|' || i+1==v.length-1)
            insideValue = !insideValue;
          else
            currSlice += v[++i];
        }
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

    /**
     * Takes a patch XML string, parses it, and applies it to the patch. This method is called once by the constructor, passing the complete patch code, and
     * frequently by an editor, passing in XML snippets. This is the only method you should use to manipulate a patch.
     * @param {String} xml VVVV Patch XML
     * @param {Function} ready_callback called after the XML code has been completely processed, and the patch is fully loaded and ready again
     */
    this.doLoad = function(xml, ready_callback) {
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
      }

      var $windowBounds = $(xml).find('bounds[type="Window"]').first();
      if ($windowBounds.length>0) {
        thisPatch.windowWidth = $windowBounds.attr('width')/15;
        thisPatch.windowHeight = $windowBounds.attr('height')/15;
      }

      if (syncmode=='complete')
        newNodes = {};

      var nodesLoading = 0;

      $(xml).find('node').each(function() {

        // in case the node's id is already present
        var nodeToReplace = undefined;
        var nodeExists = false;
        if (thisPatch.nodeMap[$(this).attr('id')]!=undefined) {
          if ($(this).attr('createme')=='pronto') // renaming node ...
            nodeToReplace = thisPatch.nodeMap[$(this).attr('id')];
          else // just moving it ...
            nodeExists = true;
        }

        var $bounds;
        if ($(this).attr('componentmode')=="InABox")
          $bounds = $(this).find('bounds[type="Box"]').first();
        else
          $bounds = $(this).find('bounds[type="Node"]').first();

        if (!nodeExists) {
          var nodename = $(this).attr('systemname')!="" ? $(this).attr('systemname') : $(this).attr('nodename');
          if (nodename==undefined)
            return;
          if (VVVV.NodeLibrary[nodename.toLowerCase()]!=undefined) {
            var n = new VVVV.NodeLibrary[nodename.toLowerCase()]($(this).attr('id'), thisPatch);
            if (VVVV.NodeLibrary[nodename.toLowerCase()].definingNode) {
              n.definingNode = VVVV.NodeLibrary[nodename.toLowerCase()].definingNode;
              if (nodeToReplace)
                VVVV.NodeLibrary[nodename.toLowerCase()].definingNode.relatedNodes[VVVV.NodeLibrary[nodename.toLowerCase()].definingNode.relatedNodes.indexOf(nodeToReplace)] = n;
              else
                VVVV.NodeLibrary[nodename.toLowerCase()].definingNode.relatedNodes.push(n);
            }

            // load 3rd party libs, if required for this node
            if (VVVV.NodeLibrary[nodename.toLowerCase()].requirements) {
              _(VVVV.NodeLibrary[nodename.toLowerCase()].requirements).each(function(libname) {
                if (VVVV.LoadedLibs[libname]===undefined) {
                  thisPatch.resourcesPending++; // pause patch evaluation
                  VVVV.loadScript(VVVV.ThirdPartyLibs[libname], function() {
                    thisPatch.resourcesPending--; // resume patch evaluation
                    VVVV.LoadedLibs[libname]=VVVV.ThirdPartyLibs[libname];
                    updateLinks(xml);
                    thisPatch.afterUpdate();
                    thisPatch.compile();
                    if (thisPatch.resourcesPending<=0 && ready_callback) {
                      ready_callback();
                      ready_callback = undefined;
                    }
                  });
                }
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
              thisPatch.resourcesPending++;
              var that = this;
              var n = new VVVV.Core.Patch($(this).attr('filename'),
                function() {
                  thisPatch.resourcesPending--;
                  if (VVVV_ENV=='development') console.log(this.nodename+'invoking update links')
                  updateLinks(xml);
                  if (thisPatch.editor)
                    thisPatch.editor.addPatch(this);
                  if (this.auto_evaluate) {
                    var p = thisPatch;
                    do {
                      p.auto_evaluate = true;
                    }
                    while (p = p.parentPatch);
                  }
                  this.setMainloop(thisPatch.mainloop);
                  thisPatch.afterUpdate();
                  thisPatch.compile();
                  if (thisPatch.resourcesPending<=0 && ready_callback) {
                    ready_callback();
                    ready_callback = undefined;
                  }
                },
                function() {
                  thisPatch.resourcesPending--;
                  this.not_implemented = true;
                  VVVV.onNotImplemented(nodename);
                  updateLinks(xml);
                  thisPatch.afterUpdate();
                  thisPatch.compile();
                  if (thisPatch.resourcesPending<=0 && ready_callback) {
                    ready_callback();
                    ready_callback = undefined;
                  }
                },
                thisPatch, $(that).attr('id')
              );
              n.isSubpatch = true;
              if (thisPatch.editor && !n.editor)
                thisPatch.editor.addPatch(n);
              thisPatch.nodeMap[n.id] = n;
            }
            else {
              var n = new VVVV.Core.Node($(this).attr('id'), nodename, thisPatch);
              n.not_implemented = true;
              VVVV.onNotImplemented(nodename);
            }
          }
          if (VVVV_ENV=='development' && syncmode!='complete') console.log(thisPatch.nodename+': inserted new node '+n.nodename);
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
          if (n.isSubpatch && !n.not_implemented) {
            if (n.editor) n.editor.removePatch(n);
            var subpatches = n.getSubPatches();
            subpatches.push(n);
            var path;
            for (var i=0; i<subpatches.length; i++) {
              path = VVVV.Helpers.prepareFilePath(subpatches[i].nodename, subpatches[i].parentPatch);
              VVVV.Patches[path].splice(VVVV.Patches[path].indexOf(n), 1);
              if (VVVV.Patches[path].length == 0)
                delete VVVV.Patches[path];
            }
          }
          if (n.definingNode) { // remove connection to related DefineNode node
            n.definingNode.relatedNodes.splice(n.definingNode.relatedNodes.indexOf(n), 1);
          }
          thisPatch.nodeList.splice(thisPatch.nodeList.indexOf(n),1);
          n.destroy();
          delete thisPatch.nodeMap[n.id];
        }

        if ($bounds.length>0) {
          if ($bounds.attr('left')) {
            n.x = $bounds.attr('left')/15;
            n.y = $bounds.attr('top')/15;
            thisPatch.boundingBox.width = Math.max(thisPatch.boundingBox.width, n.x+100);
            thisPatch.boundingBox.height = Math.max(thisPatch.boundingBox.height, n.y+100);
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
          if (nodeToReplace) { // copy config pins from node which is being replaced
            console.log("replacing node "+n.id+" / "+nodeToReplace.nodename+" with "+n.nodename);
            _(nodeToReplace.invisiblePins).each(function(p, name) {
              if (!n.invisiblePins[name])
                n.invisiblePins[name] = p;
              else {
                thisPatch.pinMap[n.id+"_inv_"+name] = n.inputPins[name];
                if (n.invisiblePins[name].typeName==p.typeName)
                  n.invisiblePins[name].values = p.values;
              }
            });
          }

          n.initialize();

          if (nodeToReplace) { // copy in- and output pins from node which is being replaced
            _(nodeToReplace.inputPins).each(function(p, name) {
              if (n.inputPins[name]) {
                thisPatch.pinMap[n.id+"_in_"+name] = n.inputPins[name];
                if (n.inputPins[name].typeName!=p.typeName) {
                  var i = p.links.length;
                  while (i--) {
                    p.links[i].destroy();
                  }
                }
                else {
                  n.inputPins[name].values = p.values;
                  var i = p.links.length;
                  while (i--) {
                    n.inputPins[name].links[i] = p.links[i];
                    n.inputPins[name].links[i].toPin = n.inputPins[name];
                  }
                }
              }
              else {
                var i = p.links.length;
                while (i--) {
                  p.links[i].destroy();
                }
              }
            });
            _(nodeToReplace.outputPins).each(function(p, name) {
              if (n.outputPins[name]) {
                thisPatch.pinMap[n.id+"_out_"+name] = n.outputPins[name];
                if (n.outputPins[name].typeName!=p.typeName) {
                  var i = p.links.length;
                  while (i--) {
                    p.links[i].destroy();
                  }
                }
                else {
                  n.outputPins[name].values = p.values;
                  var i = p.links.length;
                  while (i--) {
                    n.outputPins[name].links[i] = p.links[i];
                    n.outputPins[name].links[i].fromPin = n.outputPins[name];
                  }
                }
              }
              else {
                var i = p.links.length;
                while (i--) {
                  p.links[i].destroy();
                }
              }
            });
            thisPatch.nodeList.splice(thisPatch.nodeList.indexOf(nodeToReplace),1);
            nodeToReplace.destroy();
            delete nodeToReplace;
            nodeToReplace = undefined;
          }
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

      if (this.resourcesPending===0)
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
          if (!link)
            return;
          if (VVVV_ENV=='development') console.log('removing '+link.fromPin.pinname+' -> '+link.toPin.pinname);
          var fromPin = link.fromPin;
          var toPin = link.toPin;
          link.destroy();
          fromPin.connectionChanged();
          toPin.connectionChanged();
          toPin.markPinAsChanged();
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
              dstPin.connect(srcPin);
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

      this.compile();
      if (this.resourcesPending<=0 && ready_callback) {
        ready_callback();
        ready_callback = undefined;
      }
    }

    /**
     * Recursively fetches and returns all subpatches inside a patch
     * @return {Array} an array of {@link VVVV.Core.Patch} objects
     */
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

    /**
     * Sets the {@link VVVV.Core.MainLoop} object of the patch and all containing subpatches
     * @param {VVVV.Core.MainLoop} ml
     */
    this.setMainloop = function(ml) {
      this.mainloop = ml;
      for (var i=0; i<this.nodeList.length; i++) {
        if (this.nodeList[i].isSubpatch) {
          this.nodeList[i].setMainloop(ml);
        }
      }
    }

    /**
     * Called always after the patch has been evaluated
     * @abstract
     */
    this.afterEvaluate = function() {

    }

    /**
     * Called always after the patch has been modified using {@link VVVV.Core.Patch.doLoad}
     * @abstract
     */
    this.afterUpdate = function() {

    }

    /**
     * Returns the VVVV XML string representing the patch, ready to be saved
     * @return {String}
     */
    this.toXML = function() {
      var $patch = $("<PATCH>");
      var $bounds = $("<BOUNDS>");
      $bounds.attr("type", "Window");
      $bounds.attr("width", parseInt(this.windowWidth * 15));
      $bounds.attr("height", parseInt(this.windowHeight * 15));
      $patch.append($bounds);

      var boundTypes = ["Node", "Box"];
      for (var i=0; i<this.nodeList.length; i++) {
        var n = this.nodeList[i];
        $patch.append(n.serialize());
      }
      for (var i=0; i<this.linkList.length; i++) {
        var l = this.linkList[i];
        $patch.append(l.serialize());
      }

      var xml = '<!DOCTYPE PATCH  SYSTEM "http://vvvv.org/versions/vvvv45beta28.1.dtd" >\r\n  '+$patch.wrapAll('<d></d>').parent().html();
      xml = xml.replace(/<patch/g, "<PATCH");
      xml = xml.replace(/<\/patch>/g, "\n  </PATCH>");
      xml = xml.replace(/<node/g, "\n  <NODE");
      xml = xml.replace(/<\/node>/g, "\n  </NODE>");
      xml = xml.replace(/<bounds/g, "\n  <BOUNDS");
      xml = xml.replace(/<\/bounds>/g, "\n  </BOUNDS>");
      xml = xml.replace(/<pin/g, "\n  <PIN");
      xml = xml.replace(/<\/pin>/g, "\n  </PIN>");
      xml = xml.replace(/<lonk/g, "\n  <LINK");
      xml = xml.replace(/<\/lonk>/g, "\n  </LINK>");
      return xml;
    }

    /**
     * Assemples the {@link VVVV.Core.Patch.compiledFunc} function, which is called each frame, and subsequently calls all nodes in the correct order. This method is invoked automatically each time the patch has been changed.
     */
    this.compile = function() {
      this.evaluationRecipe = [];
      this.pinList = [];
      var addedNodes = {};
      var nodeStack = [];
      var lostLoopRoots = [];

      var recipe = this.evaluationRecipe;
      var pinList = this.pinList;
      var regex = new RegExp(/\{([^\}]+)\}/g);
      var thisPatch = this;

      var compiledCode = "";

      function addSubGraphToRecipe(node) {
        if (nodeStack.indexOf(node.id)<0) {
          nodeStack.push(node.id);
          var upstreamNodes = node.getUpstreamNodes();
          var loop_detected = false;
          _(upstreamNodes).each(function(upnode) {
            if (addedNodes[upnode.id]==undefined) {
              loop_detected = loop_detected || addSubGraphToRecipe(upnode);
            }
          });
          nodeStack.pop();
        }

        if (loop_detected && node.delays_output)
          lostLoopRoots.push(node);

        if ((!loop_detected && nodeStack.indexOf(node.id)<0) || node.delays_output) {
          if (node.getCode) {
            node.outputPins["Output"].values.incomingPins = [];
            var nodecode = "("+node.getCode()+")";
            var code = nodecode;
            var match;
            while (match = regex.exec(nodecode)) {
              var v;
              if (node.inputPins[match[1]].values.code) {
                v = node.inputPins[match[1]].values.code;
                node.outputPins['Output'].values.incomingPins = node.outputPins['Output'].values.incomingPins.concat(node.inputPins[match[1]].values.incomingPins)
              }
              else {
                if (!node.inputPins[match[1]].isConnected() && node.inputPins[match[1]].getSliceCount()==1)
                  v = node.inputPins[match[1]].getValue(0);
                else
                  v = "patch.nodeMap["+node.id+"].inputPins['"+match[1]+"'].getValue(iii)";
                node.outputPins['Output'].values.incomingPins.push(node.inputPins[match[1]]);
              }
              code = code.replace("{"+match[1]+"}", v);
            }
            node.outputPins["Output"].values.code = code;
            for (var i=0; i<node.outputPins["Output"].links.length; i++) {
              if (!node.outputPins["Output"].links[i].toPin.node.getCode) {
                compiledCode += node.outputPins["Output"].generateStaticCode(true);
                break;
              }
            }
          }
          else {
            if (!node.not_implemented) {
              recipe.push(node);
              compiledCode += "var n = patch.nodeMap["+node.id+"];";
              compiledCode += "if ((n.isDirty() || n.auto_evaluate || n.isSubpatch) && !n.dealWithNilInput()) { n.evaluate(); n.dirty = false; }\n";
            }
          }
          for (var pinname in node.inputPins) {
            if (node.inputPins[pinname].links.length==0)
              pinList.push(node.inputPins[pinname]);
          }
          for (var pinname in node.invisiblePins) {
            pinList.push(node.invisiblePins[pinname]);
          }
          for (var pinname in node.outputPins) {
            pinList.push(node.outputPins[pinname]);
          }
          addedNodes[node.id] = node;
          return false;
        }
        return true;
      }

      for (var i=0; i<this.nodeList.length; i++) {
        if (this.nodeList[i].getDownstreamNodes().length==0 || this.nodeList[i].auto_evaluate || this.nodeList[i].delays_output) {
          if (addedNodes[this.nodeList[i].id]==undefined)
            addSubGraphToRecipe(this.nodeList[i]);
        }
      }

      for (var i=0; i<lostLoopRoots.length; i++) {
        addSubGraphToRecipe(lostLoopRoots[i]);
      }

      compiledCode = "try {\n"+compiledCode+"\n} catch (e) { console.error(e.message); console.log(e.stack); }";

      this.compiledFunc = new Function('patch', compiledCode);
      //console.log(this.compiledFunc.toString());
    }

    /**
     * Evaluates the patch once. Is called by the patch's {@link VVVV.Core.MainLoop} each frame, and should not be called directly
     */
    this.evaluate = function() {
      if (this.resourcesPending>0) // this.resourcesPending is >0 when thirdbarty libs or subpatches are loading at the moment
        return;
      if (print_timing) {
        var nodeProfiles = {};
        var start = new Date().getTime();
        var elapsed = 0;
      }

      this.compiledFunc(this);

      /*var pinname;
      for (var i=0; i<this.evaluationRecipe.length; i++) {
        var node = this.evaluationRecipe[i];
        if (print_timing)
          console.log(node.nodename);
        if (node.isDirty() || node.auto_evaluate || node.isSubpatch) {
          if (print_timing)
            var start = new Date().getTime();
          if (node.auto_nil && !node.isSubpatch && node.hasNilInputs()) {
            for(pinname in node.outputPins) {
              node.outputPins[pinname].setSliceCount(0);
            }
          }
          else {
            try {
              node.evaluate();
            }
            catch (e) {
              console.log('VVVV.Js / Error evaluating '+node.nodename+': '+e.message);
            }
            node.dirty = false;
          }
          if (print_timing) {
            if (!nodeProfiles[node.nodename])
              nodeProfiles[node.nodename] = {count: 0, dt: 0};
            elapsed = new Date().getTime() - start;
            nodeProfiles[node.nodename].count++;
            nodeProfiles[node.nodename].dt += elapsed;
            console.log(node.nodename+' / '+node.id+': '+elapsed+'ms')
          }
        }
      }*/

      if (print_timing) {
        _(nodeProfiles).each(function(p, nodename) {
          console.log(p.count+'x '+nodename+': '+p.dt+'ms');
        });
        var start = new Date().getTime();
      }
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
      var path = ressource;
      if (this.parentPatch)
        path = VVVV.Helpers.prepareFilePath(ressource, this.parentPatch)
      if (!VVVV.Patches[path]) {
        $.ajax({
          url: path,
          type: 'get',
          dataType: 'text',
          success: function(r) {
            that.doLoad(r, function() {
              VVVV.Patches[path] = VVVV.Patches[path] || [];
              VVVV.Patches[path].push(that);
              if (that.success)
                that.success();
              that.afterUpdate();
            });
          },
          error: function() {
            if (that.error)
              that.error();
          }
        });
      }
      else {
        that.doLoad(VVVV.Patches[path][0].toXML(), function() {
          VVVV.Patches[path].push(that);
          if (that.success)
            that.success();
          that.afterUpdate();
        });
      }
    }
    else {
      this.doLoad(ressource, function() {
        if (this.success) this.success();
      });

    }

    // bind the #-shortcuts
    function checkLocationHash() {
      var match = window.location.hash.match('#([^\/]+)\/('+thisPatch.ressource+'|[0-9]+)$');
      if (match && VVVV.Editors[match[1]] && (match[2]==thisPatch.ressource || VVVV.Patches[match[2]]==thisPatch || VVVV.Patches.length==match[2])) {
        console.log('launching editor ...');
        var ed = new VVVV.Editors[match[1]]();
        ed.enable(thisPatch);
      }
    }
    checkLocationHash();

    $(window).bind('hashchange', function() {
      checkLocationHash();
    });


  }


}
VVVV.Core.Patch.prototype = new VVVV.Core.Node();

}(vvvvjs_jquery));
