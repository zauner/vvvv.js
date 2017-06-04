
if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }

define(function(require,exports) {

  var SharedRessourceStore = function() {
    this.data = {};
    this.registeredNodes = [];
  }

  SharedRessourceStore.prototype.registerNode = function(n) {
    this.registeredNodes.push(n);
  }

  SharedRessourceStore.prototype.unregisterNode = function(n) {
    var i = this.registeredNodes.indexOf(n);
    if (i<0) return;
    this.registeredNodes.splice(i, 1);
  }

  SharedRessourceStore.prototype.share = function(name, obj) {
    this.data[name] = obj;
  }

  SharedRessourceStore.prototype.has = function(name) {
    return this.data.hasOwnProperty(name);
  }

  SharedRessourceStore.prototype.get = function(name) {
    return this.data[name];
  }

  SharedRessourceStore.prototype.markAsChanged = function() {
    var i = this.registeredNodes.length;
    while (i--) {
      this.registeredNodes[i].dirty = true;
      this.registeredNodes[i].parentPatch.mainloop.requestEvaluate();
    }
  }

  return SharedRessourceStore;


});
