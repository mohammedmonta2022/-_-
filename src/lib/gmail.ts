/**
 * Mail notification handler for Azm Educational Complex
 * Integrates real Gmail API sending with UTF-8 base64 url-safe encoding
 * Uses the Official Authorized Sender Account credentials saved in Firebase Firestore!
 */
import { getAccessToken, getSavedSenderToken, googleSignIn } from './firebase';

/**
 * Construct modern Azm Educational Complex verification email HTML
 */
export function generateEmailHtml(code: string, username: string, purpose: 'register' | 'reset_password'): string {
  const isRegister = purpose === 'register';
  const title = isRegister ? 'تأكيد إنشاء حسابك في مجمع عزم التعليمي' : 'إعادة تعيين كلمة المرور - مجمع عزم التعليمي';
  const message = isRegister
    ? `مرحباً بك يا ${username}، نشكرك على انضمامك إلى مجمع عزم التعليمي. يُرجى استخدام رمز التحقق أدناه لإتمام عملية إنشاء الحساب وتوثيقه.`
    : `مرحباً بك يا ${username}، لقد تم طلب إعادة تعيين كلمة المرور الخاصة بحسابك في مجمع عزم التعليمي. استخدم رمز التحقق التالي:`;

  return `
    <div dir="rtl" style="font-family: 'Cairo', Tahoma, Arial, sans-serif; background-color: #F7F3EE; padding: 40px 20px; color: #053B50;">
      <div style="max-width: 520px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; border: 2px solid #E8DAC8; overflow: hidden; box-shadow: 0 10px 25px rgba(5,59,80,0.08);">
        
        <!-- Header Banner -->
        <div style="background-color: #053B50; padding: 24px; text-align: center;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 800;">مجمع عزم التعليمي</h1>
          <p style="color: #E8DAC8; margin: 6px 0 0 0; font-size: 13px;">بوابة الدخول والتحقق الموحدة</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px 24px; text-align: center;">
          <h2 style="color: #053B50; font-size: 20px; margin-top: 0; font-weight: 700;">${title}</h2>
          <p style="color: #053B50; opacity: 0.85; line-height: 1.7; font-size: 14px; margin-bottom: 28px;">
            ${message}
          </p>

          <!-- 6-digit Verification Code Block -->
          <div style="background-color: #F7F3EE; border: 2px dashed #E8DAC8; border-radius: 12px; padding: 20px; margin: 20px 0; display: inline-block; min-width: 220px;">
            <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #053B50; font-family: monospace;">
              ${code}
            </span>
          </div>

          <p style="color: #053B50; opacity: 0.65; font-size: 12px; margin-top: 20px;">
            صلاحية هذا الرمز هي 10 دقائق فقط. إذا لم تكن أنت من طلب هذا الرمز، يُرجى تجاهل هذه الرسالة.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #F7F3EE; border-top: 1px solid #E8DAC8; padding: 16px; text-align: center; font-size: 12px; color: #053B50; font-weight: bold;">
          جميع الحقوق محفوظة لمجمع عزم التعليمي
        </div>
      </div>
    </div>
  `;
}

/**
 * Encodes string to RFC 2822 base64url format for Gmail API
 */
function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Builds RFC 2822 raw message
 */
function createRawEmail(to: string, subject: string, htmlContent: string): string {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    htmlContent,
  ];
  return messageParts.join('\r\n');
}

/**
 * Real Gmail API dispatch using the authorized OAuth access token stored in Firestore
 */
export async function sendEmailViaGmail(options: {
  to: string;
  subject: string;
  htmlContent: string;
  allowInteractiveAuth?: boolean;
}): Promise<{ success: boolean; error?: string; needsAuth?: boolean }> {
  try {
    // 1. Try in-memory or persisted Firestore token from the official sender
    let token = getAccessToken();
    if (!token) {
      token = await getSavedSenderToken();
    }

    // 2. Fall back to interactive popup ONLY if explicitly requested
    if (!token && options.allowInteractiveAuth) {
      try {
        const signResult = await googleSignIn();
        token = signResult?.accessToken || null;
      } catch (authErr) {
        const msg = authErr instanceof Error ? authErr.message : String(authErr);
        return {
          success: false,
          needsAuth: true,
          error: `يرجى تسجيل الدخول بحساب Google للسماح بإرسال البريد: ${msg}`,
        };
      }
    }

    if (!token) {
      return {
        success: false,
        needsAuth: true,
        error: 'لم يتم حفظ تفويض بريد الإرسال في Firebase حتى الآن. يرجى قيام مدير النظام بتأكيد التفويض.',
      };
    }

    const rawMessage = createRawEmail(options.to, options.subject, options.htmlContent);
    const encodedRaw = toBase64Url(rawMessage);

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedRaw,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errDetail = errData?.error?.message || `كود الخطأ: ${response.status}`;
      return {
        success: false,
        error: `تعذر إرسال البريد عبر Gmail API (${errDetail})`,
      };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
    };
  }
}
