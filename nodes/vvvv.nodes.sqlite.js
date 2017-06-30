// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.

if (typeof define !== 'function') { var define = require(VVVVContext.Root+'/node_modules/amdefine')(module, VVVVContext.getRelativeRequire(require)) }
define(function(require,exports) {

var Node = require('core/vvvv.core.node');
var VVVV = require('core/vvvv.core.defines');

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Database (SQLite Network)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'vux'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.DatabaseSQLite = function(id, graph) {
  this.constructor(id, "Database (SQLite Network)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['vux'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;
  this.environments = ['nodejs'];

  // input pins
  var connStringIn = this.addInputPin('Connection String', [''], VVVV.PinTypes.String);
  var connectIn = this.addInputPin('Connect', [0], VVVV.PinTypes.Value);

  // output pins
  var dbOut = this.addOutputPin('Connection', [''], VVVV.PinTypes.Node);
  var statusOut = this.addOutputPin('Status', ['Disconnected'], VVVV.PinTypes.String);
  var connectedOut = this.addOutputPin('Connected', [0], VVVV.PinTypes.Value);

  var sqlite3 = undefined;
  var fs = undefined;
  var db = undefined;
  this.initialize = function() {
    sqlite3 = window.server_req('sqlite3');
    if (sqlite3)
      sqlite3 = sqlite3.verbose();
    fs = window.server_req('fs');
  }

  this.evaluate = function() {
    if (db===undefined && connectIn.getValue(0)>=0.5 && connStringIn.getValue(0)!="") {
      try {
        var file = VVVV.Helpers.prepareFilePath(connStringIn.getValue(0), this.parentPatch);
        if (!fs.existsSync(file))
          throw "Database "+connStringIn.getValue(0)+" not found";
        db = new sqlite3.Database(file);
        if (db) {
          dbOut.setValue(0, db);
          connectedOut.setValue(0, 1);
          statusOut.setValue(0, 'Connected');
        }
      }
      catch (err) {
        console.log(err);
        dbOut.setValue(0, undefined);
        connectedOut.setValue(0, 0);
        statusOut.setValue(0, err);
      }
    }

    if (db!==undefined && connectIn.getValue(0)<0.5) {
      db.close();
      db = undefined;
      dbOut.setValue(0, undefined);
      connectedOut.setValue(0, 0);
      statusOut.setValue(0, 'Disconnected');
    }

  }

}
VVVV.Nodes.DatabaseSQLite.prototype = new Node();
VVVV.Nodes.DatabaseSQLite.requirements = ['sqlite3'];


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: SELECT (SQLite Network)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'vux'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.SelectSQLite = function(id, graph) {
  this.constructor(id, "Select (SQLite Network)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['vux'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;
  this.environments = ['nodejs'];

  // input pins
  var connectionIn = this.addInputPin('Connection', [], VVVV.PinTypes.Node);
  var fieldsIn = this.addInputPin('Fields', ['*'], VVVV.PinTypes.String);
  var tablesIn = this.addInputPin('Tables', [''], VVVV.PinTypes.String);
  var whereIn = this.addInputPin('Where', [''], VVVV.PinTypes.String);
  var groupByIn = this.addInputPin('Group By', [''], VVVV.PinTypes.String);
  var havingIn = this.addInputPin('Having', [''], VVVV.PinTypes.String);
  var orderByIn = this.addInputPin('Order By', [''], VVVV.PinTypes.String);
  var sendQueryIn = this.addInputPin('SendQuery', [0], VVVV.PinTypes.Value);

  var fieldsCfgIn = this.addInvisiblePin('Field Names', [''], VVVV.PinTypes.String);

  // output pins
  var statementOut = this.addOutputPin('Statement', [''], VVVV.PinTypes.String);
  var statusOut = this.addOutputPin('Status', [''], VVVV.PinTypes.String);
  var onDataOut = this.addOutputPin('OnData', [0], VVVV.PinTypes.Value);
  onDataOut.auto_reset = true;
  var outputPins = {};

  function createResultFieldPins(fieldString) {
    var fieldNames = fieldString.split(',').map(function(f) { return f.trim(); });
    for (var i=0; i<fieldNames.length; i++) {
      if (fieldNames[i]=='')
        continue;
      if (outputPins[fieldNames[i]]===undefined)
        outputPins[fieldNames[i]] = this.addOutputPin(fieldNames[i], [], VVVV.PinTypes.String)
    }
    for (var pinname in outputPins) {
      if (fieldNames.indexOf(pinname)<0)
        this.removeOutputPin(pinname);
    }
  }

  this.configure = function() {
    createResultFieldPins.call(this, fieldsCfgIn.getValue(0));
  }

  var sqlite3 = undefined;
  var db = undefined;
  this.initialize = function() {
    sqlite3 = window.server_req('sqlite3');
    if (sqlite3)
      sqlite3 = sqlite3.verbose();
    fs = window.server_req('fs');
  }

  var query = "";

  this.evaluate = function() {

    if (fieldsCfgIn.pinIsChanged())
      createResultFieldPins.call(this, fieldsCfgIn.getValue(0));

    var q = ["SELECT", fieldsIn.getValue(0), "FROM ", tablesIn.getValue(0)];
    if (whereIn.getValue(0).trim()!="")
      q.push("WHERE "+whereIn.getValue(0));
    if (groupByIn.getValue(0).trim()!="")
      q.push("GROUP BY "+groupByIn.getValue(0));
    if (havingIn.getValue(0).trim()!="")
      q.push("HAVING "+havingIn.getValue(0));
    if (orderByIn.getValue(0).trim()!="")
      q.push("ORDER BY "+orderByIn.getValue(0));

    query = q.join(' ');
    statementOut.setValue(0, query);

    if (sendQueryIn.getValue(0)>=0.5) {
      var db = connectionIn.getValue(0);
      var that = this;
      db.all(query, function(err, rows) {
        if (!err) {
          statusOut.setValue(0, 'OK');
          onDataOut.setValue(0, 1);
          for (var i=0; i<rows.length; i++) {
            for (var fieldName in rows[i]) {
              if (outputPins[fieldName])
                outputPins[fieldName].setValue(i, rows[i][fieldName]);
            }
          }
          for (var pinname in outputPins) {
            outputPins[pinname].setSliceCount(rows.length);
          }
        }
        else {
          statusOut.setValue(0, err.message);
          for (var pinname in outputPins) {
            outputPins[pinname].setSliceCount(0);
          }
        }
        that.parentPatch.mainloop.requestEvaluate();
      })
    }
  }

}
VVVV.Nodes.SelectSQLite.prototype = new Node();
VVVV.Nodes.SelectSQLite.requirements = ['sqlite3'];


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Insert (SQLite Network)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'vux'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.InsertSQLite = function(id, graph) {
  this.constructor(id, "Insert (SQLite Network)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['vux'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;
  this.environments = ['nodejs'];

  // input pins
  var connectionIn = this.addInputPin('Connection', [], VVVV.PinTypes.Node);
  var tableIn = this.addInputPin('Table', [''], VVVV.PinTypes.String);
  var fieldsIn = this.addInputPin('Fields', [''], VVVV.PinTypes.String);
  var valuesIn = this.addInputPin('Values', [''], VVVV.PinTypes.String);
  var sendQueryIn = this.addInputPin('SendQuery', [0], VVVV.PinTypes.Value);

  // output pins
  var statementOut = this.addOutputPin('Statement', [''], VVVV.PinTypes.String);
  var statusOut = this.addOutputPin('Status', [''], VVVV.PinTypes.String);
  var insertedOut = this.addOutputPin('Inserted', [0], VVVV.PinTypes.Value);
  insertedOut.auto_reset = true;

  var sqlite3 = undefined;
  var db = undefined;
  this.initialize = function() {
    sqlite3 = window.server_req('sqlite3');
    if (sqlite3)
      sqlite3 = sqlite3.verbose();
    fs = window.server_req('fs');
  }

  var query = "";
  var q = ["INSERT INTO", "", "", "VALUES ", ""];

  var updated = true;
  var status = "";
  var inserted = 0;

  this.evaluate = function() {

    q[1] = tableIn.getValue(0);
    q[2] = "("+fieldsIn.getValue(0)+")";
    q[4] = "("+valuesIn.getValue(0)+")";

    query = q.join(' ');
    statementOut.setValue(0, query);

    if (sendQueryIn.getValue(0)>=0.5) {
      var db = connectionIn.getValue(0);
      var that = this;
      db.exec(query, function(err) {
        if (!err) {
          status = "OK";
          inserted = 1;
        }
        else {
          status = err.message;
        }
        updated = true;
        that.dirty = true;
        that.parentPatch.mainloop.requestEvaluate();
      })
    }

    if (updated) {
      statusOut.setValue(0, status);
      insertedOut.setValue(0, inserted);
      inserted = 0;
      updated = false;
    }
  }

}
VVVV.Nodes.InsertSQLite.prototype = new Node();
VVVV.Nodes.InsertSQLite.requirements = ['sqlite3'];


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Update (SQLite Network)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'vux'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.UpdateSQLite = function(id, graph) {
  this.constructor(id, "Update (SQLite Network)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['vux'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;
  this.environments = ['nodejs'];

  // input pins
  var connectionIn = this.addInputPin('Connection', [], VVVV.PinTypes.Node);
  var tableIn = this.addInputPin('Table', [''], VVVV.PinTypes.String);
  var setIn = this.addInputPin('Set', [''], VVVV.PinTypes.String);
  var whereIn = this.addInputPin('Where', ['1=0'], VVVV.PinTypes.String);
  var sendQueryIn = this.addInputPin('SendQuery', [0], VVVV.PinTypes.Value);

  // output pins
  var statementOut = this.addOutputPin('Statement', [''], VVVV.PinTypes.String);
  var statusOut = this.addOutputPin('Status', [''], VVVV.PinTypes.String);
  var updatedOut = this.addOutputPin('Updated', [0], VVVV.PinTypes.Value);
  updatedOut.auto_reset = true;

  var sqlite3 = undefined;
  var db = undefined;
  this.initialize = function() {
    sqlite3 = window.server_req('sqlite3');
    if (sqlite3)
      sqlite3 = sqlite3.verbose();
    fs = window.server_req('fs');
  }

  var query = "";
  var q = ["UPDATE", "", "SET", "", "WHERE", ""];

  this.evaluate = function() {
    q[1] = tableIn.getValue(0);
    q[3] = setIn.getValue(0);
    q[5] = whereIn.getValue(0);

    query = q.join(' ');
    statementOut.setValue(0, query);

    if (sendQueryIn.getValue(0)>=0.5) {
      var db = connectionIn.getValue(0);
      var that = this;
      db.exec(query, function(err) {
        if (!err) {
          statusOut.setValue(0, 'OK');
          updatedOut.setValue(0, 1);
        }
        else {
          statusOut.setValue(0, err.message);
        }
        that.parentPatch.mainloop.requestEvaluate();
      })
    }
  }

}
VVVV.Nodes.UpdateSQLite.prototype = new Node();
VVVV.Nodes.UpdateSQLite.requirements = ['sqlite3'];


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Delete (SQLite Network)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): 'vux'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.DeleteSQLite = function(id, graph) {
  this.constructor(id, "Delete (SQLite Network)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['vux'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;
  this.environments = ['nodejs'];

  // input pins
  var connectionIn = this.addInputPin('Connection', [], VVVV.PinTypes.Node);
  var tableIn = this.addInputPin('Table', [''], VVVV.PinTypes.String);
  var whereIn = this.addInputPin('Where', ['1=0'], VVVV.PinTypes.String);
  var sendQueryIn = this.addInputPin('SendQuery', [0], VVVV.PinTypes.Value);

  // output pins
  var statementOut = this.addOutputPin('Statement', [''], VVVV.PinTypes.String);
  var statusOut = this.addOutputPin('Status', [''], VVVV.PinTypes.String);
  var deletedOut = this.addOutputPin('Deleted', [0], VVVV.PinTypes.Value);
  deletedOut.auto_reset = true;

  var sqlite3 = undefined;
  var db = undefined;
  this.initialize = function() {
    sqlite3 = window.server_req('sqlite3');
    if (sqlite3)
      sqlite3 = sqlite3.verbose();
    fs = window.server_req('fs');
  }

  var query = "";
  var q = ["DELETE FROM ", "", "WHERE", ""];

  this.evaluate = function() {
    q[1] = tableIn.getValue(0);
    q[3] = whereIn.getValue(0);

    query = q.join(' ');
    statementOut.setValue(0, query);

    if (sendQueryIn.getValue(0)>=0.5) {
      var db = connectionIn.getValue(0);
      var that = this;
      db.exec(query, function(err) {
        if (!err) {
          statusOut.setValue(0, 'OK');
          deletedOut.setValue(0, 1);
        }
        else {
          statusOut.setValue(0, err.message);
        }
        that.parentPatch.mainloop.requestEvaluate();
      })
    }
  }

}
VVVV.Nodes.DeleteSQLite.prototype = new Node();
VVVV.Nodes.DeleteSQLite.requirements = ['sqlite3'];

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: Escape (SQLite String)
 Author(s): 'Matthias Zauner'
 Original Node Author(s): ''
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.EscapeSQLite = function(id, graph) {
  this.constructor(id, "Escape (SQLite String)", graph);

  this.meta = {
    authors: ['Matthias Zauner'],
    original_authors: ['vux'],
    credits: [],
    compatibility_issues: []
  };

  this.auto_evaluate = false;

  // input pins
  var inputIn = this.addInputPin('Input', [''], VVVV.PinTypes.String);

  // output pins
  var outputOut = this.addOutputPin('Output', [''], VVVV.PinTypes.String);


  this.evaluate = function() {

  }

  this.getCode = function() {
    return "({Input}+\"\").replace(/'/g, \"''\")";
  }

}
VVVV.Nodes.EscapeSQLite.prototype = new Node();

});
