"""Grace reminder email method is on EmailService."""
from app.core.mailer import EmailService, mailer


def test_send_grace_reminder_exists():
    assert hasattr(EmailService, "send_grace_reminder")
    assert callable(getattr(EmailService, "send_grace_reminder"))
    assert mailer is not None
