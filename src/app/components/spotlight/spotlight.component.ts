import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BridgeService } from '../../utils/bridge/bridge.service';
import { contactActions, ContactActions, IContactActions } from '../../utils/constants';
import { IconsService } from '../../utils/icons/icons.service';
import { SpotlightService } from './spotlight.service';

@Component({
	selector: 'app-spotlight',
	imports: [MatIconModule, CommonModule],
	templateUrl: './spotlight.component.html',
	styleUrl: './spotlight.component.scss',
	animations: [
		trigger('expandCollapse', [
			state(
				'collapsed',
				style({
					height: '0px',
					opacity: 0,
					overflow: 'hidden',
				})
			),
			state(
				'expanded',
				style({
					height: '*',
					opacity: 1,
					overflow: 'hidden',
				})
			),
			transition('collapsed <=> expanded', [animate('280ms cubic-bezier(0.4,0.0,0.2,1)')]),
		]),
	],
})
export class SpotlightComponent {
	private readonly _bridgeService = inject(BridgeService);
	private readonly _spotlightService = inject(SpotlightService);
	private readonly _iconService = inject(IconsService);

	searchQuery = signal<string | undefined>(undefined);
	openedContactIds = signal<string[]>([]);

	isSpotlightActive = this._spotlightService.spotlightActive;
	reveal = this._spotlightService.spotlightReveal;
	mathResult = this._spotlightService.mathResult;

	searchInput = viewChild<ElementRef<HTMLInputElement>>('search');

	private debounceTimeout: any;

	suggestions = this._spotlightService.suggestions;
	filteredApps = this._spotlightService.filteredApps;
	filteredContacts = this._spotlightService.filteredContacts;

	contactActions = contactActions;

	constructor() {
		effect(() => {
			clearTimeout(this.debounceTimeout);
			const currentValue = this.searchQuery();
			this.debounceTimeout = setTimeout(() => {
				this._spotlightService.updateSearchQuery(currentValue);
			}, 500);

			if (this.reveal() === 1) {
				setTimeout(() => {
					this.searchInput()?.nativeElement?.focus();
				}, 0);
			} else {
				this.searchInput()?.nativeElement?.blur();
			}

			if (!this.isSpotlightActive()) {
				this.clearSearch();
			}
		});
	}

	openSuggestion(suggestion: string) {
		this._spotlightService.openSuggestion(suggestion);
		this.clearSearch();
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

	getAppIcon(packageName: string) {
		// Attempt to match any icon filename containing the iconName
		const matchedIcon = this._iconService.getAppIcon(packageName);
		if (matchedIcon) {
			return `assets/icons/icon-pack/${matchedIcon}`;
		}
		return this._spotlightService.getAppIcon(packageName);
	}

	openApp(packageName: string) {
		this.clearSearch();
		return this._spotlightService.openApp(packageName);
	}

	openContact(id: string) {
		this.openedContactIds.update((state) => {
			if (state.includes(id)) {
				return state.filter((item) => item != id);
			}

			const arrayOfIds = state;
			arrayOfIds.push(id);
			return arrayOfIds;
		});
	}

	invokeAction(action: IContactActions, phoneNumber: string) {
		if (action.action === ContactActions.CALL) {
			this._bridgeService.requestContactCall(phoneNumber);
		} else if (action.messagingApp) {
			this._bridgeService.requestMessagingContact(phoneNumber, action.messagingApp.toString());
		}
	}

	onEnterPressed() {
		if (!this.searchQuery()) {
			return;
		}
		this._spotlightService.openSuggestion(this.searchQuery()!);
		this.clearSearch();
	}
}
