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

Installation 
-------------

In this short tutorial, I will show you how easy it is to get started with VVVV.js, the visual programming environment based on Javascript and WebGL. It runs on any platform (Windows/Linux/OSX) in a modern browser (Chrome recommended).
We will install Node.js and have a look at how we can use the browser-based visual programming editor of VVVV.js locally on your computer. Since I am working on Windows the few command-line codes will be for Windows (But should be easy to find out what it is for Linux / OSX).  

Step 1: Download or Clone Repository
-------------

First, you need to download or clone my VVVV.js repository from GitHub:

  https://github.com/tekcor/vvvv.js

Place the folder in a parent folder of your choice (e.g C://vvvv_dev/vvvv.js). This parent folder will be your working directory. You can put project folders in parallel to the vvvv.js folder. That is a convenient way to develop projects by using one vvvv.js folder for all of your projects at the same time. This has the benefit that you can globally update VVVV.js by pulling from git or by changing the code yourself.

In this example we will start with a project by using the vvvv.js-examples repository, which you can download here:

https://github.com/tekcor/vvvv.js-examples

Now your folder should look like this:

/vvvv_dev
         /vvvv.js
         /vvvv.js-examples
		 
Step 2: Install Node.js
-------------

Head over to Node.js and install it on your computer if you haven`t done it before already. After the installation, you have to check if Node.js is in your path environment. So fire up your terminal / command-line and type "node". If it does not show you the command list, chances are good you have to go and google how to add Node.js to your PATH.

If it is added to the path, you can navigate to /vvvv_dev/vvvv.js and type:

   npm install

and watch how Node.js is installing a server into your vvvv.js folder.

On Windows you can also just create a .bat file in the /vvvv_dev folder and paste the following code, which should install it correctly after double clicking:

echo "Installing Node.js Server"
cd %~dp0vvvv.js
npm install
timeout 10
Now that you have everything setup you are ready to go to start your Node.js server and launch the first VVVV.js patch.

Step3: Launch Node Server
-------------

Everytime when you want to work on a VVVV.js project, you need to start the Node.js server before.

For this navigate to your /vvvv-dev/vvvv.js folder and type the following command:

   node server.js . -e 

Of course, it makes sense to do this with a .bat file in the /vvvv_dev folder, too. So from now on you can always start your server by double-clicking the .bat file with the following code:


echo "Starting VVVV.JS Server"
node %~dp0vvvv.js/server.js . -e 
timeout 10

Now that we have your server running, let's open a patch!

Step 4: Starting the Patch
-------------

Now we want to start one of the patches in the vvvv.js-example folder. First, we open up the Chrome browser and type the local address of the examples:
http://localhost:5000/vvvv.js-examples/01_CookTorrance.html

You should see some Mokeys rendered on the screen by VVVV.js. In order to open the patch that generates this page, you have to append #edit and the path that leads to the patch file. In our example that would result in the following address, which is also what you will get if you press the "Open Editor" Button in the example.
http://localhost:5000/vvvv.js-examples/01_CookTorrance.html#edit/patches/root_CookTorrance.v4p

This link should now cause your browser to throw a pop-up warning and most likely the pop-up, which is the patch, would be blocked.

-> So you need to make sure that Pop-Ups are allowed for that page!

Eventually, reload the page after you have allowed the pop-ups. Now it should work and the patch editor should magically open and with it, a whole new universe of opportunities.

CookTorrance Patch
Figure 1: If you have successfully completed this tutorial, you should see this example now on your localhost.

Step 5: Embedding VVVV.js in your HTML file
I shortly want to show how you can embed VVVV.js in your own projects.
It is as simple as copying the following code snippet into the header of your HTML file:

<font face="Courier New">&lt;script language="JavaScript" src="../vvvv.js/lib/jquery/jquery-1.8.2.min.js"&gt;&lt;/script&gt;</font>
<font face="Courier New">&lt;script language="JavaScript" src="../vvvv.js/lib/require.js"&gt;&lt;/script&gt;</font>
<font face="Courier New">&lt;script language="JavaScript" src="../vvvv.js/vvvv.js"&gt;&lt;/script&gt;</font>
<font face="Courier New">&lt;link rel="Stylesheet" href="../vvvv.js/vvvviewer/vvvv.css"/&gt;</font>
<link rel="VVVV" href="patches/root_CookTorrance.v4p">
<font face="Courier New">&lt;script language="JavaScript"&gt;</font>
<font face="Courier New">        $(document).ready(function() {</font>
<font face="Courier New">                VVVVContext.init("../vvvv.js", "full", function() {</font>
<font face="Courier New">                        console.log('VVVV.js ready.');</font>
<font face="Courier New">                 });</font>
<font face="Courier New">         });</font>
<font face="Courier New">&lt;/script&gt;</font>


The only thing you need to change in this header script, is the relative file-path to your patch file (highlighted in bold).

The patch file has a .v4p file-ending.
You can make a new patch file by creating an empty text file and change its file-type to .v4p. If you reference to this newly created patch file into the above script, it will load this patch and you can open it for editing (see step 4).

Now that you know how to get started, you can check out the next tutorial, which will be about the basic concepts of the UI and patching with VVVV.js.


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
