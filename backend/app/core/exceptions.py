from typing import Any, Optional


class BaseAppException(Exception):
    """
    Base exception class for all custom application errors.
    Provides uniform attributes for global HTTP error mapping.
    """

    def __init__(
        self, message: str, status_code: int = 500, details: Optional[Any] = None
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)


class PermissionDeniedException(BaseAppException):
    """Raised when an authenticated user attempts an operation outside their assigned role permissions."""

    def __init__(
        self,
        message: str = "Permission denied: Insufficient privileges.",
        details: Optional[Any] = None,
    ) -> None:
        super().__init__(message=message, status_code=403, details=details)


class DatabaseOperationException(BaseAppException):
    """Raised when an unhandled database exception (e.g., query error, connection drop) occurs."""

    def __init__(
        self,
        message: str = "A database error occurred while processing your request.",
        details: Optional[Any] = None,
    ) -> None:
        super().__init__(message=message, status_code=500, details=details)
