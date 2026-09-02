# import os
# from datetime import datetime, timezone
# from typing import List, Optional
# import resend
# from app.core.config import settings
# from app.utils.logging import logger

# # Initialize the Resend client globally
# resend.api_key = settings.resend_api_key

# class EmailService:
#     @staticmethod
#     def send_transactional_email(
#         sender: str, 
#         to_addresses: List[str], 
#         subject: str, 
#         html_content: str,
#         reply_to: Optional[str] = None
#     ) -> None:
#         """
#         Synchronous wrapper execution for Resend API.
#         Designed to run inside FastAPI's BackgroundTasks worker thread.
#         """
#         start_time = datetime.now(timezone.utc)
#         try:
#             payload = {
#                 "from": sender,
#                 "to": to_addresses,
#                 "subject": subject,
#                 "html": html_content,
#             }
#             if reply_to:
#                 payload["reply_to"] = reply_to
                
#             response = resend.Emails.send(payload)
            
#             # Log successful dispatch with metrics
#             duration = (datetime.now(timezone.utc) - start_time).total_seconds()
#             logger.info(
#                 f"[EmailService] Sent successfully | Subject: '{subject}' | "
#                 f"To: {to_addresses} | ID: {response.get('id')} | Duration: {duration:.2f}s"
#             )
            
#         except Exception as e:
#             logger.error(
#                 f"[EmailService] Critical Failure | Subject: '{subject}' | "
#                 f"To: {to_addresses} | Error: {str(e)}", 
#                 exc_info=True
#             )

#     # ==========================================
#     # CORE APPLICATION ENVIRONMENT ECOSYSTEM METHODS
#     # ==========================================

#     @classmethod
#     def send_testing(cls, to_email: str, metadata: Optional[dict] = None) -> None:
#         """Basic pipeline sanity testing method."""
#         html = f"""
#         <h3>NetHub Mail System Diagnostic Test</h3>
#         <p>Timestamp (UTC): {datetime.now(timezone.utc).isoformat()}</p>
#         <p>Payload Metadata: {metadata or 'None provided'}</p>
#         <hr/>
#         <p style='font-size: 12px; color: #64748b;'>Engine: Resend Edge Infrastructure</p>
#         """
#         cls.send_transactional_email(
#             sender=settings.email_from_security,
#             to_addresses=[to_email],
#             subject="[Diagnostic] NetHub Sandbox Test Mail",
#             html_content=html
#         )

#     @classmethod
#     def send_welcome(cls, to_email: str, username: str) -> None:
#         """Dispatched upon user registration."""
#         html = f"""
#         <h2>Welcome to NetHub, {username}!</h2>
#         <p>Your cloud engineering ecosystem account has been successfully provisioned.</p>
#         <p>Get started by exploring your customized service dashboards.</p>
#         """
#         cls.send_transactional_email(
#             sender=settings.email_from_security,
#             to_addresses=[to_email],
#             subject=f"Welcome to NetHub, {username}",
#             html_content=html
#         )

#     @classmethod
#     def send_verification(cls, to_email: str, verification_url: str) -> None:
#         """Dispatched during verification checkpoints."""
#         html = f"""
#         <h2>Verify Your Email Address</h2>
#         <p>Please click the secure link below to verify your account identity:</p>
#         <p><a href="{verification_url}" style="padding: 10px 20px; background-color: #0f172a; color: #fff; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a></p>
#         <p style="font-size: 12px; color: #94a3b8;">This link will expire in 24 hours.</p>
#         """
#         cls.send_transactional_email(
#             sender=settings.email_from_security,
#             to_addresses=[to_email],
#             subject="[NetHub] Verify Your Email Address",
#             html_content=html
#         )

#     @classmethod
#     def send_password_reset(cls, to_email: str, reset_url: str) -> None:
#         """Dispatched during password recovery flows."""
#         html = f"""
#         <h2>Password Reset Request</h2>
#         <p>We received a request to reset your password. Click the secure link below to proceed:</p>
#         <p><a href="{reset_url}" style="padding: 10px 20px; background-color: #ef4444; color: #fff; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
#         <p style="font-size: 12px; color: #94a3b8;">If you did not make this request, you can safely ignore this email.</p>
#         """
#         cls.send_transactional_email(
#             sender=settings.email_from_security,
#             to_addresses=[to_email],
#             subject="[CRITICAL] NetHub Password Reset Request",
#             html_content=html
#         )

