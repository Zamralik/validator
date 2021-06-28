/* eslint-disable @typescript-eslint/no-type-alias */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/method-signature-style */
/* eslint-disable line-comment-position */
/* eslint-disable no-inline-comments */

import type { HTMLFormField } from "./types.js";

type ValidatorFieldBasicHook = (
	((field: HTMLFormField) => void)
	|
	((field: HTMLFormField) => Promise<void>)
);

type ValidatorFieldMessengerHook = (
	((field: HTMLFormField) => void)
	|
	((field: HTMLFormField) => Promise<void>)
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

export {
	ValidatorFieldBasicHook,
	ValidatorFieldMessengerHook,
	ValidatorFieldPostHook,
	ValidatorFormBasicHook,
	ValidatorFormPostHook
};
