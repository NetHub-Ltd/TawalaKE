# import os
# from typing import List, Optional
# from fastapi import FastAPI, BackgroundTasks, HTTPException, status
# from pydantic import BaseModel, EmailStr
# from pydantic_settings import BaseSettings, SettingsConfigDict
# import resend
# from app.core.config import settings
# from app.utils.logging import logger

# # ==========================================
# # 1. CONFIGURATION & SETTINGS LAYER
# # ==========================================

# resend.api_key = settings.resend_api_key



# # ==========================================
# # 3. EMAIL SERVICE UTILITY
# # ==========================================
# class EmailService:
#     @staticmethod
#     def send_transactional_email(
#         sender: str, 
#         to_addresses: List[str], 
#         subject: str, 
#         html_content: str,
#         reply_to: Optional[bool] = False
#     ) -> None:
#         """
#         Synchronous wrapper execution for Resend API.
#         Designed to run inside FastAPI's BackgroundTasks worker thread.
#         """
#         try:
#             payload = {
#                 "from": sender,
#                 "to": to_addresses,
#                 "subject": subject,
#                 "html": html_content,
#             }
#             if reply_to:
#                 payload["reply_to"] = reply_to
                
#             resend.Emails.send(payload)
#         except Exception as e:
#             # In production, route this to your logging infrastructure (e.g., Loguru / Sentry)
#             print(f"[ERROR] Failed to send email via Resend: {str(e)}")


# mailer = EmailService

import os
from datetime import datetime, timezone
from typing import List, Optional
import resend
from app.core.config import settings
from app.utils.logging import logger

# Initialize the Resend client globally
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
        Designed to run inside FastAPI's BackgroundTasks worker thread.
        """
        start_time = datetime.now(timezone.utc)
        try:
            payload = {
                "from": sender,
                "to": to_addresses,
                "subject": subject,
                "html": html_content,
            }
            if reply_to:
                payload["reply_to"] = reply_to
                
            response = resend.Emails.send(payload)
            
            # Log successful dispatch with metrics
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

    # ==========================================
    # CORE APPLICATION ENVIRONMENT ECOSYSTEM METHODS
    # ==========================================

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
        <p>Get started by exploring your customized service dashboards.</p>
        """
        cls.send_transactional_email(
            sender=settings.email_from_security,
            to_addresses=[to_email],
            subject=f"Welcome to NetHub, {username}",
            html_content=html
        )

    @classmethod
    def send_verification(cls, to_email: str, verification_url: str) -> None:
        """Dispatched during verification checkpoints."""
        html = f"""
        <h2>Verify Your Email Address</h2>
        <p>Please click the secure link below to verify your account identity:</p>
        <p><a href="{verification_url}" style="padding: 10px 20px; background-color: #0f172a; color: #fff; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a></p>
        <p style="font-size: 12px; color: #94a3b8;">This link will expire in 24 hours.</p>
        """
        cls.send_transactional_email(
            sender=settings.email_from_security,
            to_addresses=[to_email],
            subject="[NetHub] Verify Your Email Address",
            html_content=html
        )

    @classmethod
    def send_password_reset(cls, to_email: str, reset_url: str) -> None:
        """Dispatched during password recovery flows."""
        html = f"""
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password. Click the secure link below to proceed:</p>
        <p><a href="{reset_url}" style="padding: 10px 20px; background-color: #ef4444; color: #fff; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
        <p style="font-size: 12px; color: #94a3b8;">If you did not make this request, you can safely ignore this email.</p>
        """
        cls.send_transactional_email(
            sender=settings.email_from_security,
            to_addresses=[to_email],
            subject="[CRITICAL] NetHub Password Reset Request",
            html_content=html
        )

    @classmethod
    def send_newsletter(cls, to_addresses: List[str], subject: str, html_content: str) -> None:
        """Dispatched for marketing broadcast sequences."""
        cls.send_transactional_email(
            sender=settings.email_from_marketing,
            to_addresses=to_addresses,
            subject=subject,
            html_content=html_content
        )

    @classmethod
    def send_system_notice(cls, to_email: str, action_title: str, status_details: str) -> None:
        """Dispatched for infrastructure background updates (Tawala pipeline logs, etc.)."""
        html = f"""
        <h3>[System Log] {action_title}</h3>
        <p><strong>Status:</strong> {status_details}</p>
        <p><strong>Execution Time:</strong> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
        """
        cls.send_transactional_email(
            sender=settings.email_from_tawala,
            to_addresses=[to_email],
            subject=f"[Tawala] {action_title}",
            html_content=html
        )


mailer = EmailService


# from fastapi import APIRouter, BackgroundTasks, status
# from app.services.mail import mailer # Assuming file is mail.py

# router = APIRouter()

# @router.post("/auth/forgot-password", status_code=status.HTTP_202_ACCEPTED)
# async def forgot_password(email: str, background_tasks: BackgroundTasks):
#     # ... validation or database lookup logic ...
#     reset_link = "https://nethub.co.ke/auth/reset?token=xyz"
    
#     background_tasks.add_task(
#         mailer.send_password_reset,
#         to_email=email,
#         reset_url=reset_link
#     )
#     return {"status": "accepted", "message": "Reset processing."}