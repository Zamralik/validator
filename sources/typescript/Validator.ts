import type { HTMLEditableElement, HTMLFormField, ErrorKey, ExtendedErrorKey } from "./definitions/types.js";
import type { ValidatorConfiguration, ValidatorMessages } from "./definitions/ValidatorConfiguration.js";
import type { FieldValidationOutcome } from "./definitions/FieldValidationOutcome.js";

import { ValidationError } from "./ValidationError.js";

class Validator
{
	private readonly form: HTMLFormElement;

	private readonly configuration: ValidatorConfiguration|undefined;

	private isProcessing: boolean;

	public constructor(form: string|HTMLFormElement, configuration?: ValidatorConfiguration)
	{
		if (form instanceof HTMLFormElement)
		{
			this.form = form;
		}
		else
		{
			const ELEMENT: Element|null = document.querySelector(form);

			if (ELEMENT instanceof HTMLFormElement)
			{
				this.form = ELEMENT;
			}
			else
			{
				throw new Error(`Unable to find form element using selector "${form}"`);
			}
		}

		this.configuration = configuration;
		this.isProcessing = false;
	}

	public watch(): void
	{
		// Native validation prevent submit event from firing
		this.form.noValidate = true;

		this.form.addEventListener(
			"submit",
			async (submit_event: Event): Promise<void> =>
			{
				submit_event.preventDefault();
				submit_event.stopImmediatePropagation();

				if (this.isProcessing)
				{
					return;
				}

				this.isProcessing = true;

				await this.validateForm(true);

				this.isProcessing = false;
			},
			{
				capture: true
			}
		);

		this.form.addEventListener(
			"reset",
			(): void =>
			{
				this.reset();
			},
			{
				passive: true,
				capture: true
			}
		);

		this.form.addEventListener(
			"change",
			async (change_event: Event): Promise<void> =>
			{
				if (Validator.isEditableElement(change_event.target))
				{
					await this.validateEditable(change_event.target);
				}
			},
			{
				passive: true,
				capture: true
			}
		);
	}

	public reset(): void
	{
		this.getEditables(this.form).forEach(
			(editable: HTMLEditableElement): void =>
			{
				const CONTAINER_SELECTOR: string|undefined = this.configuration?.container;

				if (CONTAINER_SELECTOR)
				{
					const CONTAINER: Element|null = editable.closest(CONTAINER_SELECTOR);

					if (CONTAINER)
					{
						const INVALID_STYLE: string|undefined = this.configuration?.styles?.invalid;
						const VALID_STYLE: string|undefined = this.configuration?.styles?.valid;

						if (INVALID_STYLE)
						{
							CONTAINER.classList.remove(INVALID_STYLE);
						}

						if (VALID_STYLE)
						{
							CONTAINER.classList.remove(VALID_STYLE);
						}

						const MESSENGER_SELECTOR: string|undefined = this.configuration?.messenger;

						if (MESSENGER_SELECTOR)
						{
							const MESSENGER: Element|null = CONTAINER.querySelector(MESSENGER_SELECTOR);

							if (MESSENGER)
							{
								MESSENGER.textContent = "";
							}
						}
					}
				}
			}
		);
	}

	private getEditables(root: HTMLFormElement|HTMLFieldSetElement): Array<HTMLEditableElement>
	{
		return Array.from(root.elements).filter(
			(element: Element): element is HTMLEditableElement =>
			{
				return Boolean(Validator.isEditableElement(element) && element.name);
			}
		);
	}

	public getFieldsets(): Array<HTMLFieldSetElement>
	{
		return Array.from(this.form.elements).filter(
			(element: Element): element is HTMLFieldSetElement =>
			{
				return (element instanceof HTMLFieldSetElement);
			}
		);
	}

