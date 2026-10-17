/**
 * Image Processing Service for Player Photos
 * Removes background and applies a clean white studio background by default.
 * Uses client-side Canvas pixel segmentation with perimeter flood-fill,
 * edge gradient protection, and alpha feathering for instant, zero-latency execution.
 */

export interface ProcessImageOptions {
  tolerance?: number; // 10 - 80 (default 32)
  feather?: number; // Feather radius in pixels (default 2)
  maxDimension?: number; // Default 400
}

/**
 * Calculates Euclidean color distance between two RGB pixels
 */
function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  // Weighted color distance (human eye perception: red=0.3, green=0.59, blue=0.11)
  return Math.sqrt(0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db);
}

/**
 * Loads an image from DataURL or URL safely
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('No se pudo cargar la imagen para procesar.'));
    img.src = src;
  });
}

/**
 * Removes the background of a player photo and replaces it with pure white.
 * Returns a compressed base64 JPEG Data URL.
 */
export async function removeBackgroundToWhite(
  imageSrc: string | HTMLImageElement,
  options: ProcessImageOptions = {}
): Promise<string> {
  const { tolerance = 36, feather = 2, maxDimension = 400 } = options;

  const img = typeof imageSrc === 'string' ? await loadImage(imageSrc) : imageSrc;

  // 1. Calculate scaled dimensions
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width > height) {
    if (width > maxDimension) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    }
  } else {
    if (height > maxDimension) {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  // 2. Setup canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Draw scaled original image
  ctx.drawImage(img, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data; // Uint8ClampedArray: R, G, B, A
  const totalPixels = width * height;

  // 3. Compute edge gradient magnitude using Sobel filter
  const grayscale = new Float32Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    grayscale[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  const edges = new Float32Array(totalPixels);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      // Sobel horizontal
      const gx =
        -grayscale[idx - width - 1] +
        grayscale[idx - width + 1] -
        2 * grayscale[idx - 1] +
        2 * grayscale[idx + 1] -
        grayscale[idx + width - 1] +
        grayscale[idx + width + 1];
      // Sobel vertical
      const gy =
        -grayscale[idx - width - 1] -
        2 * grayscale[idx - width] -
        grayscale[idx - width + 1] +
        grayscale[idx + width - 1] +
        2 * grayscale[idx + width] +
        grayscale[idx + width + 1];
      edges[idx] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  // 4. Sample background seed colors from outer perimeter border
  const bgSeeds: Array<{ r: number; g: number; b: number }> = [];
  const sampleBorderPixel = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    // Avoid duplicate seeds if very close in color
    const isClose = bgSeeds.some(
      (s) => colorDistance(s.r, s.g, s.b, r, g, b) < 18
    );
    if (!isClose && bgSeeds.length < 24) {
      bgSeeds.push({ r, g, b });
    }
  };

  // Sample top, bottom, left, right edges
  for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 30))) {
    sampleBorderPixel(x, 0);
    sampleBorderPixel(x, 1);
    sampleBorderPixel(x, height - 1);
  }
  for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 30))) {
    sampleBorderPixel(0, y);
    sampleBorderPixel(1, y);
    sampleBorderPixel(width - 1, y);
    sampleBorderPixel(width - 2, y);
  }

  // 5. Multi-seed region growing / Flood fill from image borders
  // mask: 0 = unvisited/foreground, 1 = background, 2 = edge/boundary
  const isBackground = new Uint8Array(totalPixels);
  const queue = new Int32Array(totalPixels);
  let queueHead = 0;
  let queueTail = 0;

  // Initialize perimeter pixels into queue
  const enqueue = (x: number, y: number) => {
    const pIdx = y * width + x;
    if (isBackground[pIdx] === 0) {
      isBackground[pIdx] = 1;
      queue[queueTail++] = pIdx;
    }
  };

  // Border seeds
  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  // Thresholds
  const edgeCutoff = 48; // Edge threshold where boundaries stop flood
  const centerSafeXMin = Math.floor(width * 0.28);
  const centerSafeXMax = Math.floor(width * 0.72);
  const centerSafeYMin = Math.floor(height * 0.18);
  const centerSafeYMax = Math.floor(height * 0.70);

  // Flood fill loop
  while (queueHead < queueTail) {
    const currIdx = queue[queueHead++];
    const cx = currIdx % width;
    const cy = Math.floor(currIdx / width);

    const cOffset = currIdx * 4;
    const cr = data[cOffset];
    const cg = data[cOffset + 1];
    const cb = data[cOffset + 2];

    // Check 4-connected neighbors
    const neighbors = [
      cx > 0 ? currIdx - 1 : -1,
      cx < width - 1 ? currIdx + 1 : -1,
      cy > 0 ? currIdx - width : -1,
      cy < height - 1 ? currIdx + width : -1,
    ];

    for (let i = 0; i < 4; i++) {
      const nIdx = neighbors[i];
      if (nIdx === -1 || isBackground[nIdx] !== 0) continue;

      const nx = nIdx % width;
      const ny = Math.floor(nIdx / width);

      // Protect central face area from flood if edges or skin tone present
      const inFaceZone =
        nx >= centerSafeXMin &&
        nx <= centerSafeXMax &&
        ny >= centerSafeYMin &&
        ny <= centerSafeYMax;

      const edgeMag = edges[nIdx];
      if (edgeMag > edgeCutoff) {
        // Stop at strong edge
        continue;
      }

      const nOffset = nIdx * 4;
      const nr = data[nOffset];
      const ng = data[nOffset + 1];
      const nb = data[nOffset + 2];

      // Difference to current pixel
      const diffToCurr = colorDistance(cr, cg, cb, nr, ng, nb);

      // Check distance against perimeter background seeds
      let minSeedDist = 999;
      for (let s = 0; s < bgSeeds.length; s++) {
        const d = colorDistance(bgSeeds[s].r, bgSeeds[s].g, bgSeeds[s].b, nr, ng, nb);
        if (d < minSeedDist) minSeedDist = d;
      }

      const effectiveTolerance = inFaceZone ? tolerance * 0.7 : tolerance;

      if (diffToCurr < effectiveTolerance * 0.85 || minSeedDist < effectiveTolerance) {
        isBackground[nIdx] = 1;
        queue[queueTail++] = nIdx;
      }
    }
  }

  // 6. Feathering and apply pure white background (#ffffff)
  const outputData = ctx.createImageData(width, height);
  const out = outputData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const offset = idx * 4;

      if (isBackground[idx] === 1) {
        // Set pure white background
        out[offset] = 255;
        out[offset + 1] = 255;
        out[offset + 2] = 255;
        out[offset + 3] = 255;
      } else {
        // Check if on edge to feather smoothly
        let neighborBgCount = 0;
        const rCheck = feather;
        let totalChecked = 0;

        for (let dy = -rCheck; dy <= rCheck; dy++) {
          for (let dx = -rCheck; dx <= rCheck; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              totalChecked++;
              if (isBackground[ny * width + nx] === 1) {
                neighborBgCount++;
              }
            }
          }
        }

        if (neighborBgCount > 0) {
          // Soft alpha blend with white
          const blendAlpha = neighborBgCount / totalChecked;
          out[offset] = Math.round(data[offset] * (1 - blendAlpha) + 255 * blendAlpha);
          out[offset + 1] = Math.round(data[offset + 1] * (1 - blendAlpha) + 255 * blendAlpha);
          out[offset + 2] = Math.round(data[offset + 2] * (1 - blendAlpha) + 255 * blendAlpha);
          out[offset + 3] = 255;
        } else {
          // Foreground: keep original
          out[offset] = data[offset];
          out[offset + 1] = data[offset + 1];
          out[offset + 2] = data[offset + 2];
          out[offset + 3] = 255;
        }
      }
    }
  }

  ctx.putImageData(outputData, 0, 0);

  // 7. Return high-quality, lightweight base64 JPEG
  return canvas.toDataURL('image/jpeg', 0.88);
}
