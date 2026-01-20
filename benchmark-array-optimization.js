/**
 * Benchmark script to reproduce the array optimization performance improvements
 * This measures the performance difference between map().filter() vs reduce()
 * for the image overlay processing optimization in apps/ui-tars/src/main/utils/image.ts
 */

// Simulate the overlay data structure
function generateOverlayData(count) {
  const overlays = [];
  for (let i = 0; i < count; i++) {
    // About 80% of overlays have valid positions (similar to real usage)
    overlays.push({
      svg: '<svg>...</svg>',
      yPos: i % 5 === 0 ? null : 100 + i,
      xPos: i % 5 === 0 ? null : 200 + i,
      offsetY: 10,
      offsetX: 15,
    });
  }
  return overlays;
}

// Original implementation (map + filter)
function processOverlaysOld(overlays) {
  const imageOverlays = overlays
    .map((o) => {
      if (o.yPos && o.xPos) {
        return {
          input: Buffer.from(o.svg),
          top: o.yPos + o.offsetY,
          left: o.xPos + o.offsetX,
        };
      }
      return null;
    })
    .filter((overlay) => !!overlay);
  return imageOverlays;
}

// Optimized implementation (reduce)
function processOverlaysNew(overlays) {
  const imageOverlays = overlays.reduce((acc, o) => {
    if (o.yPos && o.xPos) {
      acc.push({
        input: Buffer.from(o.svg),
        top: o.yPos + o.offsetY,
        left: o.xPos + o.offsetX,
      });
    }
    return acc;
  }, []);
  return imageOverlays;
}

// Benchmark function
function benchmark(fn, overlays, iterations = 100) {
  const start = Date.now();
  for (let i = 0; i < iterations; i++) {
    fn(overlays);
  }
  const end = Date.now();
  return end - start;
}

// Run benchmarks
console.log('Array Optimization Benchmark');
console.log('============================\n');

const OVERLAY_COUNT = 10000;
const ITERATIONS = 100;

console.log(`Dataset: ${OVERLAY_COUNT} overlays (${Math.floor(OVERLAY_COUNT * 0.8)} valid, ${Math.floor(OVERLAY_COUNT * 0.2)} invalid)`);
console.log(`Iterations: ${ITERATIONS}\n`);

const overlays = generateOverlayData(OVERLAY_COUNT);

// Warm up
processOverlaysOld(overlays);
processOverlaysNew(overlays);

// Run benchmarks
const oldTime = benchmark(processOverlaysOld, overlays, ITERATIONS);
const newTime = benchmark(processOverlaysNew, overlays, ITERATIONS);

const improvement = ((oldTime - newTime) / oldTime * 100).toFixed(1);
const speedup = (oldTime / newTime).toFixed(2);

console.log('Results:');
console.log(`  Old (map + filter): ${oldTime}ms`);
console.log(`  New (reduce):       ${newTime}ms`);
console.log(`  Improvement:        ${improvement}% faster`);
console.log(`  Speedup:            ${speedup}x`);
console.log(`\nPer-iteration average:`);
console.log(`  Old: ${(oldTime / ITERATIONS).toFixed(2)}ms`);
console.log(`  New: ${(newTime / ITERATIONS).toFixed(2)}ms`);