	public async validateField(target: string|HTMLEditableElement): Promise<boolean>
	{
		if (typeof target === "string")
		{
			let field: Element|RadioNodeList|null = this.form.elements.namedItem(target);

			if (field === null)
			{
				throw new Error(`No field named "${target}"`);
			}

			if (Validator.isCollection(field))
			{
				field = field[0];
			}

			if (!Validator.isEditableElement(field))
			{
				throw new Error(`No editable element named "${target}" found`);
			}

			return await this.validateEditable(field);
		}
		else
		{
			if (!Validator.isEditableElement(target))
			{
				throw new Error("This is not an editable element");
			}

			if (!target.name)
			{
				throw new Error("This field has no name");
			}

			const OWNER_FORM: HTMLFormElement|null = (target.form || target.closest("form"));

			if (OWNER_FORM !== this.form)
			{
				throw new Error("This field belong to an other form");
			}

			return await this.validate(target.name, target);
		}
	}

	public async validateFieldSet(fieldset: string|number|HTMLFieldSetElement): Promise<boolean>
	{
		let element: HTMLFieldSetElement|null = null;

		if (typeof fieldset === "number")
		{
			if (fieldset < 0 || !Number.isSafeInteger(fieldset))
			{
				throw new Error("Invalid argument");
			}

			const FIELDSETS: Array<HTMLFieldSetElement> = this.getFieldsets();

			if (fieldset < FIELDSETS.length)
			{
				element = FIELDSETS[fieldset];
			}
			else
			{
				throw new Error(`Unable to find fieldset #${fieldset.toFixed(0)}`);
			}
		}
		else
		{
			if (fieldset instanceof HTMLFieldSetElement)
			{
				element = fieldset;
			}
			else if (typeof fieldset === "string")
			{
				const ELEMENT: Element|null = this.form.querySelector(fieldset);

				if (ELEMENT instanceof HTMLFieldSetElement)
				{
					element = ELEMENT;
				}
				else
				{
					throw new Error(`Unable to find fieldset element in form using selector "${fieldset}"`);
				}
			}

			if (element === null)
			{
				throw new Error("Invalid argument");
			}

			const OWNER_FORM: HTMLFormElement|null = (element.form || element.closest("form"));

			if (OWNER_FORM !== this.form)
			{
				throw new Error("This fieldset belong to an other form");
			}
		}

		const RESULT: boolean = await this.validateAllFields(element);

		return RESULT;
	}

	public async validateForm(enable_aftermath: boolean): Promise<boolean>
	{
		let valid: boolean = false;

		try
		{
			// Prevent validation on a rejected promise or thrown error
			await this.configuration?.hooks?.preValidation?.(this.form);

			valid = await this.validateAllFields(this.form);

			if (valid)
			{
				try
				{
					// Fail validation on a rejected promise or thrown error
					await this.configuration?.hooks?.validation?.(this.form);
				}
				catch (error: unknown)
				{
					if (error instanceof Error)
					{
						console.log(error);
					}

					valid = false;
				}
			}

			if (enable_aftermath)
			{
				if (
					valid
					&&
					!(this.configuration?.hooks?.postValidation)
					&&
					!(this.configuration?.hooks?.onValidationSuccess)
				)
				{
					// Does not trigger an other submit event
					this.form.submit();
				}
				else
				{
					try
					{
						await this.configuration?.hooks?.postValidation?.(this.form, valid);

						if (valid)
						{
							await this.configuration?.hooks?.onValidationSuccess?.(this.form);
						}
						else
						{
							await this.configuration?.hooks?.onValidationFailure?.(this.form);
						}
					}
					catch (error: unknown)
					{
						if (error instanceof Error)
						{
							console.log(error);
						}
					}
				}
			}
		}
		catch (error: unknown)
		{
			if (error instanceof Error)
			{
				console.log(error);
			}
		}

		return valid;
	}

	private async validateAllFields(root: HTMLFormElement|HTMLFieldSetElement): Promise<boolean>
	{
		try
		{
			const EDITABLE_ELEMENTS: Array<HTMLEditableElement> = this.getEditables(root);

			const PROCESSED_NAMES: Array<string> = [];

			const RESULTS: Array<boolean> = await Promise.all(
				Array.from(EDITABLE_ELEMENTS).map(
					async (editable: HTMLEditableElement): Promise<boolean> =>
					{
						return await this.validateEditable(editable, PROCESSED_NAMES);
					}
				)
			);

			return RESULTS.every(
				(result: boolean): boolean =>
				{
					return result;
				}
			);
		}
		catch (error: unknown)
		{
			if (error instanceof Error)
			{
				console.log(error);
			}

			return false;
		}
	}

