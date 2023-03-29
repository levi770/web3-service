/* eslint-disable prettier/prettier */
export function newPasswordTemplate(app_url: string, password: string) {
  return `<div style="background-color: #f7f7f7; padding: 50px 20px 40px; overflow-x: auto;">
  <table align="center" width="100%"
         style="max-width: 600px; border-spacing: 0; color: #0B0F18; font-family: 'Tahoma', sans-serif;">
    <tr>
      <td>
        <table bgcolor="white" width="100%" style="
                    box-shadow: 0 2px 9px rgba(61, 63, 66, 0.152262);
                    border-spacing: 0;">
          <tr>
            <td style="padding-left: 0; padding-right: 0; padding-top: 0; padding-bottom: 0;">
              <table width="100%" style="border-spacing: 0; text-align: center; font-size: 20px; line-height: 1.4;">
                <tr>
                  <td style="padding-left: 0; padding-right: 0; padding-top: 0; padding-bottom: 0;">
                    <p style="margin-bottom: 20px; margin-top: 40px; font-size: 14px; font-weight: 700; line-height: 17px; color: #0B0F18;">
                      Here&#39;s your new password to export data from Highloop.io Web3 Service
                    </p>
                    <p style="margin: 0; padding-top: 20px; padding-bottom: 20px; background: rgba(11, 15, 24, 0.05); font-size: 20px; line-height: 24px; color: #0B0F18;">
                      ${password}
                    </p>
                    <p style="margin-top: 20px; margin-bottom: 40px; padding-left: 40px; padding-right: 40px; font-weight: 400; font-size: 14px; line-height: 20px; color: #0B0F18;">You can export any data from Highloop.io Web3Service using export form on this page: <a href="${app_url}/export">${app_url}/export</a></p>
                    <p style="margin-top: 20px; margin-bottom: 40px; padding-left: 40px; padding-right: 40px; font-weight: 400; font-size: 14px; line-height: 20px; color: #0B0F18;">You can change your password at any time on this page: <a href="${app_url}/auth/update">${app_url}/auth/update</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`;
}
