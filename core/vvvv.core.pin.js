

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }

define(function(require,exports) {


  var _ = require('underscore');
  var $ = require('jquery');
  var VVVV = require('./vvvv.core.defines');

  /**
   * @class
   * @constructor
   * @param {String} pinname Pin Name
   * @param {String} direction see {@link VVVV.PinDirection}
   * @param {Array} init_values the array of initial values
   * @param {VVVV.Core.Node} node the node this pin is attached to
   * @param {Object} [type] the PinType, default is {@link VVVV.PinTypes.Generic), see {@link VVVV.PinTypes}
   */
  var Pin = function(pinname,direction, init_values, node, type) {
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

    this.auto_reset = false;

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
        if (!this.typeName || !VVVV.PinTypes[this.typeName].primitive || this.values[i]!=v || this.typeName=="Color")
          this.markPinAsChanged();
        this.values[i] = v;
      }

      if (this.node.isIOBox && this.pinname=='Descriptive Name' && this.node.invisiblePins["Descriptive Name"]) {
        if (this.node.parentPatch.domInterface)
          this.node.parentPatch.domInterface.connect(this.node);
        else if (this.node.parentPatch.parentPatch)
          this.node.registerInterfacePin();
      }

      if (this.direction==VVVV.PinDirection.Configuration) {
        this.node.configure();
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
  }


  return Pin;
})
