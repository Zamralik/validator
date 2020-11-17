"use strict";
{
	function get_message_key(field)
	{
		const validity = field.validity;
		return (
			validity
			&&
			Object.getOwnPropertyNames(Object.getPrototypeOf(validity)).find(
				function (key)
				{
					return (validity[key] === true);
				}
			)
			||
			"unknownError"
		);
	}

	function get_failure_message(configuration, name, key)
	{
		return (
			Object.dive(configuration, ["fields", name, "messages", key])
			||
			Object.dive(configuration, ["fields", name, "messages", "invalid"])
			||
			Object.dive(configuration, ["messages", key])
			||
			Object.dive(configuration, ["messages", "invalid"])
			||
			"Invalid field"
		);
	}

	function get_success_message(configuration, name)
	{
		return (
			Object.dive(configuration, ["fields", name, "messages", "valid"])
			||
			Object.dive(configuration, ["messages", "valid"])
			||
			""
		);
	}

	function validate_field(form, name, field, configuration)
	{
		let promise = Promise.resolve();

		if (field instanceof HTMLInputElement && ["text", "search", "number", "email", "tel", "url"].includes(field.type))
		{
			field.value = field.value.trim();
		}

		{
			// Prevalidation hook
			// Fail validation on a rejected promise or thrown error
			const hook = Object.dive(configuration, ["fields", name, "hooks", "preValidation"]);

			if (hook)
			{
				promise = promise.then(
					function ()
					{
						return hook(field);
					}
				).catch(
					function (error)
					{
						if (error instanceof Error)
						{
							// Legitimate error
							console.log(error);
						}

						return Promise.reject("unknownError");
					}
				);
			}
		}

		promise = promise.then(
			function ()
			{
				// Native validation
				if (field instanceof RadioNodeList)
				{
					const is_valid = Array.from(field).every(
						function (input)
						{
							return input.checkValidity();
						}
					);

					if (!is_valid)
					{
						return Promise.reject("valueMissing");
					}
				}
				else
				{
					if (!field.checkValidity())
					{
						return Promise.reject(get_message_key(field));
					}
					else if (field.dataset.equalsTo)
					{
						const target = form.elements.namedItem(field.dataset.equalsTo);

						if (!(target instanceof HTMLElement) || target.value !== field.value)
						{
							return Promise.reject("valueMismatch");
						}
					}
				}
			}
		);

		{
			// Validation hook
			// Fail validation on a rejected promise or thrown error
			const hook = Object.dive(configuration, ["fields", name, "hooks", "validation"]);

			if (hook)
			{
				promise = promise.then(
					function ()
					{
						return Promise.try(
							function ()
							{
								return hook(field);
							}
						).catch(
							function (error)
							{
								if (error instanceof Error)
								{
									// Legitimate error
									console.log(error);
								}

								return Promise.reject("customError");
							}
						);
					}
				);
			}
		}

		return promise;
	}

	function update_field(outcome, name, field, configuration)
	{
		let container = null;

		if (configuration.container)
		{
			container = (field instanceof RadioNodeList ? field[0] : field).closest(configuration.container);
		}

		if (!container)
		{
			if (field instanceof RadioNodeList)
			{
				container = Node.getCommonAncestor(field[0], field[1]);

				if (!container)
				{
					container = field;
				}
			}
			else
			{
				container = field.closest("label");

				if (!container)
				{
					if (field.parentNode.querySelectorAll("input, select, textarea").length === 1)
					{
						container = field.parentNode;
					}
					else
					{
						container = field;
					}
				}
			}
		}

		const new_style = outcome.error ? configuration.styles.invalid : configuration.styles.valid;
		const old_style = outcome.error ? configuration.styles.valid : configuration.styles.invalid;

		let messenger = null;
		let message = "";

		if (container instanceof RadioNodeList)
		{
			field.forEach(
				function (item)
				{
					if (new_style)
					{
						item.classList.add(new_style);
					}

					if (old_style)
					{
						item.classList.remove(old_style);
					}
				}
			);
		}
		else
		{
			if (new_style)
			{
				container.classList.add(new_style);
			}

			if (old_style)
			{
				container.classList.remove(old_style);
			}

			if (configuration.messenger)
			{
				messenger = container.querySelector(configuration.messenger);

				if (messenger)
				{
					if (outcome.error)
					{
						message = get_failure_message(configuration, name, outcome.data);
					}
					else
					{
						message = get_success_message(configuration, name);
					}
				}
			}
		}

		let promise = Promise.resolve();

		{
			// Postvalidation hook
			// If resolved with a string, override message
			const hook = Object.dive(configuration, ["fields", name, "hooks", "postValidation"]);

			if (hook)
			{
				promise = promise.then(
					function ()
					{
						return hook(field, outcome.error);
					}
				);

				if (messenger)
				{
					promise = promise.then(
						function (custom_message)
						{
							if (TypeCheck.isString(custom_message))
							{
								message = custom_message;
							}
						}
					);
				}

				promise = promise.catch(
					function (error)
					{
						if (error instanceof Error)
						{
							// Legitimate error
							console.log(error);
						}
					}
				);
			}
		}

		if (messenger)
		{
			promise = promise.then(
				function ()
				{
					messenger.textContent = message;
				}
			);
		}

		return promise;
	}

	function check_validity(root, form, configuration)
	{
		// Radio & Checkboxes sharing the same name are processed as RadioNodeList
		// Other editables sharing the same name are processed individually
		const processed_names = [];

		let promise = Promise.all(
			root.getEditableElements().map(
				function (field)
				{
					const name = field.name;

					if (!name)
					{
						return;
					}

					if (field.type === "checkbox" || field.type === "radio")
					{
						if (processed_names.includes(name))
						{
							return;
						}

						processed_names.push(name);
						field = form.elements.namedItem(name);
					}

					const promise = validate_field(form, name, field, configuration);
					// Field specific hooks must resolve before global hooks, so we wait for resolution
					return promise.collapse(
						function (outcome)
						{
							return update_field(outcome, name, field, configuration);
						}
					)
					.then(
						function ()
						{
							return promise;
						}
					);
				}
			)
		);

		return promise;
	}

	function validate_form(form, configuration)
	{
		let promise = check_validity(form, form, configuration);

		{
			// Validation hook
			// Fail validation on a rejected promise or thrown error
			const hook = Object.dive(configuration, ["hooks", "validation"]);

			if (hook)
			{
				promise = promise.then(
					function ()
					{
						return Promise.try(
							function ()
							{
								return hook(form);
							}
						).catch(
							function (error)
							{
								if (error instanceof Error)
								{
									// Legitimate error
									console.log(error);
								}

								return Promise.reject();
							}
						);
					}
				);
			}
		}

		promise = promise.collapse(
			function (outcome)
			{
				// Postvalidation hook
				const hook = Object.dive(configuration, ["hooks", "postValidation"]);

				if (hook)
				{
					return Promise.try(
						function ()
						{
							return hook(form, outcome.error);
						}
					);
				}
				else if (!outcome.error)
				{
					form.submit();
				}
			}
		);

		return promise;
	}

	function initialize(form, configuration)
	{
		// Retrieve form element

		if (TypeCheck.isString(form))
		{
			form = document.querySelector(form);

			if (!(form instanceof HTMLFormElement))
			{
				throw new Error("No form found");
			}
		}
		else if (!(form instanceof HTMLFormElement))
		{
			throw new Error("No form given");
		}

		// Initialize configuration

		if (!configuration)
		{
			configuration = {};
		}

		if (!configuration.styles)
		{
			configuration.styles = {};
		}

		if (!configuration.styles.invalid)
		{
			configuration.styles.invalid = "is-invalid";
		}

		// Add event listeners

		let is_processing = false;

		form.noValidate = true;

		form.addEventListener(
			"submit",
			function (event)
			{
				event.preventDefault();
				event.stopImmediatePropagation();

				if (is_processing)
				{
					return;
				}

				is_processing = true;

				let promise = Promise.resolve();

				// Prevalidation hook
				// Prevent validation on a rejected promise or thrown error
				const hook = Object.dive(configuration, ["hooks", "preValidation"]);

				if (hook)
				{
					promise = promise.then(
						function ()
						{
							return hook(form);
						}
					);
				}

				promise.then(
					function ()
					{
						return validate_form(form, configuration);
					}
				)
				.catch(
					function (error)
					{
						if (error instanceof Error)
						{
							// Legitimate error
							console.log(error);
						}
					}
				)
				.then(
					function ()
					{
						form.classList.add("is-submitted");
						is_processing = false;
					}
				);
			},
			true
		);

		form.addEventListener(
			"change",
			function (event)
			{
				let field = event.target;
				const name = field.name;

				if (name)
				{
					// Radio & Checkboxes sharing the same name are processed as RadioNodeList
					// Other editables sharing the same name are processed individually
					if (field.type === "checkbox" || field.type === "radio")
					{
						field = form.elements.namedItem(name);
					}

					validate_field(form, name, field, configuration).collapse(
						function (outcome)
						{
							return update_field(outcome, name, field, configuration);
						}
					);
				}
			},
			true
		);
	}

	window.validator = initialize;

	/* ValidatorHandle */

	function convert(promise)
	{
		return promise.collapse(
			function (outcome)
			{
				return !outcome.error;
			}
		);
	}

	function create(form, configuration)
	{
		return {
			checkValidity: function ()
			{
				return convert(check_validity(form, form, configuration));
			},
			checkFieldsetValidity: function (fieldset)
			{
				if (fieldset instanceof HTMLFieldSetElement)
				{
					const root = fieldset.closest("form");

					if (root !== form)
					{
						throw new Error("Fieldset belong to an other form");
					}
				}
				else if (typeof fieldset === "number")
				{
					if (fieldset < 0 || !Number.isSafeInteger(fieldset))
					{
						throw new Error("Invalid argument");
					}

					const fieldsets = form.querySelectorAll("fieldset");

					if (fieldset < fieldsets.length)
					{
						fieldset = fieldsets[fieldset];
					}
					else
					{
						throw new Error("Unable to find fieldset #" + fieldset.toFixed(0));
					}
				}
				else
				{
					throw new Error("Invalid argument");
				}

				return convert(check_validity(fieldset, form, configuration));
			}
		};
	}

	window.validator.create = create;
}
