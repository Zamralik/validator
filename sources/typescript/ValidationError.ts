class ValidationError
{
	public readonly message: string;

	constructor(message: string)
	{
		this.message = message;
	}
}

export { ValidationError };
