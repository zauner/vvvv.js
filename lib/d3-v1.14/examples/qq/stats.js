function sum(array) {
  var s = 0, i = -1, n = array.length;
  while (++i < n) s += array[i];
  return s;
}

function mean(array) {
  return sum(array) / array.length;
}

function variance(array) {
  if (array.length < 1) return NaN;
  if (array.length === 1) return 0;
  var m = mean(array), sum = 0;
  for (var i = 0; i < array.length; i++) {
    var d = array[i] - m;
    sum += d * d;
  }
  return sum;
}

function deviation(array) {
  return Math.sqrt(variance(array) / (array.length - 1));
}

// Sample from a normal distribution with mean 0, stddev 1.
function normal() {
  var x = 0, y = 0, rds, c;
  do {
    x = Math.random() * 2 - 1;
    y = Math.random() * 2 - 1;
    rds = x * x + y * y;
  } while (rds == 0 || rds > 1);
  c = Math.sqrt(-2 * Math.log(rds) / rds); // Box-Muller transform
  return x * c; // throw away extra sample y * c
}

// Simple 1D Gaussian (normal) distribution
function normal1(mean, deviation) {
  return function() {
    return mean + deviation * normal();
  };
}

// Gaussian Mixture Model (k=3) fit using E-M algorithm
function normal3(dd) {
  return function() {
    var r = Math.random(),
        i = r < dd[0][2] ? 0 : r < dd[0][2] + dd[1][2] ? 1 : 2,
        d = dd[i];
    return d[0] + Math.sqrt(d[1]) * normal();
  }
}
