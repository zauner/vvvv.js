// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }

define(function(require,exports) {


var _ = require('underscore');
var Node = require('core/vvvv.core.node');
var VVVV = require('core/vvvv.core.defines');

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: IOBox (String)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.IOBoxString = function(id, graph) {
  this.constructor(id, "IOBox (String)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.isIOBox = true;

  this.addInvisiblePin("Rows",[1.0],VVVV.PinTypes.Value);

  this.addInputPin("SliceOffset", [0], VVVV.PinTypes.Value);
  this.addInputPin("Input String", [""], VVVV.PinTypes.String);

  this.addOutputPin("Output String", [""], VVVV.PinTypes.String);

  this.evaluate = function() {
	  this.outputPins["Output String"].setSliceCount(this.inputPins["Input String"].getSliceCount());
    for (var i=0; i<this.inputPins["Input String"].getSliceCount(); i++) {
      this.outputPins["Output String"].setValue(i, this.inputPins["Input String"].getValue(i));
    }
  }

}
VVVV.Nodes.IOBoxString.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Switch (String Input)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SwitchStringInput = function(id, graph) {
  this.constructor(id, "Switch (String Input)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var inputCountIn = this.addInvisiblePin("Input Count", [2], VVVV.PinTypes.Value);

  var switchIn = this.addInputPin("Switch", [0], VVVV.PinTypes.Value);
  var inputIn = []

  var outputOut = this.addOutputPin("Output", ["text"], VVVV.PinTypes.String);

  this.configure = function() {
    var inputCount = Math.max(2, inputCountIn.getValue(0));
    VVVV.Helpers.dynamicPins(this, inputIn, inputCount, function(i) {
      return this.addInputPin('Input '+(i+1), ['text'], VVVV.PinTypes.String);
    })
  }

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSize; i++) {
      outputOut.setValue(i, inputIn[Math.round(Math.abs(switchIn.getValue(i)))%inputIn.length].getValue(i));
    }
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.SwitchStringInput.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Add (String)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AddString = function(id, graph) {
  this.constructor(id, "Add (String)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Intersperse *Enum* not implemented']
  };

  var inputCountIn = this.addInvisiblePin("Input Count", [2], VVVV.PinTypes.Value);

  var inputIn = []

  var intersperseStringIn = this.addInputPin("Intersperse String", [""], VVVV.PinTypes.String);

  var outputOut = this.addOutputPin("Output", ["texttext"], VVVV.PinTypes.String);

  this.configure = function() {
    var inputCount = Math.max(2, inputCountIn.getValue(0));
    VVVV.Helpers.dynamicPins(this, inputIn, inputCount, function(i) {
      return this.addInputPin('Input '+(i+1), ['text'], VVVV.PinTypes.String);
    })
  }

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSize; i++) {
      var pieces = [];
      var intersperse = intersperseStringIn.getValue(i);
      if (intersperse==undefined)
        intersperse = '';
      for (var j=0; j<inputIn.length; j++) {
        pieces.push(inputIn[j].getValue(i));
      }
      outputOut.setValue(i, pieces.join(intersperse));
    }
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.AddString.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: GetSlice (String)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GetSliceString = function(id, graph) {
  this.constructor(id, "GetSlice (String)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['Bin Size not implemented']
  };

  var inputIn = this.addInputPin("Input", ["text"], VVVV.PinTypes.String);
  var binSizeIn = this.addInputPin("Bin Size", [1], VVVV.PinTypes.Value);
  var indexIn = this.addInputPin("Index", [0], VVVV.PinTypes.Value);

  var outputOut = this.addOutputPin("Output", ["text"], VVVV.PinTypes.String);

  this.evaluate = function() {
      for (var i=0; i<indexIn.values.length; i++) {
        outputOut.setValue(i, inputIn.getValue(Math.round((indexIn.getValue(i)))));
      }
      outputOut.setSliceCount(indexIn.getSliceCount());
  }

}
VVVV.Nodes.GetSliceString.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: AsValue (String)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AsValue = function(id, graph) {
  this.constructor(id, "AsValue (String)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var inputIn = this.addInputPin("Input", [], VVVV.PinTypes.String);
  var defaultIn = this.addInputPin("Default", [0.0], VVVV.PinTypes.Value);

  var outputOut = this.addOutputPin("Output", [0.0], VVVV.PinTypes.Value);

  this.evaluate = function() {

    var maxSize = this.getMaxInputSliceCount();
    for (var i=0; i<maxSize; i++) {
      var inp = inputIn.getValue(i);
      if (/^\s*-?[0-9.e]+\s*$/.test(inp))
        outputOut.setValue(i, parseFloat(inp));
      else
        outputOut.setValue(i, defaultIn.getValue(i));
    }
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.AsValue.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Sort (String)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SortString = function(id, graph) {
  this.constructor(id, "Sort (String)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  // input pins
  var inputIn = this.addInputPin('Input', ['text'], VVVV.PinTypes.String);
  var reversesortingIn = this.addInputPin('Reverse Sorting', [0], VVVV.PinTypes.Value);

  // output pins
  var outputOut = this.addOutputPin('Output', ['text'], VVVV.PinTypes.String);
  var formerindexOut = this.addOutputPin('Former Index', [0], VVVV.PinTypes.Value);

  // evaluate() will be called each frame
  // (if the input pins have changed, or the nodes is flagged as auto-evaluating)
  this.evaluate = function() {
    var sorted = _(inputIn.values).map(function(v,i) { return [v, i]; });
    sorted = _(sorted).sortBy(function(x) { return x[0] });

    for (var i=0; i<sorted.length; i++) {
      outputOut.setValue(i, sorted[i][0]);
      formerindexOut.setValue(i, sorted[i][1]);
    }
    outputOut.setSliceCount(sorted.length);
    formerindexOut.setSliceCount(sorted.length);
  }

}
VVVV.Nodes.SortString.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Length (String)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.LengthString = function(id, graph) {
  this.constructor(id, "Length (String)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  // input pins
  var inputIn = this.addInputPin('Input', ['text'], VVVV.PinTypes.String);

  // output pins
  var countOut = this.addOutputPin('Count', [0], VVVV.PinTypes.Value);

  // evaluate() will be called each frame
  // (if the input pins have changed, or the nodes is flagged as auto-evaluating)
  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSize; i++) {
      var input = inputIn.getValue(i);
      countOut.setValue(i, input.length);
    }

    // you also might want to do stuff like this:
    countOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.LengthString.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Sift (String)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SiftString = function(id, graph) {
  this.constructor(id, "Sift (String)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  // input pins
  var inputIn = this.addInputPin('Input', ['text'], VVVV.PinTypes.String);
  var filterIn = this.addInputPin('Filter', ['text'], VVVV.PinTypes.String);
  var comparisonIn = this.addInputPin('Comparison', ['Matches'], VVVV.PinTypes.Enum);
  comparisonIn.enumOptions = ['Matches', 'Contains', 'MatchesAny', 'ContainsAny'];
  var casesensitiveIn = this.addInputPin('Case Sensitive', [0], VVVV.PinTypes.Value);

  // output pins
  var hitsOut = this.addOutputPin('Hits', [0], VVVV.PinTypes.Value);
  var inputindexOut = this.addOutputPin('Input Index', [0], VVVV.PinTypes.Value);
  var filterindexOut = this.addOutputPin('Filter Index', [0], VVVV.PinTypes.Value);
  var foundatpositionOut = this.addOutputPin('Found At Position', [0], VVVV.PinTypes.Value);

  // evaluate() will be called each frame
  // (if the input pins have changed, or the nodes is flagged as auto-evaluating)
  this.evaluate = function() {
    // to implement; maybe start with something like this:

    var maxSize = this.getMaxInputSliceCount();

    hitsOut.setSliceCount(maxSize);

    var comparison = comparisonIn.getValue(0);
    var casesensitive = casesensitiveIn.getValue(0);

    var hitIdx = 0;
    for (var i=0; i<maxSize; i++) {
      var input = inputIn.getValue(i);

      var numToCheck = 1;
      if (comparison=='MatchesAny' || comparison=='ContainsAny')
        numToCheck = filterIn.getSliceCount();

      var hits = 0;
      for (var j=0; j<numToCheck; j++) {
        var filter = filterIn.getValue(j+i);
        var foundAt = [];
        if (comparison=='Matches' || comparison=='MatchesAny') {
          if (filter == input)
            foundAt.push(-1);
        }
        else {
          var regex = new RegExp(filter, 'gi');
          var result;
          while (result = regex.exec(input)) {
            foundAt.push(result.index);
          }
        }
        for (var k=0; k<foundAt.length; k++) {
          inputindexOut.setValue(hitIdx, i%inputIn.getSliceCount());
          filterindexOut.setValue(hitIdx, (i+j)%filterIn.getSliceCount());
          foundatpositionOut.setValue(hitIdx, foundAt[k]+1);
          hitIdx++;
          hits++;
        }
      }
      hitsOut.setValue(i, hits);
    }
    inputindexOut.setSliceCount(hitIdx);
    filterindexOut.setSliceCount(hitIdx);
    foundatpositionOut.setSliceCount(hitIdx);

  }

}
VVVV.Nodes.SiftString.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Separate (String)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SeparateString = function(id, graph) {
  this.constructor(id, "Separate (String)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ["Quotes don't work"]
  };

  this.auto_evaluate = false;

  // input pins
  var inputIn = this.addInputPin('Input', ['text'], VVVV.PinTypes.String);
  var intersperseIn = this.addInputPin('Intersperse', ['None'], VVVV.PinTypes.Enum);
  intersperseIn.enumOptions = ["None","Space","Comma","CommaPlusSpace","Semicolon","Colon","Pipe","UnixPath","DosPath","Dash","NewLineAutoDetection","Dot","UnderScore","Minus"];
  var interspersestringIn = this.addInputPin('Intersperse String', [''], VVVV.PinTypes.String);
  var ignorebetweenIn = this.addInputPin('Ignore between', ['Double'], VVVV.PinTypes.Enum);
  ignorebetweenIn.enumOptions = ['Single', 'Double'];
  var keepquotesIn = this.addInputPin('Keep Quotes', [0], VVVV.PinTypes.Value);

  // output pins
  var outputOut = this.addOutputPin('Output', ['text'], VVVV.PinTypes.String);
  var formerindexOut = this.addOutputPin('Former Index', [0], VVVV.PinTypes.Value);

  var intersperseMap = {
    "None": "",
    "Space": " ",
    "Comma": ",",
    "CommaPlusSpace": ", ",
    "Semicolon": ";",
    "Colon": ":",
    "Pipe": "|",
    "UnixPath": "/",
    "DosPath": "\\",
    "Dash": "-",
    "NewLineAutoDetection": "\n",
    "Dot": ".",
    "UnderScore": "_",
    "Minus": "-"
  }

  var ignoreBetweenMap = {
    "Single": "'",
    "Double": "\""
  }

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    var outSlice = 0;

    for (var i=0; i<maxSize; i++) {
      var input = inputIn.getValue(i);
      var intersperse = intersperseMap[intersperseIn.getValue(i)];
      var interspersestring = interspersestringIn.getValue(i);
      var ignorebetween = ignoreBetweenMap[ignorebetweenIn.getValue(i)];
      var keepquotes = keepquotesIn.getValue(i);

      if (intersperse=='')
        intersperse = interspersestring;
      if (intersperse=='')
        intersperse = undefined;
      var splitSet = input.split(intersperse);
      var len = splitSet.length;
      var slice;
      var regex = new RegExp('[^'+ignorebetween+']*', 'g');
      for (var j=0; j<len; j++) {
        if (keepquotes==1)
          outputOut.setValue(outSlice, splitSet[j]);
        else
          outputOut.setValue(outSlice, splitSet[j].match(regex).join(''));
        formerindexOut.setValue(outSlice, i);
        outSlice++;
      }
    }

    outputOut.setSliceCount(outSlice);
    formerindexOut.setSliceCount(outSlice);
  }

}
VVVV.Nodes.SeparateString.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: EQ (String)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.EQString = function(id, graph) {
  this.constructor(id, "EQ (String)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  // input pins
  var input1In = this.addInputPin('Input 1', [''], VVVV.PinTypes.String);
  var input2In = this.addInputPin('Input 2', [''], VVVV.PinTypes.String);
  var casesensitiveIn = this.addInputPin('Case Sensitive', [1], VVVV.PinTypes.Value);

  // output pins
  var outputOut = this.addOutputPin('Output', [0], VVVV.PinTypes.Value);
  var inverseoutputOut = this.addOutputPin('Inverse Output', [0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSize; i++) {
      var input1 = input1In.getValue(i);
      var input2 = input2In.getValue(i);
      var casesensitive = casesensitiveIn.getValue(i);

      var res = (input1==input2 || (casesensitive==0 && input1.toLowerCase()==input2.toLowerCase())) ? 1 : 0;

      outputOut.setValue(i, res);
      inverseoutputOut.setValue(i, 1-res);
    }

    outputOut.setSliceCount(maxSize);
    inverseoutputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.EQString.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Select (String)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

// REDUNDANT: it's basically the sames as Select (Value), should be merged somehow

VVVV.Nodes.SelectString = function(id, graph) {
  this.constructor(id, "Select (String)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var inputIn = this.addInputPin("Input", [''], VVVV.PinTypes.String);
  var selectIn = this.addInputPin("Select", [1], VVVV.PinTypes.Value);

  var outputOut = this.addOutputPin("Output", [''], VVVV.PinTypes.String);
  var formerSliceOut = this.addOutputPin("Former Slice", [0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();

    var outputIndex = 0;
    for (var i=0; i<maxSize; i++) {
      for (var j=0; j<selectIn.getValue(i); j++) {
        outputOut.setValue(outputIndex, inputIn.getValue(i));
        formerSliceOut.setValue(outputIndex, i);
        outputIndex++;
      }
    }
    outputOut.setSliceCount(outputIndex);
    formerSliceOut.setSliceCount(outputIndex);
  }

}
VVVV.Nodes.SelectString.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Count (String)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

// REDUNDANT: it's basically the sames as Count (Value), should be merged somehow

VVVV.Nodes.CountString = function(id, graph) {
  this.constructor(id, "Count (String)", graph);

  this.auto_nil = false;

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.addInputPin("Input", [''], VVVV.PinTypes.String);

  this.addOutputPin("Count", [1.0], VVVV.PinTypes.Value);
  this.addOutputPin("High", [0.0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    if (this.inputPins["Input"].pinIsChanged()) {
      this.outputPins["Count"].setValue(0, this.inputPins["Input"].values.length);
      this.outputPins["High"].setValue(0, this.inputPins["Input"].values.length-1);
    }
  }

}
VVVV.Nodes.CountString.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Clean (String)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.CleanString = function(id, graph) {
  this.constructor(id, "Clean (String)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  // input pins
  var inputIn = this.addInputPin('Input', ['text'], VVVV.PinTypes.String);

  // output pins
  var outputOut = this.addOutputPin('Output', ['text'], VVVV.PinTypes.String);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSize; i++) {
      if (inputIn.getValue(i))
        outputOut.setValue(i, inputIn.getValue(i).trim());
      else
        outputOut.setValue(i, undefined);
    }

    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.CleanString.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: AvoidNil (String)
 Author(s): Matthias Zauner
 Original Node Author(s): Kalle
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AvoidNilString = function(id, graph) {
  this.constructor(id, "AvoidNIL (String)", graph);

  this.auto_nil = false;

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['Kalle'],
    credits: [],
    compatibility_issues: []
  };

  var inputIn = this.addInputPin("Input", ['text'], VVVV.PinTypes.String);
  var defaultIn = this.addInputPin("Default", ['text'], VVVV.PinTypes.String);

  var outputOut = this.addOutputPin("Output", ['text'], VVVV.PinTypes.String);

  this.evaluate = function() {
    if (inputIn.pinIsChanged() || defaultIn.pinIsChanged()) {
      var source = inputIn;
      if (inputIn.getSliceCount()==0) {
        source = defaultIn;
      }
      for (var i=0; i<source.values.length; i++) {
        outputOut.setValue(i, source.getValue(i));
      }
      outputOut.setSliceCount(source.getSliceCount());
    }


  }

}
VVVV.Nodes.AvoidNilString.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: FormatValue (String)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.FormatValueString = function(id, graph) {
  this.constructor(id, "FormatValue (String)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: ['pad function: http://stackoverflow.com/a/10073788',
              'thousands separator regex: http://stackoverflow.com/a/2901298'],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  var inputIn = this.addInputPin('Input', [0.0], VVVV.PinTypes.Value);
  var charactersbeforecommaIn = this.addInputPin('Characters before Comma', [1], VVVV.PinTypes.Value);
  var charactersaftercommaIn = this.addInputPin('Characters after Comma', [0], VVVV.PinTypes.Value);
  var thousandssymbolIn = this.addInputPin('Thousands Symbol', ['None'], VVVV.PinTypes.Enum);
  thousandssymbolIn.enumOptions = ["None", "Dot", "Comma", "Space"];
  var commasymbolIn = this.addInputPin('Comma Symbol', ['Dot'], VVVV.PinTypes.Enum);
  commasymbolIn.enumOptions = ["Dot", "Comma"];
  var leadingzeroesIn = this.addInputPin('Leading Zeroes', [0], VVVV.PinTypes.Value);

  var outputOut = this.addOutputPin('Output', ['0'], VVVV.PinTypes.String);

  function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }

  var separators = {"Dot": '.', "Comma": ',', "None": '', "Space": ' '};

  this.evaluate = function() {

    var maxSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSize; i++) {
      var input = inputIn.getValue(i);
      var charactersbeforecomma = parseInt(charactersbeforecommaIn.getValue(i));
      var charactersaftercomma = parseInt(charactersaftercommaIn.getValue(i));
      var thousandssymbol = thousandssymbolIn.getValue(i);
      var commasymbol = commasymbolIn.getValue(i);
      var leadingzeroes = leadingzeroesIn.getValue(i);

      var ccount = charactersbeforecomma+charactersaftercomma+(charactersaftercomma>0);
      input = input.toFixed(charactersaftercomma);
      input = pad(input, ccount, leadingzeroes>=0.5 ? '0' : ' ');
      input = input.replace('.', separators[commasymbol]).replace(/\B(?=(\d{3})+(?!\d))/g, separators[thousandssymbol]);
      outputOut.setValue(i, input);
    }

    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.FormatValueString.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: S+H (String)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SampleAndHoldString = function(id, graph) {
  this.constructor(id, "S+H (String)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['different output slice count in pure VVVV, if Set pin has only one slice']
  };

  var inputIn = this.addInputPin("Input", [''], VVVV.PinTypes.String);
  var setIn = this.addInputPin("Set", [0], VVVV.PinTypes.Value);

  var outputOut = this.addOutputPin("Output", [''], VVVV.PinTypes.String);


  this.evaluate = function() {

    var maxSize = this.getMaxInputSliceCount();
    for (var i=0; i<maxSize; i++) {
      if (outputOut.values[i]==undefined) {
        outputOut.setValue(i, 0.0);
      }
      if (Math.round(setIn.getValue(i))>=0.5) {
        outputOut.setValue(i, inputIn.getValue(i));
      }
    }
    outputOut.setSliceCount(maxSize);

  }

}
VVVV.Nodes.SampleAndHoldString.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Cons (String)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.ConsString = function(id, graph) {
  this.constructor(id, "Cons (String)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;
  this.auto_nil = false;

  var inputPins = [];

  // output pins
  var outputOut = this.addOutputPin('Output', ["text"], VVVV.PinTypes.String);

  // invisible pins
  var inputcountIn = this.addInvisiblePin('Input Count', [2], VVVV.PinTypes.Value);

  this.configure = function() {
    var inputCount = Math.max(2, inputcountIn.getValue(0));
    VVVV.Helpers.dynamicPins(this, inputPins, inputCount, function(i) {
      return this.addInputPin('Input '+(i+1), ["text"], VVVV.PinTypes.String);
    })
  }

  this.evaluate = function() {
    var idx = 0;
    for (var i=0; i<inputPins.length; i++) {
      if (inputPins[i].getSliceCount()==0)
        continue;
      for (var j=0; j<inputPins[i].getSliceCount(); j++) {
        outputOut.setValue(idx++, inputPins[i].getValue(j));
      }
    }
    outputOut.setSliceCount(idx);
  }

}
VVVV.Nodes.ConsString.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Add (String Spectral)
 Author(s): Matthias Zauner
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.AddStringSpectral = function(id, graph) {
  this.constructor(id, "Add (String Spectral)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var inputIn = this.addInputPin("Input", ['text'], VVVV.PinTypes.String);
  var binSizeIn = this.addInputPin("Bin Size", [-1], VVVV.PinTypes.Value);
  var intersperseStringIn = this.addInputPin("Intersperse String", [""], VVVV.PinTypes.String);

  var outputOut = this.addOutputPin("Output", ['text'], VVVV.PinTypes.String);

  this.evaluate = function() {
    var maxSpreadSize = this.getMaxInputSliceCount();

    var binNum = 0;
    var subIndex = 0;
    for (var j=0; j<maxSpreadSize || (binSizeIn.getValue(0)>0 && (subIndex>0 || binNum%binSizeIn.getSliceCount()!=0)); j++) {
      if (subIndex == 0)
        var sum = [];

      sum.push(inputIn.getValue(j));

      subIndex++;
      if (binSizeIn.getValue(0)>0) {
        if (subIndex>=binSizeIn.getValue(binNum)) {
          outputOut.setValue(binNum, sum.join(intersperseStringIn.getValue(0)));
          binNum++;
          subIndex = 0;
        }
      }
      else
        this.outputPins["Output"].setValue(0, sum.join(intersperseStringIn.getValue(0)));
    }
    this.outputPins["Output"].setSliceCount(binNum+(subIndex>0));
  }
}
VVVV.Nodes.AddStringSpectral.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Writer (String)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.WriterString = function(id, graph) {
  this.constructor(id, "Writer (String)", graph);

  this.environments = ['nodejs'];

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = true;

  var contentIn = this.addInputPin("Content", [""], VVVV.PinTypes.String);
  var filenameIn = this.addInputPin("Filename", ["file.txt"], VVVV.PinTypes.String);
  var writeIn = this.addInputPin("Write", [0], VVVV.PinTypes.Value);
  var appendIn = this.addInputPin("Append", [0], VVVV.PinTypes.Value);

  // output pins
  var outputOut = this.addOutputPin('Success', [0], VVVV.PinTypes.Value);


  // initialize() will be called after node creation
  var fs;
  this.initialize = function() {
    fs = window.server_req('fs');
  }

  this.evaluate = function() {
    outputOut.setValue(0, 0);
    if (writeIn.getValue(0)>=0.5 || appendIn.getValue(0)>0.5) {
      try {
        if (writeIn.getValue(0)>=0.5)
          fs.writeFileSync(VVVV.Helpers.prepareFilePath(filenameIn.getValue(0), this.patch), contentIn.getValue(0));
        else
          fs.appendFileSync(VVVV.Helpers.prepareFilePath(filenameIn.getValue(0), this.patch), contentIn.getValue(0));
        outputOut.setValue(0, 1);
      }
      catch (e) {
        outputOut.setValue(0, 0);
      }
    }
  }

}
VVVV.Nodes.WriterString.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Reader (String)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.ReaderString = function(id, graph) {
  this.constructor(id, "Reader (String)", graph);

  this.environments = ['nodejs'];

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var filenameIn = this.addInputPin("Filename", ["file.txt"], VVVV.PinTypes.String);
  var doReadIn = this.addInputPin("DoRead", [0], VVVV.PinTypes.Value);

  // output pins
  var contentOut = this.addOutputPin('Content', [''], VVVV.PinTypes.String);
  var successOut = this.addOutputPin('Success', [0], VVVV.PinTypes.Value);

  var content;

  // initialize() will be called after node creation
  var fs;
  this.initialize = function() {
    fs = window.server_req('fs');
  }

  this.evaluate = function() {
    successOut.setValue(0, 0);
    if (doReadIn.getValue(0)>=0.5) {
      try {
        content = fs.readFileSync(VVVV.Helpers.prepareFilePath(filenameIn.getValue(0), this.patch), 'utf-8');
        successOut.setValue(0, 1);
        contentOut.setValue(0, content)
      }
      catch (e) {
        successOut.setValue(0, 0);
        contentOut.setValue(0, '');
      }
    }
  }

}
VVVV.Nodes.ReaderString.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Replace (String)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.ReplaceString = function(id, graph) {
  this.constructor(id, "Replace (String RegExp)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: [''],
    credits: [],
    compatibility_issues: []
  };

  var inputIn = this.addInputPin("Input", [""], VVVV.PinTypes.String);
  var regexpIn = this.addInputPin("Regular Expression", [""], VVVV.PinTypes.String);
  var replaceIn = this.addInputPin("Replacement", [""], VVVV.PinTypes.String);
  var caseSensitiveIn = this.addInputPin("Case Sensitive", [0], VVVV.PinTypes.Value);

  // output pins
  var outputOut = this.addOutputPin('Output', [''], VVVV.PinTypes.String);
  var successOut = this.addOutputPin('Success', [0], VVVV.PinTypes.Value);

  this.evaluate = function() {
    var sliceCount = this.getMaxInputSliceCount();
    var regex;
    for (var i=0; i<sliceCount; i++) {
      try {
        regex = new RegExp(regexpIn.getValue(i), caseSensitiveIn.getValue(i)>=0.5 ? "g" : "gi");
        outputOut.setValue(i, inputIn.getValue(i).replace(regex, replaceIn.getValue(i)));
        successOut.setValue(i, 1);
      }
      catch (e) {
        outputOut.setValue(i, "");
        successOut.setValue(i, 0);
      }
    }
    outputOut.setSliceCount(sliceCount);
  }

}
VVVV.Nodes.ReplaceString.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Unzip (String)
 Author(s): David Gann
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.UnzipString = function(id, graph) {
  this.constructor(id, "Unzip (String)", graph);

  this.meta = {
    authors: ['David Gann'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };
 var inputIn = this.addInputPin("Input", [''], VVVV.PinTypes.String);
  var OutputCountIn = this.addInvisiblePin("Output Count", [1], VVVV.PinTypes.Value);

  var outputOut = []

  this.configure = function() {
    var outputCount = Math.max(1, OutputCountIn.getValue(0));
    VVVV.Helpers.dynamicPins(this, outputOut, outputCount, function(i) {
      return this.addOutputPin('Output '+(i+1), ['text'], VVVV.PinTypes.String);
    })
  }

  this.evaluate = function() {
      var outputCount = OutputCountIn.getValue(0);
    var maxSize = this.getMaxInputSliceCount();
    var maxCount = Math.max(maxSize, outputCount);
    var slicecount_value = [];
    for (var i=0; i<maxCount; i++) {
      outputOut[i%outputCount].setValue(Math.floor(i/outputCount), inputIn.getValue(i%maxSize));
      slicecount_value[i%outputCount] = Math.floor(i/outputCount)+1;
    }
    for (var j=0; j<outputCount; j++) {
    outputOut[j].setSliceCount( slicecount_value[j%slicecount_value.length]);

    }
  }

}
VVVV.Nodes.UnzipString.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Tokenizer (String)
 Author(s): 'Constantine Nisidis'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.TokenizerString = function(id, graph) {
  this.constructor(id, "Tokenizer (String)", graph);

  this.meta = {
    authors: ['Constantine Nisidis'],
    original_authors: [''],
    credits: [],
    compatibility_issues: []
  };

  var inputIn = this.addInputPin("Input", ["vvvvjs"], VVVV.PinTypes.String);

  var separatorIn = this.addInputPin("Separator", ["''"], VVVV.PinTypes.String);


  // output pins
  var outputOut = this.addOutputPin('Output', [''], VVVV.PinTypes.String);

  this.evaluate = function() {
    var sliceCount = this.getMaxInputSliceCount();
    //jdx = 0;
    strArray=[];
    for (var i=0; i<sliceCount; i++) {

        word = inputIn.getValue(i);
        chars = (word.split(''));
        for( j=0; j<chars.length; j++){
            strArray.push(chars[j]);
            console.log(chars[j]);

        }

    }
    outSliceCount = strArray.length;
    for(i=0; i<outSliceCount; i++)
      outputOut.setValue(i, strArray[i]);
    //console.log(strArray);
    outputOut.setSliceCount(outSliceCount);

  }
}
VVVV.Nodes.TokenizerString.prototype = new Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Substitute (String)
 Author(s): 'Constantine Nisidis'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SubstituteString = function(id, graph) {
  this.constructor(id, "Substitute (String)", graph);

  this.meta = {
    authors: ['Constantine Nisidis'],
    original_authors: [''],
    credits: [],
    compatibility_issues: []
  };

  var inputIn = this.addInputPin("Input", ["vvvvjs"], VVVV.PinTypes.String);
  var fromIn = this.addInputPin("From", ["vvvvjs"], VVVV.PinTypes.String);
  var toIn = this.addInputPin("To", ["vvvvjs"], VVVV.PinTypes.String);



  // output pins
  var outputOut = this.addOutputPin('Output', [''], VVVV.PinTypes.String);

  this.evaluate = function() {
    var sliceCount = this.getMaxInputSliceCount();
    //jdx = 0;
    strArray=[];
    var maxIn = Math.max(fromIn.getSliceCount(), toIn.getSliceCount());
    for (var i=0; i<sliceCount; i++) {
        word = inputIn.getValue(i);
        for( j=0; j<maxIn; j++){
              if(word == fromIn.getValue(j)){
                  outputOut.setValue(i, toIn.getValue(j));
              }
        }

    }
    outSliceCount = sliceCount;
    //for(i=0; i<outSliceCount; i++)
    //console.log(strArray);
    outputOut.setSliceCount(outSliceCount);

  }
}
VVVV.Nodes.SubstituteString.prototype = new Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Occurrence (VVVV)
 Author(s): Constantine Nisidis
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.OccurrenceString = function(id, graph) {
  this.constructor(id, "Occurrence (String)", graph);

  this.meta = {
    authors: ['c nisidis'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: [ 'with bin size']
  };

  var inputIn = this.addInputPin("Input", [''], VVVV.PinTypes.String);
  var UniqueOut = this.addOutputPin("Unique", [''], VVVV.PinTypes.String);
  var binOut = this.addOutputPin("Bins", [0], VVVV.PinTypes.String);
  var init = 1.0;
  this.auto_evaluate = true;

  function uniqueAndBinSize(arr) {

    var a = [], b = [], prev;
      arr.sort();
      for ( var i = 0; i < arr.length; i++ ) {
          if ( arr[i] !== prev ) {
              a.push(arr[i]);
              b.push(1);
          } else {
              b[b.length-1]++;
          }
          prev = arr[i];
      }

      return [a, b];
  }

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();

    var Input = inputIn.getValue(0, maxSize);
    var unique = uniqueAndBinSize(Input);
    for (var i=0; i<unique[0].length; i++) {
      UniqueOut.setValue(i, unique[0][i]);
      binOut.setValue(i, unique[1][i]);
    }
    UniqueOut.setSliceCount(unique[0].length);
    binOut.setSliceCount(unique[1].length);
  }

  }

VVVV.Nodes.OccurrenceString.prototype = new Node();

});




/* ---------- ADDED cnisidis -----------------*/
