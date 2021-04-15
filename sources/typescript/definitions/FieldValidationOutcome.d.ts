import type { ExtendedErrorKey } from "./types.js";

interface ValidOutcome
{
	success: true;
}

interface ErrorOutcome
{
	success: false;
	reason: ExtendedErrorKey;
}

/* eslint-disable-next-line @typescript-eslint/no-type-alias */
type FieldValidationOutcome = ValidOutcome | ErrorOutcome;

export type { FieldValidationOutcome };
