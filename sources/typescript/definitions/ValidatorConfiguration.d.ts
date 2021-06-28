/* eslint-disable @typescript-eslint/method-signature-style */
/* eslint-disable @typescript-eslint/type-annotation-spacing */
/* eslint-disable line-comment-position */
/* eslint-disable no-inline-comments */

import type {
	ValidatorFieldBasicHook,
	ValidatorFieldMessengerHook,
	ValidatorFieldPostHook,
	ValidatorFormBasicHook,
	ValidatorFormPostHook
} from "./hooks.js";

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