	private async validateEditable(editable: HTMLEditableElement, excluded_names?: Array<string>): Promise<boolean>
	{
		if (!editable.name)
		{
			// Anonymous fields are ignored
			return true;
		}

		let field: HTMLFormField;

		// Radio & Checkboxes sharing the same name are processed as RadioNodeList
		// Other editables sharing the same name are processed individually
		if (editable.type === "checkbox" || editable.type === "radio")
		{
			if (excluded_names)
			{
				if (excluded_names.includes(editable.name))
				{
					// Already processed names are ignored for checkbox and radio
					return true;
				}

				excluded_names.push(editable.name);
			}

			field = this.form.elements.namedItem(editable.name) as HTMLFormField;
		}
		else
		{
			field = editable;
		}

		return await this.validate(editable.name, field);
	}

	private async validate(name: string, field: HTMLFormField): Promise<boolean>
	{
		try
		{
			const OUTCOME: FieldValidationOutcome = await this.getFieldValidity(name, field);

			await this.updateField(OUTCOME, name, field);

			return OUTCOME.success;
		}
		catch (error: unknown)
		{
			if (error instanceof Error)
			{
				console.log(error);
			}

			return false;
		}
	}

	private async getFieldValidity(field_name: string, field: HTMLFormField): Promise<FieldValidationOutcome>
	{
		if (field instanceof HTMLInputElement && ["text", "number", "email", "tel", "url"].includes(field.type))
		{
			/* eslint-disable-next-line no-param-reassign */
			field.value = field.value.trim();
		}

		try
		{
			// Fail validation on a rejected promise or thrown error
			await this.configuration?.fields?.[field_name]?.hooks?.preValidation?.(field);
		}
		catch (error: unknown)
		{
			if (error instanceof Error)
			{
				console.log(error);
			}

			return {
				success: false,
				reason: "unknownError",
				customMessage: (error instanceof ValidationError) ? error.message : undefined
			};
		}

		// Native validation

		if (Validator.isCollection(field))
		{
			const VALID: boolean = Array.from(field).every(
				(input: HTMLInputElement): boolean =>
				{
					return input.checkValidity();
				}
			);

			if (!VALID)
			{
				return {
					success: false,
					reason: "valueMissing"
				};
			}
		}
		else if (!field.checkValidity())
		{
			return {
				success: false,
				reason: Validator.getErrorKey(field)
			};
		}

		try
		{
			// Fail validation on a rejected promise or thrown error
			await this.configuration?.fields?.[field_name]?.hooks?.validation?.(field);
		}
		catch (error: unknown)
		{
			if (error instanceof Error)
			{
				console.log(error);
			}

			return {
				success: false,
				reason: "customError",
				customMessage: (error instanceof ValidationError) ? error.message : undefined
			};
		}

		return {
			success: true
		};
	}

