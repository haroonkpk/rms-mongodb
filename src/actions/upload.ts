'use server'

import { uploadToCloudinary } from '@/lib/cloudinary'

export async function uploadImageAction(formData: FormData) {
  try {
    const file = formData.get('file') as File | null

    if (!file || typeof file === 'string' || file.size === 0) {
      return { success: false, error: 'Please select a valid image file.' }
    }

    // Validate image file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return { success: false, error: 'Unsupported file format. Please upload JPEG, PNG, WEBP, or GIF.' }
    }

    // Max 5MB size limit
    const MAX_SIZE_MB = 5
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return { success: false, error: `File size exceeds ${MAX_SIZE_MB}MB limit. Please select a smaller image.` }
    }

    const result = await uploadToCloudinary(file, 'restaurant_rms/avatars')
    return result
  } catch (error: any) {
    console.error('Upload Action Exception:', error)
    return { success: false, error: error?.message || 'An unexpected server error occurred during upload.' }
  }
}
