// Inline-CSS email templates (email clients strip <style> blocks in
// many cases, so everything here is inline) using ShopEasy's brand
// palette from lib/core/constants/app_colors.dart.
const COLORS = {
  primary: '#4F6EF7',
  primaryDark: '#3D56D6',
  darkBg: '#13173B',
  textPrimary: '#1A1D29',
  textSecondary: '#8A8F9A',
  background: '#F7F8FC',
  border: '#E5E7EB',
};

function otpEmailTemplate({ fullName, otp, expiresInMinutes = 10 }) {
  const codeBoxes = otp
    .split('')
    .map(
      (digit) => `
        <td style="width:40px;height:52px;background:${COLORS.background};border:1px solid ${COLORS.border};border-radius:10px;text-align:center;vertical-align:middle;font-size:24px;font-weight:700;color:${COLORS.textPrimary};font-family:'Segoe UI',Arial,sans-serif;">
          ${digit}
        </td>`
    )
    .join('<td style="width:8px;"></td>');

  return `
  <div style="background:${COLORS.background};padding:32px 16px;font-family:'Segoe UI',Arial,sans-serif;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid ${COLORS.border};">
      <tr>
        <td style="background:${COLORS.darkBg};padding:28px 32px;text-align:center;">
          <div style="display:inline-block;width:48px;height:48px;background:${COLORS.primary};border-radius:14px;line-height:48px;font-size:22px;">🛍️</div>
          <div style="color:#ffffff;font-size:20px;font-weight:700;margin-top:12px;">ShopEasy</div>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <p style="margin:0 0 4px;color:${COLORS.textPrimary};font-size:18px;font-weight:700;">
            Reset your password
          </p>
          <p style="margin:0 0 24px;color:${COLORS.textSecondary};font-size:14px;line-height:1.6;">
            Hi ${fullName || 'there'}, use the verification code below to reset your
            ShopEasy password. This code expires in ${expiresInMinutes} minutes.
          </p>
          <table role="presentation" align="center" style="margin:0 auto 24px;border-collapse:separate;border-spacing:0;">
            <tr>${codeBoxes}</tr>
          </table>
          <p style="margin:0;color:${COLORS.textSecondary};font-size:13px;line-height:1.6;text-align:center;">
            Didn't request this? You can safely ignore this email —
            your password will stay the same.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px;background:${COLORS.background};text-align:center;">
          <p style="margin:0;color:${COLORS.textSecondary};font-size:12px;">
            © ${new Date().getFullYear()} ShopEasy. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  </div>`;
}

function passwordChangedEmailTemplate({ fullName }) {
  return `
  <div style="background:${COLORS.background};padding:32px 16px;font-family:'Segoe UI',Arial,sans-serif;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid ${COLORS.border};">
      <tr>
        <td style="background:${COLORS.darkBg};padding:28px 32px;text-align:center;">
          <div style="color:#ffffff;font-size:20px;font-weight:700;">ShopEasy</div>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;text-align:center;">
          <div style="width:56px;height:56px;background:#22C55E1A;border-radius:50%;line-height:56px;margin:0 auto 16px;font-size:26px;">✅</div>
          <p style="margin:0 0 4px;color:${COLORS.textPrimary};font-size:18px;font-weight:700;">
            Password changed
          </p>
          <p style="margin:0;color:${COLORS.textSecondary};font-size:14px;line-height:1.6;">
            Hi ${fullName || 'there'}, your ShopEasy password was just changed.
            If this wasn't you, please contact support immediately.
          </p>
        </td>
      </tr>
    </table>
  </div>`;
}

module.exports = { otpEmailTemplate, passwordChangedEmailTemplate };
