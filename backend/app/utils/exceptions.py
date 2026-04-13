from fastapi import HTTPException, status


class InvalidCredentials(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Invalid email or password."},
        )


class TokenExpired(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_EXPIRED", "message": "Token has expired."},
        )


class TokenInvalid(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_INVALID", "message": "Invalid token."},
        )


class AccountDeactivated(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ACCOUNT_DEACTIVATED", "message": "Account is deactivated."},
        )


class Forbidden(HTTPException):
    def __init__(self, message: str = "Insufficient permissions."):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": message},
        )


class NotFound(HTTPException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"{resource} not found."},
        )


class DuplicateEmail(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "DUPLICATE_EMAIL", "message": "Email already registered."},
        )


class FileTooLarge(HTTPException):
    def __init__(self, max_mb: int = 50):
        super().__init__(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={"code": "FILE_TOO_LARGE", "message": f"File exceeds {max_mb}MB limit."},
        )


class InvalidFileType(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_FILE_TYPE", "message": "Only PDF files are accepted."},
        )


class DocumentProcessing(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "DOCUMENT_PROCESSING", "message": "Document is still being processed."},
        )


class RateLimited(HTTPException):
    def __init__(self, retry_after: int = 300):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "RATE_LIMITED", "message": "Too many attempts. Try again later."},
            headers={"Retry-After": str(retry_after)},
        )


class LLMUnavailable(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "LLM_UNAVAILABLE", "message": "AI service is temporarily unavailable."},
        )
