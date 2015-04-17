// VVVV.js -- Visual Webclient Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

/** @define {string} */
var VVVV_ENV = 'development';

var vvvvjs_jquery = $.noConflict();
$ = vvvvjs_jquery;

(function($) {

// some prerequisites ...
$.ajaxPrefilter(function( options, originalOptions, jqXHR ) {
  if ( options.dataType == 'script' || originalOptions.dataType == 'script' ) {
      options.cache = true;
  }
});

if(!window.console) {
  window.console = {
    log : function(str) {
    }
  };
}

// actual VVVV.js initialization code

/** @namespace */
VVVV = {};

/** @namespace */
VVVV.Nodes = {};

/** @namespace */
VVVV.PinTypes = {};

VVVV.Types = {};

/** All implemented nodes are registered here */
VVVV.NodeLibrary = {};

VVVV.NodeNames = [];

/**
 * This holds all created patches and their subpatches. Indices are the absolute patch file names. Patches that are loaded with the script tag are
 * also stored in indices 0 .. n
 */
VVVV.Patches = {};
VVVV.Editors = {};

/**
 * Fired when framerate is lower than 15fps for a certain amount of frames. See VVVV.MainLoop#update
 */
VVVV.onLowFrameRate = function() {

}

/**
 * Fired when a node is being created that is not implemented
 * @param {String} nodename the name of the node which is not implemented
 */
VVVV.onNotImplemented = function(nodename) {
  console.log("Warning: "+nodename+" is not implemented.");
};

VVVV.loadCounter = 0;
VVVV.loadScript = function(url, callback) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.async = false;
    script.src = VVVV.Root + '/' +url;
    if (callback)
      script.addEventListener('load', callback);
    VVVV.loadCounter++;
    head.appendChild(script);
};

/**
 * Adds the neccessary JavaScripts to the head, calls the callback once everything is in place. Also automatically loads patches specified in script tags.
 * @param {String} path_to_vvvv points to the folder of your vvvv.js. This is relative to your html-file
 * @param {String} mode. Can be either "full", "vvvviewer" or "run". Depends on what you want to do
 * @param {Function} callback will be called once all the scripts and initialisations have been finished.
 */
VVVV.init = function (path_to_vvvv, mode, callback) {
  VVVV.Root = path_to_vvvv || './';

  if (VVVV_ENV=='development') console.log('loading vvvv.js ...');

  if (VVVV_ENV=='development') {
    var head = document.getElementsByTagName('head')[0];

    function loadMonitor(event) {
      event.target.removeEventListener('load', loadMonitor);
      if (--VVVV.loadCounter <= 0) {
        initialisationComplete();
      };
    }

    if ($('script[src*=thirdparty]').length==0)
      VVVV.loadScript('thirdparty.js', loadMonitor);
    if ($('script[src*=underscore]').length==0)
      VVVV.loadScript('lib/underscore/underscore-min.js', loadMonitor);
    if ($('script[src*="d3.js"]').length==0 && (mode=='full' || mode=='vvvviewer'))
      VVVV.loadScript('lib/d3-v3/d3.v3.min.js', loadMonitor);
    if ($('script[src*=glMatrix]').length==0 && (mode=='full' || mode=='run'))
      VVVV.loadScript('lib/glMatrix-0.9.5.min.js', loadMonitor);

    if ($('script[src*="vvvv.core.js"]').length==0) {
      VVVV.loadScript('core/vvvv.core.js', loadMonitor);
      if (mode=='run' || mode=='full') {
        VVVV.loadScript('mainloop/vvvv.mainloop.js', loadMonitor);
        VVVV.loadScript('mainloop/vvvv.dominterface.js', loadMonitor);

        VVVV.loadScript('types/vvvv.shared_types.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.value.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.string.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.boolean.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.color.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.spreads.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.spectral.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.animation.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.network.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.system.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.canvas.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.html5.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.audio.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.transform.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.vectors.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.webgl.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.complex.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.enumerations.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.2d.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.3d.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.node.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.astronomy.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.xml.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.differential.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.xelement.js', loadMonitor);
        VVVV.loadScript('nodes/vvvv.nodes.html.js', loadMonitor);
        
        VVVV.loadScript('vvvv.makros.js', loadMonitor);
      }
      VVVV.loadScript('editors/vvvv.editors.browser_editor.js', loadMonitor);
    }
  }

  function initialisationComplete() {
    var p = new VVVV.Core.Patch('');
    _(VVVV.Nodes).each(function(n) {
      var x = new n(0, p);
      if (VVVV_ENV=='development') console.log("Registering "+x.nodename);
      VVVV.NodeLibrary[x.nodename.toLowerCase()] = n;
      VVVV.NodeNames.push(x.nodename);
    });

    if (VVVV_ENV=='development') console.log('done ...');

    VVVV.MainLoops = [];

    $("link[rel='VVVV'], script[language='VVVV']").each(function(i) {
      var href_attribute = 'href';
      if ($(this).get(0).tagName=='SCRIPT') {
        if (VVVV_ENV=='development') console.warn('DEPRECATED: loading patches via <script language="VVVV" src="..."> tag is deprecated. Use <link rel="VVVV" href="..."> instead.');
        href_attribute = 'src';
      }
      var p = new VVVV.Core.Patch($(this).attr(href_attribute), function() {
        var m = new VVVV.Core.MainLoop(this);
        VVVV.MainLoops.push(m);
      });
      VVVV.Patches[i] = p;
    });

    if (typeof callback === 'function') callback.call();
  }

  if (VVVV_ENV=='production')
    initialisationComplete();
};

}(vvvvjs_jquery));
