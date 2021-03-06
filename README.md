# Licence

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Copyright &copy; 2021 "Zamralik" (Benjamin Blum)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

# Version

[![Version](https://img.shields.io/badge/version-v1.0-blue.svg)](https://github.com/Zamralik/validator/releases/tag/v1.0)

# Documentation

## Glossary

- `HTMLEditableElement`
	Type alias for `HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement`
- `HTMLFormField`
	Type alias for `HTMLEditableElement | NodeListOf<HTMLInputElement>`

## Definition

#### `constructor(form: HTMLFormElement | string, configuration?: ValidatorConfiguration);`

Accepts a form element or a css selector as first argument.<br />
See [Configuration](#configuration) for the configuration argument.

#### `watch(): void`

Attach event listeners and automatically handle validation and submit.<br />
Event listened :
- `submit`, execute `validateForm(true)`
- `reset`, execute `reset()`
- `change`, execute `validateField(event.target.name)`.

#### `async validateForm(enable_aftermath: boolean): Promise<boolean>`

Manually trigger a validation of the whole form.<br />
If you want a valid form to submit, or form `postValidation()`, form `onValidationSuccess()`, or form `onValidationFailure()` hooks to execute; then set `enable_aftermath` to true.

####  `async validateFieldSet(fieldset: HTMLFieldSetElement | string | number): Promise<boolean>`

If the form is multi-step, you can validate fieldsets individually.<br />
Accept an index number, a css selector, or the fieldset element directly as argument.

#### `async validateField(identifier: string | HTMLEditableElement): Promise<boolean>`

Take a name, an `<input>`, a `<select>`, or a `<textarea>` as argument.<br />
If the argument is a name, it'll validate all the elements with that name, otherwise, it'll validate only the given element.

#### `getFieldsets(): Array<HTMLFieldSetElement>`

Help with `validateFieldSet()` by returning all the form's fieldsets.

#### `reset(): void`

Reset the form, clearing all css classes and messages.
If you want to clear fields, you'll have to call `form.reset()` separately.
Note that while `form.submit()` do not dispatch any event, `form.reset()` dispatch a reset event.

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

Checkbox and radio inputs sharing the same name are validated together. Other fields are always validated separately.

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
	- postValidation, or onValidationFailure resolved with a string.
1. `configuration` &#10142; `fields` &#10142; `[fieldname]` &#10142; `messages` &#10142; `[specificError]`
1. `configuration` &#10142; `fields` &#10142; `[fieldname]` &#10142; `messages` &#10142; `invalid`
1. `configuration` &#10142; `messages` &#10142; `[specificError]`
1. `configuration` &#10142; `messages` &#10142; `invalid`
1. "Invalid field"

If valid:

1. Hooks:
	- postValidation, or onValidationSuccess resolved with a string.
1. `configuration` &#10142; `fields` &#10142; `[fieldname]` &#10142; `messages` &#10142; `valid`
1. `configuration` &#10142; `messages` &#10142; `valid`
1. Empty string

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
