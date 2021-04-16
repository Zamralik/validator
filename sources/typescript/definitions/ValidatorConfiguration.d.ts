/* eslint-disable @typescript-eslint/method-signature-style */
/* eslint-disable @typescript-eslint/type-annotation-spacing */
/* eslint-disable line-comment-position */
/* eslint-disable no-inline-comments */

import type { HTMLFormField } from "./types.js";

interface ValidatorMessages
{
	valid?: string;
	invalid?: string;
	badInput?: string;
	customError?: string;
	patternMismatch?: string;
	rangeOverflow?: string;
	rangeUnderflow?: string;
	stepMismatch?: string;
	tooLong?: string;
	tooShort?: string;
	typeMismatch?: string;
	valueMissing?: string;
	unknownError?: string;
}

interface ValidatorFieldConfiguration
{
	hooks?: {
		preValidation?: (field: HTMLFormField) => void | Promise<void>;
		validation?: (field: HTMLFormField) => void | Promise<void>;
		postValidation?: (field: HTMLFormField, valid: boolean) => undefined | string | Promise<undefined | string>;
		onValidationSuccess?: (field: HTMLFormField) => undefined | string | Promise<undefined | string>;
		onValidationFailure?: (field: HTMLFormField) => undefined | string | Promise<undefined | string>;
	};
	messages?: ValidatorMessages;
}

interface ValidatorConfiguration
{
	container?: string;
	styles?: {
		valid?: string;
		invalid?: string;
	};
	messenger?: string;
	messages?: ValidatorMessages;
	hooks?: {
		preValidation?: (form: HTMLFormElement) => void | Promise<void>;
		validation?: (form: HTMLFormElement) => void | Promise<void>;
		postValidation?: (form: HTMLFormElement, valid: boolean) => void | Promise<void>;
		onValidationSuccess?: (form: HTMLFormElement) => void | Promise<void>;
		onValidationFailure?: (form: HTMLFormElement) => void | Promise<void>;
	};
	fields?: {
		[fieldName: string]: ValidatorFieldConfiguration;
	};
}

export type { ValidatorConfiguration, ValidatorFieldConfiguration, ValidatorMessages };
