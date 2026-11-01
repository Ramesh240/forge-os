import { createHash, createSign } from 'crypto';

const ANDROID_PUBLISHER_SCOPE = 'https://www.googleapis.com/auth/androidpublisher';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const PUBLISHER_API = 'https://androidpublisher.googleapis.com/androidpublisher/v3';
const DEFAULT_PACKAGE_NAME = 'com.forgeos.mastery';
const DEFAULT_PRODUCT_IDS = ['forgeos_pro_lifetime', 'pro_lifetime'];

export interface GooglePlayProductPurchase {
  purchaseState?: number;
  consumptionState?: number;
  acknowledgementState?: number;
  orderId?: string;
  productId?: string;
  quantity?: number;
}

interface ServiceAccount {
  client_email?: string;
  private_key?: string;
}

function getServiceAccount(): ServiceAccount {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('Google Play verification is not configured.');

  let serviceAccount: ServiceAccount;
  try {
    serviceAccount = JSON.parse(raw) as ServiceAccount;
  } catch {
    throw new Error('Google Play verification credentials are invalid.');
  }

  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error('Google Play verification credentials are incomplete.');
  }

  return {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key.replace(/\\n/g, '\n'),
  };
}

function base64Url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

async function getAccessToken(): Promise<string> {
  const serviceAccount = getServiceAccount();
  const issuedAt = Math.floor(Date.now() / 1000);
  const unsignedJwt = [
    base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' })),
    base64Url(JSON.stringify({
      iss: serviceAccount.client_email,
      scope: ANDROID_PUBLISHER_SCOPE,
      aud: TOKEN_URL,
      iat: issuedAt,
      exp: issuedAt + 3600,
    })),
  ].join('.');

  const signer = createSign('RSA-SHA256');
  signer.update(unsignedJwt);
  signer.end();
  const assertion = `${unsignedJwt}.${signer.sign(serviceAccount.private_key!, 'base64url')}`;

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    signal: AbortSignal.timeout(10000),
    cache: 'no-store',
  });

  if (!response.ok) throw new Error('Google Play authorization failed.');
  const tokenResponse = await response.json() as { access_token?: string };
  if (!tokenResponse.access_token) throw new Error('Google Play authorization failed.');
  return tokenResponse.access_token;
}

export function getAllowedPlayProductIds(): string[] {
  const configured = process.env.GOOGLE_PLAY_PRODUCT_IDS
    ?.split(',')
    .map((productId) => productId.trim())
    .filter(Boolean);
  return configured?.length ? configured : DEFAULT_PRODUCT_IDS;
}

export function hashPlayPurchaseToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function verifyAndAcknowledgePlayPurchase(
  purchaseToken: string,
  productId: string,
): Promise<GooglePlayProductPurchase | null> {
  const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME || DEFAULT_PACKAGE_NAME;
  const accessToken = await getAccessToken();
  const purchaseUrl = `${PUBLISHER_API}/applications/${encodeURIComponent(packageName)}` +
    `/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
  const response = await fetch(purchaseUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10000),
    cache: 'no-store',
  });

  if (response.status === 404 || response.status === 400) return null;
  if (!response.ok) throw new Error('Google Play could not verify the purchase.');

  const purchase = await response.json() as GooglePlayProductPurchase;
  if (
    purchase.productId !== productId ||
    purchase.purchaseState !== 0 ||
    purchase.consumptionState !== 0 ||
    (purchase.quantity !== undefined && purchase.quantity !== 1)
  ) {
    return null;
  }

  if (purchase.acknowledgementState === 0) {
    const acknowledgeResponse = await fetch(`${purchaseUrl}:acknowledge`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
      signal: AbortSignal.timeout(10000),
      cache: 'no-store',
    });
    if (!acknowledgeResponse.ok) {
      throw new Error('Google Play purchase acknowledgement failed.');
    }
  } else if (purchase.acknowledgementState !== 1) {
    return null;
  }

  return purchase;
}