	private async updateField(outcome: FieldValidationOutcome, field_name: string, field: HTMLFormField): Promise<void>
	{
		try
		{
			let message: string|undefined = outcome.customMessage;

			try
			{
				// If resolved with a string, override message
				const CUSTOM_MESSAGE: void|string|undefined = await this.configuration?.fields?.[field_name]?.hooks?.postValidation?.(field, outcome.success);

				if (typeof CUSTOM_MESSAGE === "string")
				{
					message = CUSTOM_MESSAGE;
				}
			}
			catch (error: unknown)
			{
				if (error instanceof Error)
				{
					console.log(error);
				}
			}

			try
			{
				if (outcome.success)
				{
					// If resolved with a string, override message
					const CUSTOM_MESSAGE: void|string|undefined = await this.configuration?.fields?.[field_name]?.hooks?.onValidationSuccess?.(field);

					if (typeof CUSTOM_MESSAGE === "string")
					{
						message = CUSTOM_MESSAGE;
					}
				}
				else
				{
					// If resolved with a string, override message
					const CUSTOM_MESSAGE: void|string|undefined = await this.configuration?.fields?.[field_name]?.hooks?.onValidationFailure?.(field);

					if (typeof CUSTOM_MESSAGE === "string")
					{
						message = CUSTOM_MESSAGE;
					}
				}
			}
			catch (error: unknown)
			{
				if (error instanceof Error)
				{
					console.log(error);
				}
			}

			const CONTAINER_SELECTOR: string|undefined = this.configuration?.container;

			if (CONTAINER_SELECTOR)
			{
				const CONTAINER: Element|null = (Validator.isCollection(field) ? field[0] : field).closest(CONTAINER_SELECTOR);

				if (CONTAINER)
				{
					const OLD_STYLE: string|undefined = outcome.success ? this.configuration?.styles?.invalid : this.configuration?.styles?.valid;
					const NEW_STYLE: string|undefined = outcome.success ? this.configuration?.styles?.valid : this.configuration?.styles?.invalid;

					if (OLD_STYLE)
					{
						CONTAINER.classList.remove(OLD_STYLE);
					}

					if (NEW_STYLE)
					{
						CONTAINER.classList.add(NEW_STYLE);
					}

					const MESSENGER_SELECTOR: string|undefined = this.configuration?.messenger;

					if (MESSENGER_SELECTOR)
					{
						const MESSENGER: Element|null = CONTAINER.querySelector(MESSENGER_SELECTOR);

						if (MESSENGER)
						{
							if (!message)
							{
								if (outcome.success)
								{
									message = this.getValidMessage(field_name);
								}
								else
								{
									message = this.getErrorMessage(field_name, outcome.reason);
								}
							}

							MESSENGER.textContent = message;
						}
					}
				}
			}
		}
		catch (error: unknown)
		{
			if (error instanceof Error)
			{
				console.log(error);
			}
		}
	}

	private getValidMessage(field_name: string): string
	{
		return (
			this.configuration?.fields?.[field_name]?.messages?.valid
			||
			this.configuration?.messages?.valid
			||
			""
		);
	}

	private getErrorMessage(field_name: string, error_key: ExtendedErrorKey): string
	{
		const SPECIFIC_MESSAGES: ValidatorMessages|undefined = this.configuration?.fields?.[field_name]?.messages;
		const GENERIC_MESSAGES: ValidatorMessages|undefined = this.configuration?.messages;

		return (
			SPECIFIC_MESSAGES?.[error_key]
			||
			SPECIFIC_MESSAGES?.invalid
			||
			GENERIC_MESSAGES?.[error_key]
			||
			GENERIC_MESSAGES?.invalid
			||
			"Invalid field"
		);
	}

	private static getErrorKey(editable: HTMLEditableElement): ExtendedErrorKey
	{
		const ERROR_KEYS: Array<ErrorKey> = [
			"badInput",
			"customError",
			"patternMismatch",
			"rangeOverflow",
			"rangeUnderflow",
			"stepMismatch",
			"tooLong",
			"tooShort",
			"typeMismatch",
			"valueMissing"
		];

		const ERROR_KEY: ErrorKey|undefined = ERROR_KEYS.find(
			(key: ErrorKey): boolean =>
			{
				return editable.validity[key];
			}
		);

		return ERROR_KEY || "unknownError";
	}

	// In TypeScript, RadioNodeList is not compatible with type NodeListOf<TNode extends Node>
	private static isCollection(field: any): field is NodeListOf<HTMLInputElement>
	{
		return (field instanceof RadioNodeList);
	}

	private static isEditableElement(element: any): element is HTMLEditableElement
	{
		return (
			element instanceof HTMLInputElement
			||
			element instanceof HTMLSelectElement
			||
			element instanceof HTMLTextAreaElement
		);
	}
}

export { Validator };
