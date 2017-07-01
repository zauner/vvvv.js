
if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }

define(function(require,exports) {


exports.Nodes = {};
exports.NodeLibrary = {};
exports.NodeNames = [];
exports.Editors = {};

exports.MousePositions = {'_all': {'x': [0.0], 'y': [0.0], 'wheel': [0.0], 'lb': [0.0], 'mb': [0.0], 'rb': [0.0]}}

/**
 * @const
 * @property {Integer} Input 0
 * @property {Integer} Output 1
 * @property {Integer} Configuration 2
 */
exports.PinDirection = { Input : 0,Output : 1,Configuration : 2 };

exports.Types = {};

exports.PinTypes = {};
/**
 * The default pin type, used if no further specified
 * @memberof VVVV.PinTypes
 * @mixin
 * @property {String} typeName Generic
 * @property {Boolean} reset_on_disconnect true
 * @property {String} defaultValue '0'
 */
exports.PinTypes.Generic = {
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
exports.PinTypes.Value = {
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
exports.PinTypes.String = {
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
exports.PinTypes.Enum = {
  typeName: "Enum",
  reset_on_disconnect: false,
  defaultValue: function() { return '' },
  primitive: true
}

/**
 * Contains various unsorted helper methods
 * @namespace
 */
exports.Helpers = {

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
      return path.replace('%VVVV%', VVVVContext.Root);

    if (path.match(/^%PAGE%/)) { // hosting HTML page path
      if (VVVVContext.name=="browser")
        return path.replace('%PAGE%', location.pathname);
      else
        return path.replace('%PAGE%', VVVVContext.DocumentRoot + VVVVContext.AppRoot);
    }

    if (path.match(/^(\/|.+:\/\/)/)) { // path starting with / or an URL protocol (http://, ftp://, ..)
      if (VVVVContext.name=="browser")
        return path;
      else
        return VVVVContext.DocumentRoot + path;
    }

    if (patch)
      path = patch.getAbsolutePath()+path;

    if (VVVVContext.name=="nodejs")
      path = VVVVContext.DocumentRoot + VVVVContext.AppRoot + path;

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

})
