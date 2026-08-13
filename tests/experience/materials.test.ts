import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NoColorSpace, RepeatWrapping, SRGBColorSpace, type DataTexture } from "three";
import { describe, expect, it } from "vitest";
import {
  PROCEDURAL_TEXTURE_METADATA,
  WORLD_TEXTURES,
} from "../../src/experience/materials/proceduralTextures";

const allTextures = [
  WORLD_TEXTURES.limestone.baseColor,
  WORLD_TEXTURES.limestone.roughness,
  WORLD_TEXTURES.limestone.normal,
  WORLD_TEXTURES.limestoneHero.baseColor,
  WORLD_TEXTURES.limestoneHero.roughness,
  WORLD_TEXTURES.limestoneHero.normal,
  WORLD_TEXTURES.floor.baseColor,
  WORLD_TEXTURES.floor.roughness,
  WORLD_TEXTURES.floor.normal,
  WORLD_TEXTURES.bronze.baseColor,
  WORLD_TEXTURES.bronze.roughness,
  WORLD_TEXTURES.bronze.normal,
  WORLD_TEXTURES.bronze.metalness,
  WORLD_TEXTURES.glassRoughness,
];

const redChannelVariation = (texture: DataTexture) => {
  const data = texture.image.data as Uint8Array;
  const values = new Set<number>();
  for (let offset = 0; offset < data.length; offset += 4 * 37) values.add(data[offset]);
  return values.size;
};

describe("Engine Room procedural PBR textures", () => {
  it("stays inside the documented shared texture budget", () => {
    expect(PROCEDURAL_TEXTURE_METADATA.origin).toBe("Core Vault original");
    expect(PROCEDURAL_TEXTURE_METADATA.license).toBe("Core Vault original");
    expect(PROCEDURAL_TEXTURE_METADATA.textureCount).toBe(allTextures.length);
    expect(PROCEDURAL_TEXTURE_METADATA.architectureResolution).toBe(512);
    expect(PROCEDURAL_TEXTURE_METADATA.heroResolution).toBe(1024);
    expect(PROCEDURAL_TEXTURE_METADATA.estimatedBytesWithMipmaps).toBeLessThan(
      70 * 1024 * 1024,
    );

    for (const texture of allTextures) {
      expect(texture.isDataTexture).toBe(true);
      expect([512, 1024]).toContain(texture.image.width);
      expect(texture.image.height).toBe(texture.image.width);
      expect(texture.wrapS).toBe(RepeatWrapping);
      expect(texture.wrapT).toBe(RepeatWrapping);
      expect(texture.generateMipmaps).toBe(true);
    }
  });

  it("uses colour space only for base-colour maps", () => {
    expect(WORLD_TEXTURES.limestone.baseColor.colorSpace).toBe(SRGBColorSpace);
    expect(WORLD_TEXTURES.limestoneHero.baseColor.colorSpace).toBe(SRGBColorSpace);
    expect(WORLD_TEXTURES.floor.baseColor.colorSpace).toBe(SRGBColorSpace);
    expect(WORLD_TEXTURES.bronze.baseColor.colorSpace).toBe(SRGBColorSpace);

    for (const texture of allTextures.filter(
      (candidate) => !candidate.name.endsWith("base_color"),
    )) {
      expect(texture.colorSpace).toBe(NoColorSpace);
    }
  });

  it("generates real low-contrast variation instead of flat placeholder maps", () => {
    expect(redChannelVariation(WORLD_TEXTURES.limestone.baseColor)).toBeGreaterThan(12);
    expect(redChannelVariation(WORLD_TEXTURES.limestoneHero.normal)).toBeGreaterThan(12);
    expect(redChannelVariation(WORLD_TEXTURES.floor.roughness)).toBeGreaterThan(12);
    expect(redChannelVariation(WORLD_TEXTURES.bronze.roughness)).toBeGreaterThan(12);
    expect(redChannelVariation(WORLD_TEXTURES.glassRoughness)).toBeGreaterThan(8);
  });

  it("remains a passive self-authored presentation dependency", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/experience/materials/proceduralTextures.ts"),
      "utf8",
    );

    expect(source).not.toMatch(/TextureLoader|useTexture|fetch\s*\(|https?:\/\//i);
    expect(source).not.toMatch(/@tauri-apps|\binvoke\s*\(|coreApi|getblockchaininfo/i);
  });
});
