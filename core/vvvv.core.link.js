

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }

define(function(require,exports) {


  var $ = require('jquery');

  /**
   * @class
   * @constructor
   * @param {VVVV.Core.Pin} fromPin the output pin which is the source of the connection
   * @param {VVVV.Core.Pin} toPin the input pin which is the destination of the connection
   */
  var Link = function(fromPin, toPin) {
    this.fromPin = fromPin;
    this.toPin = toPin;

    this.fromPin.links.push(this);
    this.toPin.links.push(this);

    /**
     * deletes resources associated with a link
     */
    this.destroy = function() {
      this.fromPin.links.splice(this.fromPin.links.indexOf(this), 1);
      this.toPin.links.splice(this.toPin.links.indexOf(this), 1);
      this.fromPin.node.parentPatch.linkList.splice(this.fromPin.node.parentPatch.linkList.indexOf(this),1);

      this.toPin.disconnect();
      if (this.toPin.reset_on_disconnect)
        this.toPin.reset();
      else {
        var cmd = {syncmode: 'diff', nodes: {}, links: []};
        var pincmd = {}
        pincmd[this.toPin.pinname] = {values: []};
        cmd.nodes[this.toPin.node.id] = {pins: pincmd}
        var i = this.toPin.getSliceCount();
        while (i--) {
          pincmd[this.toPin.pinname].values[i] = this.toPin.values[i].toString();
        }
        if (this.fromPin.node.parentPatch.editor && !this.fromPin.node.parentPatch.disposing)
          this.fromPin.node.parentPatch.editor.update(this.fromPin.node.parentPatch, cmd);
      }
    }

    /**
     * Returns the XML string representing the link. Used for saving the patch and copying to clipboard
     */
    this.serialize = function() {
      // calling it LONK instead of LINK here, because jquery does not make a closing tag for LINK elements
      // renaming it to LINK later ...
      var $link = $("<LONK>");
      $link.attr("srcnodeid", this.fromPin.node.id);
      $link.attr("srcpinname", this.fromPin.pinname);
      $link.attr("dstnodeid", this.toPin.node.id);
      $link.attr("dstpinname", this.toPin.pinname);
      return $link;
    }

    this.toJSON = function() {
      return {srcnodeid: this.fromPin.node.id, srcpinname: this.fromPin.pinname, dstnodeid: this.toPin.node.id, dstpinname: this.toPin.pinname};
    }
  }

  return Link;

});
