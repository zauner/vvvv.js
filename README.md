VVVV.js - Visual Web Client Programming
======================================

vvvvjs.quasipartikel.at

**An open project, which aims to bring the visual programming language VVVV to your web browser.**

Licence
-------

VVVV.js is freely distributable under the MIT license (see details in LICENCE file). Concepts (e.g. nodes, pins, spreads) taken from VVVV (http://www.vvvv.org).

This software uses jQuery, underscore.js, d3.js and glMatrix.js. See the corrensponding licence files in the lib folder for details.


Setup / Run
-----------

**Note:** For developing VVVV patches you will need the original VVVV, so if you don't have it already, get it from the [VVVV Download Page](http://www.vvvv.org/downloads).
**Make sure to check the [Licencing Page](http://www.vvvv.org/licensing) as well!**

### Deploying VVVV.js

#### Setup VVVV.js scripts

Unpack the files into your project directory. Unfortunatly, the directory is named 'vvvv.js', which might cause problems with most webservers, so better rename it to "vvvv_js".

Include the script somehow like this:

    <head>
    ...
    <script language="JavaScript" src="vvvv_js/lib/jquery/jquery-1.8.2.min.js"></script>
    <script language="JavaScript" src="vvvv_js/vvvv.js"></script>
    ...
    </head>
    
### Load and run VVVV.js patches

Initialize VVVV.js and run a certain .v4p file at startup like this (uses jQuery):

    var patch;
    var mainloop;
    $(document).ready(function() {
      
      VVVV.init('vvvv_js','full', function() {
      
        patch = new VVVV.Core.Patch("main.v4p", function() {
          mainloop = new VVVV.Core.MainLoop(this);
        });
      });

    });
  
  
`initVVVV(...)` initializes VVVV.js and loads all the needed script files, where the argument is the path to where you unpacked VVVV.js to.
`VVVV.Core.Patch(...)` loads the .v4p file, and calls the function supplied in the 2nd argument when finished. `VVVV.Core.MainLoop(this)` will run the patch.

You can pause and resume the mainloop by using

    // pause mainloop
    mainloop.stop();

    // resume mainloop
    mainloop.start();
  
### Patching VVVV.js

#### Install the VVVV.js SDK

Fire up VVVV and hit Alt+R to show the root patch. Add the path `path/to/vvvv_js/vvvv_js_sdk` to the list of external resources. Save the root patch.
Open a new patch, and check, if you can add e.g. the `Renderer (Canvas VVVVjs)` node.

#### Realtime Patching by connecting VVVV.js and VVVV

To get VVVV's great realtime-patching experience, you can connect your classic VVVV to the browser running a VVVV.js website. Open an empty patch
and add the VVVVJsConnector node. Your VVVV is now ready to establish a connection. In your browser, add the string `#sync/name_of_your_patch.v4p`
in the address bar. Hit enter, and VVVV.js and VVVV should be synced, so you can alter the patch in VVVV.

Note, that VVVV doesn't know anything abot VVVV.js, so just because you can create a node in VVVV doesn't mean that VVVV.js can actually run it.
Keep an eye on the JavaScript console to know what's going on.


### Rendering Patches with the VVVViewer

You can load and view a patch by first creating a Patch object as shown above, and then pass it to a newly created VVVViewer object:

    var myvvvviewer;
    var mypatch = new VVVV.Core.Patch("mypatch.v4p", function() {
      myvvvviewer = new VVVV.VVVViewer(this, '#patch');
    });
    
This is the corresponding HTML code:

    <div id='patch'>Your browser does not support the VVVViewer</div>
    
While in the example above the Patch constructor new VVVV.Core.Patch("mypatch.v4p", ...) loads a VVVV patch file from the remote server,
it is also possible to just pass actual VVVV XML Code to the constructor instead of a filename.
This might be the case, when you display VVVV Code which comes from a forum post or a blog entry.