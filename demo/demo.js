

$(document).ready(function() {
  initVVVV('../', 'full');

  $('#patchxml').bind('paste', function() {
    setTimeout(function() {
      var patch = new VVVV.Core.Patch($('#patchxml').val());
      var mainloop = new VVVV.Core.MainLoop(patch);
      var vvvviewer = new VVVV.VVVViewer(patch, '#patch2');
      $('#patchxml').remove();
    }, 100);
  });
  
  $('#visualizecode').click(function() {
    var patch1 = new VVVV.Core.Patch($('#patch1').text());
    var mainloop1 = new VVVV.Core.MainLoop(patch1);
    var vvvviewer = new VVVV.VVVViewer(patch1, '#patch1');
  });
  
  $('#loadpatchfile').click(function() {
    $.ajax({
      url: $('#patch3').attr('href'),
      type: 'get',
      dataType: 'text',
      success: function(r) {
        var patch3 = new VVVV.Core.Patch(r);
        var mainloop3 = new VVVV.Core.MainLoop(patch3);
        var vvvviewer = new VVVV.VVVViewer(patch3, '#patch3');
      }
    });
    return false;
  });
    
  
});

