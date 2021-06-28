/* eslint-disable @typescript-eslint/no-type-alias */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/method-signature-style */
/* eslint-disable line-comment-position */
/* eslint-disable no-inline-comments */

import type { HTMLFormField } from "./types.js";

/* FIELD HOOKS */

type ValidatorFieldHookBasic =
(
	((field: HTMLFormField) => void)
	|
	((field: HTMLFormField) => Promise<void>)
);

type ValidatorFieldHookMessenger =
(
	((field: HTMLFormField) => void)
	|
	((field: HTMLFormField) => string|undefined)
	|
	((field: HTMLFormField) => Promise<void>)
	|
	((field: HTMLFormField) => Promise<string|undefined>)
);

type ValidatorFieldHookMergedMessenger =
(
	((field: HTMLFormField, is_valid: boolean) => void)
	|
	((field: HTMLFormField, is_valid: boolean) => string|undefined)
	|
	((field: HTMLFormField, is_valid: boolean) => Promise<void>)
	|
	((field: HTMLFormField, is_valid: boolean) => Promise<string|undefined>)
);

/* FORM HOOKS */

type ValidatorFormHookBasic =
(
	((form: HTMLFormElement) => void)
	|
	((form: HTMLFormElement) => Promise<void>)
);

type ValidatorFormHookMerged =
(
	((form: HTMLFormElement, is_valid: boolean) => void)
	|
	((form: HTMLFormElement, is_valid: boolean) => Promise<void>)
);

export {
	ValidatorFieldHookBasic,
	ValidatorFieldHookMessenger,
	ValidatorFieldHookMergedMessenger,
	ValidatorFormHookBasic,
	ValidatorFormHookMerged
};
