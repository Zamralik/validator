class Validator {
    constructor(form, configuration) {
        if (form instanceof HTMLFormElement) {
            this.form = form;
        }
        else {
            const ELEMENT = document.querySelector(form);
            if (ELEMENT instanceof HTMLFormElement) {
                this.form = ELEMENT;
            }
            else {
                throw new Error(`Unable to find form element using selector "${form}"`);
            }
        }
        this.configuration = configuration;
        this.isProcessing = false;
        this.processedCollectionNames = [];
    }
    static getErrorKey(editable) {
        const VALIDITY = editable.validity;
        const ERROR_KEY = Object.getOwnPropertyNames(Object.getPrototypeOf(VALIDITY)).find((key) => {
            return VALIDITY[key] === true;
        });
        return ERROR_KEY || "unknownError";
    }
    static isCollection(field) {
        return (field instanceof RadioNodeList);
    }
    watch() {
        this.form.noValidate = true;
        this.form.addEventListener("submit", async (submit_event) => {
            submit_event.preventDefault();
            submit_event.stopImmediatePropagation();
            await this.validate(true);
        }, true);
        this.form.addEventListener("change", async (change_event) => {
            const EDITABLE_ELEMENT = change_event.target;
            await this.validateEditable(EDITABLE_ELEMENT);
        }, true);
    }
    async validateForm() {
        await this.validate(false);
    }
    async validateFieldSet(fieldset) {
        let element = null;
        if (fieldset instanceof HTMLFieldSetElement) {
            const OWNER_FORM = fieldset.closest("form");
            if (OWNER_FORM === this.form) {
                element = fieldset;
            }
            else {
                throw new Error("This fieldset belong to an other form");
            }
        }
        else if (typeof fieldset === "string") {
            const ELEMENT = this.form.querySelector(fieldset);
            if (ELEMENT instanceof HTMLFieldSetElement) {
                element = ELEMENT;
            }
            else {
                throw new Error(`Unable to find fieldset element in form using selector "${fieldset}"`);
            }
        }
        else {
            if (fieldset < 0 || !Number.isSafeInteger(fieldset)) {
                throw new Error("Invalid argument");
            }
            const FIELDSETS = this.form.querySelectorAll("fieldset");
            if (fieldset < FIELDSETS.length) {
                element = FIELDSETS[fieldset];
            }
            else {
                throw new Error(`Unable to find fieldset #${fieldset.toFixed(0)}`);
            }
        }
        if (this.isProcessing) {
            return;
        }
        this.isProcessing = true;
        await this.validateAllFields(element);
        this.processedCollectionNames = [];
        this.isProcessing = false;
    }
    async validate(allow_submit) {
        if (this.isProcessing) {
            return;
        }
        this.isProcessing = true;
        try {
            await this.configuration?.hooks?.preValidation?.(this.form);
            let valid = await this.validateAllFields(this.form);
            if (valid) {
                try {
                    await this.configuration?.hooks?.validation?.(this.form);
                }
                catch (error) {
                    if (error instanceof Error) {
                        console.log(error);
                    }
                    valid = false;
                }
            }
            const HOOK_POST_VALIDATION = this.configuration?.hooks?.postValidation;
            const HOOK_ON_VALIDATION_SUCCESS = valid ? (this.configuration?.hooks?.onValidationSuccess) : undefined;
            if (valid
                &&
                    allow_submit
                &&
                    HOOK_POST_VALIDATION === undefined
                &&
                    HOOK_ON_VALIDATION_SUCCESS === undefined) {
                this.form.submit();
            }
            else {
                try {
                    await HOOK_POST_VALIDATION?.(valid, this.form);
                    if (valid) {
                        await HOOK_ON_VALIDATION_SUCCESS?.(this.form);
                    }
                    else {
                        await this.configuration?.hooks?.onValidationFailure?.(this.form);
                    }
                }
                catch (error) {
                    if (error instanceof Error) {
                        console.log(error);
                    }
                }
            }
        }
        catch (error) {
            if (error instanceof Error) {
                console.log(error);
            }
        }
        this.processedCollectionNames = [];
        this.isProcessing = false;
    }
    async validateAllFields(root) {
        try {
            const EDITABLE_ELEMENTS = root.querySelectorAll("input[name], select[name], textarea[name]");
            const OUTCOMES = await Promise.all(Array.from(EDITABLE_ELEMENTS).map(async (editable) => {
                const VALID = await this.validateEditable(editable);
                return VALID;
            }));
            const GLOBAL_VALID = OUTCOMES.every((outcome) => {
                return outcome;
            });
            return GLOBAL_VALID;
        }
        catch (error) {
            if (error instanceof Error) {
                console.log(error);
            }
            return false;
        }
    }
    async validateEditable(editable) {
        try {
            const NAME = editable.name;
            if (!NAME) {
                return true;
            }
            let field = null;
            if (editable.type === "checkbox" || editable.type === "radio") {
                if (this.processedCollectionNames.includes(NAME)) {
                    return true;
                }
                this.processedCollectionNames.push(NAME);
                field = this.form.elements.namedItem(NAME);
            }
            else {
                field = editable;
            }
            const OUTCOME = await this.validateField(NAME, field);
            await this.updateField(OUTCOME, NAME, field);
            return OUTCOME.success;
        }
        catch (error) {
            if (error instanceof Error) {
                console.log(error);
            }
            return false;
        }
    }
    async validateField(field_name, field) {
        if (field instanceof HTMLInputElement && ["text", "number", "email", "tel", "url"].includes(field.type)) {
            field.value = field.value.trim();
        }
        try {
            await this.configuration?.fields?.[field_name]?.hooks?.preValidation?.(field);
        }
        catch (error) {
            if (error instanceof Error) {
                console.log(error);
            }
            return {
                success: false,
                reason: "unknownError"
            };
        }
        if (Validator.isCollection(field)) {
            const VALID = Array.from(field).every((input) => {
                return input.checkValidity();
            });
            if (!VALID) {
                return {
                    success: false,
                    reason: "valueMissing"
                };
            }
        }
        else if (!field.checkValidity()) {
            return {
                success: false,
                reason: Validator.getErrorKey(field)
            };
        }
        try {
            await this.configuration?.fields?.[field_name]?.hooks?.validation?.(field);
        }
        catch (error) {
            if (error instanceof Error) {
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
    async updateField(outcome, field_name, field) {
        try {
            let message = undefined;
            try {
                const CUSTOM_MESSAGE = await this.configuration?.fields?.[field_name]?.hooks?.postValidation?.(outcome.success, field);
                if (typeof CUSTOM_MESSAGE === "string") {
                    message = CUSTOM_MESSAGE;
                }
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log(error);
                }
            }
            const CONTAINER_SELECTOR = this.configuration?.container;
            if (CONTAINER_SELECTOR) {
                const CONTAINER = (Validator.isCollection(field) ? field[0] : field).closest(CONTAINER_SELECTOR);
                if (CONTAINER) {
                    const OLD_STYLE = outcome.success ? this.configuration?.styles?.invalid : this.configuration?.styles?.valid;
                    const NEW_STYLE = outcome.success ? this.configuration?.styles?.valid : this.configuration?.styles?.invalid;
                    if (OLD_STYLE) {
                        CONTAINER.classList.remove(OLD_STYLE);
                    }
                    if (NEW_STYLE) {
                        CONTAINER.classList.add(NEW_STYLE);
                    }
                    const MESSENGER_SELECTOR = this.configuration?.messenger;
                    if (MESSENGER_SELECTOR) {
                        const MESSENGER = CONTAINER.querySelector(MESSENGER_SELECTOR);
                        if (MESSENGER) {
                            if (!message) {
                                if (outcome.success) {
                                    message = this.getValidMessage(field_name);
                                }
                                else {
                                    message = this.getErrorMessage(field_name, outcome.reason);
                                }
                            }
                            MESSENGER.textContent = message;
                        }
                    }
                }
            }
        }
        catch (error) {
            if (error instanceof Error) {
                console.log(error);
            }
        }
    }
    getValidMessage(field_name) {
        return (this.configuration?.fields?.[field_name]?.messages?.valid
            ||
                this.configuration?.messages?.valid
            ||
                "");
    }
    getErrorMessage(field_name, error_key) {
        return (this.configuration?.fields?.[field_name]?.messages?.[error_key]
            ||
                this.configuration?.fields?.[field_name]?.messages?.invalid
            ||
                this.configuration?.messages?.[error_key]
            ||
                this.configuration?.messages?.invalid
            ||
                "Invalid field");
    }
}
export { Validator };