#     @classmethod
#     def send_newsletter(cls, to_addresses: List[str], subject: str, html_content: str) -> None:
#         """Dispatched for marketing broadcast sequences."""
#         cls.send_transactional_email(
#             sender=settings.email_from_marketing,
#             to_addresses=to_addresses,
#             subject=subject,
#             html_content=html_content
#         )

#     @classmethod
#     def send_system_notice(cls, to_email: str, action_title: str, status_details: str) -> None:
#         """Dispatched for infrastructure background updates (Tawala pipeline logs, etc.)."""
#         html = f"""
#         <h3>[System Log] {action_title}</h3>
#         <p><strong>Status:</strong> {status_details}</p>
#         <p><strong>Execution Time:</strong> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
#         """
#         cls.send_transactional_email(
#             sender=settings.email_from_tawala,
#             to_addresses=[to_email],
#             subject=f"[Tawala] {action_title}",
#             html_content=html
#         )


# mailer = EmailService


# # from fastapi import APIRouter, BackgroundTasks, status
# # from app.services.mail import mailer # Assuming file is mail.py

# # router = APIRouter()

# # @router.post("/auth/forgot-password", status_code=status.HTTP_202_ACCEPTED)
# # async def forgot_password(email: str, background_tasks: BackgroundTasks):
# #     # ... validation or database lookup logic ...
# #     reset_link = "https://nethub.co.ke/auth/reset?token=xyz"
    
# #     background_tasks.add_task(
# #         mailer.send_password_reset,
# #         to_email=email,
# #         reset_url=reset_link
# #     )
# #     return {"status": "accepted", "message": "Reset processing."}

import os
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

import resend
from app.core.config import settings
from app.utils.logging import logger

# Initialize Resend SDK globally
resend.api_key = settings.resend_api_key


