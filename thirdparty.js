// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }

define(function(require,exports) {

/** Define 3rd party libraries, that should be loaded on demand here.
 * Use
 * VVVV.Nodes.YourNode.requirements = ["exampleLib"]
 * after your nodes's code to define, that the library is required.
 */
VVVVContext.ThirdPartyLibs = {
  //"exampleLib": "lib/examplelib.js"
  "beatdetektor": "lib/beatdetektor.js",
  "GLUtil": "lib/gl-util.js",
  "meshUtils": "lib/mesh-utils.js"
}

// ... and just leave this
VVVVContext.LoadedLibs = {};

});
