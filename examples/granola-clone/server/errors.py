"""One error type for the whole API, rendered as { "error": code, "message": text }."""


class ApiError(Exception):
    def __init__(self, status, code, message):
        self.status = status
        self.code = code
        self.message = message


def unauthorized():
    return ApiError(401, "unauthorized", "Missing or invalid token")


def invalid_input(message):
    return ApiError(400, "invalid_input", message)
