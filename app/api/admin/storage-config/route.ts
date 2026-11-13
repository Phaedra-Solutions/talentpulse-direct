import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/server-auth';
import { canManageAdminUsers } from '@/lib/auth/permissions';
import {
  getDoSpacesConfig,
  saveDoSpacesConfig,
  testDoSpacesConnection,
  isDoSpacesConfigured,
  isMaskedOrEmptyCredential,
} from '@/lib/storage/do-spaces';

export async function GET(req: NextRequest) {
  const auth = requireAdminAuth(req, canManageAdminUsers);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  const config = getDoSpacesConfig();

  return NextResponse.json({
    success: true,
    isConfigured: isDoSpacesConfigured(),
    config: {
      endpoint: config.endpoint,
      region: config.region,
      bucket: config.bucket,
      accessKey: '', // Kept empty so client form value doesn't submit masked string
      accessKeyMasked: config.accessKey ? `${config.accessKey.slice(0, 4)}...${config.accessKey.slice(-4)}` : '',
      hasAccessKey: Boolean(config.accessKey),
      hasSecretKey: Boolean(config.secretKey),
    },
    folderStructure: 'Talent Pulse/{Month-Year}/candidate/{candidateId}_{filename}',
    accessControl: 'Private (system proxy only)',
  });
}

export async function POST(req: NextRequest) {
  const auth = requireAdminAuth(req, canManageAdminUsers);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const body = await req.json();
    const { endpoint, region, bucket, accessKey, secretKey, testOnly } = body;

    const testPayload: Record<string, string> = {};
    if (endpoint && typeof endpoint === 'string' && endpoint.trim()) {
      testPayload.endpoint = endpoint.trim();
    }
    if (region && typeof region === 'string' && region.trim()) {
      testPayload.region = region.trim();
    }
    if (bucket && typeof bucket === 'string' && bucket.trim()) {
      testPayload.bucket = bucket.trim();
    }

    // Only accept accessKey / secretKey if provided and not a masked placeholder
    if (accessKey && typeof accessKey === 'string' && !isMaskedOrEmptyCredential(accessKey)) {
      testPayload.accessKey = accessKey.trim();
    }
    if (secretKey && typeof secretKey === 'string' && !isMaskedOrEmptyCredential(secretKey)) {
      testPayload.secretKey = secretKey.trim();
    }

    // Always test credentials BEFORE saving so invalid/mismatched keys never corrupt active storage
    const testResult = await testDoSpacesConnection(testPayload);

    if (testOnly || !testResult.success) {
      return NextResponse.json({
        success: true,
        saved: false,
        message: testResult.message,
        testResult,
        isConfigured: isDoSpacesConfigured(),
      });
    }

    saveDoSpacesConfig(testPayload);

    return NextResponse.json({
      success: true,
      saved: true,
      message: 'Storage credentials verified and saved securely.',
      testResult,
      isConfigured: isDoSpacesConfigured(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed saving storage configuration.' },
      { status: 500 }
    );
  }
}
