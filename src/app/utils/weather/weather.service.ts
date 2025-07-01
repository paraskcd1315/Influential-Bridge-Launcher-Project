import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map, Observable } from 'rxjs';
import { PersistenceService } from '../persistence/persistence.service';
import { StatusbarService } from '../statusbar/statusbar.service';
import { OpenWeather } from './weather.types';

@Injectable({
	providedIn: 'root',
})
export class WeatherService {
	private readonly _persistenceService = inject(PersistenceService);
	private readonly _statusbarService = inject(StatusbarService);
	private readonly _httpClient: HttpClient = inject(HttpClient);
	private readonly apiKey = computed(() => this._persistenceService.apiKeysStore().weatherApiKey);
	private readonly apiUrl = computed(() => {
		if (this.apiKey() && this._statusbarService.location().latitude && this._statusbarService.location().longitude) {
			return `https://api.openweathermap.org/data/2.5/weather?lat=${this._statusbarService.location().latitude}&lon=${this._statusbarService.location().longitude}&appid=${this.apiKey}&units=metric`;
		} else {
			return '';
		}
	});

	private readonly weatherResource = rxResource({
		request: () => ({ apiUrl: this.apiUrl() }),
		loader: ({ request }): Observable<OpenWeather | null> => {
			const { apiUrl } = request;
			return this._httpClient.get<OpenWeather>(apiUrl).pipe(map((resp) => resp));
		},
	});

	temperatureData = computed(() => this.weatherResource.value()?.main);
	weatherData = computed(() => this.weatherResource.value()?.weather ?? []);
	cityName = computed(() => this.weatherResource.value()?.name ?? '');
	isLoading = this.weatherResource.isLoading;
	isError = this.weatherResource.error;

	constructor() {
		this.reload();
	}

	getWeatherIcon(iconCode: string) {
		return `assets/icons/weather-icons/${iconCode}.svg`;
	}

	reload() {
		this.weatherResource.reload();

		setTimeout(() => {
			this.reload();
		}, 3_600_000);
	}
}
