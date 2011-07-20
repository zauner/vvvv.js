VVVV.js - Visual Web Client Programming
======================================

www.zauner900.net/vvvv_js

**An open project, which aims to bring the visual programming language VVVV to your web browser.**


Setup / Run
-----------

**Note:** For developing VVVV patches you will need the original VVVV, so if you don't have it already, get it from the [VVVV Download Page](http://www.vvvv.org/downloads).
**Make sure to check the [Licencing Page](http://www.vvvv.org/licensing) as well!**

### Install Dummy Modules

Copy the directory "vvvv_js_modules" from the downloaded archive into the "modules" directory of your VVVV installation directory. This is neccessary,
because there are some VVVV.js nodes, that don't exist in pure VVVV for example the whole Canvas category). To be able to create those nodes in VVVV, we use this (dummy) modules.

### Setup VVVV.js scripts

Unpack the files into your project directory. Unfortunatly, the directory is named 'vvvv.js', which might cause problems with most webservers, so better rename it to "vvvv_js".

Include the script somehow like this:

    <head>
    ...
    <script language="JavaScript" src="vvvv_js/lib/jquery/jquery-1.4.2.min.js"></script>
    <script language="JavaScript" src="vvvv_js/vvvv.js"></script>
    ...
    </head>
    
### Load and run VVVV.js patches

Initialize VVVV.js and run a certain .v4p file at startup like this (uses jQuery):

    var patch;
    var mainloop;
    $(document).ready(function() {
      
      initVVVV('vvvv_js');
      
      patch = new VVVV.Core.Patch("main.v4p", function() {
        mainloop = new VVVV.Core.MainLoop(this);
      });

    });
  
  
`initVVVV(...)` initializes VVVV.js and loads all the needed script files, where the argument is the path to where you unpacked VVVV.js to.
`VVVV.Core.Patch(...)` loads the .v4p file, and calls the function supplied in the 2nd argument when finished. `VVVV.Core.MainLoop(this)` will run the patch.

You can pause and resume the mainloop by using

    // pause mainloop
    mainloop.stop();

    // resume mainloop
    mainloop.start();
  
### About patching VVVV.js

The great thing with VVVV is, that there's no difference between development and runtime, which means that your application is running while you're patching around.
Unfortunatly this is not possible in VVVV.js right now. Here we're stuck with the more traditional workflow of

1. patching in original VVVV
2. saving the file, and
3. running the patch in your browser

Note, that VVVV doesn't know anything abot VVVV.js, so just because you can create a node in VVVV doesn't mean that VVVV.js can actually run it.


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