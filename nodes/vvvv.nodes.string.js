  // VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.


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

  this.addInvisiblePin("Rows",[1.0],VVVV.PinTypes.Value);

  this.addInputPin("SliceOffset", [0], VVVV.PinTypes.Value);
  this.addInputPin("Input String", [""], VVVV.PinTypes.String);

  this.addOutputPin("Output String", [""], VVVV.PinTypes.String);

  this.evaluate = function() {
	  this.outputPins["Output String"].setSliceCount(this.inputPins["Input String"].getSliceCount());
    for (var i=0; i<this.inputPins["Input String"].getSliceCount(); i++) {
      this.outputPins["Output String"].setValue(i, this.inputPins["Input String"].values[i]);
    }
  }

}
VVVV.Nodes.IOBoxString.prototype = new VVVV.Core.Node();

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

  this.initialize = function() {
    var inputCount = Math.max(2, inputCountIn.getValue(0));
    VVVV.Helpers.dynamicPins(this, inputIn, inputCount, function(i) {
      return this.addInputPin('Input '+(i+1), ['text'], VVVV.PinTypes.String);
    })
  }

  this.evaluate = function() {
    if (inputCountIn.pinIsChanged())
      this.initialize();
    var maxSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSize; i++) {
      outputOut.setValue(i, inputIn[Math.round(Math.abs(switchIn.getValue(i)))%inputIn.length].getValue(i));
    }
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.SwitchStringInput.prototype = new VVVV.Core.Node();

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
    compatibility_issues: ['No dynamic pin count yet', 'Intersperse *Enum* not implemented']
  };

  var inputCountIn = this.addInvisiblePin("Input Count", [2], VVVV.PinTypes.Value);

  var inputIn = []

  var intersperseStringIn = this.addInputPin("Intersperse String", [""], VVVV.PinTypes.String);

  var outputOut = this.addOutputPin("Output", ["texttext"], VVVV.PinTypes.String);

  this.initialize = function() {
    var inputCount = Math.max(2, inputCountIn.getValue(0));
    VVVV.Helpers.dynamicPins(this, inputIn, inputCount, function(i) {
      return this.addInputPin('Input '+(i+1), ['text'], VVVV.PinTypes.String);
    })
  }

  this.evaluate = function() {
    if (inputCountIn.pinIsChanged())
      this.initialize();
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
VVVV.Nodes.AddString.prototype = new VVVV.Core.Node();


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
VVVV.Nodes.GetSliceString.prototype = new VVVV.Core.Node();


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
        outputOut.setValue(i, parseFloat(defaultIn.getValue(i)));
    }
    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.AsValue.prototype = new VVVV.Core.Node();


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

  // invisible pins


  // initialize() will be called after node creation
  this.initialize = function() {

  }

  // evaluate() will be called each frame
  // (if the input pins have changed, or the nodes is flagged as auto-evaluating)
  this.evaluate = function() {
    xxx = inputIn.values;
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
VVVV.Nodes.SortString.prototype = new VVVV.Core.Node();


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
VVVV.Nodes.LengthString.prototype = new VVVV.Core.Node();


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
VVVV.Nodes.SiftString.prototype = new VVVV.Core.Node();


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
VVVV.Nodes.SeparateString.prototype = new VVVV.Core.Node();


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
VVVV.Nodes.EQString.prototype = new VVVV.Core.Node();


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
VVVV.Nodes.SelectString.prototype = new VVVV.Core.Node();


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
VVVV.Nodes.CountString.prototype = new VVVV.Core.Node();


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
VVVV.Nodes.CleanString.prototype = new VVVV.Core.Node();


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
      if (inputIn.values[0]==undefined) {
        source = defaultIn;
      }
      for (var i=0; i<source.values.length; i++) {
        outputOut.setValue(i, source.getValue(i));
      }
      outputOut.setSliceCount(source.getSliceCount());
    }


  }

}
VVVV.Nodes.AvoidNilString.prototype = new VVVV.Core.Node();


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
      input = parseFloat(input).toFixed(charactersaftercomma);
      input = pad(input, ccount, leadingzeroes>=0.5 ? '0' : ' ');
      input = input.replace('.', separators[commasymbol]).replace(/\B(?=(\d{3})+(?!\d))/g, separators[thousandssymbol]);
      outputOut.setValue(i, input);
    }

    outputOut.setSliceCount(maxSize);
  }

}
VVVV.Nodes.FormatValueString.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: CAR (String)
 Author(s): 'Storozhik Gleb'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.CAR = function(id, graph) {
  this.constructor(id, "CAR (String)", graph);

  this.meta = {
    authors: ['Gleb Storozhik'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var inputIn = this.addInputPin("Input", [''], VVVV.PinTypes.String);

  var firstSlice = this.addOutputPin('First Slice', ['0'], VVVV.PinTypes.String);
  var remainder = this.addOutputPin('Remainder', ['0'], VVVV.PinTypes.String);

  this.evaluate = function() {
    firstSlice.setValue(0, inputIn.getValue(0));

    var maxSize = this.getMaxInputSliceCount();

    for (var i=1; i<maxSize; i++) {
      remainder.setValue(i-1, inputIn.getValue(i));
    }

    firstSlice.setSliceCount(1);
    remainder.setSliceCount(maxSize-1);
  }
}
VVVV.Nodes.CAR.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: CDR (String)
 Author(s): 'Storozhik Gleb'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.CDRString = function(id, graph) {
  this.constructor(id, "CDR (String)", graph);

  this.meta = {
    authors: ['Gleb Storozhik'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var inputIn = this.addInputPin("Input", [''], VVVV.PinTypes.String);

  var remainder = this.addOutputPin('Remainder', ['0'], VVVV.PinTypes.String);
  var lastSlice = this.addOutputPin('Last Slice', ['0'], VVVV.PinTypes.String);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();

    lastSlice.setValue(0, inputIn.getValue(maxSize-1));

    for (var i=0; i<maxSize-1; i++) {
      remainder.setValue(i, inputIn.getValue(i+1));
    }

    firstSlice.setSliceCount(1);
    remainder.setSliceCount(maxSize-1);
  }
}
VVVV.Nodes.CDRString.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: DeleteSlice (String)
 Author(s): 'Storozhik Gleb'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.DeleteSlice = function(id, graph) {
  this.constructor(id, "DeleteSlice (String)", graph);

  this.meta = {
    authors: ['Gleb Storozhik'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['without bin(size)']
  };

  var inputIn = this.addInputPin("Input", [''], VVVV.PinTypes.String);
  var index = this.addInputPin("Index", [''], VVVV.PinTypes.Value);

  var outputOut = this.addOutputPin('Output', ['0'], VVVV.PinTypes.String);


  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSize-1; i++) {
      if (i<index.getValue(0))
        outputOut.setValue(i, inputIn.getValue(i));
      else
        outputOut.setValue(i, inputIn.getValue(i+1));
    }

    outputOut.setSliceCount(maxSize-1);
  }
}
VVVV.Nodes.DeleteSlice.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Reader (String)
 Author(s): 'Storozhik Gleb'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.Reader = function(id, graph) {
  this.constructor(id, "Reader (String)", graph);

  this.meta = {
    authors: ['Gleb Storozhik'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var filename = this.addInputPin("Filename", ['file.txt'], VVVV.PinTypes.String);
  var read = this.addInputPin("Read", ['0'], VVVV.PinTypes.Value);

  var content = this.addOutputPin('Content', ['0'], VVVV.PinTypes.String);


  this.evaluate = function() {

    var maxSize = this.getMaxInputSliceCount();

    if(read.getValue(0) == '1'){

      for (var i=0; i<maxSize; i++) {

        var rawFile = new XMLHttpRequest();
        rawFile.open("GET", filename.getValue(i), false);

        rawFile.onreadystatechange = function ()
        {
            if(rawFile.readyState === 4)
            {
                if(rawFile.status === 200 || rawFile.status == 0)
                {
                    content.setValue(i, rawFile.responseText);
                    alert(allText);
                }
            }
        }
        rawFile.send(null);
        }
    content.setSliceCount(maxSize);
    }
  }
}
VVVV.Nodes.Reader.prototype = new VVVV.Core.Node();

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Subtract (String)
 Author(s): Gleb Storozhik
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SubtractString = function(id, graph) {
  this.constructor(id, "Subtract (String)", graph);

  this.meta = {
    authors: ['Gleb Storozhik'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var operand1 = this.addInputPin('Operand 1', [''], VVVV.PinTypes.String);
  var operand2 = this.addInputPin('Operand 2', [''], VVVV.PinTypes.String);

  var result = this.addOutputPin('Result', ['0'], VVVV.PinTypes.String);


  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();

    for (var i=0; i<maxSize; i++) {
      var res =operand1.getValue(i).replace(operand2.getValue(i), "");
      result.setValue(i, res);
    }
    result.setSliceCount(maxSize);
  }
}
VVVV.Nodes.SubtractString.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: GetSpread (String Advanced)
 Author(s): Gleb Storozhik
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.GetSpreadStringAdvanced = function(id, graph) {
  this.constructor(id, "GetSpread (String Advanced)", graph);

  this.meta = {
    authors: ['Gleb Storozhik'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: []
  };

  var inputIn = this.addInputPin('Input', [''], VVVV.PinTypes.String);
  var binSizeIn = this.addInputPin('Input Bin Size', [1], VVVV.PinTypes.Value);
  var offsetIn = this.addInputPin('Offset', [0], VVVV.PinTypes.Value);
  var count =this.addInputPin('Count', [0], VVVV.PinTypes.Value);

  var outputOut = this.addOutputPin('Output', [''], VVVV.PinTypes.String);


  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();

    var result = [];
    var offset = offsetIn.getValue(0);

    var startIndex = 0;
    var binsCount = inputIn.values.length / binSizeIn.getValue(0);

    for (var i = 0; i < binsCount; i++) {
      var bin = inputIn.values.slice(startIndex, binSizeIn.getValue(0) - 1);
      startIndex += binSizeIn.getValue(0);

      result = result.concat(bin.slice(offset), offset + count.getValue(0));
    }

    for(i = 0; i < result.length; i++) {
      outputOut.setValue(i, result[i]);
    }

    outputOut.setSliceCount(result.length);
  };
};

VVVV.Nodes.GetSpreadStringAdvanced.prototype = new VVVV.Core.Node();


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: SetSlice (String)
 Author(s): Gleb Storozhik
 Original Node Author(s): VVVV Group
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SetSliceString = function(id, graph) {
  this.constructor(id, "SetSlice (String)", graph);

  this.meta = {
    authors: ['Gleb Storozhik'],
    original_authors: ['VVVV Group'],
    credits: [],
    compatibility_issues: ['not implemented bin size']
  };

  var spreadIn = this.addInputPin('Spread', [''], VVVV.PinTypes.String);
  var inputIn = this.addInputPin('Input', [''], VVVV.PinTypes.String);
  var binSizeIn = this.addInputPin('Bin Size', [1], VVVV.PinTypes.Value);
  var indexIn = this.addInputPin('Index', [0], VVVV.PinTypes.Value);

  var outputOut = this.addOutputPin('Output', [''], VVVV.PinTypes.String);

  this.evaluate = function() {

    var maxSize = this.getMaxInputSliceCount();
    var values = spreadIn.values.slice(0);

    for (var i = 0; i < indexIn.getSliceCount(); i++)
      values[indexIn.getValue(i)] = inputIn.getValue(0);

    for (i = 0; i < maxSize; i++) {
      outputOut.setValue(i, values[i]);
    }

    outputOut.setSliceCount(maxSize);
  };
};
VVVV.Nodes.SetSliceString.prototype = new VVVV.Core.Node();
