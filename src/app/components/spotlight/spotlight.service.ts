import { computed, inject, Injectable, signal } from '@angular/core';
import { AppGridService } from '../../utils/app-grid/app-grid.service';
import { BridgeService } from '../../utils/bridge/bridge.service';
import { PACKAGE_NAME_ALIASES } from '../../utils/constants';
import { StartMenuService } from '../start-menu/start-menu.service';

@Injectable({
	providedIn: 'root',
})
export class SpotlightService {
	private readonly _appgridService = inject(AppGridService);
	private readonly _bridgeService = inject(BridgeService);
	private readonly _startMenuService = inject(StartMenuService);

	private hasPushedState = false;

	spotlightActive = signal<boolean>(false);
	spotlightReveal = signal<number>(0);

	searchQuery = signal<string | undefined>(undefined);

	apps = this._bridgeService.apps;

	suggestions = computed<string[]>(() => {
		const query = this.searchQuery();
		if (!query) {
			return [];
		}
		return JSON.parse(this._bridgeService.getGoogleSearchSuggestions(query) || '[]').slice(0, 5);
	});

	filteredApps = computed(() => {
		const query = this.searchQuery();
		if (!query) {
			return [];
		}

		const lowerQuery = query.toLowerCase();
		const suggestions = this.suggestions().map((s) => s.toLowerCase());

		return this.apps()
			.filter((app) => {
				const label = app.label.toLowerCase().trim();
				if (label.startsWith('transcripción instantánea')) {
					return false;
				}

				const labelWords = label.split(/\s+/);
				const packageAliases = PACKAGE_NAME_ALIASES[app.packageName] || [];

				const labelMatches = labelWords.some((word) => word.startsWith(lowerQuery));
				const suggestionMatches = suggestions.some((s) => s.split(/\s+/).some((sWord) => labelWords.some((word) => word.startsWith(sWord))));
				const aliasMatchesQuery = packageAliases.some((alias) => alias.startsWith(lowerQuery));
				const aliasMatchesSuggestions = packageAliases.some((alias) => suggestions.some((s) => s.includes(alias)));

				return labelMatches || suggestionMatches || aliasMatchesQuery || aliasMatchesSuggestions;
			})
			.slice(0, 5);
	});

	constructor() {
		window.addEventListener('popstate', this.handleBackButton);
	}

	openSpotlight() {
		if (!this._appgridService.isEditMode() && !this._startMenuService.startMenuActive()) {
			this.spotlightActive.set(true);

			if (!this.hasPushedState) {
				history.pushState({ spotlight: true }, '');
				this.hasPushedState = true;
			}
		}
	}

	updateReveal(progress: number) {
		if (!this._appgridService.isEditMode() && !this._startMenuService.startMenuActive()) {
			this.spotlightReveal.set(progress);
		}
	}

	closeSpotlight() {
		this.searchQuery.set(undefined);
		this.spotlightActive.set(false);

		if (this.hasPushedState) {
			this.hasPushedState = false;

			// SAFELY simulate a back press without navigating away
			if (history.state?.spotlight) {
				history.back();
			}
		}
	}

	toggleSpotlight() {
		this.spotlightActive.update((state) => !state);
	}

	updateSearchQuery(query: string | undefined) {
		this.searchQuery.set(query);
	}

	getAppIcon(packageName: string) {
		return this._bridgeService.getAppIcon(packageName);
	}

	openSuggestion(suggestion: string) {
		this._bridgeService.requestGoogleSearch(suggestion);
		this.closeSpotlight();
	}

	openApp(packageName: string) {
		this._bridgeService.requestLaunchApp(packageName);
		this.closeSpotlight();
	}

	private handleBackButton = (event: PopStateEvent) => {
		if (this.spotlightActive()) {
			this.closeSpotlight();
			event.preventDefault(); // Not strictly needed, but shows intent
		}
	};
}
