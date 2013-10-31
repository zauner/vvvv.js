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
  
  this.addInvisiblePin("Rows",[1.0],this);
  
  this.addInputPin("SliceOffset", [0], this);
  this.addInputPin("Input String", [""], this);
  
  this.addOutputPin("Output String", [""], this);

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
    compatibility_issues: ['No dynamic pin count yet']
  };
  
  var switchIn = this.addInputPin("Switch", [0], this);
  var inputIn = []
  inputIn[0] = this.addInputPin("Input 1", ["text"], this);
  inputIn[1] = this.addInputPin("Input 2", ["text"], this);
  
  var outputOut = this.addOutputPin("Output", ["text"], this);

  this.evaluate = function() {
    var maxSize = this.getMaxInputSliceCount();
    
    if (switchIn.getValue(0)==undefined) {
      outputOut.setValue(0, undefined);
      return;
    }
    for (var i=0; i<maxSize; i++) {
      outputOut.setValue(i, inputIn[switchIn.getValue(i)%inputIn.length].getValue(i));
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
  
  var inputIn = []
  inputIn[0] = this.addInputPin("Input 1", ["text"], this);
  inputIn[1] = this.addInputPin("Input 2", ["text"], this);
  
  var intersperseStringIn = this.addInputPin("Intersperse String", [""], this);
  
  var outputOut = this.addOutputPin("Output", ["texttext"], this);

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
  
  var inputIn = this.addInputPin("Input", ["text"], this);
  var binSizeIn = this.addInputPin("Bin Size", [1], this);
  var indexIn = this.addInputPin("Index", [0], this);
  
  var outputOut = this.addOutputPin("Output", ["text"], this);

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
  
  var inputIn = this.addInputPin("Input", [], this);
  var defaultIn = this.addInputPin("Default", [0.0], this);
  
  var outputOut = this.addOutputPin("Output", [0.0], this);

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
  var inputIn = this.addInputPin('Input', ['text'], this);
  var reversesortingIn = this.addInputPin('Reverse Sorting', [0], this);

  // output pins
  var outputOut = this.addOutputPin('Output', ['text'], this);
  var formerindexOut = this.addOutputPin('Former Index', [0], this);

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
  var inputIn = this.addInputPin('Input', ['text'], this);

  // output pins
  var countOut = this.addOutputPin('Count', [0], this);

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
  var inputIn = this.addInputPin('Input', ['text'], this);
  var filterIn = this.addInputPin('Filter', ['text'], this);
  var comparisonIn = this.addInputPin('Comparison', ['Matches'], this);
  var casesensitiveIn = this.addInputPin('Case Sensitive', [0], this);

  // output pins
  var hitsOut = this.addOutputPin('Hits', [0], this);
  var inputindexOut = this.addOutputPin('Input Index', [0], this);
  var filterindexOut = this.addOutputPin('Filter Index', [0], this);
  var foundatpositionOut = this.addOutputPin('Found At Position', [0], this);

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
  var inputIn = this.addInputPin('Input', ['text'], this);
  var intersperseIn = this.addInputPin('Intersperse', ['None'], this);
  var interspersestringIn = this.addInputPin('Intersperse String', [''], this);
  var ignorebetweenIn = this.addInputPin('Ignore between', ['Double'], this);
  var keepquotesIn = this.addInputPin('Keep Quotes', [0], this);

  // output pins
  var outputOut = this.addOutputPin('Output', ['text'], this);
  var formerindexOut = this.addOutputPin('Former Index', [0], this);
  
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
  var input1In = this.addInputPin('Input 1', [''], this);
  var input2In = this.addInputPin('Input 2', [''], this);
  var casesensitiveIn = this.addInputPin('Case Sensitive', [1], this);

  // output pins
  var outputOut = this.addOutputPin('Output', [0], this);
  var inverseoutputOut = this.addOutputPin('Inverse Output', [0], this);

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
  
  var inputIn = this.addInputPin("Input", [''], this);
  var selectIn = this.addInputPin("Select", [1], this);
  
  var outputOut = this.addOutputPin("Output", [0.0], this);
  var formerSliceOut = this.addOutputPin("Former Slice", [0], this);

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
  
  this.addInputPin("Input", [''], this);
  
  this.addOutputPin("Count", [1.0], this);
  this.addOutputPin("High", [0.0], this);

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
  var inputIn = this.addInputPin('Input', ['text'], this);

  // output pins
  var outputOut = this.addOutputPin('Output', ['text'], this);

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
  
  var inputIn = this.addInputPin("Input", ['text'], this);
  var defaultIn = this.addInputPin("Default", ['text'], this);
  
  var outputOut = this.addOutputPin("Output", ['text'], this);

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
  
  var inputIn = this.addInputPin('Input', [0.0], this);
  var charactersbeforecommaIn = this.addInputPin('Characters before Comma', [1], this);
  var charactersaftercommaIn = this.addInputPin('Characters after Comma', [0], this);
  var thousandssymbolIn = this.addInputPin('Thousands Symbol', ['None'], this, true, VVVV.PinTypes.Enum);
  thousandssymbolIn.enumOptions = ["None", "Dot", "Comma", "Space"];
  var commasymbolIn = this.addInputPin('Comma Symbol', ['Dot'], this, true, VVVV.PinTypes.Enum);
  commasymbolIn.enumOptions = ["Dot", "Comma"];
  var leadingzeroesIn = this.addInputPin('Leading Zeroes', [0], this);

  var outputOut = this.addOutputPin('Output', ['0'], this);
  
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