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

const CHANNELS = 4;
const ARCHITECTURE_SIZE = 512;
const HERO_SIZE = 1024;

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
  const top =
    hash2(wrappedX, wrappedY, seed) * (1 - blendX) +
    hash2(nextX, wrappedY, seed) * blendX;
  const bottom =
    hash2(wrappedX, nextY, seed) * (1 - blendX) +
    hash2(nextX, nextY, seed) * blendX;
  return top * (1 - blendY) + bottom * blendY;
}

function layeredNoise(u: number, v: number, seed: number) {
  return (
    periodicNoise(u, v, 3, seed) * 0.52 +
    periodicNoise(u, v, 8, seed + 11) * 0.28 +
    periodicNoise(u, v, 21, seed + 29) * 0.14 +
    periodicNoise(u, v, 55, seed + 47) * 0.06
  );
}

function writePixel(
  data: Uint8Array,
  index: number,
  red: number,
  green = red,
  blue = red,
) {
  const offset = index * CHANNELS;
  data[offset] = toByte(red);
  data[offset + 1] = toByte(green);
  data[offset + 2] = toByte(blue);
  data[offset + 3] = 255;
}

function createTexture(
  name: string,
  data: Uint8Array,
  size: number,
  colorSpace: ColorSpace,
  repeat: Repeat,
) {
  const texture = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType);
  texture.name = name;
  texture.colorSpace = colorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function normalDataFromHeight(height: Float32Array, size: number, strength: number) {
  const data = new Uint8Array(size * size * CHANNELS);
  const sample = (x: number, y: number) =>
    height[((y + size) % size) * size + ((x + size) % size)];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const normalX = (sample(x - 1, y) - sample(x + 1, y)) * strength;
      const normalY = (sample(x, y - 1) - sample(x, y + 1)) * strength;
      const length = Math.hypot(normalX, normalY, 1);
      writePixel(
        data,
        y * size + x,
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
  return smooth(clamp01(1 - edgeDistance / 0.018));
}

function createLimestoneTextures(
  name: "limestone_architecture" | "limestone_hero" | "floor_hero",
  size: number,
  repeat: Repeat,
): SurfaceTextureSet {
  const baseColor = new Uint8Array(size * size * CHANNELS);
  const roughness = new Uint8Array(size * size * CHANNELS);
  const height = new Float32Array(size * size);
  const isFloor = name === "floor_hero";
  const isHero = name !== "limestone_architecture";
  const seed = isFloor ? 61 : isHero ? 37 : 17;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = y * size + x;
      const u = x / size;
      const v = y / size;
      const cloud = layeredNoise(u, v, seed);
      const mineral = periodicNoise(u, v, 34, seed + 73);
      const grain = periodicNoise(u, v, 92, seed + 127);
      const joint = isFloor ? floorJoint(u, v) : 0;
      const poreChance = hash2(x, y, seed + 181);
      const pore = poreChance > (isHero ? 0.994 : 0.997) ? 1 : 0;
      const warmMineral = smooth(clamp01((mineral - 0.58) / 0.28));
      const neutral =
        0.94 +
        (cloud - 0.5) * 0.12 +
        (grain - 0.5) * 0.022 -
        joint * 0.07 -
        pore * 0.08;

      height[index] =
        cloud * 0.58 + grain * 0.04 - joint * 0.08 - pore * 0.032;
      writePixel(
        baseColor,
        index,
        neutral * (1.035 + warmMineral * 0.018),
        neutral * (1.004 + warmMineral * 0.006),
        neutral * (0.946 - warmMineral * 0.014),
      );
      writePixel(
        roughness,
        index,
        0.72 + cloud * 0.13 + grain * 0.04 + joint * 0.08 + pore * 0.06,
      );
    }
  }

  return {
    baseColor: createTexture(`CV_${name}_base_color`, baseColor, size, SRGBColorSpace, repeat),
    roughness: createTexture(`CV_${name}_roughness`, roughness, size, NoColorSpace, repeat),
    normal: createTexture(
      `CV_${name}_normal`,
      normalDataFromHeight(height, size, isFloor ? 5.4 : isHero ? 4.8 : 3.5),
      size,
      NoColorSpace,
      repeat,
    ),
  };
}

