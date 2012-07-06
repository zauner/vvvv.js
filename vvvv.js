// VVVV.js -- Visual Webclient Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.


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
VVVV = {};

VVVV.onNotImplemented = function(nodename) {
  console.log("Warning: "+nodename+" is not implemented.");
};

/**
 * Adds the neccessary JavaScripts to the head, calls the callback once everything is in place.
 * @param {String} path_to_vvvv points to the folder of your vvvv.js. This is relative to your html-file
 * @param {String} mode. Can be either "full", "vvvviewer" or "run". Depends on what you want to do 
 * @param {Function} callback will be called once all the scripts and initialisations have been finished.
 */
VVVV.init = function (path_to_vvvv, mode, callback) {
  VVVV.Root = path_to_vvvv || './';
  VVVV.Nodes = {};
  VVVV.NodeLibrary = {};

  console.log('loading vvvv.js ...');

  var head = document.getElementsByTagName('head')[0];
  var loadCounter = 0;

  function loadMonitor(event) {
    event.target.removeEventListener('load');
    if (--loadCounter <= 0) {
      initialisationComplete();
    };
  }

  function insertJS(url) {
    var script = document.createElement('script');
    script.async = false;
    script.src = VVVV.Root + url;
    script.addEventListener('load', loadMonitor);
    loadCounter++;
    head.appendChild(script);
  }

  if ($('script[src*=underscore]').length==0)
    insertJS('lib/underscore/underscore-min.js');
  if ($('script[src*="d3.js"]').length==0 && (mode=='full' || mode=='vvvviewer'))
    insertJS('lib/d3-v1.14/d3.min.js');
  if ($('script[src*=glMatrix]').length==0 && (mode=='full' || mode=='run'))
    insertJS('lib/glMatrix-0.9.5.min.js');

  if ($('script[src*="vvvv.core.js"]').length==0) {
    insertJS('core/vvvv.core.js');
    insertJS('core/vvvv.core.vvvvconnector.js');
    if (mode=='run' || mode=='full') {
      insertJS('mainloop/vvvv.mainloop.js');
      insertJS('mainloop/vvvv.dominterface.js');

      insertJS('nodes/vvvv.nodes.value.js');
      insertJS('nodes/vvvv.nodes.string.js');
      insertJS('nodes/vvvv.nodes.boolean.js');
      insertJS('nodes/vvvv.nodes.color.js');
      insertJS('nodes/vvvv.nodes.spreads.js');
      insertJS('nodes/vvvv.nodes.animation.js');
      insertJS('nodes/vvvv.nodes.network.js');
      insertJS('nodes/vvvv.nodes.system.js');
      insertJS('nodes/vvvv.nodes.canvas.js');
      insertJS('nodes/vvvv.nodes.html5.js');
      insertJS('nodes/vvvv.nodes.transform.js');
      insertJS('nodes/vvvv.nodes.vectors.js');
      insertJS('nodes/vvvv.nodes.webgl.js');
      insertJS('nodes/vvvv.nodes.complex.js');
      insertJS('nodes/vvvv.nodes.enumerations.js');
      insertJS('nodes/vvvv.nodes.2d.js');
      insertJS('nodes/vvvv.nodes.3d.js');
    }
    if (mode=='vvvviewer' || mode=='full') {
      insertJS('vvvviewer/vvvv.vvvviewer.js');
    }
  }

  function initialisationComplete() {
    var p = new VVVV.Core.Patch('');
    _(VVVV.Nodes).each(function(n) {
      var x = new n(0, p);
      console.log("Registering "+x.nodename);
      VVVV.NodeLibrary[x.nodename.toLowerCase()] = n;
    });

    console.log('done ...');

    VVVV.Patches = [];
    VVVV.MainLoops = [];

    $("script[language='VVVV']").each(function() {
      var p = new VVVV.Core.Patch($(this).attr('src'), function() {
        var m = new VVVV.Core.MainLoop(this);
        VVVV.MainLoops.push(m);
      });
      VVVV.Patches.push(p);
    });

    if (typeof callback === 'function') callback.call();
  }
};




