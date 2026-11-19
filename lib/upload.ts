import { upload } from '@vercel/blob/client';

/** Downscale to max 1600px JPEG in the browser (phone photos are 5-10MB), then upload to Vercel Blob. Returns the public URL. */
async function shrink(file: File, maxSide = 1600, quality = 0.82): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale); canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
    return blob && blob.size < file.size ? blob : file;
  } catch { return file; }
}

export async function uploadImage(file: File, folder: 'photos' | 'slips'): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('รองรับเฉพาะไฟล์รูปภาพ');
  const body = await shrink(file);
  const ext = body.type === 'image/jpeg' ? 'jpg' : (file.name.split('.').pop() || 'png').toLowerCase();
  const res = await upload(`${folder}/${Date.now()}.${ext}`, body, { access: 'public', handleUploadUrl: '/api/upload', contentType: body.type || file.type });
  return res.url;
}
