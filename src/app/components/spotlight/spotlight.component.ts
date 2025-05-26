import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { IconsService } from '../../utils/icons/icons.service';
import { SpotlightService } from './spotlight.service';

@Component({
	selector: 'app-spotlight',
	imports: [MatIconModule, CommonModule],
	templateUrl: './spotlight.component.html',
	styleUrl: './spotlight.component.scss',
	animations: [
		trigger('spotlightAnimation', [
			transition(':enter', [style({ opacity: 0, transform: 'translateY(20px)' }), animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))]),
			transition(':leave', [animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(20px)' }))]),
		]),
	],
})
export class SpotlightComponent {
	private readonly _spotlightService = inject(SpotlightService);
	private readonly _iconService = inject(IconsService);

	searchQuery = signal<string | undefined>(undefined);

	isSpotlightActive = this._spotlightService.spotlightActive;
	reveal = this._spotlightService.spotlightReveal;

	searchInput = viewChild<ElementRef<HTMLInputElement>>('search');

	private debounceTimeout: any;

	suggestions = this._spotlightService.suggestions;
	filteredApps = this._spotlightService.filteredApps;

	constructor() {
		effect(() => {
			clearTimeout(this.debounceTimeout);
			const currentValue = this.searchQuery();
			this.debounceTimeout = setTimeout(() => {
				this._spotlightService.updateSearchQuery(currentValue);
			}, 500);

			if (this.isSpotlightActive()) {
				this.searchInput()?.nativeElement.focus();
			}
		});
	}

	openSuggestion(suggestion: string) {
		this._spotlightService.openSuggestion(suggestion);
	}

	clearSearch() {
		this.searchQuery.set(undefined);
		const inputEl = this.searchInput()?.nativeElement;

		if (!inputEl) {
			return;
		}
		inputEl.value = '';
		inputEl.blur();
		inputEl.classList.add('clearing');

		setTimeout(() => {
			inputEl.classList.remove('clearing');
		}, 300);
	}

	getAppIcon(packageName: string, label: string) {
		// Attempt to match any icon filename containing the iconName
		const matchedIcon = this._iconService.getAppIcon(packageName);
		if (matchedIcon) {
			return `assets/icons/icon-pack/${matchedIcon}`;
		}
		return this._spotlightService.getAppIcon(packageName);
	}

	openApp(packageName: string) {
		return this._spotlightService.openApp(packageName);
	}

	onEnterPressed() {
		if (!this.searchQuery()) {
			return;
		}
		this._spotlightService.openSuggestion(this.searchQuery()!);
	}
}
