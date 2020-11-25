import type { HTMLEditableElement, HTMLFormField, ErrorKey, ExtendedErrorKey } from "definitions/types.js";
import type { ValidatorConfiguration } from "definitions/ValidatorConfiguration.js";
import type { FieldValidationOutcome } from "definitions/FieldValidationOutcome.js";

class Validator
{
	private readonly form: HTMLFormElement;

	private readonly configuration: ValidatorConfiguration | undefined;

	private isProcessing: boolean;

	private processedCollectionNames: Array<string>;

	public constructor(form: string | HTMLFormElement, configuration?: ValidatorConfiguration)
	{
		if (form instanceof HTMLFormElement)
		{
			this.form = form;
		}
		else
		{
			const ELEMENT: Element | null = document.querySelector(form);

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
		this.processedCollectionNames = [];
	}

	private static getErrorKey(editable: HTMLEditableElement): ExtendedErrorKey
	{
		const VALIDITY: ValidityState = editable.validity;

		const ERROR_KEY: ErrorKey | undefined = (Object.getOwnPropertyNames(Object.getPrototypeOf(VALIDITY)) as Array<ErrorKey>).find(
			(key: ErrorKey): boolean =>
			{
				return VALIDITY[key];
			}
		);

		return ERROR_KEY || "unknownError";
	}

	// In TypeScript, RadioNodeList is not compatible with type NodeListOf<TNode extends Node>
	private static isCollection(field: HTMLFormField): field is NodeListOf<HTMLInputElement>
	{
		return (field instanceof RadioNodeList);
	}

	public watch(): void
	{
		// Disable native validation
		this.form.noValidate = true;

		this.form.addEventListener(
			"submit",
			async (submit_event: Event): Promise<void> =>
			{
				submit_event.preventDefault();
				submit_event.stopImmediatePropagation();
				await this.validate(true);
			},
			true
		);

		this.form.addEventListener(
			"change",
			async (change_event: Event): Promise<void> =>
			{
				const EDITABLE_ELEMENT: HTMLEditableElement = change_event.target as HTMLEditableElement;
				await this.validateEditable(EDITABLE_ELEMENT);
			},
			true
		);
	}

	public async validateForm(): Promise<void>
	{
		await this.validate(false);
	}

	public async validateFieldSet(fieldset: string | number | HTMLFieldSetElement): Promise<void>
	{
		let element: HTMLFieldSetElement | null = null;

		if (fieldset instanceof HTMLFieldSetElement)
		{
			const OWNER_FORM: HTMLFormElement | null = fieldset.closest("form");

			if (OWNER_FORM === this.form)
			{
				element = fieldset;
			}
			else
			{
				throw new Error("This fieldset belong to an other form");
			}
		}
		else if (typeof fieldset === "string")
		{
			const ELEMENT: Element | null = this.form.querySelector(fieldset);

			if (ELEMENT instanceof HTMLFieldSetElement)
			{
				element = ELEMENT;
			}
			else
			{
				throw new Error(`Unable to find fieldset element in form using selector "${fieldset}"`);
			}
		}
		else
		{
			if (fieldset < 0 || !Number.isSafeInteger(fieldset))
			{
				throw new Error("Invalid argument");
			}

			const FIELDSETS: NodeListOf<HTMLFieldSetElement> = this.form.querySelectorAll("fieldset");

			if (fieldset < FIELDSETS.length)
			{
				element = FIELDSETS[fieldset];
			}
			else
			{
				throw new Error(`Unable to find fieldset #${fieldset.toFixed(0)}`);
			}
		}

		if (this.isProcessing)
		{
			return;
		}

		this.isProcessing = true;

		await this.validateAllFields(element);

		// Clean after every validation to free memory
		this.processedCollectionNames = [];
		this.isProcessing = false;
	}

	private async validate(allow_submit: boolean): Promise<void>
	{
		if (this.isProcessing)
		{
			return;
		}

		this.isProcessing = true;

		try
		{
			// Prevent validation on a rejected promise or thrown error
			await this.configuration?.hooks?.preValidation?.(this.form);

			let valid: boolean = await this.validateAllFields(this.form);

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

			if (valid && allow_submit && (this.configuration?.hooks?.postValidation === undefined))
			{
				// Does not trigger an other submit event
				this.form.submit();
			}
			else
			{
				try
				{
					// Must handle the form submission
					await this.configuration?.hooks?.postValidation?.(valid, this.form);
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
		catch (error: unknown)
		{
			if (error instanceof Error)
			{
				console.log(error);
			}
		}

		// Clean after every validation to free memory
		this.processedCollectionNames = [];
		this.isProcessing = false;
	}

	private async validateAllFields(root: HTMLFormElement | HTMLFieldSetElement): Promise<boolean>
	{
		try
		{
			const EDITABLE_ELEMENTS: NodeListOf<HTMLEditableElement> = root.querySelectorAll("input[name], select[name], textarea[name]");

			const OUTCOMES: Array<boolean> = await Promise.all(
				Array.from(EDITABLE_ELEMENTS).map(
					async (editable: HTMLEditableElement): Promise<boolean> =>
					{
						const VALID: boolean = await this.validateEditable(editable);

						return VALID;
					}
				)
			);

			const GLOBAL_VALID: boolean = OUTCOMES.every(
				(outcome) =>
				{
					return outcome;
				}
			);

			return GLOBAL_VALID;
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

	private async validateEditable(editable: HTMLEditableElement): Promise<boolean>
	{
		try
		{
			const NAME: string = editable.name;

			if (!NAME)
			{
				// Anonymous fields are valid
				return true;
			}

			let field: HTMLFormField | null = null;

			// Radio & Checkboxes sharing the same name are processed as RadioNodeList
			// Other editables sharing the same name are processed individually
			if (editable.type === "checkbox" || editable.type === "radio")
			{
				if (this.processedCollectionNames.includes(NAME))
				{
					// Already processed names are valid
					return true;
				}

				this.processedCollectionNames.push(NAME);
				field = this.form.elements.namedItem(NAME) as HTMLFormField;
			}
			else
			{
				field = editable;
			}

			const OUTCOME: FieldValidationOutcome = await this.validateField(NAME, field);

			await this.updateField(OUTCOME, NAME, field);

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

	private async validateField(field_name: string, field: HTMLFormField): Promise<FieldValidationOutcome>
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
				reason: "unknownError"
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
				reason: "customError"
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
			let message: string | undefined = undefined;

			try
			{
				// If resolved with a string, override message
				const CUSTOM_MESSAGE: string | undefined = await this.configuration?.fields?.[field_name]?.hooks?.postValidation?.(outcome.success, field);

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

			const CONTAINER_SELECTOR: string | undefined = this.configuration?.container;

			if (CONTAINER_SELECTOR)
			{
				const CONTAINER: Element | null = (Validator.isCollection(field) ? field[0] : field).closest(CONTAINER_SELECTOR);

				if (CONTAINER)
				{
					const OLD_STYLE: string | undefined = outcome.success ? this.configuration?.styles?.invalid : this.configuration?.styles?.valid;
					const NEW_STYLE: string | undefined = outcome.success ? this.configuration?.styles?.valid : this.configuration?.styles?.invalid;

					if (OLD_STYLE)
					{
						CONTAINER.classList.remove(OLD_STYLE);
					}

					if (NEW_STYLE)
					{
						CONTAINER.classList.add(NEW_STYLE);
					}

					const MESSENGER_SELECTOR: string | undefined = this.configuration?.messenger;

					if (MESSENGER_SELECTOR)
					{
						const MESSENGER: Element | null = CONTAINER.querySelector(MESSENGER_SELECTOR);

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
		return (
			this.configuration?.fields?.[field_name]?.messages?.[error_key]
			||
			this.configuration?.fields?.[field_name]?.messages?.invalid
			||
			this.configuration?.messages?.[error_key]
			||
			this.configuration?.messages?.invalid
			||
			"Invalid field"
		);
	}
}

export { Validator };
