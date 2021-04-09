if (typeof define !== 'function') {
    var define = require(VVVVContext.Root + '/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require))
}

define(function (require, exports) {


    const _ = require('underscore');
    const $ = require('jquery');
    const VVVV = require('./vvvv.core.defines');

    return function (root_patch) {
        this.socket = null;
        this.patchRegistry = {};

        this.connect = function (success_callback) {
            if (VVVVContext.name !== "browser" || this.socket !== null)
                return;
            this.socket = new WebSocket("ws://" + location.hostname + ":5001/vvvvjs-rt");
            root_patch.resourcesPending++;

            const that = this;

            this.socket.onopen = function () {
                const msg = {
                    app_root: location.pathname.substring(0, location.pathname.lastIndexOf("/") + 1),
                    patch: root_patch.nodename
                };
                this.send(JSON.stringify(msg));
                root_patch.resourcesPending--;
                if (success_callback)
                    success_callback.call(root_patch);
            }

            this.socket.onclose = function () {
                VVVVContext.onConnectionLost.call();
            }

            let messageQueue = {};
            this.processMessage = function (patchIdentifier) {
                const p = that.patchRegistry[patchIdentifier];
                let msg;
                if (!messageQueue[patchIdentifier])
                    return;
                if ((msg = messageQueue[patchIdentifier].shift()) !== undefined) {
                    console.log('->');
                    console.log(msg);
                    let i = msg.nodes.length;
                    let node = null;
                    while (i--) {
                        node = msg.nodes[i];
                        for (let pinname in node.pinValues) {
                            let j = node.pinValues[pinname].length;
                            while (j--) {
                                p.nodeMap[node.node_id].outputPins[pinname].setValue(j, node.pinValues[pinname][j]);
                            }
                            p.nodeMap[node.node_id].outputPins[pinname].setSliceCount(node.pinValues[pinname].length);
                        }

                    }
                }
            }

            this.socket.onmessage = function (str) {
                const msg = JSON.parse(str.data);
                const p = that.patchRegistry[msg.patch];
                //console.log("-> "+str.data);
                if (msg.nodes) {
                    if (!messageQueue[msg.patch])
                        messageQueue[msg.patch] = [];
                    messageQueue[msg.patch].push(msg);
                }
                if (msg.message) {
                    if (typeof p.nodeMap[msg.node].handleBackendMessage === 'function')
                        p.nodeMap[msg.node].handleBackendMessage(msg.message);
                }
            };
        }

        this.isConnected = function () {
            return this.socket !== null;
        }

        this.sendPatchUpdate = function (patch, command) {
            console.log('patch update ....');
            const msg = {patch: VVVV.Helpers.prepareFilePath(patch.nodename, patch.parentPatch), command: command};
            this.socket.send(JSON.stringify(msg));
        }

        this.sendPatchSave = function (patch) {
            const msg = {patch: VVVV.Helpers.prepareFilePath(patch.nodename, patch.parentPatch), save: true};
            this.socket.send(JSON.stringify(msg));
        }

        this.registerPatch = function (p) {
            this.patchRegistry[p.getPatchIdentifier()] = p;
        }

        this.unregisterPatch = function (p) {
            delete this.patchRegistry[p.getPatchIdentifier()];
        }

        this.sendBinaryBackendMessage = function (node, buf, meta) {
            if (meta === undefined) {
                let meta = {};
            }
            meta.patch = node.parentPatch.getPatchIdentifier();
            meta.node = node.id;
            meta = JSON.stringify(meta);
            const message = new ArrayBuffer(buf.byteLength + meta.length * 2 + 2);
            const message_dv = new DataView(message);
            const payload_dv = new DataView(buf);
            message_dv.setUint16(0, meta.length);
            let offset = 2;
            for (let j = 0; j < meta.length; j++) {
                message_dv.setInt16(offset, meta.charCodeAt(j));
                offset += 2;
            }
            for (let j = 0; j < buf.byteLength; j++) {
                message_dv.setUint8(offset + j, payload_dv.getUint8(j));
            }
            this.socket.send(message);
        }

    };
});
