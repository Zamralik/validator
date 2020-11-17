/* eslint-disable @typescript-eslint/method-signature-style */
/* eslint-disable @typescript-eslint/type-annotation-spacing */
/* eslint-disable line-comment-position */
/* eslint-disable no-inline-comments */

import type { HTMLFormField } from "definitions/types.js";

interface ValidatorMessages
{
	valid?: string; // default to "".
	invalid?: string; // generic error message, default to "Invalid field".
	badInput?: string; // browser is unable to convert the user input.
	customError?: string; // validation hook defined and failed.
	patternMismatch?: string; // value doesn't match the pattern.
	rangeOverflow?: string; // value exceed the maximum.
	rangeUnderflow?: string; // value doesn't reach the minimum.
	stepMismatch?: string; // value fall between two steps.
	tooLong?: string; // value has too many characters.
	tooShort?: string; // value doesn't have enough characters.
	typeMismatch?: string; // value doesn't match the type (email, number, date, ...).
	valueMissing?: string; // field is required and value is missing.
	unknownError?: string; // code execution failed
}

interface ValidatorConfiguration
{
	styles?: {
		// CSS class added when field is valid, unused if missing.
		valid?: string;
		// CSS class added when field is invalid, default to "is-invalid".
		invalid?: string;
	};
	// CSS selector to find the root element on which the CSS classes will be toggled.
	// If missing or not found, will default to a common ancestor (for checkbox/radio inputs sharing a name),
	// the closest label, the parent element, or the fields themselves.
	container?: string;
	// CSS selector to find the parent of the validation message inside the container.
	messenger?: string;
	// Generic messages, see message priority.
	messages?: ValidatorMessages;
	hooks?: {
		// An error or rejection cancel the validation of the form.
		preValidation?: (form: HTMLFormElement) => void | Promise<void>;
		// Global validation, occurs if all fields natively valid.
		validation?: (form: HTMLFormElement) => void | Promise<void>;
		// If defined, the form must be submitted manually (form.submit()).
		postValidation?: (valid: boolean, form: HTMLFormElement) => void | Promise<void>;
	};
	fields?: {
		// Each field can be referenced by its name (surround names with special characters with quotes).
		[fieldName: string]: {
			hooks?: {
				// Occurs before browser validation, an error or rejection fails the validation.
				preValidation?: (field: HTMLFormField) => void | Promise<void>;
				// Occurs after browser validation, an error or rejection fails the validation.
				validation?: (field: HTMLFormField) => void | Promise<void>;
				// If it resolved to a string, it is used in place of any other message.
				postValidation?: (valid: boolean, field: HTMLFormField) => undefined | string | Promise<undefined | string>;
			};
			// Custom messages for this field, see message priority.
			messages?: ValidatorMessages;
		};
	};
}

export type { ValidatorConfiguration };
