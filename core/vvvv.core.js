// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }

define(function(require, exports) {

  var _ = require('underscore');

  var defs = require('core/vvvv.core.defines');
  exports.Types = defs.Types;
  exports.PinTypes = defs.PinTypes;
  exports.Helpers = defs.Helpers;
  exports.MousePositions = defs.MousePositions;
  exports.Nodes = defs.Nodes;
  exports.NodeLibrary = defs.NodeLibrary;
  exports.NodeNames = defs.NodeNames;
  exports.Editors = defs.Editors;

  require('thirdparty');

  require('mainloop/vvvv.dominterface');
  require('types/vvvv.shared_types');
  require('nodes/vvvv.nodes.value');
  require('nodes/vvvv.nodes.string');
  require('nodes/vvvv.nodes.boolean');
  require('nodes/vvvv.nodes.color');
  require('nodes/vvvv.nodes.spreads');
  require('nodes/vvvv.nodes.spectral');
  require('nodes/vvvv.nodes.animation');
  require('nodes/vvvv.nodes.network');
  require('nodes/vvvv.nodes.system');
  require('nodes/vvvv.nodes.canvas');
  require('nodes/vvvv.nodes.html5');
  require('nodes/vvvv.nodes.audio');
  require('nodes/vvvv.nodes.transform');
  require('nodes/vvvv.nodes.vectors');
  require('nodes/vvvv.nodes.webgl');
  require('nodes/vvvv.nodes.complex');
  require('nodes/vvvv.nodes.enumerations');
  require('nodes/vvvv.nodes.2d');
  require('nodes/vvvv.nodes.3d');
  require('nodes/vvvv.nodes.node');
  require('nodes/vvvv.nodes.astronomy');
  require('nodes/vvvv.nodes.xml');
  require('nodes/vvvv.nodes.sendandreceive');
  require('nodes/vvvv.nodes.differential');
  require('nodes/vvvv.nodes.xelement');
  require('nodes/vvvv.nodes.html');
  require('nodes/vvvv.nodes.sqlite');
  require('nodes/vvvv.nodes.buffer');
  require('nodes/vvvv.nodes.game');

  exports.MainLoop = require('mainloop/vvvv.mainloop');
  exports.Pin = require('core/vvvv.core.pin');
  exports.Node = require('core/vvvv.core.node');
  exports.Patch = require('core/vvvv.core.patch');
  exports.Link = require('core/vvvv.core.link');

  var p = new exports.Patch('');
  _(defs.Nodes).each(function(n) {
    var x = new n(0, p);
    if (VVVV_ENV=='development') console.log("Registering "+x.nodename);
    defs.NodeLibrary[x.nodename.toLowerCase()] = n;
    defs.NodeNames.push(x.nodename);
  });

  if (VVVV_ENV=='development') console.log('done ...');


});
