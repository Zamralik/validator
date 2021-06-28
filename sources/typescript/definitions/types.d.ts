/* eslint-disable @typescript-eslint/no-type-alias */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/method-signature-style */
/* eslint-disable line-comment-position */
/* eslint-disable no-inline-comments */

declare type HTMLEditableElement = HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement;

declare type HTMLFormField = HTMLEditableElement|NodeListOf<HTMLInputElement>;

declare type ErrorKey = (
	"badInput"
	|
	"customError"
	|
	"patternMismatch"
	|
	"rangeOverflow"
	|
	"rangeUnderflow"
	|
	"stepMismatch"
	|
	"tooLong"
	|
	"tooShort"
	|
	"typeMismatch"
	|
	"valueMissing"
);

declare type ExtendedErrorKey = "unknownError"|ErrorKey;

export { HTMLEditableElement, HTMLFormField, ErrorKey, ExtendedErrorKey };
