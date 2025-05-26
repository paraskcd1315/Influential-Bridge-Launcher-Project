import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StatusbarService } from '../statusbar/statusbar.service';
import { OpenWeather } from './weather.types';

@Injectable({
	providedIn: 'root',
})
export class WeatherService {
	private readonly _statusbarService = inject(StatusbarService);
	private readonly _httpClient: HttpClient = inject(HttpClient);
	private readonly apiKey: string = environment.weatherApiKey;
	private readonly apiUrl: string = 'https://api.openweathermap.org/data/2.5/weather?q=Castelldefels,es&appid=' + this.apiKey + '&units=metric';

	private readonly weatherResource = rxResource({
		request: () => ({ location: this._statusbarService.location() }),
		loader: () => {
			if (this._statusbarService.location().latitude || this._statusbarService.location().longitude) {
				return this._httpClient
					.get<OpenWeather>(`https://api.openweathermap.org/data/2.5/weather?lat=${this._statusbarService.location().latitude}&lon=${this._statusbarService.location().longitude}&appid=${this.apiKey}&units=metric`)
					.pipe(map((resp) => resp));
			}
			return this._httpClient.get<OpenWeather>(this.apiUrl).pipe(map((resp) => resp));
		},
	});

	temperatureData = computed(() => this.weatherResource.value()?.main);
	weatherData = computed(() => this.weatherResource.value()?.weather ?? []);
	cityName = computed(() => this.weatherResource.value()?.name ?? '');
	isLoading = this.weatherResource.isLoading;

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
