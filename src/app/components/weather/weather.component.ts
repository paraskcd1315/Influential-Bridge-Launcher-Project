import { Component, HostListener, inject } from '@angular/core';
import { BridgeService } from '../../utils/bridge/bridge.service';
import { WEATHER_APP } from '../../utils/constants';
import { WeatherService } from '../../utils/weather/weather.service';

@Component({
	selector: 'app-weather',
	imports: [],
	templateUrl: './weather.component.html',
	styleUrl: './weather.component.scss',
})
export class WeatherComponent {
	private readonly _bridgeService = inject(BridgeService);
	private readonly _weatherService = inject(WeatherService);

	weatherData = this._weatherService.weatherData;
	temperatureData = this._weatherService.temperatureData;
	cityName = this._weatherService.cityName;
	isLoading = this._weatherService.isLoading;

	getWeatherIcon() {
		if (!this.weatherData()[0]?.icon) {
			return;
		}
		return this._weatherService.getWeatherIcon(this.weatherData()[0].icon!);
	}

	@HostListener('click')
	refresh() {
		this._weatherService.reload();
		this._bridgeService.requestLaunchApp(WEATHER_APP);
	}
}
