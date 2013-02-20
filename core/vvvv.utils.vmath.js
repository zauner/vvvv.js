VVVV.Utils = {};
VVVV.Utils.VMath = {};

VVVV.Utils.VMath.MapModeEnum = (function() {
  this.enumerator = {
    FLOAT : 0,
    CLAMP : 1,
    WRAP : 2
  };
  
  return this.enumerator;
})();

VVVV.Utils.VMath.map = function (input, inMin, inMax, outMin, outMax, mapMode) {
	var output;
	if (inMax - inMin === 0){
		output = 0;
	}
	else{
		var range = inMax - inMin;
		var normalized = (input - inMin) / range;
		var mapModeEnum = VVVV.Utils.VMath.MapModeEnum;

		switch (mapMode) {
			case mapModeEnum.FLOAT:
        output = outMin + normalized * (outMax - outMin);
        break;
      case mapModeEnum.CLAMP:
        output = outMin + normalized * (outMax - outMin);
        var min = Math.min(OutMin, OutMax);
        var max = Math.max(OutMin, OutMax);
        output = Math.min(Math.max(output, min), max);
        break;
      case mapModeEnum.WRAP:
        if (normalized < 0){
          normalized = 1 + normalized;
          output = outMin + (normalized % 1) * (outMax - outMin);
        }
        break;
      default:
        output = outMin + normalized * (outMax - outMin);
        break;
		}
	}

  return output;
};