if (typeof define !== 'function') {
    var define = require(VVVVContext.Root + '/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require))
}

define(function (require, exports) {


    const $ = require('jquery');

    return function (fromPin, toPin) {
        this.fromPin = fromPin;
        this.toPin = toPin;

        this.fromPin.links.push(this);
        this.toPin.links.push(this);

        /**
         * deletes resources associated with a link
         */
        this.destroy = function () {
            this.fromPin.links.splice(this.fromPin.links.indexOf(this), 1);
            this.toPin.links.splice(this.toPin.links.indexOf(this), 1);
            this.fromPin.node.parentPatch.linkList.splice(this.fromPin.node.parentPatch.linkList.indexOf(this), 1);

            this.toPin.disconnect();
            if (this.toPin.reset_on_disconnect)
                this.toPin.reset();
            else {
                let cmd = {syncmode: 'diff', nodes: {}, links: []};
                let pincmd = {};
                pincmd[this.toPin.pinname] = {values: []};
                cmd.nodes[this.toPin.node.id] = {pins: pincmd}
                let i = this.toPin.getSliceCount();
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
        this.serialize = function () {
            // calling it LONK instead of LINK here, because jquery does not make a closing tag for LINK elements
            // renaming it to LINK later ...
            let $link = $("<LONK>");
            $link.attr("srcnodeid", this.fromPin.node.id);
            $link.attr("srcpinname", this.fromPin.pinname);
            $link.attr("dstnodeid", this.toPin.node.id);
            $link.attr("dstpinname", this.toPin.pinname);
            return $link;
        }

        this.toJSON = function () {
            return {
                srcnodeid: this.fromPin.node.id,
                srcpinname: this.fromPin.pinname,
                dstnodeid: this.toPin.node.id,
                dstpinname: this.toPin.pinname
            };
        }
    };

});
