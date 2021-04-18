import { ValidationError } from "./ValidationError.js";
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
    }
    watch() {
        this.form.noValidate = true;
        this.form.addEventListener("submit", async (submit_event) => {
            submit_event.preventDefault();
            submit_event.stopImmediatePropagation();
            if (this.isProcessing) {
                return;
            }
            this.isProcessing = true;
            await this.validateForm(true);
            this.isProcessing = false;
        }, true);
        this.form.addEventListener("change", async (change_event) => {
            const EDITABLE_ELEMENT = change_event.target;
            await this.validateEditable(EDITABLE_ELEMENT);
        }, true);
    }
    getEditables(root) {
        if (root.elements) {
            return Array.from(root.elements).filter((element) => {
                return Boolean(Validator.isEditableElement(element) && element.name);
            });
        }
        else {
            return Array.from(root.querySelectorAll("input[name], select[name], textarea[name]")).filter((editable) => {
                return this.form === (editable.form || editable.closest("form"));
            });
        }
    }
    getFieldsets() {
        if (this.form.elements) {
            return Array.from(this.form.elements).filter((element) => {
                return (element instanceof HTMLFieldSetElement);
            });
        }
        else {
            return Array.from(this.form.querySelectorAll("fieldset")).filter((fieldset) => {
                return this.form === (fieldset.form || fieldset.closest("form"));
            });
        }
    }
    async validateField(fieldname) {
        const FIELD = this.form.elements.namedItem(fieldname);
        if (FIELD === null) {
            throw new Error(`No field named "${fieldname}"`);
        }
        return await this.validate(fieldname, FIELD);
    }
    async validateFieldSet(fieldset) {
        let element = null;
        if (fieldset instanceof HTMLFieldSetElement) {
            const OWNER_FORM = (fieldset.form || fieldset.closest("form"));
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
            const FIELDSETS = this.getFieldsets();
            if (fieldset < FIELDSETS.length) {
                element = FIELDSETS[fieldset];
            }
            else {
                throw new Error(`Unable to find fieldset #${fieldset.toFixed(0)}`);
            }
        }
        const RESULT = await this.validateAllFields(element);
        return RESULT;
    }
    async validateForm(enable_aftermath) {
        let valid = false;
        try {
            await this.configuration?.hooks?.preValidation?.(this.form);
            valid = await this.validateAllFields(this.form);
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
            if (enable_aftermath) {
                if (valid
                    &&
                        !(this.configuration?.hooks?.postValidation)
                    &&
                        !(this.configuration?.hooks?.onValidationSuccess)) {
                    this.form.submit();
                }
                else {
                    try {
                        await this.configuration?.hooks?.postValidation?.(this.form, valid);
                        if (valid) {
                            await this.configuration?.hooks?.onValidationSuccess?.(this.form);
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
        }
        catch (error) {
            if (error instanceof Error) {
                console.log(error);
            }
        }
        return valid;
    }
    async validateAllFields(root) {
        try {
            const EDITABLE_ELEMENTS = this.getEditables(root);
            const PROCESSED_NAMES = [];
            const RESULTS = await Promise.all(Array.from(EDITABLE_ELEMENTS).map(async (editable) => {
                return await this.validateEditable(editable, PROCESSED_NAMES);
            }));
            return RESULTS.every((result) => {
                return result;
            });
        }
        catch (error) {
            if (error instanceof Error) {
                console.log(error);
            }
            return false;
        }
    }
    async validateEditable(editable, excluded_names) {
        if (!editable.name) {
            return true;
        }
        let field;
        if (editable.type === "checkbox" || editable.type === "radio") {
            if (excluded_names) {
                if (excluded_names.includes(editable.name)) {
                    return true;
                }
                excluded_names.push(editable.name);
            }
            field = this.form.elements.namedItem(editable.name);
        }
        else {
            field = editable;
        }
        return await this.validate(editable.name, field);
    }
    async validate(name, field) {
        try {
            const OUTCOME = await this.getFieldValidity(name, field);
            await this.updateField(OUTCOME, name, field);
            return OUTCOME.success;
        }
        catch (error) {
            if (error instanceof Error) {
                console.log(error);
            }
            return false;
        }
    }
    async getFieldValidity(field_name, field) {
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
                reason: "unknownError",
                customMessage: (error instanceof ValidationError) ? error.message : undefined
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
                reason: "customError",
                customMessage: (error instanceof ValidationError) ? error.message : undefined
            };
        }
        return {
            success: true
        };
    }
    async updateField(outcome, field_name, field) {
        try {
            let message = outcome.customMessage;
            try {
                const CUSTOM_MESSAGE = await this.configuration?.fields?.[field_name]?.hooks?.postValidation?.(field, outcome.success);
                if (typeof CUSTOM_MESSAGE === "string") {
                    message = CUSTOM_MESSAGE;
                }
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log(error);
                }
            }
            try {
                if (outcome.success) {
                    const CUSTOM_MESSAGE = await this.configuration?.fields?.[field_name]?.hooks?.onValidationSuccess?.(field);
                    if (typeof CUSTOM_MESSAGE === "string") {
                        message = CUSTOM_MESSAGE;
                    }
                }
                else {
                    const CUSTOM_MESSAGE = await this.configuration?.fields?.[field_name]?.hooks?.onValidationFailure?.(field);
                    if (typeof CUSTOM_MESSAGE === "string") {
                        message = CUSTOM_MESSAGE;
                    }
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
        const SPECIFIC_MESSAGES = this.configuration?.fields?.[field_name]?.messages;
        const GENERIC_MESSAGES = this.configuration?.messages;
        return (SPECIFIC_MESSAGES?.[error_key]
            ||
                SPECIFIC_MESSAGES?.invalid
            ||
                GENERIC_MESSAGES?.[error_key]
            ||
                GENERIC_MESSAGES?.invalid
            ||
                "Invalid field");
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
    static isEditableElement(element) {
        return (element instanceof HTMLInputElement
            ||
                element instanceof HTMLSelectElement
            ||
                element instanceof HTMLTextAreaElement);
    }
}
export { Validator };
