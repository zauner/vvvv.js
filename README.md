VVVV.js - Visual Web Client Programming
=======================================

[www.vvvvjs.com](http://www.vvvvjs.com)

**The visual programming language VVVV brought to your web browser.**

VVVV.js allows you to use the world's greatest visual programming language [VVVV](http://vvvv.org) to enhance your web projects. You can create
2D Canvas and 3D WebGL graphics without writing a single line of code. It comes with a built in, browser based patch editor,
you don't need any additional software.

Main Features
-------------

* Run VVVV Patches seemlessly embedded in your web project
* Real-time patching using the built in browser based patch editor
* Supports subpatches so you can better structure your patches
* 2D Canvas graphics and 3D WebGL graphics with built in shader code editor
* Access and manipulate the DOM of the surrounding page from your VVVV.js patch
* VVVV compatible data format, so you can exchange patch snippets with classic VVVV

Licence
-------

VVVV.js is freely distributable under the MIT license (see details in LICENCE file). Concepts (e.g. nodes, pins, spreads) taken from VVVV (http://www.vvvv.org).

This software uses jQuery, underscore.js, d3.js and glMatrix.js. See the corrensponding licence files in the lib folder for details.


Getting Started
---------------

The best way to dive straight into VVVV.js is to head over to the [VVVV.js Lab](http://lab.vvvvjs.com) and try it out. There, you can try patching VVVV.js without the need of installing anything. Read on to find out how you can use VVVV.js in your own project.

### Loading VVVV.js and running patches

The template (see the template directory) gives a good starting point to see how to integrate VVVV.js with your web page.

However, here are the single steps:

1. Download VVVV.js and extract it (or clone the github repo) to the location in your project where you keep your JavaScript. Here, we are using javascripts/vvvv_js. Some webservers seem to have problems with
dots in directory names, so make sure to really rename the 'vvvv.js' from the archive to 'vvvv_js'.

2. Create a new patch. You do so by just creating an empty .v4p file at the location you'd like to have it, for example, mypatch.v4p.

3. Include VVVV.js and the mypatch.v4p in your website (e.g. index.html) like this:

index.html:

    <head>
    ...
    <script language="JavaScript" src="javascripts/vvvv_js/lib/jquery/jquery-1.8.2.min.js"></script> 
    <script language="JavaScript" src="javascripts/vvvv_js/vvvv.js"></script>
    <link rel="VVVV" href="mypatch.v4p"/>
    <script language="JavaScript">
      $(document).ready(function() {
        VVVV.init("javascripts/vvvv_js/", 'full', function() {
          console.log('VVVV.js initialized'); 
        });
      });
    </script>
    ...
    </head>
    
All the patches (and subpatches) loaded are stored in the VVVV.Patches object. You can access the VVVV.Core.Patch object created above for further processing via

    VVVV.Patches[0];
    
### Launching the patch editor

1. Launch the editor by appending #edit/mypatch.v4p to the URL in the address bar. This will launch the editor in a popup, make sure your browser allows it.

2. To save, hit CTRL+S in the editor. This will trigger a file download. Overwrite your existing mypatch.v4p with the downloaded file2

### Manually loading patches

If the &lt;script&gt; tag method above doesn't suit your needs (e.g. because you don't want to run the patch immeditely), you can create
the VVVV.Core.Patch object yourself like so:

    <head>
    ...
    <script language="JavaScript" src="javascripts/vvvv_js/lib/jquery/jquery-1.8.2.min.js"></script> 
    <script language="JavaScript" src="javascripts/vvvv_js/vvvv.js"></script>
    <script language="JavaScript">
      $(document).ready(function() {
        VVVV.init("javascripts/vvvv_js/", 'full', function() {
          console.log('VVVV.js initialized');
          
          var patch = new VVVV.Core.Patch("mypatch.v4p", function() {
            var mainloop = new VVVV.MainLoop(p);
            console.log('patch loaded and started');
          });
        });
      });
    </script>
    ...
    </head>

### Rendering Patches with the VVVViewer

You can load and render a patch embedded in a web site by first creating a Patch object as shown above, and then pass it to a newly created VVVViewer object:

    var myvvvviewer;
    var mypatch = new VVVV.Core.Patch("mypatch.v4p", function() {
      myvvvviewer = new VVVV.VVVViewer(this, '#patch');
    });
    
This is the corresponding HTML code:

    <div id='patch'>Your browser does not support the VVVViewer</div>
    
While in the example above the Patch constructor new VVVV.Core.Patch("mypatch.v4p", ...) loads a VVVV patch file from the remote server,
it is also possible to just pass actual VVVV XML Code to the constructor instead of a filename.
This might be the case, when you display VVVV Code which comes from a forum post or a blog entry.

### More Information

Find more information and guides on [www.vvvvjs.com](http://www.vvvvjs.com).