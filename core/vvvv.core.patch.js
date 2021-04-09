if (typeof define !== "function") {
  var define = require(VVVVContext.Root + "/node_modules/amdefine")(
    module,
    VVVVContext.getRelativeRequire(require)
  );
}

define(function (require, exports) {
  const $ = require("jquery");
  const _ = require("underscore");
  const Node = require("./vvvv.core.node");
  const Link = require("./vvvv.core.link");
  const VVVV = require("./vvvv.core.defines");
  const ServerSync = require("./vvvv.core.server_sync");
  const Cluster = require("./vvvv.core.cluster");

  /**
   * @class
   * @constructor
   * @param {String} ressource either a path/to/some/patch.v4p or VVVV XML code
   * @param {Function} success_handler called after the patch (and all sub components) has completely loaded and is ready
   * @param {Function} error_handler called if an error occured, most likey because the .v4p file was not found
   * @param {VVVV.Core.Patch} [parentPatch] the parent patch, if it's a subpatch
   * @param {Integer} id the patch's ID in the parent patch, if it's a subpatch
   */
  return function (ressource, success_handler, error_handler, parentPatch, id) {
    let path;
    let newNodes;
    let oldNodes;
    let newLinks;
    let oldLinks;
    this.ressource = ressource;
    this.vvvv_version = "45_26.1";
    /** the diameter of the patch / the maximum X and Y coordinates of all nodes in a patch */
    this.boundingBox = { width: 0, height: 0 };
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

    // this.setupObject();

    if (parentPatch) {
      this.parentPatch = parentPatch;
      this.executionContext = parentPatch.executionContext;
    } else {
      this.executionContext = { ShaderCodeResources: {}, Patches: {} };
      // TODO: this is a hack to fill the shader code resources in the execution context with the ones defined in nodes.webgl.js; seems wrong though
      for (let resourceId in VVVV.ShaderCodeResources) {
        this.executionContext.ShaderCodeResources[resourceId] =
          VVVV.ShaderCodeResources[resourceId];
      }
    }
    if (id) {
      this.id = id;
    }

    let print_timing = false;

    /**
     * Returns the patch's absolute path, usable for the browser
     * @return {String} the absolute path
     */
    this.getAbsolutePath = () => {
      let path = this.getRelativePath();
      if (this.parentPatch) path = this.parentPatch.getAbsolutePath() + path;
      return path;
    };

    /**
     * Returns a patch's relative path, as it is specified in the paret patch
     * @return {String} the patch's path relative to its parent patch
     */
    this.getRelativePath = () => {
      const match = this.nodename.match(/(.*\/)?[^/]+\.v4p(\.json)?/);
      return match[1] || "";
    };

    let patchIdentifier = undefined;
    this.getPatchIdentifier = function () {
      if (patchIdentifier) {
        return patchIdentifier;
      }
      if (!this.parentPatch) {
        patchIdentifier = "ROOT";
      } else {
        patchIdentifier = this.parentPatch.getPatchIdentifier() + "/" + this.id;
      }
      return patchIdentifier;
    };

    /**
     * Called when a patch is deleted. Deletes all containing nodes.
     */
    this.destroy = () => {
      this.disposing = true;
      path = VVVV.Helpers.prepareFilePath(this.nodename, this.parentPatch);
      this.executionContext.Patches[path].splice(
        this.executionContext.Patches[path].indexOf(this),
        1
      );
      if (this.executionContext.Patches[path].length === 0)
        delete this.executionContext.Patches[path];
      this.serverSync.unregisterPatch(this);
      for (let i = 0; i < this.nodeList.length; i++) {
        let node = this.nodeList[i];
        if (
          (node.inCluster && VVVVContext.name === "nodejs") ||
          (!node.inCluster && VVVVContext.name === "browser")
        )
          node.destroy();
        delete this.nodeMap[node.id];
        delete this.nodeList[i];
      }
    };

    /**
     * Creates an array of slices out of pin value string coming from a patch XML
     * @param {String} v the pin value string from the XML
     */
    const splitValues = (v) => {
      if (v === undefined) return [];
      if (this.vvvv_version <= "45_26") {
        // legacy code
        if (/\|/.test(v)) separator = "|";
        else separator = ",";
        return v.split(separator).filter(function (d, i) {
          return d !== "";
        });
      }

      let result = [];
      let currSlice = "";
      let insideValue = false;
      let len = v.length;
      for (let i = 0; i < len; i++) {
        if (v[i] === "," && !insideValue) {
          result.push(currSlice);
          currSlice = "";
        } else if (v[i] === "|") {
          if (v[i + 1] !== "|" || i + 1 === v.length - 1)
            insideValue = !insideValue;
          else currSlice += v[++i];
        } else currSlice += v[i];
      }
      result.push(currSlice);
      return result;
    };

    if (this.vvvv_version <= "45_26") {
      oldLinks = {};
      newLinks = {};
      oldNodes = {};
      newNodes = {};
    }

    const thisPatch = this;

    this.ready_callback = undefined;
    /**
     * Takes a patch XML string, parses it, and applies it to the patch. This method is called once by the constructor, passing the complete patch code, and
     * frequently by an editor, passing in XML snippets. This is the only method you should use to manipulate a patch.
     * @param {String} xml VVVV Patch XML
     * @param {Function} rb called after the XML code has been completely processed, and the patch is fully loaded and ready again
     */
    this.doLoad = function (xml, rb) {
      let cmd;
      if (typeof xml == "object") {
        cmd = xml;
        if (cmd.syncmode !== "diff") cmd.syncmode = "complete";
        this.execute(cmd, rb);
        return;
      }

      if (xml.indexOf("{") === 0) {
        cmd = JSON.parse(xml);
        if (cmd.syncmode !== "diff") cmd.syncmode = "complete";
        this.execute(cmd, rb);
        return;
      }

      cmd = { nodes: {}, links: [] };

      let $xml;
      if (VVVVContext.name === "browser") {
        const $ = require("jquery");
        $xml = $(xml);
      } else {
        const $ = window.server_req("cheerio").load(xml, { xmlMode: true });
        $xml = $("PATCH");
      }

      const version_match = /^<!DOCTYPE\s+PATCH\s+SYSTEM\s+"(.+)\\(.+)\.dtd/.exec(
        xml
      );
      if (version_match)
        thisPatch.vvvv_version = version_match[2].replace(/[a-zA-Z]+/, "_");

      // this is kind of a hacky way to determine, if the incoming XML is the complete patch, or a patch change
      cmd.syncmode = "diff";
      if (/\s<PATCH/.test(xml) || thisPatch.vvvv_version <= "45_26") {
        cmd.syncmode = "complete";
      }

      const $windowBounds = $xml.find('BOUNDS[type="Window"]').first();
      if ($windowBounds.length > 0) {
        cmd.windowWidth = $windowBounds.attr("width");
        cmd.windowHeight = $windowBounds.attr("height");
      }

      $xml.find("NODE").each(function () {
        const nodecmd = {
          nodename:
            $(this).attr("systemname") != ""
              ? $(this).attr("systemname")
              : $(this).attr("nodename"),
          pins: {},
        };

        if ($(this).attr("filename"))
          nodecmd.filename = $(this).attr("filename");

        let $bounds;
        if ($(this).attr("componentmode") === "InABox")
          $bounds = $(this).find('BOUNDS[type="Box"]').first();
        else $bounds = $(this).find('BOUNDS[type="Node"]').first();

        if ($(this).attr("deleteme") === "pronto") {
          nodecmd.delete = true;
        }

        if ($(this).attr("createme") === "pronto") {
          nodecmd.create = true;
        }

        if ($bounds.length > 0) {
          if ($bounds.attr("left")) {
            nodecmd.x = $bounds.attr("left");
            nodecmd.y = $bounds.attr("top");
          }
          if ($bounds.attr("width")) {
            nodecmd.width = $bounds.attr("width");
            nodecmd.height = $bounds.attr("height");
          }
        }

        const that = this;

        // PINS
        $(this)
          .find("PIN")
          .each(function () {
            const pinname = $(this).attr("pinname");
            const values = splitValues($(this).attr("values"));

            nodecmd.pins[pinname] = {
              visible: $(this).attr("visible"),
              values: values,
            };
          });

        cmd.nodes[$(this).attr("id")] = nodecmd;
      });

      $xml.find("LINK").each(function () {
        let lnkcmd = {};
        lnkcmd.srcnodeid = $(this).attr("srcnodeid");
        lnkcmd.srcpinname = $(this).attr("srcpinname");
        lnkcmd.dstnodeid = $(this).attr("dstnodeid");
        lnkcmd.dstpinname = $(this).attr("dstpinname");
        if ($(this).attr("deleteme") === "pronto") lnkcmd.delete = true;
        cmd.links.push(lnkcmd);
      });
      console.warn(
        this.nodename,
        " will be converted from legacy XML to VVVV.js JSON format"
      );
      this.isPersisted = false;
      this.execute(cmd, rb);
    };

    this.execute = function (cmd, rb) {
      let i;
      let n;
      this.ready_callback = rb;
      let p = this;
      do {
        p.dirty = true;
      } while (p == p.parentPatch);

      //syncmode = "complete";

      if (cmd.windowWidth) {
        thisPatch.windowWidth = cmd.windowWidth / 15;
        thisPatch.windowHeight = cmd.windowHeight / 15;
      }

      if (cmd.syncmode === "complete") newNodes = {};
      else this.isPersisted = false;

      let nodesLoading = 0;
      let parsingComplete = false;

      for (let id in cmd.nodes) {
        // in case the node's id is already present
        let nodeToReplace = undefined;
        let nodeExists = false;
        if (thisPatch.nodeMap[id] !== undefined) {
          if (cmd.nodes[id].create)
            // renaming node ...
            nodeToReplace = thisPatch.nodeMap[id];
          // just moving it ...
          else nodeExists = true;
        }

        if (!nodeExists) {
          let nodename = cmd.nodes[id].nodename;
          if (nodename === undefined) return;
          if (VVVV.NodeLibrary[nodename.toLowerCase()] !== undefined) {
            n = new VVVV.NodeLibrary[nodename.toLowerCase()](id, thisPatch);
            if (VVVV.NodeLibrary[nodename.toLowerCase()].definingNode) {
              n.definingNode =
                VVVV.NodeLibrary[nodename.toLowerCase()].definingNode;
              if (nodeToReplace)
                VVVV.NodeLibrary[
                  nodename.toLowerCase()
                ].definingNode.relatedNodes[
                  VVVV.NodeLibrary[
                    nodename.toLowerCase()
                  ].definingNode.relatedNodes.indexOf(nodeToReplace)
                ] = n;
              else
                VVVV.NodeLibrary[
                  nodename.toLowerCase()
                ].definingNode.relatedNodes.push(n);
            }

            // load 3rd party libs, if required for this node
            if (VVVV.NodeLibrary[nodename.toLowerCase()].requirements) {
              _(VVVV.NodeLibrary[nodename.toLowerCase()].requirements).each(
                function (libname) {
                  if (VVVVContext.LoadedLibs[libname] === undefined) {
                    (function (node) {
                      if (
                        n.environments &&
                        n.environments.indexOf(VVVVContext.name) < 0
                      )
                        return;
                      let dep;
                      if (VVVVContext.name === "nodejs") dep = libname;
                      else if (VVVVContext.name === "browser")
                        dep = VVVVContext.ThirdPartyLibs[libname];
                      thisPatch.resourcesPending++; // pause patch evaluation
                      VVVVContext.loadDependency(dep, function () {
                        thisPatch.resourcesPending--; // resume patch evaluation
                        node.initialize();
                        VVVVContext.LoadedLibs[libname] = true;
                        updateLinks(cmd);
                        thisPatch.afterUpdate();
                        thisPatch.compile();
                        if (
                          thisPatch.resourcesPending <= 0 &&
                          thisPatch.ready_callback &&
                          parsingComplete
                        ) {
                          thisPatch.ready_callback();
                          thisPatch.ready_callback = undefined;
                        }
                      });
                    })(n);
                  }
                }
              );
            }
          } else if (/.fx$/.test(cmd.nodes[id].filename)) {
            n = new VVVV.Nodes.GenericShader(id, thisPatch);
            n.isShader = true;
            n.shaderFile = cmd.nodes[id].filename
              .replace(/\\/g, "/")
              .replace(/\.fx$/, ".vvvvjs.fx")
              .replace("lib/nodes/", "");
            n.nodename = nodename;
          } else {
            if (/.v4p(\.json)?$/.test(cmd.nodes[id].filename)) {
              thisPatch.resourcesPending++;
              const that = this;
              n = new Patch(
                cmd.nodes[id].filename,
                function () {
                  thisPatch.resourcesPending--;
                  updateLinks(cmd);
                  if (thisPatch.editor) thisPatch.editor.addPatch(this);
                  if (this.auto_evaluate) {
                    let p = thisPatch;
                    do {
                      p.auto_evaluate = true;
                    } while (p === p.parentPatch);
                  }
                  thisPatch.setMainloop(thisPatch.mainloop);
                  thisPatch.afterUpdate();
                  thisPatch.compile();
                  if (
                    thisPatch.resourcesPending <= 0 &&
                    thisPatch.ready_callback &&
                    parsingComplete
                  ) {
                    thisPatch.ready_callback();
                    thisPatch.ready_callback = undefined;
                  }
                },
                function () {
                  thisPatch.resourcesPending--;
                  this.not_implemented = true;
                  VVVVContext.onNotImplemented(nodename);
                  updateLinks(cmd);
                  thisPatch.afterUpdate();
                  thisPatch.compile();
                  if (
                    thisPatch.resourcesPending <= 0 &&
                    thisPatch.ready_callback &&
                    parsingComplete
                  ) {
                    thisPatch.ready_callback();
                    thisPatch.ready_callback = undefined;
                  }
                },
                thisPatch,
                id
              );
              n.isSubpatch = true;
              if (thisPatch.editor && !n.editor) thisPatch.editor.addPatch(n);
              thisPatch.nodeMap[n.id] = n;
            } else {
              n = new Node(id, nodename, thisPatch);
              n.not_implemented = true;
              VVVVContext.onNotImplemented(nodename);
            }
          }
          if (VVVV_ENV === "development" && cmd.syncmode !== "complete")
            console.log(
              thisPatch.nodename + ": inserted new node " + n.nodename
            );
        } else n = thisPatch.nodeMap[id];

        if (n.auto_evaluate) {
          // as soon as the patch contains a single auto-evaluate node, it is also an auto evaluating subpatch
          p = thisPatch;
          do {
            p.auto_evaluate = true;
          } while (p === p.parentPatch);
        }

        if (cmd.nodes[id].delete) {
          if (VVVV_ENV === "development") console.log("removing node " + n.id);
          if (n.definingNode) {
            // remove connection to related DefineNode node
            n.definingNode.relatedNodes.splice(
              n.definingNode.relatedNodes.indexOf(n),
              1
            );
          }
          thisPatch.nodeList.splice(thisPatch.nodeList.indexOf(n), 1);
          if (
            n.isSubpatch ||
            (n.inCluster && VVVVContext.name === "nodejs") ||
            (!n.inCluster && VVVVContext.name === "browser")
          ) {
            if (!n.not_implemented && n.editor) n.editor.removePatch(n);
            n.destroy();
          }
          delete thisPatch.nodeMap[n.id];
        }

        if (cmd.nodes[id].x) {
          n.x = cmd.nodes[id].x / 15;
          n.y = cmd.nodes[id].y / 15;
          thisPatch.boundingBox.width = Math.max(
            thisPatch.boundingBox.width,
            n.x + 100
          );
          thisPatch.boundingBox.height = Math.max(
            thisPatch.boundingBox.height,
            n.y + 100
          );
        }
        if (cmd.nodes[id].width) {
          n.width = cmd.nodes[id].width;
          n.height = cmd.nodes[id].height;
        }

        if (/^iobox/.test(n.nodename.toLowerCase())) n.isIOBox = true;

        //To add anything which relates to all nodes
        if (!nodeExists) n.setup();

        const that = this;

        // PINS
        for (let pinname in cmd.nodes[id].pins) {
          let values = cmd.nodes[id].pins[pinname].values;

          //Get all defaults from xml
          if (values !== undefined) {
            if (values.length > 0) n.addDefault(pinname, values);
          }

          // if the output pin already exists (because the node created it), skip
          if (n.outputPins[pinname] !== undefined) continue;

          // the input pin already exists (because the node created it), don't add it, but set values, if present in the xml
          if (n.inputPins[pinname] !== undefined) {
            if (!n.inputPins[pinname].isConnected()) {
              n.applyPinValuesFromXML(pinname);
            }
            continue;
          }

          // the input pin already exists (because the node created it), don't add it, but set values, if present in the xml
          if (n.invisiblePins[pinname] !== undefined) {
            if (values !== undefined) {
              for (i = 0; i < values.length; i++) {
                if (n.invisiblePins[pinname].values[i] !== values[i])
                  n.invisiblePins[pinname].setValue(i, values[i]);
              }
              n.invisiblePins[pinname].setSliceCount(values.length);
            }
            continue;
          }

          //Check for non implemented nodes
          if (cmd.nodes[id].pins[pinname].visible !== 0 || n.isSubpatch) {
            let outgoing_link_found = false;
            for (i = 0; i < cmd.links.length; i++) {
              if (
                cmd.links[i].srcnodeid === n.id &&
                cmd.links[i].pinname === pinname.replace(/[\[\]]/, "")
              )
                outgoing_link_found = true;
            }
            if (outgoing_link_found) {
              if (n.outputPins[pinname] === undefined) {
                //Add as output list if not already there
                n.addOutputPin(pinname, values);
              }
            } else {
              if (
                n.inputPins[pinname] === undefined &&
                n.invisiblePins[pinname] === undefined
              ) {
                //Add as intput is neither in invisible/input list
                n.addInputPin(pinname, values);
              }
            }
          } else {
            if (
              n.inputPins[pinname] === undefined &&
              n.invisiblePins[pinname] === undefined
            ) {
              //Add as invisible pin
              n.addInvisiblePin(pinname, values);
            }
          }
        }

        //Initialize node
        if (!nodeExists) {
          if (nodeToReplace) {
            // copy config pins from node which is being replaced
            console.log(
              "replacing node " +
                n.id +
                " / " +
                nodeToReplace.nodename +
                " with " +
                n.nodename
            );
            _(nodeToReplace.invisiblePins).each(function (p, name) {
              if (!n.invisiblePins[name]) n.invisiblePins[name] = p;
              else {
                thisPatch.pinMap[n.id + "_inv_" + name] = n.inputPins[name];
                if (n.invisiblePins[name].typeName === p.typeName)
                  n.invisiblePins[name].values = p.values;
              }
            });
          }

          n.configure();
          if (
            !n.environments ||
            (n.environments.indexOf(VVVVContext.name) >= 0 &&
              thisPatch.resourcesPending === 0)
          )
            n.initialize();

          if (nodeToReplace) {
            // copy in- and output pins from node which is being replaced
            _(nodeToReplace.inputPins).each(function (p, name) {
              let i;
              if (n.inputPins[name]) {
                thisPatch.pinMap[n.id + "_in_" + name] = n.inputPins[name];
                if (n.inputPins[name].typeName !== p.typeName) {
                  i = p.links.length;
                  while (i--) {
                    p.links[i].destroy();
                  }
                } else {
                  n.inputPins[name].values = p.values;
                  i = p.links.length;
                  while (i--) {
                    n.inputPins[name].links[i] = p.links[i];
                    n.inputPins[name].links[i].toPin = n.inputPins[name];
                  }
                }
              } else {
                i = p.links.length;
                while (i--) {
                  p.links[i].destroy();
                }
              }
            });
            _(nodeToReplace.outputPins).each(function (p, name) {
              let i;
              if (n.outputPins[name]) {
                thisPatch.pinMap[n.id + "_out_" + name] = n.outputPins[name];
                if (n.outputPins[name].typeName !== p.typeName) {
                  i = p.links.length;
                  while (i--) {
                    p.links[i].destroy();
                  }
                } else {
                  n.outputPins[name].values = p.values;
                  i = p.links.length;
                  while (i--) {
                    n.outputPins[name].links[i] = p.links[i];
                    n.outputPins[name].links[i].fromPin = n.outputPins[name];
                  }
                }
              } else {
                i = p.links.length;
                while (i--) {
                  p.links[i].destroy();
                }
              }
            });
            thisPatch.nodeList.splice(
              thisPatch.nodeList.indexOf(nodeToReplace),
              1
            );
            if (
              (nodeToReplace.inCluster && VVVVContext.name === "nodejs") ||
              (!nodeToReplace.inCluster && VVVVContext.name === "browser")
            )
              nodeToReplace.destroy();
            delete nodeToReplace;
            nodeToReplace = undefined;
          }
          thisPatch.nodeList.push(n);
        }

        if (cmd.syncmode === "complete") newNodes[n.id] = n;
      }

      if (cmd.syncmode === "complete") {
        _(oldNodes).each(function (n, id) {
          if (newNodes[id] === undefined) {
            if (VVVV_ENV === "development")
              console.log("removing node " + n.id);
            thisPatch.nodeList.splice(thisPatch.nodeList.indexOf(n), 1);
            delete thisPatch.nodeMap[n.id];
          }
        });
        oldNodes = {};
        _(newNodes).each(function (n, id) {
          oldNodes[id] = n;
        });
      }

      if (this.resourcesPending === 0) updateLinks(cmd);

      function updateLinks(cmd) {
        if (cmd.syncmode === "complete") newLinks = {};

        // first delete marked links
        cmd.links.forEach(function (lnkcmd) {
          if (!lnkcmd.delete) return;
          let link = false;
          for (let i = 0; i < thisPatch.linkList.length; i++) {
            if (
              thisPatch.linkList[i].fromPin.node.id === lnkcmd.srcnodeid &&
              thisPatch.linkList[i].fromPin.pinname === lnkcmd.srcpinname &&
              thisPatch.linkList[i].toPin.node.id === lnkcmd.dstnodeid &&
              thisPatch.linkList[i].toPin.pinname === lnkcmd.dstpinname
            ) {
              link = thisPatch.linkList[i];
            }
          }
          if (!link) {
            return;
          }
          if (VVVV_ENV === "development") {
            console.log(
              "removing " + link.fromPin.pinname + " -> " + link.toPin.pinname
            );
          }
          const fromPin = link.fromPin;
          const toPin = link.toPin;
          link.destroy();
          fromPin.connectionChanged();
          toPin.connectionChanged();
          toPin.markPinAsChanged();
        });

        cmd.links.forEach(function (lnkcmd) {
          if (lnkcmd.delete) return;
          let srcPin =
            thisPatch.pinMap[lnkcmd.srcnodeid + "_out_" + lnkcmd.srcpinname];
          let dstPin =
            thisPatch.pinMap[lnkcmd.dstnodeid + "_in_" + lnkcmd.dstpinname];

          // add pins which are neither defined in the node, nor defined in the xml, but only appeare in the links (this is the case with shaders)
          if (srcPin === undefined && thisPatch.nodeMap[lnkcmd.srcnodeid])
            srcPin = thisPatch.nodeMap[lnkcmd.srcnodeid].addOutputPin(
              lnkcmd.srcpinname,
              undefined
            );
          if (dstPin === undefined && thisPatch.nodeMap[lnkcmd.dstnodeid])
            dstPin = thisPatch.nodeMap[lnkcmd.dstnodeid].addInputPin(
              lnkcmd.dstpinname,
              undefined
            );

          if (srcPin && dstPin) {
            if (srcPin.node.isSubpatch && dstPin.node.isSubpatch)
              console.warn(
                "WARNING: directly connecting subpatches is buggy and should be avoided (" +
                  srcPin.node.nodename +
                  " -> " +
                  dstPin.node.nodename +
                  ")"
              );

            let link = false;
            for (let i = 0; i < thisPatch.linkList.length; i++) {
              if (
                thisPatch.linkList[i].fromPin.node.id === srcPin.node.id &&
                thisPatch.linkList[i].fromPin.pinname === srcPin.pinname &&
                thisPatch.linkList[i].toPin.node.id === dstPin.node.id &&
                thisPatch.linkList[i].toPin.pinname === dstPin.pinname
              ) {
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

            if (cmd.syncmode === "complete")
              newLinks[
                srcPin.node.id +
                  "_" +
                  srcPin.pinname +
                  "-" +
                  dstPin.node.id +
                  "_" +
                  dstPin.pinname
              ] = link;
          }
        });

        if (cmd.syncmode === "complete") {
          _(oldLinks).each(function (l, key) {
            if (newLinks[key] === undefined) {
              if (VVVV_ENV === "development")
                console.log(
                  "removing " + l.fromPin.pinname + " -> " + l.toPin.pinname
                );
              let fromPin = l.fromPin;
              let toPin = l.toPin;
              l.destroy();
              fromPin.connectionChanged();
              toPin.connectionChanged();
              toPin.markPinAsChanged();
              if (toPin.reset_on_disconnect) toPin.reset();
            }
          });
          oldLinks = {};
          _(newLinks).each(function (l, key) {
            oldLinks[key] = l;
          });
        }
      }

      this.compile();
      parsingComplete = true;
      if (this.resourcesPending <= 0 && this.ready_callback) {
        this.ready_callback();
        this.ready_callback = undefined;
      }
    };

    /**
     * Recursively fetches and returns all subpatches inside a patch
     * @return {Array} an array of {@link VVVV.Core.Patch} objects
     */
    this.getSubPatches = function () {
      let ret = [];
      for (let i = 0; i < this.nodeList.length; i++) {
        if (this.nodeList[i].isSubpatch) {
          ret.push(this.nodeList[i]);
          ret = ret.concat(this.nodeList[i].getSubPatches());
        }
      }
      return ret;
    };

    /**
     * Sets the {@link VVVV.Core.MainLoop} object of the patch and all containing subpatches
     * @param {VVVV.Core.MainLoop} ml
     */
    this.setMainloop = function (ml) {
      this.mainloop = ml;
      for (let i = 0; i < this.nodeList.length; i++) {
        if (this.nodeList[i].isSubpatch) {
          this.nodeList[i].setMainloop(ml);
        }
      }
    };

    /**
     * Called always after the patch has been evaluated
     * @abstract
     */
    this.afterEvaluate = function () {};

    /**
     * Called always after the patch has been modified using {@link VVVV.Core.Patch.doLoad}
     * @abstract
     */
    this.afterUpdate = function () {};

    /**
     * Returns the VVVV XML string representing the patch, ready to be saved
     * @return {String}
     */
    this.toXML = function () {
      let i;
      const $patch = $("<PATCH>");
      const $bounds = $("<BOUNDS>");
      $bounds.attr("type", "Window");
      $bounds.attr("width", parseInt(this.windowWidth * 15));
      $bounds.attr("height", parseInt(this.windowHeight * 15));
      $patch.append($bounds);

      const boundTypes = ["Node", "Box"];
      for (i = 0; i < this.nodeList.length; i++) {
        let n = this.nodeList[i];
        $patch.append(n.serialize());
      }
      for (i = 0; i < this.linkList.length; i++) {
        let l = this.linkList[i];
        $patch.append(l.serialize());
      }

      let xml =
        '<!DOCTYPE PATCH  SYSTEM "http://vvvv.org/versions/vvvv45beta28.1.dtd" >\r\n  ' +
        $patch.wrapAll("<d></d>").parent().html();
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
    };

    this.exportJSON = function () {
      const patch = this;
      let obj = {};
      for (let prop in this) {
        switch (prop) {
          case "nodename":
            obj[prop] = this[prop];
            break;
          case "x":
            obj.left = this.x;
            break;
          case "y":
            obj.top = this.y;
            break;
          case "windowWidth":
            obj.windowWidth = parseInt(patch.windowWidth * 15);
            break;
          case "windowHeight":
            obj.windowHeight = parseInt(patch.windowHeight * 15);
            break;
          case "linkList":
            obj.links = this.linkList;
            break;
          case "nodeMap":
            obj.nodes = this.nodeMap;
            break;
          default:
        }
      }
      return JSON.stringify(obj);
    };

    this.remotePatchConnection = null;
    if (this.parentPatch) this.serverSync = this.parentPatch.serverSync;
    else {
      this.serverSync = new ServerSync(this);
    }
    this.cluster = new Cluster(this);

    let autoResetPins = [];
    this.resetAutoResetPins = function () {
      let i = autoResetPins.length;
      let j = 0;
      let resetted;
      while (i--) {
        resetted = false;
        if (autoResetPins[i].values.changedAt < this.mainloop.frameNum) {
          j = autoResetPins[i].values.length;
          while (j--) {
            if (autoResetPins[i].values[j] >= 0.5) {
              autoResetPins[i].values[j] = 0;
              resetted = true;
            }
          }
          if (resetted) {
            autoResetPins[i].markPinAsChanged();
          }
        }
      }
    };

    /**
     * Assemples the {@link VVVV.Core.Patch.compiledFunc} function, which is called each frame, and subsequently calls all nodes in the correct order. This method is invoked automatically each time the patch has been changed.
     */
    this.compile = function (cname) {
      let i;
      const context_name = cname ? cname : VVVVContext.name;

      this.evaluationRecipe = [];
      this.pinList = [];
      let addedNodes = {};
      let nodeStack = [];
      let lostLoopRoots = [];

      let recipe = this.evaluationRecipe;
      let pinList = this.pinList;
      let regex = new RegExp(/\{([^\}]+)\}/g);
      let thisPatch = this;

      autoResetPins = [];

      this.cluster.detect();
      if (this.cluster.hasNodes && !this.serverSync.isConnected())
        this.serverSync.connect(function () {
          if (this.resourcesPending === 0 && this.ready_callback) {
            this.ready_callback();
            this.ready_callback = undefined;
          }
        });

      let compiledCode = "";

      function addSubGraphToRecipe(node) {
        if (nodeStack.indexOf(node.id) < 0) {
          nodeStack.push(node.id);
          const upstreamNodes = node.getUpstreamNodes();
          let loop_detected = false;
          _(upstreamNodes).each(function (upnode) {
            if (addedNodes[upnode.id] === undefined) {
              loop_detected = loop_detected || addSubGraphToRecipe(upnode);
            }
          });
          nodeStack.pop();
        }

        if (loop_detected && node.delays_output) lostLoopRoots.push(node);
        if (
          (!loop_detected && nodeStack.indexOf(node.id) < 0) ||
          node.delays_output
        ) {
          let pinname;
          if (
            (node.inCluster && context_name === "nodejs") ||
            (!node.inCluster && context_name === "browser") ||
            node.isSubpatch ||
            (node.environments && node.environments.length > 1)
          ) {
            if (node.getCode) {
              node.outputPins["Output"].values.incomingPins = [];
              const nodecode = "(" + node.getCode() + ")";
              let code = nodecode;
              let match;
              while ((match = regex.exec(nodecode))) {
                let v;
                if (node.inputPins[match[1]].values.code) {
                  v = node.inputPins[match[1]].values.code;
                  node.outputPins[
                    "Output"
                  ].values.incomingPins = node.outputPins[
                    "Output"
                  ].values.incomingPins.concat(
                    node.inputPins[match[1]].values.incomingPins
                  );
                } else {
                  if (
                    !node.inputPins[match[1]].isConnected() &&
                    node.inputPins[match[1]].getSliceCount() == 1
                  )
                    v = node.inputPins[match[1]].getValue(0);
                  else
                    v =
                      "patch.nodeMap[" +
                      node.id +
                      "].inputPins['" +
                      match[1] +
                      "'].getValue(iii)";
                  node.outputPins["Output"].values.incomingPins.push(
                    node.inputPins[match[1]]
                  );
                }
                code = code.replace("{" + match[1] + "}", v);
              }
              node.outputPins["Output"].values.code = code;
              for (let i = 0; i < node.outputPins["Output"].links.length; i++) {
                if (!node.outputPins["Output"].links[i].toPin.node.getCode) {
                  compiledCode += node.outputPins["Output"].generateStaticCode(
                    true
                  );
                  break;
                }
              }
            } else {
              if (!node.not_implemented) {
                recipe.push(node);
                compiledCode += "var n = patch.nodeMap[" + node.id + "];\n";
                compiledCode +=
                  "if ((n.isDirty() || n.auto_evaluate || n.isSubpatch) && !n.dealWithNilInput()) { n.evaluate(); n.dirty = false; }\n";
              }
            }
          }
          for (pinname in node.inputPins) {
            if (node.inputPins[pinname].links.length === 0)
              pinList.push(node.inputPins[pinname]);
          }
          for (pinname in node.invisiblePins) {
            pinList.push(node.invisiblePins[pinname]);
          }
          for (pinname in node.outputPins) {
            pinList.push(node.outputPins[pinname]);
            if (node.outputPins[pinname].auto_reset)
              autoResetPins.push(node.outputPins[pinname]);
          }
          addedNodes[node.id] = node;
          return false;
        }
        return true;
      }

      for (i = 0; i < this.nodeList.length; i++) {
        if (
          this.nodeList[i].getDownstreamNodes().length === 0 ||
          this.nodeList[i].auto_evaluate ||
          this.nodeList[i].delays_output
        ) {
          if (addedNodes[this.nodeList[i].id] === undefined)
            addSubGraphToRecipe(this.nodeList[i]);
        }
      }

      for (i = 0; i < lostLoopRoots.length; i++) {
        addSubGraphToRecipe(lostLoopRoots[i]);
      }

      compiledCode =
        "try {\npatch.resetAutoResetPins();\n" +
        compiledCode +
        "\n} catch (e) { console.error(e.message); console.log(e.stack); }";

      this.compiledFunc = new Function("patch", compiledCode);
      //console.log(this.compiledFunc.toString());
    };

    /**
     * Evaluates the patch once. Is called by the patch's {@link VVVV.Core.MainLoop} each frame, and should not be called directly
     */
    this.evaluate = function () {
      let start;
      let nodeProfiles = {};
      if (this.resourcesPending > 0)
        // this.resourcesPending is >0 when thirdbarty libs or subpatches are loading at the moment
        return;
      if (print_timing) {
        start = new Date().getTime();
        let elapsed = 0;
      }

      if (this.serverSync.processMessage)
        this.serverSync.processMessage(this.getPatchIdentifier());

      this.compiledFunc(this);

      if (this.cluster.hasNodes) {
        this.cluster.syncPinValues(this.serverSync.socket);
      }

      if (print_timing) {
        _(nodeProfiles).each(function (p, nodename) {
          console.log(p.count + "x " + nodename + ": " + p.dt + "ms");
        });
        start = new Date().getTime();
      }
      this.afterEvaluate();
      if (print_timing)
        console.log(
          "patch rendering: " + (new Date().getTime() - start) + "ms"
        );

      print_timing = false;
    };

    $(window).keydown(function (e) {
      // ctrl + alt + T to print execution times
      if (e.which === 84 && e.altKey && e.ctrlKey) print_timing = true;
    });

    // actually load the patch, depending on the type of resource

    if (/\.v4p[^<>\s]*$/.test(ressource)) {
      this.nodename = ressource;
      let that = this;
      path = ressource;
      path = VVVV.Helpers.prepareFilePath(ressource, this.parentPatch);
      if (!that.executionContext.Patches[path]) {
        VVVVContext.loadFile(path, {
          success: function (r) {
            that.doLoad(r, function () {
              that.executionContext.Patches[path] =
                that.executionContext.Patches[path] || [];
              that.executionContext.Patches[path].push(that);
              that.serverSync.registerPatch(that);
              if (that.success) that.success();
              that.afterUpdate();
            });
          },
          error: function () {
            if (that.error) that.error();
          },
        });
      } else {
        that.doLoad(
          that.executionContext.Patches[path][0].exportJSON(),
          function () {
            that.executionContext.Patches[path].push(that);
            that.serverSync.registerPatch(that);
            if (that.success) that.success();
            that.afterUpdate();
          }
        );
      }
    } else {
      this.doLoad(ressource, function () {
        if (this.success) this.success();
      });
    }

    // bind the #-shortcuts
    function checkLocationHash() {
      VVVV.Editors["edit"] = "browser_editor";
      const match = window.location.hash.match(
        "#([^/]+)/(" + thisPatch.ressource + "|[0-9]+)$"
      );
      if (
        match &&
        VVVV.Editors[match[1]] &&
        (match[2] === thisPatch.ressource ||
          thisPatch.executionContext.Patches[match[2]] === thisPatch ||
          thisPatch.executionContext.Patches.length === match[2])
      ) {
        let editor_name = VVVV.Editors[match[1]];
        console.log("launching editor " + editor_name + "...");
        require(["editors/vvvv.editors." + editor_name], function (
          editorModule
        ) {
          let ed = new editorModule.Interface();
          ed.enable(thisPatch);
        });
      }
    }

    checkLocationHash();

    $(window).bind("hashchange", function () {
      checkLocationHash();
    });
  };
});
