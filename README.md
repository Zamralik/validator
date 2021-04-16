# Validator Documentation

## Configuration

Everything is optional

- **container**<br />
	Type `string`.<br />
	CSS selector matching the root element on which the CSS classes will be toggled.
	If missing or not found, will default to a common ancestor (for checkbox/radio inputs sharing a name),
	the closest label, the parent element, or the fields themselves.
- **styles**
	- **valid**<br />
		Type `string`.<br />
		CSS class added when field is valid, unused if missing.
	- **invalid**<br />
		Type `string`.<br />
		CSS class added when field is invalid, default to "is-invalid".
- **messenger**<br />
	Type `string`.<br />
	CSS selector to find the element, descendant of the container, in which appropriate messages will be inserted.
- **messages**<br />
	Type `ValidatorMessages`<br />
	See [Message Configuration](#message-configuration).
- **hooks**<br />
	See [Validation process](#validation-process) for the hook order of execution. Any hook can be asynchronous.
	- **preValidation**<br />
		Type `(form: HTMLFormElement) => void | Promise<void>`<br />
		An error or rejection cancel the validation of the form.
	- **validation**<br />
		Type `(form: HTMLFormElement) => void | Promise<void>`<br />
		Global validation, only called if all fields are individually valid.
	- **postValidation**<br />
		Type `(form: HTMLFormElement, valid: boolean) => void | Promise<void>`<br />
		If defined, the automatic `form.submit()` is disabled.
	- **onValidationSuccess**<br />
		Type `(form: HTMLFormElement) => void | Promise<void>`<br />
		If defined, the automatic `form.submit()` is disabled.
	- **onValidationFailure**<br />
		Type `(form: HTMLFormElement) => void | Promise<void>`;
- **fields**<br />
	Type `Record<string, ValidatorFieldConfiguration>`<br />
	Each configuration is associated by its name used as key. Surround names with special characters with quotes.
	See [Field Configuration](#field-configuration)

## Field Configuration

- **messages**<br />
	Type `ValidatorMessages`<br />
	See [Message Configuration](#message-configuration).
- **hooks**<br />
	See [Validation process](#validation-process) for the hook order of execution. Any hook can be asynchronous.
	- **preValidation**:<br />
		Type `(field: HTMLFormField) => void | Promise<void>`<br />
		Executed before browser validation, it can be used to clean the value beforehand.
		If it throws a ValidationError, it will be used as error message.
	- **validation**<br />
		Type `(field: HTMLFormField) => void | Promise<void>`<br />
		Executed after browser validation. Not executed if preValidation or browser validation fails.
		An error or rejection fails the validation.
		If it throws a ValidationError, it will be used as error message.
	- **postValidation**<br />
		Type `(field: HTMLFormField, valid: boolean) => undefined | string | Promise<undefined | string>`;<br />
		If it resolves with a string, it will be used as message.
	- **onValidationSuccess**<br />
		Type `(field: HTMLFormField) => undefined | string | Promise<undefined | string>`<br />
		If resolved with a string, it is used as message.
	- **onValidationFailure**<br />
		Type `(field: HTMLFormField) => undefined | string | Promise<undefined | string>`<br />
		If resolved with a string, it is used as message.
- **messages**<br />
	Type `ValidatorMessages`<br />
	See [Message Configuration](#message-configuration).

## Message configuration

Messages are displayed per field based on its validation status.
Will be ignored if a message was given by a hook.

### Message keys

All the properties are optionals and of type `string`.

- **valid**<br />
	Displayed when the field is valid. Defaults to an empty string.
- **invalid**<br />
	Generic error message used as fallback for all other status but valid, defaults to "Invalid field".
- **badInput**<br />
	Browser is unable to convert the user input. Pasting a name in a number input may cause this.
- **customError**<br />
	Validation() hook has thrown.
- **patternMismatch**<br />
	Value doesn't match the pattern (attribute: `pattern`).
- **rangeOverflow**<br />
	Value exceed the maximum (attribute: `max`).
- **rangeUnderflow**<br />
	Value doesn't reach the minimum (attribute: `min`).
- **stepMismatch**<br />
	Value fall between two steps (attribute: `step`).
- **tooLong**<br />
	Value has too many characters (attribute: `max-length`).
- **tooShort**<br />
	Value doesn't have enough characters (attribute: `min-length`).
- **typeMismatch**<br />
	Value doesn't match the type (email, number, date, ...) (attribute: `type`).
- **valueMissing**<br />
	Field is required and value is missing (attribute: `required`).
- **unknownError**<br />
	PreValidation() hook has thrown.

### Messages order priority

1. `configuration` &#10142; `fields` &#10142; `[fieldname]` &#10142; `messages` &#10142; `[specificError]`
1. `configuration` &#10142; `fields` &#10142; `[fieldname]` &#10142; `messages` &#10142; `invalid`
1. `configuration` &#10142; `messages` &#10142; `[specificError]`
1. `configuration` &#10142; `messages` &#10142; `invalid`

## Validation process

- form `preValidation()` hook
- if no error occured
	- loop through fields
		- field `preValidation()` hook
		- if field is still valid
			- field browser validation
		- if field is still valid
			- field `validation()` hook
		- field `postValidation()` hook
		- if field is valid
			- field `onValidationSuccess()` hook
		- else
			- field `onValidationFailure()` hook
	- if all fields are individually valid
		- form `validation()` hook
	- form `postValidation()` hook
	- if everything is valid
		- form `onValidationSuccess()` hook
	- else
		- form `onValidationFailure()` hook
