import { Injectable, signal } from '@angular/core';

@Injectable({
	providedIn: 'root',
})
export class TouchStateService {
	isGridScrollingHorizontally = signal(false);
}
