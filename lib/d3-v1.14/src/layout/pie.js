d3.layout.pie = function() {
  var value = Number,
      sort = null,
      startAngle = 0,
      endAngle = 2 * Math.PI;

  function pie(data, i) {

    // Compute the start angle.
    var a = +(typeof startAngle == "function"
        ? startAngle.apply(this, arguments)
        : startAngle);

    // Compute the angular range (end - start).
    var k = (typeof endAngle == "function"
        ? endAngle.apply(this, arguments)
        : endAngle) - startAngle;

    // Optionally sort the data.
    var index = d3.range(data.length);
    if (sort != null) index.sort(function(i, j) {
      return sort(data[i], data[j]);
    });

    // Compute the numeric values for each data element.
    var values = data.map(value);

    // Convert k into a scale factor from value to angle, using the sum.
    k /= values.reduce(function(p, d) { return p + d; }, 0);

    // Compute the arcs!
    var arcs = index.map(function(i) {
      return {
        value: d = values[i],
        startAngle: a,
        endAngle: a += d * k
      };
    });

    // Return the arcs in the original data's order.
    return data.map(function(d, i) {
      return arcs[index[i]];
    });
  }

  /**
   * Specifies the value function *x*, which returns a nonnegative numeric value
   * for each datum. The default value function is `Number`. The value function
   * is passed two arguments: the current datum and the current index.
   */
  pie.value = function(x) {
    if (!arguments.length) return value;
    value = x;
    return pie;
  };

  /**
   * Specifies a sort comparison operator *x*. The comparator is passed two data
   * elements from the data array, a and b; it returns a negative value if a is
   * less than b, a positive value if a is greater than b, and zero if a equals
   * b.
   */
  pie.sort = function(x) {
    if (!arguments.length) return sort;
    sort = x;
    return pie;
  };

  /**
   * Specifies the overall start angle of the pie chart. Defaults to 0. The
   * start angle can be specified either as a constant or as a function; in the
   * case of a function, it is evaluated once per array (as opposed to per
   * element).
   */
  pie.startAngle = function(x) {
    if (!arguments.length) return startAngle;
    startAngle = x;
    return pie;
  };

  /**
   * Specifies the overall end angle of the pie chart. Defaults to 2π. The
   * end angle can be specified either as a constant or as a function; in the
   * case of a function, it is evaluated once per array (as opposed to per
   * element).
   */
  pie.endAngle = function(x) {
    if (!arguments.length) return endAngle;
    endAngle = x;
    return pie;
  };

  return pie;
};
