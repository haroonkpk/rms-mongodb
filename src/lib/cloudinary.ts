import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadToCloudinary(
  file: File,
  folder: string = "restaurant_rms/avatars",
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return {
        success: false,
        error:
          "Cloudinary credentials missing in .env. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64Data, {
      folder,
      resource_type: "image",
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
      ],
    });

    return { success: true, url: result.secure_url };
  } catch (error: unknown) {
    console.error("Cloudinary Upload Error:", error);
    return {
      success: false,
      error: (error as Error)?.message || "Failed to upload image to Cloudinary",
    };
  }
}

export default cloudinary;
