import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { buildObjectKey, contentTypeFor, isS3Configured, uploadToS3 } from '@/lib/s3';

// Admin media upload. Files go to S3-compatible object storage (see lib/s3.ts).

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB - matches the video hint in the admin UI.

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isS3Configured()) {
    console.error('[upload] S3 storage is not configured');
    return NextResponse.json({ error: 'Storage is not configured' }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File is too large (max 50 MB)' }, { status: 413 });
  }

  try {
    const key = buildObjectKey(file.name);
    const url = await uploadToS3(
      key,
      await file.arrayBuffer(),
      file.type || contentTypeFor(file.name),
    );
    return NextResponse.json({ url });
  } catch (error) {
    console.error('[upload] S3 upload failed', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
