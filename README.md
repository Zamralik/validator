# Validator Documentation

## Configuration

Everything is optional

- **container**
	Type `string`.
	CSS selector matching the root element on which the CSS classes will be toggled.
	If missing or not found, will default to a common ancestor (for checkbox/radio inputs sharing a name),
	the closest label, the parent element, or the fields themselves.
- **styles**
	- **valid**
		Type `string`.
		CSS class added when field is valid, unused if missing.
	- **invalid**
		Type `string`.
		CSS class added when field is invalid, default to "is-invalid".
- **messenger**
	Type `string`.
	CSS selector to find the element, descendant of the container, in which appropriate messages will be inserted.
- **messages**
	Type `ValidatorMessages`
	See [Message Configuration](#message-configuration).
- **hooks**
	See [Validation process](#validation-process) for the hook order of execution.
	- **preValidation**
		Type `(form: HTMLFormElement) => void | Promise<void>`
		An error or rejection cancel the validation of the form.
	- **validation**
		Type `(form: HTMLFormElement) => void | Promise<void>`
		Global validation, only called if all fields are individually valid.
	- **postValidation**
		Type `(form: HTMLFormElement, valid: boolean) => void | Promise<void>`
		If defined, the automatic `form.submit()` is disabled.
	- **onValidationSuccess**
		Type `(form: HTMLFormElement) => void | Promise<void>`
		If defined, the automatic `form.submit()` is disabled.
	- **onValidationFailure**
		Type `(form: HTMLFormElement) => void | Promise<void>`;
- **fields**
	Type `Record<string, ValidatorFieldConfiguration>`
	Each configuration is associated by its name used as key. Surround names with special characters with quotes.
	See [Field Configuration](#field-configuration)

## Field Configuration

- **messages**
	Type `ValidatorMessages`
	See [Message Configuration](#message-configuration).
- **hooks**
	- **preValidation**:
		Type `(field: HTMLFormField) => void | Promise<void>`
		Executed before browser validation, it can be used to clean the value beforehand.
		If it throws a ValidationError, it will be used as error message.

	- **validation**
		Type `(field: HTMLFormField) => void | Promise<void>`
		Executed after browser validation. Not executed if preValidation or browser validation fails.
		An error or rejection fails the validation.
		If it throws a ValidationError, it will be used as error message.

	- **postValidation**
		Type `(field: HTMLFormField, valid: boolean) => undefined | string | Promise<undefined | string>`;
		If it resolves with a string, it will be used as message.
	- **onValidationSuccess**
		Type `(field: HTMLFormField) => undefined | string | Promise<undefined | string>`
		If resolved with a string, it is used as message.
	- **onValidationFailure**
		Type `(field: HTMLFormField) => undefined | string | Promise<undefined | string>`
		If resolved with a string, it is used as message.
- **messages**
	Type `ValidatorMessages`
	See [Message Configuration](#message-configuration).

## Message configuration

Messages are displayed per field based on its validation status.
Will be ignored if a message was given by a hook.

### Message keys

- **valid**: Displayed when the field is valid. Defaults to an empty string.
- **invalid**: Generic error message used as fallback for all other status but valid, defaults to "Invalid field".
- **badInput**: Browser is unable to convert the user input. Pasting a name in a number input may cause this.
- **customError**: Validation() hook has thrown.
- **patternMismatch**: Value doesn't match the pattern (attribute: `pattern`).
- **rangeOverflow**: Value exceed the maximum (attribute: `max`).
- **rangeUnderflow**: Value doesn't reach the minimum (attribute: `min`).
- **stepMismatch**: Value fall between two steps (attribute: `step`).
- **tooLong**: Value has too many characters (attribute: `max-length`).
- **tooShort**: Value doesn't have enough characters (attribute: `min-length`).
- **typeMismatch**: Value doesn't match the type (email, number, date, ...) (attribute: `type`).
- **valueMissing**: Field is required and value is missing (attribute: `required`).
- **unknownError**: PreValidation() hook has thrown.

### Messages order priority

1. configuration.fields[fieldname].messages[specificError]
1. configuration.fields[fieldname].messages.invalid
1. configuration.messages[specificError]
1. configuration.messages.invalid

## Validation process

- form preValidation() hook
- loop through fields
	- field preValidation() hook
	- if (field is still valid)
		-field browser validation
	- if (field is still valid)
		- field validation() hook
	- field postValidation() hook
	- if (field is valid)
		- field onValidationSuccess() hook
	- else
		- field onValidationFailure() hook
- form validation() hook
- form postValidation() hook
- if (everything is valid)
	- form onValidationSuccess() hook
- else
	- form onValidationFailure() hook
