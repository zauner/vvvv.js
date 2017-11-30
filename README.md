** NOTICE: THIS IS THE INSTABLE MASTER. Existing documentation on http://vvvvjs.com is refering to the v1.0 tag, and might differ from this version.**

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

However, here are the single steps:

1. Download and install [Node.js 6.x](http://nodejs.org)

2. Download or clone VVVV.js into `/your/project/directory/vvvv_js`

3. In your console/terminal change to the vvvv.js directory and run
    npm install

4. At this point you can download/clone the [VVVV.js template](https://github.com/zauner/vvvv.js-template) into `/your/project/directory/vvvvjs-template`. If you decide to go with the template, you can skip over to 7.

5. In your project directoy create an empty VVVV patch. Just do so by creating an empty .v4p patch. In ths example it is `/your/project/directory/main.v4p`

6. Prepare your frontend HTML, so it includes and loads VVVV.js, like this:

/your/project/directory/index.html:

    <head>
    ...
    <script language="JavaScript" src="/vvvvjs/lib/require.js"></script>
    <script language="JavaScript" src="/vvvvjs/vvvv.js"></script>
    <link rel="VVVV" href="main.v4p"/>
    <script language="JavaScript">
      VVVVContext.init("/vvvv_js/", 'full', function() {
        console.log('VVVV.js initialized');
      });
    </script>
    ...
    </head>

This code initializes VVVV.js on the frontend and loads and runs `main.v4p`.

7. In `/your/project/directory` run

    $ node vvvv_js/server.js . -e

This will run the VVVV.js webserver and serve the current directory (`.` in the first argument). The `-e` option will enable patch editing.

    http://localhost:5000

This will just show `index.html`, since your mypatch.v4p is still empty, nothing more will happen. Read on to launch the patch editor


### Launching the patch editor

1. Launch the editor by appending #edit/main.v4p to the URL in the address bar. This will launch the editor in a popup, make sure your browser allows it.

2. To save, hit CTRL+S in the editor.

### Manually loading patches

If the &lt;link&gt; tag method above doesn't suit your needs (e.g. because you don't want to run the patch immeditely), you can create
the VVVV.Core.Patch object yourself like so:

    <head>
    ...
    <script language="JavaScript" src="/vvvv_js/lib/require.js"></script>
    <script language="JavaScript" src="/vvvv_js/vvvv.js"></script>
    <script language="JavaScript">
      VVVVContext.init("javascripts/vvvv_js/", 'full', function(VVVV) {
        console.log('VVVV.js initialized');

        var patch = new VVVV.Core.Patch("mypatch.v4p", function() {
          var mainloop = new VVVV.MainLoop(p);
          console.log('patch loaded and started');
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
