import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import ImageKit from "imagekit";

const KYC_FOLDER = "/marketplace-kyc";

@Injectable()
export class ImageKitService {
  private client: ImageKit | null = null;

  private getClient(): ImageKit {
    if (this.client) return this.client;
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY?.trim();
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim();
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT?.trim();
    if (!publicKey || !privateKey || !urlEndpoint) {
      throw new ServiceUnavailableException(
        "ImageKit is not configured (IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT)",
      );
    }
    this.client = new ImageKit({ publicKey, privateKey, urlEndpoint });
    return this.client;
  }

  async uploadKycFile(input: {
    userId: string;
    purpose: string;
    buffer: Buffer;
    mimeType: string;
    originalName?: string;
  }): Promise<{ filePath: string; fileId: string }> {
    const ext = mimeToExt(input.mimeType, input.originalName);
    const fileName = `${input.purpose}_${Date.now()}${ext}`;
    const folder = `${KYC_FOLDER}/${input.userId}`;
    const ik = this.getClient();
    const result = await ik.upload({
      file: input.buffer,
      fileName,
      folder,
      useUniqueFileName: true,
      isPrivateFile: true,
    });
    return { filePath: result.filePath, fileId: result.fileId };
  }

  async downloadFile(filePath: string): Promise<{ buffer: Buffer; contentType: string }> {
    const ik = this.getClient();
    const signedUrl = ik.url({
      path: filePath,
      signed: true,
      expireSeconds: 120,
    });
    const res = await fetch(signedUrl);
    if (!res.ok) {
      throw new ServiceUnavailableException("Failed to fetch KYC image from storage");
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    return { buffer, contentType };
  }
}

function mimeToExt(mimeType: string, originalName?: string): string {
  const fromName = originalName?.match(/\.[a-zA-Z0-9]+$/)?.[0]?.toLowerCase();
  if (fromName && [".jpg", ".jpeg", ".png", ".webp"].includes(fromName)) return fromName;
  switch (mimeType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return ".jpg";
  }
}
