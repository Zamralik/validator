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

type ValidatorFieldBasicHook = (
	((field: HTMLFormField) => void)
	|
	((field: HTMLFormField) => Promise<void>)
);

type ValidatorFieldMessengerHook = (
	((field: HTMLFormField) => void)
	|
	((field: HTMLFormField) => string|undefined)
	|
	((field: HTMLFormField) => Promise<void>)
	|
	((field: HTMLFormField) => Promise<string|undefined>)
);

type ValidatorFieldPostHook = (
	((field: HTMLFormField, valid: boolean) => void)
	|
	((field: HTMLFormField, valid: boolean) => string|undefined)
	|
	((field: HTMLFormField, valid: boolean) => Promise<void>)
	|
	((field: HTMLFormField, valid: boolean) => Promise<string|undefined>)
);

interface ValidatorFieldHooks
{
	preValidation?: ValidatorFieldBasicHook;
	validation?: ValidatorFieldBasicHook;
	postValidation?: ValidatorFieldPostHook;
	onValidationSuccess?: ValidatorFieldMessengerHook;
	onValidationFailure?: ValidatorFieldMessengerHook;
}

interface ValidatorFieldConfiguration
{
	hooks?: ValidatorFieldHooks;
	messages?: ValidatorMessages;
}

type ValidatorFormBasicHook = (
	((form: HTMLFormElement) => void)
	|
	((form: HTMLFormElement) => Promise<void>)
);

type ValidatorFormPostHook = (
	((form: HTMLFormElement, valid: boolean) => void)
	|
	((form: HTMLFormElement, valid: boolean) => Promise<void>)
);

interface ValidatorFormHooks
{
	preValidation?: ValidatorFormBasicHook;
	validation?: ValidatorFormBasicHook;
	postValidation?: ValidatorFormPostHook;
	onValidationSuccess?: ValidatorFormBasicHook;
	onValidationFailure?: ValidatorFormBasicHook;
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
	hooks?: ValidatorFormHooks;
	fields?: Record<string, ValidatorFieldConfiguration>;
}

export type {
	ValidatorConfiguration,
	ValidatorFieldConfiguration,
	ValidatorMessages,
	ValidatorFormHooks,
	ValidatorFieldHooks
};
