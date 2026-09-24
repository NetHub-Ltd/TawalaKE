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

# ---------------------------------------------------------------------------
# Canonical email tokens (DESIGN.md → client-safe hex — no CSS variables)
# Logo: https://tawala.nethub.co.ke/logo.svg
# ---------------------------------------------------------------------------
EMAIL_PRIMARY = "#003F4E"
EMAIL_ON_PRIMARY = "#FFFFFF"
EMAIL_BODY = "#121B1E"
# Stronger muted for footer/body secondary text (was #5A6468 — too faint)
EMAIL_MUTED = "#3D474B"
EMAIL_SURFACE = "#F4F3F0"
EMAIL_CARD = "#FFFFFF"
EMAIL_BORDER = "#D8D5CC"
EMAIL_SUCCESS = "#0F766E"
EMAIL_CREDIT = "#C1705B"
EMAIL_ERROR = "#BA1A1A"
EMAIL_LOGO = "https://tawala.nethub.co.ke/logo.svg"
EMAIL_SITE = "https://tawala.nethub.co.ke"
EMAIL_SUPPORT = "https://tawala.nethub.co.ke/support"

resend.api_key = settings.resend_api_key


class EmailService:
    """Transactional email via Resend. All customer mail uses the master shell."""

    @staticmethod
    def send_transactional_email(
        sender: str,
        to_addresses: List[str],
        subject: str,
        html_content: str,
        reply_to: Optional[str] = None,
    ) -> None:
        """Synchronous Resend send — safe inside FastAPI BackgroundTasks."""
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
                exc_info=True,
            )

    # =========================================================================
    # MASTER SHELL
    # =========================================================================

    @staticmethod
    def _preheader(text: str) -> str:
        """Hidden inbox preview (first ~90 chars)."""
        safe = (text or "").replace("<", "").replace(">", "")[:120]
        return (
            f'<div style="display:none;font-size:1px;line-height:1px;max-height:0;'
            f'max-width:0;opacity:0;overflow:hidden;mso-hide:all;">{safe}'
            f'{"&nbsp;" * 30}</div>'
        )

    @classmethod
    def render_shell(
        cls,
        *,
        title: str,
        body_html: str,
        preheader: str = "",
        eyebrow: Optional[str] = None,
    ) -> str:
        """
        Canonical Tawala email layout (light shell, all transactional mail).

        - White header so teal logo stands out (authority / genuineness)
        - Stronger footer contrast
        - Forced light color-scheme for dark-mode clients
        body_html: inner content only (paragraphs, CTA, tables) — no outer document.
        """
        eyebrow_html = ""
        if eyebrow:
            eyebrow_html = (
                f'<p style="margin:0 0 10px;font-size:11px;font-weight:700;'
                f'letter-spacing:0.12em;text-transform:uppercase;color:{EMAIL_PRIMARY};">'
                f"{eyebrow}</p>"
            )
        return f"""<!DOCTYPE html>
<html lang="en" style="color-scheme:light only;">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>{title}</title>
  <!--[if mso]>
  <style type="text/css">body, table, td {{font-family: Arial, sans-serif !important;}}</style>
  <![endif]-->
  <style type="text/css">
    :root {{ color-scheme: light only; }}
    @media (prefers-color-scheme: dark) {{
      .email-body, .email-card, .email-header, .email-footer {{
        background-color: #FFFFFF !important;
        color: #121B1E !important;
      }}
    }}
  </style>
</head>
<body class="email-body" style="margin:0;padding:0;background-color:{EMAIL_SURFACE};-webkit-text-size-adjust:100%;color-scheme:light only;font-family:Inter,Segoe UI,system-ui,-apple-system,sans-serif;">
  {cls._preheader(preheader or title)}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:{EMAIL_SURFACE};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" class="email-card" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:{EMAIL_CARD};border:1px solid {EMAIL_BORDER};border-radius:12px;overflow:hidden;">
          <!-- Header: light so teal logo is visible -->
          <tr>
            <td class="email-header" style="background-color:{EMAIL_CARD};padding:0;border-bottom:1px solid {EMAIL_BORDER};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:28px 28px 20px;text-align:center;background-color:{EMAIL_CARD};">
                    <img src="{EMAIL_LOGO}" width="56" height="65" alt="Tawala"
                         style="display:inline-block;border:0;outline:none;height:65px;width:auto;max-width:56px;vertical-align:middle;" />
                    <div style="margin-top:14px;color:{EMAIL_PRIMARY};font-size:20px;font-weight:700;letter-spacing:0.04em;">
                      Tawala
                    </div>
                    <div style="margin-top:4px;color:{EMAIL_MUTED};font-size:12px;letter-spacing:0.04em;">
                      Control your biashara
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="height:4px;background-color:{EMAIL_PRIMARY};font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 28px 16px;background-color:{EMAIL_CARD};">
              {eyebrow_html}
              <h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;font-weight:700;color:{EMAIL_BODY};">{title}</h1>
              {body_html}
            </td>
          </tr>
          <!-- Footer: stronger contrast -->
          <tr>
            <td class="email-footer" style="background-color:{EMAIL_CARD};border-top:2px solid {EMAIL_BORDER};padding:22px 28px 26px;">
              <p style="margin:0 0 10px;font-size:13px;line-height:1.5;color:{EMAIL_BODY};text-align:center;font-weight:600;">
                Tawala · Built for Kenyan retailers
              </p>
              <p style="margin:0 0 10px;font-size:13px;line-height:1.55;color:{EMAIL_BODY};text-align:center;">
                <a href="{EMAIL_SITE}" style="color:{EMAIL_PRIMARY};text-decoration:underline;font-weight:600;">tawala.nethub.co.ke</a>
                &nbsp;·&nbsp;
                <a href="{EMAIL_SUPPORT}" style="color:{EMAIL_PRIMARY};text-decoration:underline;">Support</a>
                &nbsp;·&nbsp;
                <a href="{EMAIL_SITE}/legal/privacy" style="color:{EMAIL_PRIMARY};text-decoration:underline;">Privacy</a>
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:{EMAIL_MUTED};text-align:center;">
                You received this because of an account action on Tawala. If this was not you, contact support.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    @staticmethod
    def _cta(url: str, label: str) -> str:
        return (
            f'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 18px;">'
            f'<tr><td align="center">'
            f'<a href="{url}" target="_blank" rel="noopener" '
            f'style="background-color:{EMAIL_PRIMARY};color:{EMAIL_ON_PRIMARY};'
            f'padding:14px 32px;text-decoration:none;border-radius:8px;'
            f'font-weight:700;font-size:15px;display:inline-block;">{label}</a>'
            f'</td></tr></table>'
        )

    @staticmethod
    def _p(text: str) -> str:
        return (
            f'<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:{EMAIL_BODY};">'
            f"{text}</p>"
        )

    @staticmethod
    def _muted(text: str) -> str:
        return (
            f'<p style="margin:0 0 10px;font-size:13px;line-height:1.55;color:{EMAIL_MUTED};">'
            f"{text}</p>"
        )

    @staticmethod
    def _raw_link(url: str) -> str:
        return (
            f'<p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:{EMAIL_MUTED};word-break:break-all;">'
            f'If the button does not work, open this link:<br/>'
            f'<a href="{url}" style="color:{EMAIL_PRIMARY};">{url}</a></p>'
        )

    # =========================================================================
    # CUSTOMER TEMPLATES
    # =========================================================================

    @classmethod
    def send_platform_login_code(
        cls,
        to_email: str,
        code: str,
        user_name: Optional[str] = None,
        ip_address: Optional[str] = None,
        expire_minutes: int = 10,
    ) -> None:
        """Platform operator login MFA — six-digit email code (issue #298)."""
        name = (user_name or "").strip() or "there"
        ip = ip_address or "Unknown"
        time_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        body = (
            cls._p(f"Hello {name},")
            + cls._p(
                "Use this code to finish signing in to the <strong>Tawala platform</strong> console. "
                f"It expires in <strong>{expire_minutes} minutes</strong>."
            )
            + cls._p(
                f'<span style="font-size:28px;letter-spacing:6px;font-weight:700;'
                f'font-family:ui-monospace,monospace;">{code}</span>'
            )
            + cls._muted(
                "If you did not try to sign in, ignore this email and consider rotating your password."
            )
            + cls._muted(f"Request time: {time_str} · IP: {ip}")
        )
        html = cls.render_shell(
            title="Your platform sign-in code",
            preheader=f"Platform login code expires in {expire_minutes} minutes",
            eyebrow="Security",
            body_html=body,
        )
        cls.send_transactional_email(
            sender=settings.email_from_security,
            to_addresses=[to_email],
            subject="Your Tawala platform sign-in code",
            html_content=html,
        )

    @classmethod
    def send_platform_user_invite(
        cls,
        to_email: str,
        *,
        temporary_password: str,
        login_url: str,
        user_name: Optional[str] = None,
        inviter_name: Optional[str] = None,
    ) -> None:
        """Platform operator invite — generated password + login CTA (no hardcoded bootstrap)."""
        name = (user_name or "").strip() or "there"
        inviter = (inviter_name or "").strip() or "A platform administrator"
        body = (
            cls._p(f"Hello {name},")
            + cls._p(
                f"{inviter} invited you to the <strong>Tawala platform</strong> operator console."
            )
            + cls._p(
                "Use the temporary password below for your first sign-in. "
                "You will also need the email verification code (MFA) when that step is enabled."
            )
            + cls._p(
                f'<span style="font-size:16px;font-family:ui-monospace,monospace;'
                f'letter-spacing:1px;"><strong>{temporary_password}</strong></span>'
            )
            + cls._p(
                "After you sign in the first time, you will be asked to "
                "<strong>change this password</strong> before continuing."
            )
            + cls._cta(login_url, "Sign in to platform")
            + cls._muted(
                "If you were not expecting this invitation, ignore this email and contact support."
            )
            + cls._raw_link(login_url)
        )
        html = cls.render_shell(
            title="Your Tawala platform invitation",
            preheader="Temporary password and platform sign-in link",
            eyebrow="Platform access",
            body_html=body,
        )
        cls.send_transactional_email(
            sender=settings.email_from_security,
            to_addresses=[to_email],
            subject="You are invited to the Tawala platform",
            html_content=html,
        )

    @classmethod
    def send_password_reset(
        cls,
        to_email: str,
        reset_url: str,
        user_name: Optional[str] = None,
        ip_address: Optional[str] = None,
        expire_minutes: int = 15,
    ) -> None:
        """Password recovery — security-first hierarchy."""
        name = (user_name or "").strip() or "there"
        ip = ip_address or "Unknown"
        time_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        body = (
            cls._p(f"Hello {name},")
            + cls._p(
                f"We received a request to reset the password for <strong>{to_email}</strong>. "
                f"This link expires in <strong>{expire_minutes} minutes</strong>."
            )
            + cls._cta(reset_url, "Reset password")
            + cls._muted(
                "If you did not request this, you can ignore this email — your password will stay the same."
            )
            + cls._muted(f"Request time: {time_str} · IP: {ip}")
            + cls._raw_link(reset_url)
        )
        html = cls.render_shell(
            title="Reset your Tawala password",
            preheader=f"Password reset link expires in {expire_minutes} minutes",
            eyebrow="Security",
            body_html=body,
        )
        cls.send_transactional_email(
            sender=settings.email_from_security,
            to_addresses=[to_email],
            subject="Reset your Tawala password",
            html_content=html,
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
        """Verify email + set password + start 14-day Ndovu trial."""
        name = (user_name or "").strip() or "there"
        ip = ip_address or "Unknown"
        body = (
            cls._p(f"Hello {name},")
            + cls._p(
                "You are one step away from <strong>Ndovu</strong> — our recommended plan for Kenyan shops. "
                "Set your password to verify your email and activate <strong>14 days free</strong>. "
                "No credit card required."
            )
            + cls._cta(setup_url, "Set password &amp; start trial")
            + (
                f'<p style="margin:0 0 8px;font-weight:600;font-size:14px;color:{EMAIL_BODY};">'
                f"Get value in the next 10 minutes:</p>"
                f'<ol style="margin:0 0 16px;padding-left:20px;color:{EMAIL_MUTED};font-size:14px;line-height:1.6;">'
                f"<li style=\"margin-bottom:4px;\">Confirm your business name and phone</li>"
                f"<li style=\"margin-bottom:4px;\">Add your first products</li>"
                f"<li style=\"margin-bottom:4px;\">Create a staff PIN for the counter</li>"
                f"</ol>"
            )
            + cls._muted(f"This link expires in <strong>{expire_minutes} minutes</strong>.")
            + cls._muted(
                "If you did not create a Tawala account, you can ignore this email."
            )
            + cls._muted(f"Request IP: {ip}")
            + cls._raw_link(setup_url)
        )
        html = cls.render_shell(
            title="Confirm your email to start selling",
            preheader="14 days free on Ndovu — set your password, no card required",
            eyebrow="14-day free trial",
            body_html=body,
        )
        cls.send_transactional_email(
            sender=settings.email_from_tawala,
            to_addresses=[to_email],
            subject="Set your password and start your 14-day Ndovu trial",
            html_content=html,
        )

    @classmethod
    def send_staff_invite(
        cls,
        to_email: str,
        invite_url: str,
        user_name: Optional[str] = None,
        org_name: Optional[str] = None,
        role_label: Optional[str] = None,
        invited_by_name: Optional[str] = None,
        expire_hours: int = 48,
    ) -> None:
        """Invite pending staff to set password and join the organisation."""
        name = (user_name or "").strip() or "there"
        org = (org_name or "").strip() or "your team"
        role = (role_label or "").strip() or "team member"
        inviter = (invited_by_name or "").strip()
        who = (
            f"<strong>{inviter}</strong> invited you to join as <strong>{role}</strong>."
            if inviter
            else f"You have been invited to join as <strong>{role}</strong>."
        )
        body = (
            cls._p(f"Hello {name},")
            + cls._p(who)
            + (
                f'<table width="100%" style="margin:16px 0 8px;border-collapse:collapse;font-size:13px;">'
                f'<tr><td style="padding:8px 0;border-bottom:1px solid {EMAIL_BORDER};color:{EMAIL_MUTED};">Organisation</td>'
                f'<td style="padding:8px 0;border-bottom:1px solid {EMAIL_BORDER};text-align:right;color:{EMAIL_BODY};font-weight:600;">{org}</td></tr>'
                f'<tr><td style="padding:8px 0;border-bottom:1px solid {EMAIL_BORDER};color:{EMAIL_MUTED};">Role</td>'
                f'<td style="padding:8px 0;border-bottom:1px solid {EMAIL_BORDER};text-align:right;color:{EMAIL_BODY};font-weight:600;">{role}</td></tr>'
                f"</table>"
            )
            + cls._cta(invite_url, f"Accept invite")
            + cls._muted(
                "After joining, use your PIN on shared shop devices so every sale is tied to you."
            )
            + cls._muted(f"This invite expires in <strong>{expire_hours} hours</strong>.")
            + cls._muted("If you were not expecting this, you can ignore this email.")
            + cls._raw_link(invite_url)
        )
        html = cls.render_shell(
            title=f"You&rsquo;re invited to join {org}",
            preheader=f"Join {org} on Tawala as {role}",
            eyebrow="Staff invite",
            body_html=body,
        )
        cls.send_transactional_email(
            sender=settings.email_from_tawala,
            to_addresses=[to_email],
            subject=f"You're invited to join {org} on Tawala",
            html_content=html,
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
        invoice: Optional[dict] = None,
    ) -> None:
        """Email the generated trial invoice (zero amount) — not an empty notice."""
        open_url = (dashboard_url or "").strip() or f"{EMAIL_SITE}/org"
        org = (org_name or "").strip() or "your business"
        inv = invoice or {}
        inv_no = (inv.get("invoice_number") or "").strip() or "TRIAL-DRAFT"
        cur = (inv.get("currency") or currency or "KES").strip()
        issue = inv.get("issue_date") or start_date
        bill = inv.get("bill_to") or {}
        bill_name = (bill.get("name") or org).strip()
        bill_email = (bill.get("email") or to_email or "").strip()
        lines = inv.get("line_items") or [
            {
                "description": f"{plan_name} — {trial_days}-day free trial",
                "quantity": 1,
                "unit_price": 0,
                "amount": 0,
            }
        ]
        rows_html = ""
        for li in lines:
            desc = (li.get("description") or "Trial").strip()
            amt = float(li.get("amount") or 0)
            rows_html += (
                f'<tr>'
                f'<td style="padding:10px 0;border-bottom:1px solid {EMAIL_BORDER};color:{EMAIL_BODY};">{desc}</td>'
                f'<td style="padding:10px 0;border-bottom:1px solid {EMAIL_BORDER};text-align:right;color:{EMAIL_BODY};">'
                f'{amt:,.2f} {cur}</td></tr>'
            )
        total = float(inv.get("total_amount") if inv.get("total_amount") is not None else 0)
        notes = (inv.get("notes") or "").strip()

        body = (
            cls._p(f"Hello,")
            + cls._p(
                f"Here is your <strong>trial invoice</strong> for <strong>{org}</strong>. "
                f"Amount due today is <strong>0 {cur}</strong> — no payment is required to start."
            )
            + (
                f'<table width="100%" style="margin:8px 0 16px;border-collapse:collapse;font-size:13px;">'
                f'<tr><td style="padding:4px 0;color:{EMAIL_MUTED};">Invoice</td>'
                f'<td style="padding:4px 0;text-align:right;font-weight:700;color:{EMAIL_BODY};">{inv_no}</td></tr>'
                f'<tr><td style="padding:4px 0;color:{EMAIL_MUTED};">Issue date</td>'
                f'<td style="padding:4px 0;text-align:right;color:{EMAIL_BODY};">{issue}</td></tr>'
                f'<tr><td style="padding:4px 0;color:{EMAIL_MUTED};">Bill to</td>'
                f'<td style="padding:4px 0;text-align:right;color:{EMAIL_BODY};">{bill_name}<br/>{bill_email}</td></tr>'
                f'<tr><td style="padding:4px 0;color:{EMAIL_MUTED};">Trial window</td>'
                f'<td style="padding:4px 0;text-align:right;color:{EMAIL_BODY};">{start_date} → {end_date}</td></tr>'
                f"</table>"
            )
            + (
                f'<table width="100%" style="margin:12px 0;border-collapse:collapse;font-size:13px;">'
                f'<tr><td style="padding:8px 0;border-bottom:2px solid {EMAIL_BORDER};color:{EMAIL_MUTED};font-weight:600;">Description</td>'
                f'<td style="padding:8px 0;border-bottom:2px solid {EMAIL_BORDER};text-align:right;color:{EMAIL_MUTED};font-weight:600;">Amount</td></tr>'
                f"{rows_html}"
                f'<tr><td style="padding:12px 0 4px;color:{EMAIL_MUTED};">Subtotal</td>'
                f'<td style="padding:12px 0 4px;text-align:right;color:{EMAIL_BODY};">0.00 {cur}</td></tr>'
                f'<tr><td style="padding:4px 0;color:{EMAIL_MUTED};">Tax</td>'
                f'<td style="padding:4px 0;text-align:right;color:{EMAIL_BODY};">0.00 {cur}</td></tr>'
                f'<tr><td style="padding:8px 0;font-weight:700;color:{EMAIL_BODY};">Total / amount due</td>'
                f'<td style="padding:8px 0;text-align:right;font-weight:700;color:{EMAIL_SUCCESS};">{total:,.2f} {cur}</td></tr>'
                f"</table>"
            )
            + (cls._p(notes) if notes else "")
            + cls._p(
                "Next steps: confirm business details, add products, and create a staff PIN."
            )
            + cls._cta(open_url, "Open Tawala")
            + cls._muted(
                f"Upgrade or cancel before {end_date}. Keep this invoice for your records."
            )
            + cls._raw_link(open_url)
        )
        html = cls.render_shell(
            title=f"Trial invoice {inv_no}",
            preheader=f"Invoice {inv_no} · 0 {cur} due · {trial_days}-day {plan_name} trial",
            eyebrow="Trial invoice · no charge",
            body_html=body,
        )
        cls.send_transactional_email(
            sender=settings.email_from_billing,
            to_addresses=[to_email],
            subject=f"Trial invoice {inv_no} · {org}",
            html_content=html,
        )


    @classmethod
    def send_testing(cls, to_email: str, metadata: Optional[dict] = None) -> None:
        """Internal pipeline sanity check — not for customers."""
        meta = metadata or {}
        body = (
            cls._p("NetHub mail system diagnostic.")
            + cls._muted(
                f"Timestamp (UTC): {datetime.now(timezone.utc).isoformat()}"
            )
            + cls._muted(f"Metadata: {meta or 'None'}")
        )
        html = cls.render_shell(
            title="Diagnostic test mail",
            preheader="Tawala mail pipeline test",
            body_html=body,
        )
        cls.send_transactional_email(
            sender=settings.email_from_security,
            to_addresses=[to_email],
            subject="[Diagnostic] Tawala test mail",
            html_content=html,
        )

    @classmethod
    def send_welcome(cls, to_email: str, username: str) -> None:
        """Lightweight welcome — prefer send_onboarding_setup for new signups."""
        name = (username or "").strip() or "there"
        body = (
            cls._p(f"Hello {name},")
            + cls._p(
                "Welcome to Tawala. Your account is ready — open the app to manage stock, staff PINs, and daily profit."
            )
            + cls._cta(f"{EMAIL_SITE}/login", "Log in to Tawala")
            + cls._raw_link(f"{EMAIL_SITE}/login")
        )
        html = cls.render_shell(
            title="Welcome to Tawala",
            preheader="Your shop OS is ready",
            body_html=body,
        )
        cls.send_transactional_email(
            sender=settings.email_from_tawala,
            to_addresses=[to_email],
            subject="Welcome to Tawala",
            html_content=html,
        )


    @classmethod
    def send_sale_receipt(
        cls,
        to_email: str,
        *,
        business_name: str,
        document_number: str,
        issued_at: str,
        currency: str,
        total_amount: float,
        payment_method: str,
        is_invoice: bool = False,
        balance_due: float = 0.0,
        customer_name: Optional[str] = None,
        preview_url: Optional[str] = None,
        line_summary: Optional[str] = None,
    ) -> None:
        """Email customer a sale receipt or open-credit invoice summary."""
        name = (customer_name or "").strip() or "there"
        shop = (business_name or "").strip() or "your shop"
        cur = currency or "KES"
        total = f"{float(total_amount):,.2f}"
        due = f"{float(balance_due):,.2f}"
        if is_invoice and balance_due > 0.001:
            title = "Invoice — amount due"
            preheader = f"{shop} · {cur} {due} due · {document_number}"
            eyebrow = "Credit sale"
            lead = (
                cls._p(f"Hello {name},")
                + cls._p(
                    f"<strong>{shop}</strong> recorded a credit sale. "
                    f"Amount due: <strong>{cur} {due}</strong>."
                )
            )
            total_row_label = "Amount due"
            total_row_value = f"{cur} {due}"
            total_color = EMAIL_CREDIT
        else:
            title = "Payment received"
            preheader = f"{shop} · {cur} {total} · {document_number}"
            eyebrow = "Receipt"
            lead = (
                cls._p(f"Hello {name},")
                + cls._p(
                    f"Payment received at <strong>{shop}</strong>. "
                    f"Total: <strong>{cur} {total}</strong>."
                )
            )
            total_row_label = "Total paid"
            total_row_value = f"{cur} {total}"
            total_color = EMAIL_SUCCESS

        facts = (
            f'<table width="100%" style="margin:16px 0 12px;border-collapse:collapse;font-size:13px;">'
            f'<tr><td style="padding:8px 0;border-bottom:1px solid {EMAIL_BORDER};color:{EMAIL_MUTED};">Document</td>'
            f'<td style="padding:8px 0;border-bottom:1px solid {EMAIL_BORDER};text-align:right;color:{EMAIL_BODY};font-weight:600;">{document_number}</td></tr>'
            f'<tr><td style="padding:8px 0;border-bottom:1px solid {EMAIL_BORDER};color:{EMAIL_MUTED};">Date</td>'
            f'<td style="padding:8px 0;border-bottom:1px solid {EMAIL_BORDER};text-align:right;color:{EMAIL_BODY};">{issued_at}</td></tr>'
            f'<tr><td style="padding:8px 0;border-bottom:1px solid {EMAIL_BORDER};color:{EMAIL_MUTED};">Payment</td>'
            f'<td style="padding:8px 0;border-bottom:1px solid {EMAIL_BORDER};text-align:right;color:{EMAIL_BODY};">{payment_method}</td></tr>'
            f'<tr><td style="padding:8px 0;color:{EMAIL_MUTED};">{total_row_label}</td>'
            f'<td style="padding:8px 0;text-align:right;color:{total_color};font-weight:700;">{total_row_value}</td></tr>'
            f"</table>"
        )
        lines = ""
        if line_summary:
            lines = cls._muted(line_summary)
        cta = ""
        if preview_url:
            cta = cls._cta(preview_url, "View document") + cls._raw_link(preview_url)
        body = lead + facts + lines + cta + cls._muted(
            "Keep this email for your records. Contact the shop if anything looks wrong."
        )
        html = cls.render_shell(
            title=title,
            preheader=preheader,
            eyebrow=eyebrow,
            body_html=body,
        )
        subject = (
            f"Invoice {document_number} · {cur} {due} due"
            if is_invoice and balance_due > 0.001
            else f"Receipt {document_number} · {cur} {total}"
        )
        cls.send_transactional_email(
            sender=settings.email_from_tawala,
            to_addresses=[to_email],
            subject=subject,
            html_content=html,
        )

    @classmethod
    def send_credit_collected(
        cls,
        to_email: str,
        *,
        business_name: str,
        document_number: str,
        collected_at: str,
        currency: str,
        amount: float,
        payment_method: str,
        customer_name: Optional[str] = None,
        preview_url: Optional[str] = None,
    ) -> None:
        """Confirm credit collection — balance closed."""
        name = (customer_name or "").strip() or "there"
        shop = (business_name or "").strip() or "your shop"
        cur = currency or "KES"
        amt = f"{float(amount):,.2f}"
        body = (
            cls._p(f"Hello {name},")
            + cls._p(
                f"We received your payment of <strong>{cur} {amt}</strong> at "
                f"<strong>{shop}</strong>. Your open balance on this sale is now settled."
            )
            + (
                f'<table width="100%" style="margin:16px 0 12px;border-collapse:collapse;font-size:13px;">'
                f'<tr><td style="padding:8px 0;border-bottom:1px solid {EMAIL_BORDER};color:{EMAIL_MUTED};">Reference</td>'
                f'<td style="padding:8px 0;border-bottom:1px solid {EMAIL_BORDER};text-align:right;color:{EMAIL_BODY};font-weight:600;">{document_number}</td></tr>'
                f'<tr><td style="padding:8px 0;border-bottom:1px solid {EMAIL_BORDER};color:{EMAIL_MUTED};">Collected</td>'
                f'<td style="padding:8px 0;border-bottom:1px solid {EMAIL_BORDER};text-align:right;color:{EMAIL_BODY};">{collected_at}</td></tr>'
                f'<tr><td style="padding:8px 0;border-bottom:1px solid {EMAIL_BORDER};color:{EMAIL_MUTED};">Method</td>'
                f'<td style="padding:8px 0;border-bottom:1px solid {EMAIL_BORDER};text-align:right;color:{EMAIL_BODY};">{payment_method}</td></tr>'
                f'<tr><td style="padding:8px 0;color:{EMAIL_MUTED};">Amount</td>'
                f'<td style="padding:8px 0;text-align:right;color:{EMAIL_SUCCESS};font-weight:700;">{cur} {amt}</td></tr>'
                f"</table>"
            )
            + (cls._cta(preview_url, "View receipt") + cls._raw_link(preview_url) if preview_url else "")
            + cls._muted("Thank you for settling your account.")
        )
        html = cls.render_shell(
            title="Payment collected",
            preheader=f"{shop} · {cur} {amt} collected · {document_number}",
            eyebrow="Credit settled",
            body_html=body,
        )
        cls.send_transactional_email(
            sender=settings.email_from_billing,
            to_addresses=[to_email],
            subject=f"Payment collected · {cur} {amt} · {document_number}",
            html_content=html,
        )



    @classmethod
    def send_trial_ending(
        cls,
        to_email: str,
        *,
        org_name: str,
        plan_name: str,
        days_left: int,
        end_date: str,
        billing_url: Optional[str] = None,
        owner_name: Optional[str] = None,
    ) -> None:
        """Remind owner that the free trial ends soon — upgrade or continue risk."""
        name = (owner_name or "").strip() or "there"
        org = (org_name or "").strip() or "your business"
        plan = (plan_name or "").strip() or "your plan"
        days = max(0, int(days_left))
        if days <= 0:
            urgency = "Your trial ends today"
            preheader = f"{org} · trial ends today · {plan}"
        elif days == 1:
            urgency = "Your trial ends tomorrow"
            preheader = f"{org} · 1 day left on trial · {plan}"
        else:
            urgency = f"Your trial ends in {days} days"
            preheader = f"{org} · {days} days left on trial · {plan}"

        open_url = (billing_url or "").strip() or f"{EMAIL_SITE}/org"
        body = (
            cls._p(f"Hello {name},")
            + cls._p(
                f"<strong>{urgency}.</strong> "
                f"<strong>{org}</strong> is still on the free trial of <strong>{plan}</strong> "
                f"(ends <strong>{end_date}</strong>)."
            )
            + cls._p(
                "Upgrade before the trial ends to keep selling, stock, and staff access without interruption. "
                "No card was charged for the trial."
            )
            + (
                f'<table width="100%" style="margin:16px 0 12px;border-collapse:collapse;font-size:13px;">'
                f'<tr><td style="padding:8px 0;border-bottom:1px solid {EMAIL_BORDER};color:{EMAIL_MUTED};">Organisation</td>'
                f'<td style="padding:8px 0;border-bottom:1px solid {EMAIL_BORDER};text-align:right;color:{EMAIL_BODY};font-weight:600;">{org}</td></tr>'
                f'<tr><td style="padding:8px 0;border-bottom:1px solid {EMAIL_BORDER};color:{EMAIL_MUTED};">Plan</td>'
                f'<td style="padding:8px 0;border-bottom:1px solid {EMAIL_BORDER};text-align:right;color:{EMAIL_BODY};">{plan}</td></tr>'
                f'<tr><td style="padding:8px 0;border-bottom:1px solid {EMAIL_BORDER};color:{EMAIL_MUTED};">Days left</td>'
                f'<td style="padding:8px 0;border-bottom:1px solid {EMAIL_BORDER};text-align:right;color:{EMAIL_CREDIT};font-weight:700;">{days}</td></tr>'
                f'<tr><td style="padding:8px 0;color:{EMAIL_MUTED};">Trial ends</td>'
                f'<td style="padding:8px 0;text-align:right;color:{EMAIL_BODY};font-weight:600;">{end_date}</td></tr>'
                f"</table>"
            )
            + cls._cta(open_url, "View plans &amp; upgrade")
            + cls._raw_link(open_url)
            + cls._muted(
                "If you already upgraded, you can ignore this email. "
                "Questions? Reply or visit Support."
            )
        )
        html = cls.render_shell(
            title=urgency,
            preheader=preheader,
            eyebrow="Trial reminder",
            body_html=body,
        )
        subject = (
            f"Trial ends today · {org}"
            if days <= 0
            else f"Trial ends in {days} day{'s' if days != 1 else ''} · {org}"
        )
        cls.send_transactional_email(
            sender=settings.email_from_billing,
            to_addresses=[to_email],
            subject=subject,
            html_content=html,
        )


    @classmethod
    def send_grace_reminder(
        cls,
        to_email: str,
        *,
        org_name: str,
        plan_name: str,
        days_left: int,
        grace_end_date: str,
        billing_url: Optional[str] = None,
        owner_name: Optional[str] = None,
    ) -> None:
        """Remind owner they are in the post-trial grace window before lock."""
        name = (owner_name or "").strip() or "there"
        org = (org_name or "").strip() or "your business"
        plan = (plan_name or "").strip() or "your plan"
        days = max(0, int(days_left))
        if days <= 0:
            urgency = "Your grace period ends today"
            preheader = f"{org} · access locks today · {plan}"
        elif days == 1:
            urgency = "Your grace period ends tomorrow"
            preheader = f"{org} · 1 day left before lock · {plan}"
        else:
            urgency = f"Your grace period ends in {days} days"
            preheader = f"{org} · {days} days left before lock · {plan}"

        open_url = (billing_url or "").strip() or f"{EMAIL_SITE}/org"
        body = (
            cls._p(f"Hello {name},")
            + cls._p(
                f"<strong>{urgency}.</strong> "
                f"The free trial for <strong>{org}</strong> has ended. "
                f"Your team can still use Tawala until <strong>{grace_end_date}</strong>, "
                f"then workspaces will lock until payment is completed."
            )
            + cls._p(
                f"Please open billing and choose a plan for <strong>{plan}</strong> "
                f"so staff are not locked out."
            )
            + cls._cta(open_url, "Open billing")
            + cls._p(
                "If you need a short extension, contact Tawala support — "
                "only our platform team can extend grace."
            )
        )
        html = cls.render_shell(
            title=urgency,
            preheader=preheader,
            eyebrow="Grace period",
            body_html=body,
        )
        subject = (
            f"Grace ends today · {org}"
            if days <= 0
            else f"Grace ends in {days} day{'s' if days != 1 else ''} · {org}"
        )
        cls.send_transactional_email(
            sender=settings.email_from_billing,
            to_addresses=[to_email],
            subject=subject,
            html_content=html,
        )


mailer = EmailService()

