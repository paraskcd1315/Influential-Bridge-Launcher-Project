import { Injectable, signal } from '@angular/core';

@Injectable({
	providedIn: 'root',
})
export class AppGridService {
	isEditMode = signal<boolean>(false);
}
