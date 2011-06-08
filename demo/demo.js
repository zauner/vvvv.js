

$(document).ready(function() {
  initVVVV('../', 'full');

  $('#patchxml').bind('paste', function() {
    setTimeout(function() {
      var graph = new VVVV.Core.Graph($('#patchxml').val());
      VVVV.Core.MainLoop.run(graph);
      var vvvviewer = new VVVV.VVVViewer(graph, '#patch2');
      $('#patchxml').remove();
    }, 100);
  });
  
  $('#visualizecode').click(function() {
    var graph1 = new VVVV.Core.Graph($('#patch1').text());
    VVVV.Core.MainLoop.run(graph1);
    var vvvviewer = new VVVV.VVVViewer(graph1, '#patch1');
  });
  
  $('#loadpatchfile').click(function() {
    $.ajax({
      url: $('#patch3').attr('href'),
      type: 'get',
      dataType: 'text',
      success: function(r) {
        var graph3 = new VVVV.Core.Graph(r);
        VVVV.Core.MainLoop.run(graph3);
        var vvvviewer = new VVVV.VVVViewer(graph3, '#patch3');
      }
    });
    return false;
  });
    
  
});