function createBronzeTextures(): BronzeTextureSet {
  const size = HERO_SIZE;
  const baseColor = new Uint8Array(size * size * CHANNELS);
  const roughness = new Uint8Array(size * size * CHANNELS);
  const metalness = new Uint8Array(size * size * CHANNELS);
  const height = new Float32Array(size * size);
  const repeat: Repeat = [3, 5];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = y * size + x;
      const u = x / size;
      const v = y / size;
      const cloud = layeredNoise(u, v, 113);
      const grain = periodicNoise(u, v, 67, 151);
      const brush = Math.sin(v * Math.PI * 2 * 96 + grain * 0.95) * 0.5 + 0.5;
      const patina = smooth(clamp01((cloud - 0.72) / 0.2));
      const neutral = 0.93 + (cloud - 0.5) * 0.13 - patina * 0.055;

      height[index] = cloud * 0.14 + grain * 0.04 + brush * 0.052;
      writePixel(
        baseColor,
        index,
        neutral * (1.035 - patina * 0.035),
        neutral * (0.995 + patina * 0.008),
        neutral * (0.945 + patina * 0.025),
      );
      writePixel(roughness, index, 0.32 + cloud * 0.21 + brush * 0.09 + patina * 0.14);
      writePixel(metalness, index, 0.99 - patina * 0.12);
    }
  }

  return {
    baseColor: createTexture("CV_bronze_hero_base_color", baseColor, size, SRGBColorSpace, repeat),
    roughness: createTexture("CV_bronze_hero_roughness", roughness, size, NoColorSpace, repeat),
    normal: createTexture(
      "CV_bronze_hero_normal",
      normalDataFromHeight(height, size, 12),
      size,
      NoColorSpace,
      repeat,
    ),
    metalness: createTexture("CV_bronze_hero_metalness", metalness, size, NoColorSpace, repeat),
  };
}

function createGlassRoughnessTexture() {
  const size = HERO_SIZE;
  const data = new Uint8Array(size * size * CHANNELS);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const v = y / size;
      const cloud = layeredNoise(u, v, 211);
      const vertical = periodicNoise(u, v, 57, 227);
      writePixel(data, y * size + x, 0.16 + cloud * 0.14 + vertical * 0.035);
    }
  }

  return createTexture(
    "CV_technical_glass_hero_roughness",
    data,
    size,
    NoColorSpace,
    [3, 6],
  );
}

export const WORLD_TEXTURES = {
  limestone: createLimestoneTextures(
    "limestone_architecture",
    ARCHITECTURE_SIZE,
    [3.5, 3.5],
  ),
  limestoneHero: createLimestoneTextures("limestone_hero", HERO_SIZE, [2.4, 2.4]),
  floor: createLimestoneTextures("floor_hero", HERO_SIZE, [6, 6]),
  bronze: createBronzeTextures(),
  glassRoughness: createGlassRoughnessTexture(),
} as const;

const UNCOMPRESSED_BYTES =
  ARCHITECTURE_SIZE * ARCHITECTURE_SIZE * CHANNELS * 3 +
  HERO_SIZE * HERO_SIZE * CHANNELS * 11;

export const PROCEDURAL_TEXTURE_METADATA = {
  origin: "Core Vault original",
  license: "Core Vault original",
  architectureResolution: ARCHITECTURE_SIZE,
  heroResolution: HERO_SIZE,
  textureCount: 14,
  uncompressedBytes: UNCOMPRESSED_BYTES,
  estimatedBytesWithMipmaps: Math.ceil(UNCOMPRESSED_BYTES * (4 / 3)),
  mapTypes: ["base color", "roughness", "normal", "metalness"],
} as const;
