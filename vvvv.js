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
VVVV.Nodes = {};

VVVV.onNotImplemented = function(nodename) {
  console.log("Warning: "+nodename+" is not implemented.");
};

/**
 * Adds the neccessary JavaScripts to the head, calls the callback once everything is in place.
 * @param {String} path_to_vvvv points to the folder of your vvvv.js
 * @param {String} mode. Can be either "full", "vvvviewer" or "run". Depends on what you want to do 
 * @param {Function} callback will be called once all the scripts and initialisations have been finished.
 */
VVVV.init = function (path_to_vvvv, mode, callback) {

  console.log('loading vvvv.js ...');

  var head = document.getElementsByTagName('head')[0];
  var script = document.createElement( 'script' );
  var loadCounter = 0;
  script.setAttribute('language', 'JavaScript');

  function loadMonitor(event) {
    event.target.removeEventListener('load');
    if (--loadCounter <= 0) {
      initialisationComplete();
    };
    
  }

  function insertJS(url) {
    var scriptClone;
    scriptClone = script.cloneNode();
    scriptClone.src = url;
    scriptClone.addEventListener('load', loadMonitor);
    loadCounter++;
    head.appendChild(scriptClone);
  }

  if ($('script[src*=underscore]').length==0)
    insertJS(path_to_vvvv+'/lib/underscore/underscore-min.js');
  if ($('script[src*="d3.js"]').length==0 && (mode=='full' || mode=='vvvviewer'))
    insertJS(path_to_vvvv+'/lib/d3-v1.14/d3.min.js');
  if ($('script[src*=glMatrix]').length==0 && (mode=='full' || mode=='run'))
    insertJS(path_to_vvvv+'/lib/glMatrix-0.9.5.min.js');

  if ($('script[src*="vvvv.core.js"]').length==0) {
    $('head').append($('<script language="JavaScript" src="'+path_to_vvvv+'/core/vvvv.core.js"></script>'));
    insertJS(path_to_vvvv+'/core/vvvv.core.vvvvconnector.js');
    if (mode=='run' || mode=='full') {
      insertJS(path_to_vvvv+'/mainloop/vvvv.mainloop.js');
      insertJS(path_to_vvvv+'/mainloop/vvvv.dominterface.js');

      insertJS(path_to_vvvv+'/nodes/vvvv.nodes.value.js');
      insertJS(path_to_vvvv+'/nodes/vvvv.nodes.string.js');
      insertJS(path_to_vvvv+'/nodes/vvvv.nodes.boolean.js');
      insertJS(path_to_vvvv+'/nodes/vvvv.nodes.color.js');
      insertJS(path_to_vvvv+'/nodes/vvvv.nodes.spreads.js');
      insertJS(path_to_vvvv+'/nodes/vvvv.nodes.animation.js');
      insertJS(path_to_vvvv+'/nodes/vvvv.nodes.network.js');
      insertJS(path_to_vvvv+'/nodes/vvvv.nodes.system.js');
      insertJS(path_to_vvvv+'/nodes/vvvv.nodes.canvas.js');
      insertJS(path_to_vvvv+'/nodes/vvvv.nodes.html5.js');
      insertJS(path_to_vvvv+'/nodes/vvvv.nodes.transform.js');
      insertJS(path_to_vvvv+'/nodes/vvvv.nodes.vectors.js');
      insertJS(path_to_vvvv+'/nodes/vvvv.nodes.webgl.js');
      insertJS(path_to_vvvv+'/nodes/vvvv.nodes.complex.js');
      insertJS(path_to_vvvv+'/nodes/vvvv.nodes.enumerations.js');
      insertJS(path_to_vvvv+'/nodes/vvvv.nodes.2d.js');
      insertJS(path_to_vvvv+'/nodes/vvvv.nodes.3d.js');
    }
    if (mode=='vvvviewer' || mode=='full') {
      insertJS(path_to_vvvv+'/vvvviewer/vvvv.vvvviewer.js');
    }
  }

  function initialisationComplete() {
    VVVV.Root = path_to_vvvv;
    VVVV.NodeLibrary = {};

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




