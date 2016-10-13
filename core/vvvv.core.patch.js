

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }

define(function(require,exports) {


  var $ = require('jquery');
  var _ = require('underscore');
  var Node = require('./vvvv.core.node');
  var Link = require('./vvvv.core.link');
  var VVVV = require('./vvvv.core.defines');
  var ServerSync = require('./vvvv.core.server_sync');
  var Cluster = require('./vvvv.core.cluster');

  /**
   * @class
   * @constructor
   * @param {String} ressource either a path/to/some/patch.v4p or VVVV XML code
   * @param {Function} success_handler called after the patch (and all sub components) has completely loaded and is ready
   * @param {Function} error_handler called if an error occured, most likey because the .v4p file was not found
   * @param {VVVV.Core.Patch} [parentPatch] the parent patch, if it's a subpatch
   * @param {Integer} id the patch's ID in the parent patch, if it's a subpatch
   */
  var Patch = function(ressource, success_handler, error_handler, parentPatch, id) {

    this.ressource = ressource;
    this.vvvv_version = "45_26.1";
    /** the diameter of the patch / the maximum X and Y coordinates of all nodes in a patch */
    this.boundingBox = {width: 0, height: 0};
    /** @member*/
    this.windowWidth = 500;
    /** @member */
    this.windowHeight = 500;

    /** a hash table containing the pins of all nodes inside a patch, indexed with [node_id]_[in|out|inv]_[pinname] */
    this.pinMap = {};
    /** a hash table containing all nodes inside a patch, indexed with the node ID */
    this.nodeMap = {};
    /** an array containing all nodes inside a patch */
    this.nodeList = [];
    /** an array containing all links inside a patch */
    this.linkList = [];
    /** an array containing all pins (except connected input pins) **/
    this.pinList = [];
    /** the flattened, compiled function calling all nodes in the correct order. Should not be written manually, but only updated using {@link VVVV.Core.Patch.compile} */
    this.compiledFunc = undefined;

    /** The {@link VVVV.MainLoop} Object running this patch */
    this.mainloop = undefined;

    this.success = success_handler;
    this.error = error_handler;

    this.editor = undefined;

    this.isPersisted = true;

    this.setupObject();

    if (parentPatch)
      this.parentPatch = parentPatch;
    if (id)
      this.id = id;

    var print_timing = false;

    /**
     * Returns the patch's absolute path, usable for the browser
     * @return {String} the absolute path
     */
    this.getAbsolutePath = function() {
      var path = this.getRelativePath();
      if (this.parentPatch)
        path = this.parentPatch.getAbsolutePath()+path;
      return path;
    }

    /**
     * Returns a patch's relative path, as it is specified in the paret patch
     * @return {String} the patch's path relative to its parent patch
     */
    this.getRelativePath = function() {
      var match = this.nodename.match(/(.*\/)?[^/]+\.v4p/);
      return match[1] || '';
    }

    var patchIdentifier = undefined;
    this.getPatchIdentifier = function() {
      if (patchIdentifier)
        return patchIdentifier;
      if (!this.parentPatch)
        patchIdentifier = "ROOT";
      else
        patchIdentifier = this.parentPatch.getPatchIdentifier()+"/"+this.id;
      return patchIdentifier;
    }

    /**
     * Called when a patch is deleted. Deletes all containing nodes.
     */
    this.destroy = function() {
      for (var i=0; i<this.nodeList.length; i++) {
        this.nodeList[i].destroy();
        delete this.nodeMap[this.nodeList[i].id];
        delete this.nodeList[i];
      }
    }

    /**
     * Creates an array of slices out of pin value string coming from a patch XML
     * @param {String} v the pin value string from the XML
     */
    function splitValues(v) {
      if (v==undefined)
        return [];
      if (this.vvvv_version<="45_26") { // legacy code
        if (/\|/.test(v))
          separator = "|";
        else
          separator = ",";
        return v.split(separator).filter(function(d,i) { return d!=""});
      }

      var result = [];
      var currSlice = '';
      var insideValue = false;
      var len = v.length;
      for (var i=0; i<len; i++) {
        if (v[i]==',' && !insideValue) {
          result.push(currSlice);
          currSlice = '';
        }
        else if (v[i]=='|') {
          if (v[i+1]!='|' || i+1==v.length-1)
            insideValue = !insideValue;
          else
            currSlice += v[++i];
        }
        else
          currSlice += v[i];
      }
      result.push(currSlice);
      return result;
    }

    if (this.vvvv_version<="45_26") {
      var oldLinks = {};
      var newLinks = {};
      var oldNodes = {};
      var newNodes = {};
    }

    var thisPatch = this;

    var ready_callback = undefined;
    /**
     * Takes a patch XML string, parses it, and applies it to the patch. This method is called once by the constructor, passing the complete patch code, and
     * frequently by an editor, passing in XML snippets. This is the only method you should use to manipulate a patch.
     * @param {String} xml VVVV Patch XML
     * @param {Function} ready_callback called after the XML code has been completely processed, and the patch is fully loaded and ready again
     */
    this.doLoad = function(xml, rb) {
      ready_callback = rb;
      var p = this;
      do {
        p.dirty = true;
      }
      while (p=p.parentPatch);

      var $xml;
      if (VVVVContext.name == "browser") {
        var $ = require('jquery');
        $xml = $(xml);
      }
      else {
        var $ = window.server_req('cheerio').load(xml, {xmlMode: true});
        $xml = $('PATCH');
      }

      var version_match = /^<!DOCTYPE\s+PATCH\s+SYSTEM\s+"(.+)\\(.+)\.dtd/.exec(xml);
      if (version_match)
        thisPatch.vvvv_version = version_match[2].replace(/[a-zA-Z]+/, '_');

      // this is kind of a hacky way to determine, if the incoming XML is the complete patch, or a patch change
      var syncmode = 'diff';
      if (/\s<PATCH/.test(xml) || thisPatch.vvvv_version<="45_26") {
        syncmode = 'complete';
        if (VVVV_ENV=='development') console.log('complete: '+this.nodename);
      }

      var $windowBounds = $xml.find('BOUNDS[type="Window"]').first();
      if ($windowBounds.length>0) {
        thisPatch.windowWidth = $windowBounds.attr('width')/15;
        thisPatch.windowHeight = $windowBounds.attr('height')/15;
      }

      if (syncmode=='complete')
        newNodes = {};
      else
        this.isPersisted = false;

      var nodesLoading = 0;

      $xml.find('NODE').each(function() {

        // in case the node's id is already present
        var nodeToReplace = undefined;
        var nodeExists = false;
        if (thisPatch.nodeMap[$(this).attr('id')]!=undefined) {
          if ($(this).attr('createme')=='pronto') // renaming node ...
            nodeToReplace = thisPatch.nodeMap[$(this).attr('id')];
          else // just moving it ...
            nodeExists = true;
        }

        var $bounds;
        if ($(this).attr('componentmode')=="InABox")
          $bounds = $(this).find('BOUNDS[type="Box"]').first();
        else
          $bounds = $(this).find('BOUNDS[type="Node"]').first();

        if (!nodeExists) {
          var nodename = $(this).attr('systemname')!="" ? $(this).attr('systemname') : $(this).attr('nodename');
          if (nodename==undefined)
            return;
          if (VVVV.NodeLibrary[nodename.toLowerCase()]!=undefined) {
            var n = new VVVV.NodeLibrary[nodename.toLowerCase()]($(this).attr('id'), thisPatch);
            if (VVVV.NodeLibrary[nodename.toLowerCase()].definingNode) {
              n.definingNode = VVVV.NodeLibrary[nodename.toLowerCase()].definingNode;
              if (nodeToReplace)
                VVVV.NodeLibrary[nodename.toLowerCase()].definingNode.relatedNodes[VVVV.NodeLibrary[nodename.toLowerCase()].definingNode.relatedNodes.indexOf(nodeToReplace)] = n;
              else
                VVVV.NodeLibrary[nodename.toLowerCase()].definingNode.relatedNodes.push(n);
            }

            // load 3rd party libs, if required for this node
            if (VVVV.NodeLibrary[nodename.toLowerCase()].requirements) {
              _(VVVV.NodeLibrary[nodename.toLowerCase()].requirements).each(function(libname) {
                if (VVVV.LoadedLibs[libname]===undefined) {
                  thisPatch.resourcesPending++; // pause patch evaluation
                  VVVV.loadScript(VVVV.ThirdPartyLibs[libname], function() {
                    thisPatch.resourcesPending--; // resume patch evaluation
                    VVVV.LoadedLibs[libname]=VVVV.ThirdPartyLibs[libname];
                    updateLinks(xml);
                    thisPatch.afterUpdate();
                    thisPatch.compile();
                    if (thisPatch.resourcesPending<=0 && ready_callback) {
                      ready_callback();
                      ready_callback = undefined;
                    }
                  });
                }
              });
            }
          }
          else if (/.fx$/.test($(this).attr('filename'))) {
            var n = new VVVV.Nodes.GenericShader($(this).attr('id'), thisPatch);
            n.isShader = true;
            n.shaderFile = $(this).attr('filename').replace(/\\/g, '/').replace(/\.fx$/, '.vvvvjs.fx').replace('lib/nodes/', '');
            n.nodename = nodename;
          }
          else {
            if (/.v4p$/.test($(this).attr('filename'))) {
              thisPatch.resourcesPending++;
              var that = this;
              var n = new Patch($(this).attr('filename'),
                function() {
                  thisPatch.resourcesPending--;
                  if (VVVV_ENV=='development') console.log(this.nodename+'invoking update links')
                  updateLinks(xml);
                  if (thisPatch.editor)
                    thisPatch.editor.addPatch(this);
                  if (this.auto_evaluate) {
                    var p = thisPatch;
                    do {
                      p.auto_evaluate = true;
                    }
                    while (p = p.parentPatch);
                  }
                  this.setMainloop(thisPatch.mainloop);
                  thisPatch.afterUpdate();
                  thisPatch.compile();
                  if (thisPatch.resourcesPending<=0 && ready_callback) {
                    ready_callback();
                    ready_callback = undefined;
                  }
                },
                function() {
                  thisPatch.resourcesPending--;
                  this.not_implemented = true;
                  VVVVContext.onNotImplemented(nodename);
                  updateLinks(xml);
                  thisPatch.afterUpdate();
                  thisPatch.compile();
                  if (thisPatch.resourcesPending<=0 && ready_callback) {
                    ready_callback();
                    ready_callback = undefined;
                  }
                },
                thisPatch, $(that).attr('id')
              );
              n.isSubpatch = true;
              if (thisPatch.editor && !n.editor)
                thisPatch.editor.addPatch(n);
              thisPatch.nodeMap[n.id] = n;
            }
            else {
              var n = new Node($(this).attr('id'), nodename, thisPatch);
              n.not_implemented = true;
              VVVVContext.onNotImplemented(nodename);
            }
          }
          if (VVVV_ENV=='development' && syncmode!='complete') console.log(thisPatch.nodename+': inserted new node '+n.nodename);
        }
        else
          n = thisPatch.nodeMap[$(this).attr('id')];

        if (n.auto_evaluate) { // as soon as the patch contains a single auto-evaluate node, it is also an auto evaluating subpatch
          var p = thisPatch;
          do {
            p.auto_evaluate = true;
          }
          while (p = p.parentPatch);
        }

        if ($(this).attr('deleteme')=='pronto') {
          if (VVVV_ENV=='development') console.log('removing node '+n.id);
          if (n.isSubpatch && !n.not_implemented) {
            if (n.editor) n.editor.removePatch(n);
            var subpatches = n.getSubPatches();
            subpatches.push(n);
            var path;
            for (var i=0; i<subpatches.length; i++) {
              path = VVVV.Helpers.prepareFilePath(subpatches[i].nodename, subpatches[i].parentPatch);
              VVVVContext.Patches[path].splice(VVVVContext.Patches[path].indexOf(n), 1);
              if (VVVVContext.Patches[path].length == 0)
                delete VVVVContext.Patches[path];
              thisPatch.serverSync.unregisterPatch(subpatches[i]);
            }
          }
          if (n.definingNode) { // remove connection to related DefineNode node
            n.definingNode.relatedNodes.splice(n.definingNode.relatedNodes.indexOf(n), 1);
          }
          thisPatch.nodeList.splice(thisPatch.nodeList.indexOf(n),1);
          n.destroy();
          delete thisPatch.nodeMap[n.id];
        }

        if ($bounds.length>0) {
          if ($bounds.attr('left')) {
            n.x = $bounds.attr('left')/15;
            n.y = $bounds.attr('top')/15;
            thisPatch.boundingBox.width = Math.max(thisPatch.boundingBox.width, n.x+100);
            thisPatch.boundingBox.height = Math.max(thisPatch.boundingBox.height, n.y+100);
          }
          if ($bounds.attr('width')) {
            n.width = $bounds.attr('width');
            n.height = $bounds.attr('height');
          }
        }

        if (/^iobox/.test(n.nodename.toLowerCase()))
          n.isIOBox = true;

        //To add anything which relates to all nodes
        if (!nodeExists)
          n.setup();

        var that = this;

        // PINS
        $(this).find('PIN').each(function() {
          var pinname = $(this).attr('pinname');
          var values = splitValues($(this).attr('values'));

          //Get all defaults from xml
          if (values!=undefined) {
            if (values.length > 0)
              n.addDefault(pinname, values);
          }

          // if the output pin already exists (because the node created it), skip
          if (n.outputPins[pinname]!=undefined)
            return;

          // the input pin already exists (because the node created it), don't add it, but set values, if present in the xml
          if (n.inputPins[pinname]!=undefined) {
            if (!n.inputPins[pinname].isConnected()) {
              n.applyPinValuesFromXML(pinname);
            }
            return;
          }

          // the input pin already exists (because the node created it), don't add it, but set values, if present in the xml
          if (n.invisiblePins[pinname]!=undefined) {
            if (values!=undefined) {
              for (var i=0; i<values.length; i++) {
                if (n.invisiblePins[pinname].values[i]!=values[i])
                  n.invisiblePins[pinname].setValue(i, values[i]);
              }
              n.invisiblePins[pinname].setSliceCount(values.length);
            }
            return;
          }

          //Check for non implemented nodes
          if (($(this).attr('visible')==1 && $(this).attr('pintype')!='Configuration') || n.isSubpatch) {
            if ($(this).attr('pintype')=="Output" || $xml.find('LINK[srcnodeid='+n.id+']').filter("LINK[srcpinname='"+pinname.replace(/[\[\]]/,'')+"']").length > 0) {
              if (n.outputPins[pinname] == undefined) {
                //Add as output list if not already there
                n.addOutputPin(pinname, values);
              }
            }
            else {
              if (n.inputPins[pinname] == undefined && n.invisiblePins[pinname] == undefined) {
                //Add as intput is neither in invisible/input list
                n.addInputPin(pinname, values);
              }
            }
          }
          else {
            if (n.inputPins[pinname] == undefined && n.invisiblePins[pinname] == undefined) {
              //Add as invisible pin
              n.addInvisiblePin(pinname, values);
            }
          }

        });

        //Initialize node
        if (!nodeExists) {
          if (nodeToReplace) { // copy config pins from node which is being replaced
            console.log("replacing node "+n.id+" / "+nodeToReplace.nodename+" with "+n.nodename);
            _(nodeToReplace.invisiblePins).each(function(p, name) {
              if (!n.invisiblePins[name])
                n.invisiblePins[name] = p;
              else {
                thisPatch.pinMap[n.id+"_inv_"+name] = n.inputPins[name];
                if (n.invisiblePins[name].typeName==p.typeName)
                  n.invisiblePins[name].values = p.values;
              }
            });
          }

          n.initialize();

          if (nodeToReplace) { // copy in- and output pins from node which is being replaced
            _(nodeToReplace.inputPins).each(function(p, name) {
              if (n.inputPins[name]) {
                thisPatch.pinMap[n.id+"_in_"+name] = n.inputPins[name];
                if (n.inputPins[name].typeName!=p.typeName) {
                  var i = p.links.length;
                  while (i--) {
                    p.links[i].destroy();
                  }
                }
                else {
                  n.inputPins[name].values = p.values;
                  var i = p.links.length;
                  while (i--) {
                    n.inputPins[name].links[i] = p.links[i];
                    n.inputPins[name].links[i].toPin = n.inputPins[name];
                  }
                }
              }
              else {
                var i = p.links.length;
                while (i--) {
                  p.links[i].destroy();
                }
              }
            });
            _(nodeToReplace.outputPins).each(function(p, name) {
              if (n.outputPins[name]) {
                thisPatch.pinMap[n.id+"_out_"+name] = n.outputPins[name];
                if (n.outputPins[name].typeName!=p.typeName) {
                  var i = p.links.length;
                  while (i--) {
                    p.links[i].destroy();
                  }
                }
                else {
                  n.outputPins[name].values = p.values;
                  var i = p.links.length;
                  while (i--) {
                    n.outputPins[name].links[i] = p.links[i];
                    n.outputPins[name].links[i].fromPin = n.outputPins[name];
                  }
                }
              }
              else {
                var i = p.links.length;
                while (i--) {
                  p.links[i].destroy();
                }
              }
            });
            thisPatch.nodeList.splice(thisPatch.nodeList.indexOf(nodeToReplace),1);
            nodeToReplace.destroy();
            delete nodeToReplace;
            nodeToReplace = undefined;
          }
          thisPatch.nodeList.push(n);
        }

        if (syncmode=='complete')
          newNodes[n.id] = n;

      });

      if (syncmode=='complete') {
        _(oldNodes).each(function(n, id) {
          if (newNodes[id]==undefined) {
            if (VVVV_ENV=='development') console.log('removing node '+n.id);
            thisPatch.nodeList.splice(thisPatch.nodeList.indexOf(n),1);
            delete thisPatch.nodeMap[n.id];
          }
        });
        oldNodes = {};
        _(newNodes).each(function(n, id) {
          oldNodes[id] = n;
        });
      }

      if (this.resourcesPending===0)
        updateLinks(xml);

      function updateLinks(xml) {
        if (syncmode=='complete')
          newLinks = {};

        // first delete marked links
        $xml.find('LINK[deleteme="pronto"]').each(function() {
          var link = false;
          for (var i=0; i<thisPatch.linkList.length; i++) {
            if (thisPatch.linkList[i].fromPin.node.id==$(this).attr('srcnodeid') &&
                thisPatch.linkList[i].fromPin.pinname==$(this).attr('srcpinname') &&
                thisPatch.linkList[i].toPin.node.id==$(this).attr('dstnodeid') &&
                thisPatch.linkList[i].toPin.pinname==$(this).attr('dstpinname')) {
              link = thisPatch.linkList[i];
            }
          }
          if (!link)
            return;
          if (VVVV_ENV=='development') console.log('removing '+link.fromPin.pinname+' -> '+link.toPin.pinname);
          var fromPin = link.fromPin;
          var toPin = link.toPin;
          link.destroy();
          fromPin.connectionChanged();
          toPin.connectionChanged();
          toPin.markPinAsChanged();
        });

        $xml.find('LINK[deleteme!="pronto"]').each(function() {
          var srcPin = thisPatch.pinMap[$(this).attr('srcnodeid')+'_out_'+$(this).attr('srcpinname')];
          var dstPin = thisPatch.pinMap[$(this).attr('dstnodeid')+'_in_'+$(this).attr('dstpinname')];

          // add pins which are neither defined in the node, nor defined in the xml, but only appeare in the links (this is the case with shaders)
          if (srcPin==undefined && thisPatch.nodeMap[$(this).attr('srcnodeid')])
            srcPin = thisPatch.nodeMap[$(this).attr('srcnodeid')].addOutputPin($(this).attr('srcpinname'), undefined);
          if (dstPin==undefined && thisPatch.nodeMap[$(this).attr('dstnodeid')])
            dstPin = thisPatch.nodeMap[$(this).attr('dstnodeid')].addInputPin($(this).attr('dstpinname'), undefined);

          if (srcPin && dstPin) {
            var link = false;
            for (var i=0; i<thisPatch.linkList.length; i++) {
              if (thisPatch.linkList[i].fromPin.node.id==srcPin.node.id &&
                  thisPatch.linkList[i].fromPin.pinname==srcPin.pinname &&
                  thisPatch.linkList[i].toPin.node.id==dstPin.node.id &&
                  thisPatch.linkList[i].toPin.pinname==dstPin.pinname) {
                link = thisPatch.linkList[i];
              }
            }

            if (!link) {
              link = new Link(srcPin, dstPin);
              srcPin.connectionChanged();
              dstPin.connectionChanged();
              thisPatch.linkList.push(link);
              dstPin.connect(srcPin);
            }

            if (syncmode=='complete')
              newLinks[srcPin.node.id+'_'+srcPin.pinname+'-'+dstPin.node.id+'_'+dstPin.pinname] = link;
          }
        });

        if (syncmode=='complete') {
          _(oldLinks).each(function(l, key) {
            if (newLinks[key]==undefined) {
              if (VVVV_ENV=='development') console.log('removing '+l.fromPin.pinname+' -> '+l.toPin.pinname);
              var fromPin = l.fromPin;
              var toPin = l.toPin;
              l.destroy();
              fromPin.connectionChanged();
              toPin.connectionChanged();
              toPin.markPinAsChanged();
              if (toPin.reset_on_disconnect)
                toPin.reset();
            }
          });
          oldLinks = {};
          _(newLinks).each(function(l, key) {
            oldLinks[key] = l;
          });
        }
      }

      this.compile();
      if (this.resourcesPending<=0 && ready_callback) {
        ready_callback();
        ready_callback = undefined;
      }
    }

    /**
     * Recursively fetches and returns all subpatches inside a patch
     * @return {Array} an array of {@link VVVV.Core.Patch} objects
     */
    this.getSubPatches = function() {
      var ret = [];
      for (var i=0; i<this.nodeList.length; i++) {
        if (this.nodeList[i].isSubpatch) {
          ret.push(this.nodeList[i]);
          ret = ret.concat(this.nodeList[i].getSubPatches());
        }
      }
      return ret;
    }

    /**
     * Sets the {@link VVVV.Core.MainLoop} object of the patch and all containing subpatches
     * @param {VVVV.Core.MainLoop} ml
     */
    this.setMainloop = function(ml) {
      this.mainloop = ml;
      for (var i=0; i<this.nodeList.length; i++) {
        if (this.nodeList[i].isSubpatch) {
          this.nodeList[i].setMainloop(ml);
        }
      }
    }

    /**
     * Called always after the patch has been evaluated
     * @abstract
     */
    this.afterEvaluate = function() {

    }

    /**
     * Called always after the patch has been modified using {@link VVVV.Core.Patch.doLoad}
     * @abstract
     */
    this.afterUpdate = function() {

    }

    /**
     * Returns the VVVV XML string representing the patch, ready to be saved
     * @return {String}
     */
    this.toXML = function() {
      var $patch = $("<PATCH>");
      var $bounds = $("<BOUNDS>");
      $bounds.attr("type", "Window");
      $bounds.attr("width", parseInt(this.windowWidth * 15));
      $bounds.attr("height", parseInt(this.windowHeight * 15));
      $patch.append($bounds);

      var boundTypes = ["Node", "Box"];
      for (var i=0; i<this.nodeList.length; i++) {
        var n = this.nodeList[i];
        $patch.append(n.serialize());
      }
      for (var i=0; i<this.linkList.length; i++) {
        var l = this.linkList[i];
        $patch.append(l.serialize());
      }

      var xml = '<!DOCTYPE PATCH  SYSTEM "http://vvvv.org/versions/vvvv45beta28.1.dtd" >\r\n  '+$patch.wrapAll('<d></d>').parent().html();
      xml = xml.replace(/<patch/g, "<PATCH");
      xml = xml.replace(/<\/patch>/g, "\n  </PATCH>");
      xml = xml.replace(/<node/g, "\n  <NODE");
      xml = xml.replace(/<\/node>/g, "\n  </NODE>");
      xml = xml.replace(/<bounds/g, "\n  <BOUNDS");
      xml = xml.replace(/<\/bounds>/g, "\n  </BOUNDS>");
      xml = xml.replace(/<pin/g, "\n  <PIN");
      xml = xml.replace(/<\/pin>/g, "\n  </PIN>");
      xml = xml.replace(/<lonk/g, "\n  <LINK");
      xml = xml.replace(/<\/lonk>/g, "\n  </LINK>");
      return xml;
    }

    this.remotePatchConnection = null;
    if (this.parentPatch)
      this.serverSync = this.parentPatch.serverSync;
    else {
      this.serverSync = new ServerSync(this);
    }
    this.cluster = new Cluster(this);

    var autoResetPins = [];
    this.resetAutoResetPins = function() {
      var i = autoResetPins.length;
      var j = 0;
      var resetted;
      while (i--) {
        resetted = false;
        if (autoResetPins[i].values.changedAt<this.mainloop.frameNum) {
          j = autoResetPins[i].values.length;
          while (j--) {
            if (autoResetPins[i].values[j]>=0.5) {
              autoResetPins[i].values[j] = 0;
              resetted = true;
            }
          }
          if (resetted) {
            autoResetPins[i].markPinAsChanged();
          }
        }
      }
    }

    /**
     * Assemples the {@link VVVV.Core.Patch.compiledFunc} function, which is called each frame, and subsequently calls all nodes in the correct order. This method is invoked automatically each time the patch has been changed.
     */
    this.compile = function() {
      this.evaluationRecipe = [];
      this.pinList = [];
      var addedNodes = {};
      var nodeStack = [];
      var lostLoopRoots = [];

      var recipe = this.evaluationRecipe;
      var pinList = this.pinList;
      var regex = new RegExp(/\{([^\}]+)\}/g);
      var thisPatch = this;

      autoResetPins = [];

      this.cluster.detect();
      if (this.cluster.hasNodes && !this.serverSync.isConnected())
        this.serverSync.connect(function() {
          if (this.resourcesPending==0 && ready_callback) {
            ready_callback();
            ready_callback = undefined;
          }
        });

      var compiledCode = "";

      function addSubGraphToRecipe(node) {
        if (nodeStack.indexOf(node.id)<0) {
          nodeStack.push(node.id);
          var upstreamNodes = node.getUpstreamNodes();
          var loop_detected = false;
          _(upstreamNodes).each(function(upnode) {
            if (addedNodes[upnode.id]==undefined) {
              loop_detected = loop_detected || addSubGraphToRecipe(upnode);
            }
          });
          nodeStack.pop();
        }

        if (loop_detected && node.delays_output)
          lostLoopRoots.push(node);

        if ((!loop_detected && nodeStack.indexOf(node.id)<0) || node.delays_output) {
          if ((node.inCluster && VVVVContext.name=="nodejs") || (!node.inCluster && VVVVContext.name=="browser") || node.isSubpatch || (node.environments && node.environments.length>1)) {
            if (node.getCode) {
              node.outputPins["Output"].values.incomingPins = [];
              var nodecode = "("+node.getCode()+")";
              var code = nodecode;
              var match;
              while (match = regex.exec(nodecode)) {
                var v;
                if (node.inputPins[match[1]].values.code) {
                  v = node.inputPins[match[1]].values.code;
                  node.outputPins['Output'].values.incomingPins = node.outputPins['Output'].values.incomingPins.concat(node.inputPins[match[1]].values.incomingPins)
                }
                else {
                  if (!node.inputPins[match[1]].isConnected() && node.inputPins[match[1]].getSliceCount()==1)
                    v = node.inputPins[match[1]].getValue(0);
                  else
                    v = "patch.nodeMap["+node.id+"].inputPins['"+match[1]+"'].getValue(iii)";
                  node.outputPins['Output'].values.incomingPins.push(node.inputPins[match[1]]);
                }
                code = code.replace("{"+match[1]+"}", v);
              }
              node.outputPins["Output"].values.code = code;
              for (var i=0; i<node.outputPins["Output"].links.length; i++) {
                if (!node.outputPins["Output"].links[i].toPin.node.getCode) {
                  compiledCode += node.outputPins["Output"].generateStaticCode(true);
                  break;
                }
              }
            }
            else {
              if (!node.not_implemented) {
                recipe.push(node);
                compiledCode += "var n = patch.nodeMap["+node.id+"];\n";
                compiledCode += "if ((n.isDirty() || n.auto_evaluate || n.isSubpatch) && !n.dealWithNilInput()) { n.evaluate(); n.dirty = false; }\n";
              }
            }
          }
          for (var pinname in node.inputPins) {
            if (node.inputPins[pinname].links.length==0)
              pinList.push(node.inputPins[pinname]);
          }
          for (var pinname in node.invisiblePins) {
            pinList.push(node.invisiblePins[pinname]);
          }
          for (var pinname in node.outputPins) {
            pinList.push(node.outputPins[pinname]);
            if (node.outputPins[pinname].auto_reset)
              autoResetPins.push(node.outputPins[pinname]);
          }
          addedNodes[node.id] = node;
          return false;
        }
        return true;
      }

      for (var i=0; i<this.nodeList.length; i++) {
        if (this.nodeList[i].getDownstreamNodes().length==0 || this.nodeList[i].auto_evaluate || this.nodeList[i].delays_output) {
          if (addedNodes[this.nodeList[i].id]==undefined)
            addSubGraphToRecipe(this.nodeList[i]);
        }
      }

      for (var i=0; i<lostLoopRoots.length; i++) {
        addSubGraphToRecipe(lostLoopRoots[i]);
      }

      compiledCode = "try {\npatch.resetAutoResetPins();\n"+compiledCode+"\n} catch (e) { console.error(e.message); console.log(e.stack); }";

      this.compiledFunc = new Function('patch', compiledCode);
      //console.log(this.compiledFunc.toString());
    }

    /**
     * Evaluates the patch once. Is called by the patch's {@link VVVV.Core.MainLoop} each frame, and should not be called directly
     */
    this.evaluate = function() {
      if (this.resourcesPending>0) // this.resourcesPending is >0 when thirdbarty libs or subpatches are loading at the moment
        return;
      if (print_timing) {
        var nodeProfiles = {};
        var start = new Date().getTime();
        var elapsed = 0;
      }

      if (this.serverSync.processMessage)
        this.serverSync.processMessage(this.getPatchIdentifier());

      this.compiledFunc(this);

      if (this.cluster.hasNodes) {
        this.cluster.syncPinValues(this.serverSync.socket);
      }

      if (print_timing) {
        _(nodeProfiles).each(function(p, nodename) {
          console.log(p.count+'x '+nodename+': '+p.dt+'ms');
        });
        var start = new Date().getTime();
      }
      this.afterEvaluate();
      if (print_timing)
        console.log('patch rendering: '+(new Date().getTime() - start)+'ms')

      print_timing = false;
    }

    $(window).keydown(function(e) {

      // ctrl + alt + T to print execution times
      if (e.which==84 && e.altKey && e.ctrlKey)
        print_timing = true;
    });

    // actually load the patch, depending on the type of resource

    if (/\.v4p[^<>\s]*$/.test(ressource)) {
      this.nodename = ressource;
      var that = this;
      var path = ressource;
      path = VVVV.Helpers.prepareFilePath(ressource, this.parentPatch)
      if (!VVVVContext.Patches[path]) {
        VVVVContext.loadFile(path, {
          success: function(r) {
            that.doLoad(r, function() {
              VVVVContext.Patches[path] = VVVVContext.Patches[path] || [];
              VVVVContext.Patches[path].push(that);
              that.serverSync.registerPatch(that);
              if (that.success)
                that.success();
              that.afterUpdate();
            });
          },
          error: function() {
            if (that.error)
              that.error();
          }
        });
      }
      else {
        that.doLoad(VVVVContext.Patches[path][0].toXML(), function() {
          VVVVContext.Patches[path].push(that);
          that.serverSync.registerPatch(that);
          if (that.success)
            that.success();
          that.afterUpdate();
        });
      }
    }
    else {
      this.doLoad(ressource, function() {
        if (this.success) this.success();
      });

    }

    // bind the #-shortcuts
    function checkLocationHash() {
      VVVV.Editors['edit'] = 'browser_editor';
      var match = window.location.hash.match('#([^\/]+)\/('+thisPatch.ressource+'|[0-9]+)$');
      if (match && VVVV.Editors[match[1]] && (match[2]==thisPatch.ressource || VVVVContext.Patches[match[2]]==thisPatch || VVVVContext.Patches.length==match[2])) {
        var editor_name = VVVV.Editors[match[1]];
        console.log('launching editor '+editor_name+'...');
        require(['editors/vvvv.editors.'+editor_name], function(editorModule) {
          var ed = new editorModule.Interface();
          ed.enable(thisPatch);
        });
      }
    }
    checkLocationHash();

    $(window).bind('hashchange', function() {
      checkLocationHash();
    });


  }



  Patch.prototype = new Node();
  return Patch;
})
