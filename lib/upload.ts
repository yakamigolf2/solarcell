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

/** Upload a PDF (quotation attachment) as-is to Vercel Blob. Returns the public URL. */
export async function uploadPdf(file: File): Promise<string> {
  if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) throw new Error('รองรับเฉพาะไฟล์ PDF');
  if (file.size > 25 * 1024 * 1024) throw new Error('ไฟล์ใหญ่เกิน 25MB');
  const res = await upload(`attachments/${Date.now()}-${file.name.replace(/[^\w.\-ก-๙]+/g, '_')}`, file, { access: 'public', handleUploadUrl: '/api/upload', contentType: 'application/pdf' });
  return res.url;
}

export async function uploadImage(file: File, folder: 'photos' | 'slips' | 'news'): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('รองรับเฉพาะไฟล์รูปภาพ');
  const body = await shrink(file);
  const ext = body.type === 'image/jpeg' ? 'jpg' : (file.name.split('.').pop() || 'png').toLowerCase();
  const res = await upload(`${folder}/${Date.now()}.${ext}`, body, { access: 'public', handleUploadUrl: '/api/upload', contentType: body.type || file.type });
  return res.url;
}

/** Logos keep their transparency: PNG/WebP are uploaded as-is (or downscaled to PNG if huge); never converted to JPEG. */
export async function uploadLogo(file: File): Promise<string> {
  if (!/^image\/(png|webp|jpeg)$/.test(file.type)) throw new Error('รองรับไฟล์ PNG, WebP หรือ JPG');
  let body: Blob = file;
  if (file.size > 3 * 1024 * 1024) {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 800 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    body = await new Promise<Blob>((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('ย่อรูปไม่สำเร็จ'))), 'image/png'));
  }
  const ext = body.type === 'image/png' ? 'png' : body.type === 'image/webp' ? 'webp' : 'jpg';
  const res = await upload(`clients/${Date.now()}.${ext}`, body, { access: 'public', handleUploadUrl: '/api/upload', contentType: body.type || file.type });
  return res.url;
}
