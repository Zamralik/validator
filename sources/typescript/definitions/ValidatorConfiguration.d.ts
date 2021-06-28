/* eslint-disable @typescript-eslint/method-signature-style */
/* eslint-disable @typescript-eslint/type-annotation-spacing */
/* eslint-disable line-comment-position */
/* eslint-disable no-inline-comments */

import type {
	ValidatorFieldHookBasic,
	ValidatorFieldHookMessenger,
	ValidatorFieldHookMergedMessenger,
	ValidatorFormHookBasic,
	ValidatorFormHookMerged
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
	preValidation?: ValidatorFieldHookBasic;
	validation?: ValidatorFieldHookBasic;
	postValidation?: ValidatorFieldHookMergedMessenger;
	onValidationSuccess?: ValidatorFieldHookMessenger;
	onValidationFailure?: ValidatorFieldHookMessenger;
}

interface ValidatorFieldConfiguration
{
	hooks?: ValidatorFieldHooks;
	messages?: ValidatorMessages;
}

interface ValidatorFormHooks
{
	preValidation?: ValidatorFormHookBasic;
	validation?: ValidatorFormHookBasic;
	postValidation?: ValidatorFormHookMerged;
	onValidationSuccess?: ValidatorFormHookBasic;
	onValidationFailure?: ValidatorFormHookBasic;
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
