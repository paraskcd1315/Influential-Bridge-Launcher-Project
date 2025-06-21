export interface IContact {
	id: string;
	name: string;
	phoneNumbers: Array<string>;
	photoUri?: string;
	telegramUsername?: string;
	isFavorite: boolean;
}
