"use client";

import { photoError } from "../domain/listing";
import { DataError } from "./api";

/** Downscales a photo in the browser so demo listings fit in localStorage. */
export async function compressImage(file: File, maxSide = 1200, quality = 0.8): Promise<string> {
  const error = photoError(file);
  if (error) throw new DataError(error);
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new DataError(`${file.name} could not be read as an image.`);
  });
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}
