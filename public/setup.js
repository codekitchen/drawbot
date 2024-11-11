import Apriltag from './apriltag.js'

let apriltag = await Apriltag()

const api = {
  create_buffer: apriltag.cwrap("create_buffer", "number", ["number", "number"]),
  destroy_buffer: apriltag.cwrap("destroy_buffer", "", ["number"]),
  detect_wasm: apriltag.cwrap("detect_wasm", "string", ["number", "number", "number", "number", "number", "number"]),
};

const img = new Image();
img.src = "./IMG_1889.jpeg";
img.onload = () => setupUsingImg(img);

async function setupUsingImg(img) {
  try {
    const tagsize = 0.025; // 1 inch
    let exif = await readEXIF(img);
    const { fx, fy } = focalLength(exif);

    const cimage = getImageData(img);
    const wasm_p = api.create_buffer(cimage.width, cimage.height);
    apriltag.HEAPU8.set(cimage.data, wasm_p);

    const found = api.detect_wasm(wasm_p, cimage.width, cimage.height, tagsize, fx, fy);
    const result = JSON.parse(found);
    console.log("ran apriltag", result);
    let t11 = result.tags.find(t => t.id === 11);
    let t12 = result.tags.find(t => t.id === 12);
    if (!t11 || !t12) {
      throw new Error(`couldn't find tags 11 and 12. Tags found: ${result.tags.map(t => t.id)}`);
    }
    let dist = distance(t11, t12);
    console.log("dist", dist);

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
  }
}

function readEXIF(img) {
  return new Promise(resolve => {
    EXIF.getData(img, function () {
      resolve(this);
    })
  })
}

function focalLength(exif) {
  const flen = +EXIF.getTag(exif, "FocalLength")
  const fequiv = EXIF.getTag(exif, "FocalLengthIn35mmFilm")
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
