import type { ExtendedErrorKey } from "./types.js";

interface ValidOutcome
{
	success: true;
	customMessage?: string | undefined;
}

interface ErrorOutcome
{
	success: false;
	reason: ExtendedErrorKey;
	customMessage?: string | undefined;
}

/* eslint-disable-next-line @typescript-eslint/no-type-alias */
type FieldValidationOutcome = ValidOutcome | ErrorOutcome;

export type { FieldValidationOutcome };
