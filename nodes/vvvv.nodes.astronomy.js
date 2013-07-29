// VVVV.js -- Visual Web Client Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.


/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 NODE: CurrentTime (Astronomy)
 Author(s): 'Zauner'
 Original Node Author(s): 'VVVV Group'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

VVVV.Nodes.CurrentTimeAstronomy = function(id, graph) {
  this.constructor(id, "CurrentTime (Astronomy)", graph);
  
  this.meta = {
    authors: ['Zauner'],
    original_authors: ['VVVV Group'],
    credits: ['http://javascript.about.com/library/bldst.htm'],
    compatibility_issues: ['Time Zone index differs from classic VVVV']
  };
  
  this.auto_evaluate = true;
  
  function stdTimeZoneOffset(now) {
    var jan = new Date(now.getFullYear(), 0, 1);
    var jul = new Date(now.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  }
  var now = new Date();
  
  // output pins
  var gmtOut = this.addOutputPin('GMT', [], this);
  var timezoneOut = this.addOutputPin('Time Zone', [0], this);
  var timezonenameOut = this.addOutputPin('Time Zone Name', [''], this);
  var daylightsavingtimeOut = this.addOutputPin('Daylight Saving Time', [now.getTimezoneOffset()<stdTimeZoneOffset(now)?1:0], this);
  var currenttimeOut = this.addOutputPin('Current Time', [], this);
  
  var jsVVVVOffset = 25569;

  this.evaluate = function() {
      
      var localTime = new Date();
      var timeZoneOffset = localTime.getTimezoneOffset()*60*1000;
      var now_ms = localTime.getTime();
      
      gmtOut.setValue(0, now_ms/1000/60/60/24+jsVVVVOffset);
      timezoneOut.setValue(0, timeZoneOffset/1000/60/60);
      timezonenameOut.setValue(0, localTime.toString().match(/\((.+)\)$/)[1]);
      //daylightsavingtimeOut.setValue(0, 0);
      currenttimeOut.setValue(0, (now_ms-timeZoneOffset)/1000/60/60/24+jsVVVVOffset);
  }

}
VVVV.Nodes.CurrentTimeAstronomy.prototype = new VVVV.Core.Node();