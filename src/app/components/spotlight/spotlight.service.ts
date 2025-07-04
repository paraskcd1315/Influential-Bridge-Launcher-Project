import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { AppGridService } from '../../utils/app-grid/app-grid.service';
import { BridgeService } from '../../utils/bridge/bridge.service';
import { PACKAGE_NAME_ALIASES } from '../../utils/constants';
import { evaluateMathExpression } from '../../utils/math/math.utils';
import { PersistenceService } from '../../utils/persistence/persistence.service';
import { StartMenuService } from '../start-menu/start-menu.service';

@Injectable({
	providedIn: 'root',
})
export class SpotlightService {
	private readonly _appgridService = inject(AppGridService);
	private readonly _bridgeService = inject(BridgeService);
	private readonly _startMenuService = inject(StartMenuService);
	private readonly _persistenceService = inject(PersistenceService);

	private hasPushedState = false;

	spotlightActive = signal<boolean>(false);
	spotlightReveal = signal<number>(0);

	searchQuery = signal<string | undefined>(undefined);

	mathResult = signal<{ value: number; unit?: string; human?: string; altHuman?: string } | null>(null);
	currencyApiKey = computed(() => this._persistenceService.apiKeysStore().currencyApiKey);

	constructor() {
		window.addEventListener('popstate', this.handleBackButton);

		effect(() => {
			const query = this.searchQuery();
			if (!query) {
				this.mathResult.set(null);
				return;
			}

			evaluateMathExpression(query, this.currencyApiKey()).then((result) => {
				this.mathResult.set(result);
			});
		});
	}

	apps = this._bridgeService.apps;

	contacts = this._bridgeService.contacts;

	suggestions = computed<string[]>(() => {
		const query = this.searchQuery();
		if (!query || query.length < 3) {
			return [];
		}
		return JSON.parse(this._bridgeService.getGoogleSearchSuggestions(query) || '[]');
	});

	filteredApps = computed(() => {
		const query = this.searchQuery();
		if (!query) {
			return [];
		}

		const lowerQuery = query.toLowerCase();
		const suggestions = this.suggestions().map((s) => s.toLowerCase());

		const hasStrongMatch = (app: any) => {
			const label = app.label.toLowerCase().trim();
			if (label.startsWith('transcripción instantánea')) {
				return false;
			}

			const labelWords = label.split(/\s+/);
			const packageAliases = PACKAGE_NAME_ALIASES[app.packageName] || [];

			const labelMatches = labelWords.some((word: any) => (lowerQuery.length <= 2 ? word === lowerQuery : word.startsWith(lowerQuery)));
			const aliasMatchesQuery = packageAliases.some((alias) => (lowerQuery.length <= 2 ? alias === lowerQuery : alias.startsWith(lowerQuery)));
			const aliasMatchesSuggestions = packageAliases.some((alias) => suggestions.some((s) => s === alias));

			return labelMatches || aliasMatchesQuery || aliasMatchesSuggestions;
		};

		// primero buscamos matches fuertes
		const strongMatches = this.apps().filter(hasStrongMatch);

		// si encontramos matches reales, devolvemos esos
		if (strongMatches.length > 0) {
			return strongMatches;
		}

		// si no, probamos con el caso fallback: sugerencia exacta y alias exacta
		return this.apps().filter((app) => {
			const packageAliases = PACKAGE_NAME_ALIASES[app.packageName] || [];
			return packageAliases.includes(lowerQuery);
		});
	});

	filteredContacts = computed(() => {
		const query = this.searchQuery();
		if (!query) {
			return [];
		}

		return this.contacts().filter((contact) => contact.name.trim().toLowerCase().includes(query.trim().toLowerCase()) || contact.phoneNumbers.some((phone) => phone.trim().includes(query)));
	});

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
