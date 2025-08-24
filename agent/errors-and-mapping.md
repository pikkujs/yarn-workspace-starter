# Errors & Mapping

All errors must extend `PikkuError` and be registered centrally with `addError`.
Most common errors are already available in `@pikku/core/errors`.

---

## Registered Errors

```
BadRequestError
UnauthorizedError
MissingSessionError
InvalidSessionError
PaymentRequiredError
ForbiddenError
InvalidOriginError
NotFoundError
MethodNotAllowedError
NotAcceptableError
ProxyAuthenticationRequiredError
RequestTimeoutError
ConflictError
GoneError
LengthRequiredError
PreconditionFailedError
PayloadTooLargeError
URITooLongError
UnsupportedMediaTypeError
RangeNotSatisfiableError
ExpectationFailedError
UnprocessableContentError
LockedError
TooManyRequestsError
InternalServerError
NotImplementedError
BadGatewayError
ServiceUnavailableError
GatewayTimeoutError
HTTPVersionNotSupportedError
MaxComputeTimeReachedError
```

---

## Mapping Rules

* **`status`** — required HTTP status code mapping (for HTTP transport).
* **`mcpCode`** — optional MCP-specific error code.
* **`message`** — default developer-friendly message.

---

## Creating Custom Errors

You can create your own error class and register it:

```ts
export class PaymentFailedError extends PikkuError {}

addError(PaymentFailedError, {
  status: 402,
  mcpCode: 1001,
  message: 'Payment could not be processed',
})
```

The runtime will map this automatically for supported transports.