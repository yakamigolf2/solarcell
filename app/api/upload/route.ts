import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { can, getSessionUser } from '@/lib/auth';

// Browser uploads straight to Vercel Blob (bypasses the 4.5MB function body limit); this route only issues short-lived tokens.
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || !can(user, 'photos_upload', 'finance_edit_installments', 'news_manage', 'projects_manage', 'quotes_edit', 'quotes_create')) return NextResponse.json({ error: 'ไม่มีสิทธิ์อัปโหลด' }, { status: 403 });
  try {
    const body = (await req.json()) as HandleUploadBody;
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        maximumSizeInBytes: 25 * 1024 * 1024,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'upload failed' }, { status: 400 });
  }
}
