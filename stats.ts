/**
 * Statistics module following Numerical Recipes implementations.
 */

const ITMAX = 100;
const EPS = 3.0e-7;
const FPMIN = 1.0e-30;

/**
 * Log-Gamma via Stirling-Approximation (Numerical Recipes)
 */
export function gammln(xx: number): number {
  let x, y, tmp, ser;
  const cof = [
    76.18009172947146,
    -86.50532032941677,
    24.01409824083091,
    -1.231739572450155,
    0.1208650973866179e-2,
    -0.5395239384953e-5,
  ];
  y = x = xx;
  tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  ser = 1.000000000190015;
  for (let j = 0; j <= 5; j++) {
    ser += cof[j] / ++y;
  }
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

/**
 * Series development for P(a,x)
 */
function gser(a: number, x: number): { val: number; ln: number } {
  const gln = gammln(a);
  if (x <= 0) return { val: 0, ln: gln };
  let ap = a;
  let delta = 1 / a;
  let sum = delta;
  for (let n = 1; n <= ITMAX; n++) {
    ++ap;
    delta *= x / ap;
    sum += delta;
    if (Math.abs(delta) < Math.abs(sum) * EPS) break;
  }
  return { val: sum * Math.exp(-x + a * Math.log(x) - gln), ln: gln };
}

/**
 * Continued fraction for Q(a,x)
 */
function gcf(a: number, x: number): { val: number; ln: number } {
  const gln = gammln(a);
  let b = x + 1.0 - a;
  let c = 1.0 / FPMIN;
  let d = 1.0 / b;
  let h = d;
  for (let i = 1; i <= ITMAX; i++) {
    const an = -i * (i - a);
    b += 2.0;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1.0 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1.0) < EPS) break;
  }
  return { val: Math.exp(-x + a * Math.log(x) - gln) * h, ln: gln };
}

/**
 * Incomplete Gamma Q(a,x) = 1 - P(a,x)
 */
export function gammq(a: number, x: number): number {
  if (x < 0 || a <= 0) return 1.0;
  if (x < a + 1.0) {
    return 1.0 - gser(a, x).val;
  } else {
    return gcf(a, x).val;
  }
}

/**
 * Yates-corrected Chi-squared for 2x2 contingency table
 */
export function chi2Corrected(a: number, b: number, c: number, d: number): { chi2: number; p: number; direction: number } {
  const n = a + b + c + d;
  if (n === 0) return { chi2: 0, p: 1, direction: 0 };

  const numerator = Math.pow(Math.max(0, Math.abs(a * d - b * c) - n / 2.0), 2) * n;
  const denominator = (a + b) * (c + d) * (b + d) * (a + c);

  if (denominator === 0) return { chi2: 0, p: 1, direction: 0 };

  const chi2 = numerator / denominator;
  // p = Q(df/2, chi2/2) where df=1
  const p = gammq(0.5, 0.5 * chi2);

  // Direction: more right omissions (b and d relative to a and c)
  // Standard A B
  //          C D
  // Row 1: Left Hits (a), Right Hits (b)
  // Row 2: Left Misses (c), Right Misses (d)
  const direction = d - c;

  return { chi2, p, direction };
}

/**
 * Simple Binomial Test P(X >= hits | n, p=0.5)
 */
export function binomialTest(hits: number, n: number): number {
  if (n === 0) return 1;
  const p = 0.5;
  let prob = 0;
  for (let k = hits; k <= n; k++) {
    prob += combination(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
  }
  return prob;
}

function combination(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  if (k > n / 2) k = n - k;
  let res = 1;
  for (let i = 1; i <= k; i++) {
    res = (res * (n - i + 1)) / i;
  }
  return res;
}