class EmailService:
    @staticmethod
    def send_transactional_email(
        sender: str,
        to_addresses: List[str],
        subject: str,
        html_content: str,
        reply_to: Optional[str] = None
    ) -> None:
        """
        Synchronous wrapper execution for Resend API.
        Designed to run safely inside FastAPI's BackgroundTasks worker thread.
        """
        start_time = datetime.now(timezone.utc)
        try:
            payload: Dict[str, Any] = {
                "from": sender,
                "to": to_addresses,
                "subject": subject,
                "html": html_content,
            }
            if reply_to:
                payload["reply_to"] = reply_to

            response = resend.Emails.send(payload)

            duration = (datetime.now(timezone.utc) - start_time).total_seconds()
            logger.info(
                f"[EmailService] Sent successfully | Subject: '{subject}' | "
                f"To: {to_addresses} | ID: {response.get('id')} | Duration: {duration:.2f}s"
            )

        except Exception as e:
            logger.error(
                f"[EmailService] Critical Failure | Subject: '{subject}' | "
                f"To: {to_addresses} | Error: {str(e)}",
                exc_info=True
            )

    # =========================================================================
    # TRANSACTIONAL MAIL TEMPLATES
    # =========================================================================

    @classmethod
    def send_password_reset(
        cls,
        to_email: str,
        reset_url: str,
        user_name: Optional[str] = None,
        ip_address: Optional[str] = None,
        expire_minutes: int = 15
    ) -> None:
        """
        Dispatched during password recovery flows. Features responsive HTML layout,
        clear primary CTAs, security alerts, and request metadata.
        """
        greeting_name = user_name if user_name else "Valued User"
        request_ip = ip_address if ip_address else "Unknown"
        time_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 10px;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                            
                            <!-- Header -->
                            <tr>
                                <td style="background-color: #0f172a; padding: 24px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.5px;">
                                        NetHub Security
                                    </h1>
                                </td>
                            </tr>

                            <!-- Body -->
                            <tr>
                                <td style="padding: 32px 24px;">
                                    <h2 style="color: #0f172a; font-size: 18px; margin-top: 0; margin-bottom: 16px;">
                                        Password Reset Request
                                    </h2>
                                    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                                        Hello {greeting_name},
                                    </p>
                                    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                                        We received a request to reset the password for your account. Click the button below to set up a new password:
                                    </p>

                                    <!-- CTA Button -->
                                    <div style="text-align: center; margin: 32px 0;">
                                        <a href="{reset_url}" 
                                           target="_blank"
                                           style="background-color: #0284c7; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
                                           Reset Password
                                        </a>
                                    </div>

                                    <!-- Warning Notice -->
                                    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 24px;">
                                        ⏱️ This link is single-use and will automatically expire in <strong>{expire_minutes} minutes</strong>.
                                    </p>

                                    <!-- Security Context Table -->
                                    <div style="background-color: #f1f5f9; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
                                        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase;">
                                            Request Details
                                        </p>
                                        <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">
                                            <strong>Time:</strong> {time_str}
                                        </p>
                                        <p style="margin: 0; font-size: 12px; color: #64748b;">
                                            <strong>Origin IP:</strong> {request_ip}
                                        </p>
                                    </div>

                                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

                                    <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
                                        If you didn't initiate this request, you can safely ignore this email. Your password will remain unchanged.
                                    </p>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                                    <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                                        &copy; {datetime.now().year} NetHub Security Infrastructure. All rights reserved.
                                    </p>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """

        cls.send_transactional_email(
            sender=settings.email_from_security,
            to_addresses=[to_email],
            subject="🔐 Reset Your NetHub Password",
            html_content=html_content
        )

    @classmethod
    def send_testing(cls, to_email: str, metadata: Optional[dict] = None) -> None:
        """Basic pipeline sanity testing method."""
        html = f"""
        <h3>NetHub Mail System Diagnostic Test</h3>
        <p>Timestamp (UTC): {datetime.now(timezone.utc).isoformat()}</p>
        <p>Payload Metadata: {metadata or 'None provided'}</p>
        <hr/>
        <p style='font-size: 12px; color: #64748b;'>Engine: Resend Edge Infrastructure</p>
        """
        cls.send_transactional_email(
            sender=settings.email_from_security,
            to_addresses=[to_email],
            subject="[Diagnostic] NetHub Sandbox Test Mail",
            html_content=html
        )

    @classmethod
    def send_welcome(cls, to_email: str, username: str) -> None:
        """Dispatched upon user registration."""
        html = f"""
        <h2>Welcome to NetHub, {username}!</h2>
        <p>Your cloud engineering ecosystem account has been successfully provisioned.</p>
        """
        cls.send_transactional_email(
            sender=settings.email_from_security,
            to_addresses=[to_email],
            subject=f"Welcome to NetHub, {username}",
            html_content=html
        )



    @classmethod
    def send_onboarding_setup(
        cls,
        to_email: str,
        setup_url: str,
        user_name: Optional[str] = None,
        ip_address: Optional[str] = None,
        expire_minutes: int = 60,
    ) -> None:
        """Email new registrants a one-time link to set password and start the Ndovu trial."""
        greeting_name = (user_name or "").strip() or "there"
        request_ip = ip_address if ip_address else "Unknown"
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Segoe UI,system-ui,-apple-system,sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px;">
            <tr><td align="center">
              <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
                <tr><td style="background:#0f172a;padding:28px 24px;text-align:center;">
                  <p style="color:#94a3b8;margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">Tawala</p>
                  <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">Start your 14-day trial</h1>
                </td></tr>
                <tr><td style="padding:32px 28px;">
                  <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 12px;">Hello {greeting_name},</p>
                  <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 12px;">
                    You are one step away from <strong>Ndovu</strong> — our recommended plan for Kenyan shops.
                    Set your password to verify your email and activate <strong>14 days free</strong>. No credit card required.
                  </p>
                  <div style="text-align:center;margin:28px 0;">
                    <a href="{setup_url}" target="_blank" rel="noopener"
                       style="background-color:#4f46e5;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;display:inline-block;">
                      Set password &amp; start trial
                    </a>
                  </div>
                  <p style="color:#64748b;font-size:13px;line-height:1.5;margin:0 0 8px;">
                    This link expires in <strong>{expire_minutes} minutes</strong>.
                  </p>
                  <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:0;">
                    If you did not create a Tawala account, you can ignore this email.<br/>
                    Request IP: {request_ip}
                  </p>
                </td></tr>
                <tr><td style="padding:16px 28px 24px;border-top:1px solid #f1f5f9;">
                  <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">
                    Tawala · Control your biashara · <a href="https://tawala.nethub.co.ke" style="color:#64748b;">tawala.nethub.co.ke</a>
                  </p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """
        cls.send_transactional_email(
            sender=settings.email_from_tawala,
            to_addresses=[to_email],
            subject="Set your password and start your 14-day Ndovu trial",
            html_content=html_content,
        )



    @classmethod
    def send_trial_invoice(
        cls,
        to_email: str,
        org_name: str,
        plan_name: str,
        trial_days: int,
        start_date: str,
        end_date: str,
        currency: str = "KES",
        dashboard_url: Optional[str] = None,
    ) -> None:
        """Confirm trial activation with next steps and zero-amount clarity."""
        open_url = (dashboard_url or "").strip() or "https://tawala.nethub.co.ke/org"
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Segoe UI,system-ui,-apple-system,sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px;">
            <tr><td align="center">
              <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
                <tr><td style="background:#0f172a;padding:28px 24px;text-align:center;">
                  <p style="color:#94a3b8;margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">Tawala</p>
                  <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">Your trial is active</h1>
                </td></tr>
                <tr><td style="padding:32px 28px;color:#334155;font-size:15px;line-height:1.6;">
                  <p style="margin:0 0 12px;">Hello,</p>
                  <p style="margin:0 0 12px;">
                    <strong>{org_name}</strong> is on a <strong>{trial_days}-day free trial</strong> of
                    <strong>{plan_name}</strong>. Amount due today: <strong>0 {currency}</strong> — no card required.
                  </p>
                  <p style="margin:0 0 8px;font-weight:600;color:#0f172a;">Get value in the next 10 minutes:</p>
                  <ol style="margin:0 0 20px;padding-left:20px;color:#475569;font-size:14px;">
                    <li style="margin-bottom:6px;">Confirm your business name and phone</li>
                    <li style="margin-bottom:6px;">Add your first products or import stock</li>
                    <li style="margin-bottom:6px;">Create a staff PIN for the counter</li>
                  </ol>
                  <div style="text-align:center;margin:24px 0 8px;">
                    <a href="{open_url}" target="_blank" rel="noopener"
                       style="background-color:#4f46e5;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;display:inline-block;">
                      Open Tawala
                    </a>
                  </div>
                  <table width="100%" style="margin:28px 0 12px;border-collapse:collapse;font-size:13px;color:#64748b;">
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">Plan</td>
                      <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:right;color:#0f172a;">{plan_name}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">Trial window</td>
                      <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:right;color:#0f172a;">{start_date} → {end_date}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;">Amount due today</td>
                      <td style="padding:8px 0;text-align:right;color:#0f172a;"><strong>0 {currency}</strong></td>
                    </tr>
                  </table>
                  <p style="color:#94a3b8;font-size:12px;margin:0;">
                    You can upgrade or cancel before the trial ends. Local support is available when you need it.
                  </p>
                </td></tr>
                <tr><td style="padding:16px 28px 24px;border-top:1px solid #f1f5f9;">
                  <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">
                    Tawala · Control your biashara · <a href="https://tawala.nethub.co.ke" style="color:#64748b;">tawala.nethub.co.ke</a>
                  </p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """
        cls.send_transactional_email(
            sender=settings.email_from_billing,
            to_addresses=[to_email],
            subject=f"Your {trial_days}-day {plan_name} trial is active — KES 0 today",
            html_content=html_content,
        )



# Global Service Instance
mailer = EmailService()