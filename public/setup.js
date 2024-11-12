import Apriltag from './apriltag.js'
import exifr from './3rd-party/exifr.js'

let apriltag = await Apriltag()
const stringOffsetX = 45, stringOffsetY = 76;
const penOffsetY = -60;

const api = {
  create_buffer: apriltag.cwrap("create_buffer", "number", ["number", "number"]),
  destroy_buffer: apriltag.cwrap("destroy_buffer", "", ["number"]),
  detect_wasm: apriltag.cwrap("detect_wasm", "string", ["number", "number", "number", "number", "number", "number"]),
};

// const img = new Image();
// img.src = "./IMG_1889.jpeg";
// img.onload = () => setupUsingImg(img);

document.querySelector('#setup-img').onchange = (ev) => {
  const file = ev.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => setupUsingImg(img);
  img.src = URL.createObjectURL(file);
}

async function setupUsingImg(img) {
  try {
    const tagsize = 0.025; // 1 inch
    let exif = await exifr.parse(img);
    // document.querySelector('#exif-data').innerText = JSON.stringify(exif, null, 2);

    const { fx, fy } = focalLength(img, exif);

    const cimage = getImageData(img);
    const wasm_p = api.create_buffer(cimage.width, cimage.height);
    apriltag.HEAPU8.set(cimage.data, wasm_p);

    const found = api.detect_wasm(wasm_p, cimage.width, cimage.height, tagsize, fx, fy);
    const result = JSON.parse(found);
    console.log("ran apriltag", result);
    let t11 = result.tags.find(t => t.id === 11);
    let t12 = result.tags.find(t => t.id === 12);
    let t13 = result.tags.find(t => t.id === 13);
    if (!t11 || !t12) {
      throw new Error(`couldn't find tags 11 and 12. Tags found: ${result.tags.map(t => t.id)}`);
    }
    let dist = distance(t11, t12) * 1000;
    console.log("dist", dist);
    let penX = 0, penY = 0;
    if (t13) {
      penX = 1000 * Math.abs(t13.pose.t[0] - t11.pose.t[0]) - stringOffsetX;
      penY = 1000 * Math.abs(t13.pose.t[1] - t11.pose.t[1]);
    }
    document.querySelector('#dist-output').innerText =
      `distance between tags: ${dist.toFixed(2)}
       distance with offset: ${(dist - stringOffsetX * 2).toFixed(2)}
       pen offset x: ${penX.toFixed(2)} y: ${penY.toFixed(2)}`;

    api.destroy_buffer(wasm_p);

    const display = document.createElement("canvas");
    document.body.appendChild(display);
    display.width = document.body.clientWidth;
    display.height = display.width * (img.height / img.width);
    const dctx = display.getContext("2d");
    dctx.scale(display.width / img.width, display.height / img.height);
    dctx.drawImage(img, 0, 0);
    dctx.fillStyle = "#EE000099";
    for (let tag of result.tags) {
      dctx.beginPath();
      dctx.moveTo(...tag.corners[0]);
      dctx.lineTo(...tag.corners[1]);
      dctx.lineTo(...tag.corners[2]);
      dctx.lineTo(...tag.corners[3]);
      dctx.closePath();
      dctx.fill();
    }
  } catch (e) {
    document.querySelector('#errors').innerText = e.message;
    throw e;
  }
}

function focalLength(img, exif) {
  const flen = exif.FocalLength
  const fequiv = exif.FocalLengthIn35mmFormat
  if (!flen || !fequiv) {
    throw new Error("couldn't find focal length information in image EXIF data.");
  }
  const width = img.width;
  const height = img.height;
  const diag = Math.sqrt(width * width + height * height);
  const crop_factor = fequiv / flen;
  // 35mm diagonal is 43.2667mm
  const diag_mm = 43.2667 / crop_factor;
  const sensorw = diag_mm * (width / diag);
  const sensorh = diag_mm * (height / diag);
  const fx = width * flen / sensorw;
  const fy = height * flen / sensorh;
  return { fx, fy }
}

function getImageData(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, img.width, img.height);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function distance(tag1, tag2) {
  const p1 = tag1.pose.t;
  const p2 = tag2.pose.t;
  return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2) + Math.pow(p1[2] - p2[2], 2));
}
