import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { BridgeInstalledAppInfo } from '@bridgelauncher/api';
import { BridgeService } from '../../utils/bridge/bridge.service';
import { ICalendar } from '../../utils/bridge/calendar.types';
import { PACKAGE_NAME_ALIASES } from '../../utils/constants';

@Injectable({
	providedIn: 'root',
})
export class StartMenuService {
	private readonly _bridgeService = inject(BridgeService);

	selectedDate = signal(new Date());
	startMenuActive = signal<boolean>(false);
	filter = signal<string | undefined>(undefined);
	apps = this._bridgeService.apps;
	private readonly _clock = signal(new Date());

	constructor() {
		effect(() => {
			console.log(this.selectedDate());

			setInterval(() => {
				this._clock.set(new Date());
			}, 60 * 1000);
		});
	}

	alphabeticDistributedApps = computed(() => {
		const grouped: Record<string, BridgeInstalledAppInfo[]> = {};

		for (const app of this.apps()) {
			const firstLetter = app.label[0]?.toLowerCase() ?? '#';
			const key = /^[a-z]$/.test(firstLetter) ? firstLetter : '#';

			if (!grouped[key]) {
				grouped[key] = [];
			}

			grouped[key].push(app);
		}

		return grouped;
	});

	filteredApps = computed(() => {
		const query = this.filter();
		if (!query && this.apps().length > 0) return this.alphabeticDistributedApps();

		const lowerQuery = query?.toLowerCase() ?? '';
		const original = this.alphabeticDistributedApps();
		const filtered: Record<string, BridgeInstalledAppInfo[]> = {};

		for (const [letter, apps] of Object.entries(original)) {
			const matchingApps = apps.filter((app) => {
				const label = app.label.toLowerCase();
				const labelWords = label.split(/\s+/);
				const packageAliases = PACKAGE_NAME_ALIASES[app.packageName] || [];
				return labelWords.some((word) => word.startsWith(lowerQuery)) || packageAliases.some((alias) => alias.startsWith(lowerQuery));
			});

			if (matchingApps.length > 0) {
				filtered[letter] = matchingApps;
			}
		}

		return filtered;
	});

	readonly calendarEventsForSelectedDate = computed(() => {
		const date = this.selectedDate();
		// Esto te da '2025-06-14'
		const targetDate = date.toLocaleDateString('sv-SE');
		const all = this._bridgeService.calendarMonhlyData() ?? [];

		return all.filter((event) => {
			const startDate = new Date(event.startTime).toLocaleDateString('sv-SE');
			const endDate = new Date(event.endTime).toLocaleDateString('sv-SE');

			if (event.allDay) {
				return startDate <= targetDate && targetDate < endDate;
			} else {
				// Evento con hora: incluir si coincide exactamente con el día local
				return targetDate === startDate;
			}
		});
	});

	readonly allDayEvents = computed(() => this.calendarEventsForSelectedDate().filter((e) => e.allDay));

	readonly timedEvents = computed(() => this.calendarEventsForSelectedDate().filter((e) => !e.allDay));

	readonly hourlyDistributedEvents = computed(() => {
		this._clock();

		const events = this.timedEvents();
		const grouped: Record<string, ICalendar[]> = {};

		const now = new Date();
		const isToday = now.getFullYear() === this.selectedDate().getFullYear() && now.getMonth() === this.selectedDate().getMonth() && now.getDate() === this.selectedDate().getDate();

		const currentHour = isToday ? now.getHours() : 0;

		// Rellenamos desde la hora actual hasta las 23
		for (let h = currentHour; h < 24; h++) {
			const hourKey = h.toString().padStart(2, '0') + ':00';
			grouped[hourKey] = [];
		}

		for (const event of events) {
			const start = new Date(event.startTime);
			const end = new Date(event.endTime);

			// Rango de horas ocupadas por el evento
			let startHour = start.getHours();
			let endHour = end.getMinutes() === 0 ? end.getHours() : end.getHours() + 1;

			startHour = Math.max(currentHour, startHour); // Evita incluir eventos antes de la hora actual
			endHour = Math.min(24, endHour);

			for (let h = startHour; h < endHour; h++) {
				const hourKey = h.toString().padStart(2, '0') + ':00';
				if (!grouped[hourKey]) grouped[hourKey] = []; // Seguridad extra
				grouped[hourKey].push(event);
			}
		}

		return grouped;
	});

	getAppIcon(packageName: string) {
		return this._bridgeService.getAppIcon(packageName);
	}

	openApp(packageName: string) {
		return this._bridgeService.requestLaunchApp(packageName);
	}
}
