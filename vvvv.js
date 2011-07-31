// VVVV.js -- Visual Webclient Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.




if(!window.console) {
	window.console = {
		log : function(str) {
		}
	};
}

function initVVVV(path_to_vvvv, mode) {

  console.log('loading vvvv.js ...');

  if ($('script[src*=underscore]').length==0)
    $('head').append($('<script language="JavaScript" src="'+path_to_vvvv+'/lib/underscore/underscore-min.js"></script>'));
  if ($('script[src*=d3.js]').length==0 && (mode=='full' || mode=='vvvviewer'))
    $('head').append($('<script language="JavaScript" src="'+path_to_vvvv+'/lib/d3-v1.14/d3.min.js"></script>'));
  if ($('script[src*=glMatrix]').length==0 && (mode=='full' || mode=='run'))
    $('head').append($('<script language="JavaScript" src="'+path_to_vvvv+'/lib/glMatrix-0.9.5.min.js"></script>'));

  if ($('script[src*=vvvv.core.js]').length==0) {
    $('head').append($('<script language="JavaScript" src="'+path_to_vvvv+'/core/vvvv.core.js"></script>'));
    if (mode=='run' || mode=='full') {
      $('head').append($('<script language="JavaScript" src="'+path_to_vvvv+'/mainloop/vvvv.mainloop.js"></script>'));
      $('head').append($('<script language="JavaScript" src="'+path_to_vvvv+'/mainloop/vvvv.dominterface.js"></script>'));
    
      $('head').append($('<script language="JavaScript" src="'+path_to_vvvv+'/nodes/vvvv.nodes.value.js"></script>'));
      $('head').append($('<script language="JavaScript" src="'+path_to_vvvv+'/nodes/vvvv.nodes.string.js"></script>'));
      $('head').append($('<script language="JavaScript" src="'+path_to_vvvv+'/nodes/vvvv.nodes.boolean.js"></script>'));
      $('head').append($('<script language="JavaScript" src="'+path_to_vvvv+'/nodes/vvvv.nodes.color.js"></script>'));
      $('head').append($('<script language="JavaScript" src="'+path_to_vvvv+'/nodes/vvvv.nodes.spreads.js"></script>'));
      $('head').append($('<script language="JavaScript" src="'+path_to_vvvv+'/nodes/vvvv.nodes.animation.js"></script>'));
      $('head').append($('<script language="JavaScript" src="'+path_to_vvvv+'/nodes/vvvv.nodes.network.js"></script>'));
      $('head').append($('<script language="JavaScript" src="'+path_to_vvvv+'/nodes/vvvv.nodes.system.js"></script>'));
      $('head').append($('<script language="JavaScript" src="'+path_to_vvvv+'/nodes/vvvv.nodes.canvas.js"></script>'));
      $('head').append($('<script language="JavaScript" src="'+path_to_vvvv+'/nodes/vvvv.nodes.transform.js"></script>'));
      $('head').append($('<script language="JavaScript" src="'+path_to_vvvv+'/nodes/vvvv.nodes.webgl.js"></script>'));
    }
    if (mode=='vvvviewer' || mode=='full') {
      $('head').append($('<script language="JavaScript" src="'+path_to_vvvv+'/vvvviewer/vvvv.vvvviewer.js"></script>'));
    }
  }
  
  console.log('done ...');
  
  VVVV.NodeLibrary = {};

  var p = new VVVV.Core.Patch('');
  _(VVVV.Nodes).each(function(n) {
    var x = new n(0, p);
    console.log("Registering "+x.nodename);
    VVVV.NodeLibrary[x.nodename] = n;
  });
  
}




