# Validator Documentation

## Definition

#### `constructor(form: HTMLFormElement | string, configuration?: ValidatorConfiguration);`

Accepts a form element or a css selector as first argument.<br />
See [Configuration](#configuration) for the configuration argument.

#### `watch(): void`

Attach event listeners and automatically handle validation and submit.

#### `async validateForm(enable_aftermath: boolean): Promise<boolean>`

Manually trigger a validation of the whole form.<br />
If `enable_aftermath` is set to true, might call `form.submit()` or execute post validation hooks.

####  `async validateFieldSet(fieldset: HTMLFieldSetElement | string | number): Promise<boolean>`

If the form is multi-step, you can validate fieldsets individually.<br />
Accept an index number, a css selector, or the fieldset element directly as argument.

#### `async validateField(fieldname: string): Promise<boolean>`

Validate a field by its name for fine checking freedom.

#### `isProcessing(): boolean`

Because validation is fully asynchronous, you may have to check if a full form or fieldset validation is ongoing.<br />
See [Configuration](#configuration) for details on asynchronous hooks.

## Configuration

Everything is optional.

- **container**<br />
	Type `string`.<br />
	CSS selector matching the field's ancestor element on which the CSS classes will be toggled.
- **styles**
	- **valid**<br />
		Type `string`.<br />
		CSS class added when field is valid, unused if missing.
	- **invalid**<br />
		Type `string`.<br />
		CSS class added when field is invalid, default to "is-invalid".
- **messenger**<br />
	Type `string`.<br />
	CSS selector of the container's descendant in which appropriate messages will be inserted.
- **messages**<br />
	Type `ValidatorMessages`<br />
	See [Message Configuration](#message-configuration).
- **hooks**<br />
	See [Validation process](#validation-process) for how each hook is used.
	- **preValidation**<br />
		Type `(form: HTMLFormElement) => void`<br />
		Type `async (form: HTMLFormElement) => Promise<void>`<br />
		An error or rejection cancel the validation of the form.
	- **validation**<br />
		Type `(form: HTMLFormElement) => void`<br />
		Type `async (form: HTMLFormElement) => Promise<void>`<br />
		Global validation, only called if all fields are individually valid.
	- **postValidation**<br />
		Type `(form: HTMLFormElement, valid: boolean) => void`<br />
		Type `async (form: HTMLFormElement, valid: boolean) => Promise<void>`<br />
		If defined, the automatic `form.submit()` is disabled.
	- **onValidationSuccess**<br />
		Type `(form: HTMLFormElement) => void`<br />
		Type `async (form: HTMLFormElement) => Promise<void>`<br />
		If defined, the automatic `form.submit()` is disabled.
	- **onValidationFailure**<br />
		Type `(form: HTMLFormElement) => void`;<br />
		Type `async (form: HTMLFormElement) => Promise<void>`;
- **fields**<br />
	Type `Record<string, ValidatorFieldConfiguration>`<br />
	Keys must be the name of the field on which to use the configuration.<br />
	Field names with special characters must be enclosed in quotes.<br />
	See [Field Configuration](#field-configuration).

## Field Configuration

Type `HTMLFormField` is an alias for<br />
`HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | NodeListOf<HTMLInputElement>`.<br />
Checkbox and radio inputs sharing the same name are validated together as a RadioNodeList, other inputs are validated separately even if they have the same name.

- **messages**<br />
	Type `ValidatorMessages`<br />
	See [Message Configuration](#message-configuration).
- **hooks**<br />
	See [Validation process](#validation-process) for how each hook is used.
	- **preValidation**:<br />
		Type `(field: HTMLFormField) => void`<br />
		Type `async (field: HTMLFormField) => Promise<void>`<br />
		Executed before browser validation, it can be used to clean the value beforehand.
		If it throws a ValidationError, it will be used as error message.
	- **validation**<br />
		Type `(field: HTMLFormField) => void`<br />
		Type `async (field: HTMLFormField) => Promise<void>`<br />
		Executed after browser validation. Not executed if preValidation or browser validation fails.
		An error or rejection fails the validation.
		If it throws a ValidationError, it will be used as error message.
	- **postValidation**<br />
		Type `(field: HTMLFormField, valid: boolean) => undefined | string`;<br />
		Type `async (field: HTMLFormField, valid: boolean) => Promise<undefined | string>`;<br />
		If it resolves with a string, it will be used as message.
	- **onValidationSuccess**<br />
		Type `(field: HTMLFormField) => undefined | string`<br />
		Type `async (field: HTMLFormField) => Promise<undefined | string>`<br />
		If resolved with a string, it is used as message.
	- **onValidationFailure**<br />
		Type `(field: HTMLFormField) => undefined | string`<br />
		Type `async (field: HTMLFormField) => Promise<undefined | string>`<br />
		If resolved with a string, it is used as message.
- **messages**<br />
	Type `ValidatorMessages`<br />
	See [Message Configuration](#message-configuration).

## Message configuration

Messages are displayed per field based on its validation status.
Will be ignored if a message was given by a hook.
Any message is interpreted as raw text, not as HTML.

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

If invalid:

1. Hooks:
	- preValidation, or field validation throwing a ValidationError.
	- postValidation, onValidationSuccess, onValidationFailure resolved with a string.
1. `configuration` &#10142; `fields` &#10142; `[fieldname]` &#10142; `messages` &#10142; `[specificError]`
1. `configuration` &#10142; `fields` &#10142; `[fieldname]` &#10142; `messages` &#10142; `invalid`
1. `configuration` &#10142; `messages` &#10142; `[specificError]`
1. `configuration` &#10142; `messages` &#10142; `invalid`

If valid:

1. Hooks:
	- postValidation, onValidationSuccess, onValidationFailure resolved with a string.
1. `configuration` &#10142; `fields` &#10142; `[fieldname]` &#10142; `messages` &#10142; `valid`
1. `configuration` &#10142; `messages` &#10142; `valid`

## Validation process

Here is the simplified validation algorithm in pseudo-code

```
form preValidation() hook

if no error occured

	loop through fields
	{
		field preValidation() hook

		if field is still valid
			field browser validation

		if field is still valid
			field validation() hook

		field postValidation() hook

		if field is valid
			field onValidationSuccess() hook
		else
			field onValidationFailure() hook
	}

	if all fields are individually valid
		form validation() hook

	form postValidation() hook

	if everything is valid
		form onValidationSuccess() hook
	else
		form onValidationFailure() hook
```
