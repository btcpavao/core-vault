import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
  type ColorSpace,
} from "three";

const TEXTURE_SIZE = 128;
const CHANNELS = 4;

type Repeat = readonly [number, number];

interface SurfaceTextureSet {
  baseColor: DataTexture;
  roughness: DataTexture;
  normal: DataTexture;
}

interface BronzeTextureSet extends SurfaceTextureSet {
  metalness: DataTexture;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const toByte = (value: number) => Math.round(clamp01(value) * 255);
const smooth = (value: number) => value * value * (3 - 2 * value);

function hash2(x: number, y: number, seed: number) {
  let value = Math.imul(x + Math.imul(seed, 374_761_393), 668_265_263);
  value ^= Math.imul(y + seed, 2_246_822_519);
  value = Math.imul(value ^ (value >>> 13), 1_274_126_177);
  return ((value ^ (value >>> 16)) >>> 0) / 4_294_967_295;
}

function periodicNoise(u: number, v: number, cells: number, seed: number) {
  const scaledX = u * cells;
  const scaledY = v * cells;
  const cellX = Math.floor(scaledX);
  const cellY = Math.floor(scaledY);
  const nextX = (cellX + 1) % cells;
  const nextY = (cellY + 1) % cells;
  const wrappedX = ((cellX % cells) + cells) % cells;
  const wrappedY = ((cellY % cells) + cells) % cells;
  const blendX = smooth(scaledX - cellX);
  const blendY = smooth(scaledY - cellY);
  const top = hash2(wrappedX, wrappedY, seed) * (1 - blendX) + hash2(nextX, wrappedY, seed) * blendX;
  const bottom = hash2(wrappedX, nextY, seed) * (1 - blendX) + hash2(nextX, nextY, seed) * blendX;
  return top * (1 - blendY) + bottom * blendY;
}

function layeredNoise(u: number, v: number, seed: number) {
  return (
    periodicNoise(u, v, 2, seed) * 0.5 +
    periodicNoise(u, v, 5, seed + 11) * 0.27 +
    periodicNoise(u, v, 11, seed + 29) * 0.15 +
    periodicNoise(u, v, 23, seed + 47) * 0.08
  );
}

function writePixel(data: Uint8Array, index: number, red: number, green = red, blue = red) {
  const offset = index * CHANNELS;
  data[offset] = toByte(red);
  data[offset + 1] = toByte(green);
  data[offset + 2] = toByte(blue);
  data[offset + 3] = 255;
}

function createTexture(
  name: string,
  data: Uint8Array,
  colorSpace: ColorSpace,
  repeat: Repeat,
) {
  const texture = new DataTexture(
    data,
    TEXTURE_SIZE,
    TEXTURE_SIZE,
    RGBAFormat,
    UnsignedByteType,
  );
  texture.name = name;
  texture.colorSpace = colorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function normalDataFromHeight(height: Float32Array, strength: number) {
  const data = new Uint8Array(TEXTURE_SIZE * TEXTURE_SIZE * CHANNELS);
  const sample = (x: number, y: number) =>
    height[
      ((y + TEXTURE_SIZE) % TEXTURE_SIZE) * TEXTURE_SIZE +
        ((x + TEXTURE_SIZE) % TEXTURE_SIZE)
    ];

  for (let y = 0; y < TEXTURE_SIZE; y += 1) {
    for (let x = 0; x < TEXTURE_SIZE; x += 1) {
      const normalX = (sample(x - 1, y) - sample(x + 1, y)) * strength;
      const normalY = (sample(x, y - 1) - sample(x, y + 1)) * strength;
      const length = Math.hypot(normalX, normalY, 1);
      writePixel(
        data,
        y * TEXTURE_SIZE + x,
        normalX / length / 2 + 0.5,
        normalY / length / 2 + 0.5,
        1 / length / 2 + 0.5,
      );
    }
  }

  return data;
}

function floorJoint(u: number, v: number) {
  const tileX = (u * 2) % 1;
  const tileY = (v * 2) % 1;
  const edgeDistance = Math.min(tileX, 1 - tileX, tileY, 1 - tileY);
  return smooth(clamp01(1 - edgeDistance / 0.026));
}

function createLimestoneTextures(name: "limestone" | "floor", repeat: Repeat): SurfaceTextureSet {
  const baseColor = new Uint8Array(TEXTURE_SIZE * TEXTURE_SIZE * CHANNELS);
  const roughness = new Uint8Array(TEXTURE_SIZE * TEXTURE_SIZE * CHANNELS);
  const height = new Float32Array(TEXTURE_SIZE * TEXTURE_SIZE);
  const isFloor = name === "floor";
  const seed = isFloor ? 61 : 17;

  for (let y = 0; y < TEXTURE_SIZE; y += 1) {
    for (let x = 0; x < TEXTURE_SIZE; x += 1) {
      const index = y * TEXTURE_SIZE + x;
      const u = x / TEXTURE_SIZE;
      const v = y / TEXTURE_SIZE;
      const cloud = layeredNoise(u, v, seed);
      const fine = periodicNoise(u, v, 41, seed + 73);
      const joint = isFloor ? floorJoint(u, v) : 0;
      const pore = hash2(x, y, seed + 101) > 0.988 ? 1 : 0;
      const neutral = 0.95 + (cloud - 0.5) * 0.095 - joint * 0.035 - pore * 0.025;

      height[index] = cloud * 0.55 + fine * 0.055 - joint * 0.045 - pore * 0.012;
      writePixel(baseColor, index, neutral * 1.018, neutral, neutral * 0.955);
      writePixel(roughness, index, 0.8 + cloud * 0.1 + fine * 0.025 + joint * 0.035);
    }
  }

  return {
    baseColor: createTexture(`CV_${name}_base_color`, baseColor, SRGBColorSpace, repeat),
    roughness: createTexture(`CV_${name}_roughness`, roughness, NoColorSpace, repeat),
    normal: createTexture(
      `CV_${name}_normal`,
      normalDataFromHeight(height, isFloor ? 3.8 : 3.2),
      NoColorSpace,
      repeat,
    ),
  };
}

function createBronzeTextures(): BronzeTextureSet {
  const baseColor = new Uint8Array(TEXTURE_SIZE * TEXTURE_SIZE * CHANNELS);
  const roughness = new Uint8Array(TEXTURE_SIZE * TEXTURE_SIZE * CHANNELS);
  const metalness = new Uint8Array(TEXTURE_SIZE * TEXTURE_SIZE * CHANNELS);
  const height = new Float32Array(TEXTURE_SIZE * TEXTURE_SIZE);
  const repeat: Repeat = [2.5, 3.5];

  for (let y = 0; y < TEXTURE_SIZE; y += 1) {
    for (let x = 0; x < TEXTURE_SIZE; x += 1) {
      const index = y * TEXTURE_SIZE + x;
      const u = x / TEXTURE_SIZE;
      const v = y / TEXTURE_SIZE;
      const cloud = layeredNoise(u, v, 113);
      const grain = periodicNoise(u, v, 47, 151);
      const brush = Math.sin(v * Math.PI * 2 * 48 + grain * 0.8) * 0.5 + 0.5;
      const patina = smooth(clamp01((cloud - 0.67) / 0.22));
      const neutral = 0.94 + (cloud - 0.5) * 0.1 - patina * 0.035;

      height[index] = cloud * 0.17 + grain * 0.05 + brush * 0.045;
      writePixel(
        baseColor,
        index,
        neutral * (1 - patina * 0.045),
        neutral * (1 + patina * 0.018),
        neutral * (1 + patina * 0.034),
      );
      writePixel(roughness, index, 0.48 + cloud * 0.2 + brush * 0.055 + patina * 0.11);
      writePixel(metalness, index, 0.97 - patina * 0.17);
    }
  }

  return {
    baseColor: createTexture("CV_bronze_base_color", baseColor, SRGBColorSpace, repeat),
    roughness: createTexture("CV_bronze_roughness", roughness, NoColorSpace, repeat),
    normal: createTexture(
      "CV_bronze_normal",
      normalDataFromHeight(height, 10),
      NoColorSpace,
      repeat,
    ),
    metalness: createTexture("CV_bronze_metalness", metalness, NoColorSpace, repeat),
  };
}

function createGlassRoughnessTexture() {
  const data = new Uint8Array(TEXTURE_SIZE * TEXTURE_SIZE * CHANNELS);

  for (let y = 0; y < TEXTURE_SIZE; y += 1) {
    for (let x = 0; x < TEXTURE_SIZE; x += 1) {
      const u = x / TEXTURE_SIZE;
      const v = y / TEXTURE_SIZE;
      const cloud = layeredNoise(u, v, 211);
      const vertical = periodicNoise(u, v, 29, 227);
      writePixel(data, y * TEXTURE_SIZE + x, 0.34 + cloud * 0.2 + vertical * 0.045);
    }
  }

  return createTexture("CV_technical_glass_roughness", data, NoColorSpace, [2, 4]);
}

export const WORLD_TEXTURES = {
  limestone: createLimestoneTextures("limestone", [2.2, 2.2]),
  floor: createLimestoneTextures("floor", [3.5, 3.5]),
  bronze: createBronzeTextures(),
  glassRoughness: createGlassRoughnessTexture(),
} as const;

export const PROCEDURAL_TEXTURE_METADATA = {
  origin: "Core Vault original",
  license: "Core Vault original",
  resolution: TEXTURE_SIZE,
  textureCount: 11,
  uncompressedBytes: TEXTURE_SIZE * TEXTURE_SIZE * CHANNELS * 11,
  mapTypes: ["base color", "roughness", "normal", "metalness"],
} as const;
