import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, computed, inject, signal } from '@angular/core';
import { AppGridComponent } from './components/app-grid/app-grid.component';
import { ContextMenuComponent } from './components/context-menu/context-menu.component';
import { DateComponent } from './components/date/date.component';
import { StartMenuComponent } from './components/start-menu/start-menu.component';
import { TaskbarComponent } from './components/taskbar/taskbar.component';
import { WeatherComponent } from './components/weather/weather.component';
import { HomescreenService } from './utils/homescreen/homescreen.service';

@Component({
	selector: 'app-root',
	imports: [TaskbarComponent, StartMenuComponent, DateComponent, AppGridComponent, CommonModule, ContextMenuComponent, WeatherComponent],
	standalone: true,
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewInit {
	private readonly _homescreenService = inject(HomescreenService);
	startMenuActive = signal<boolean>(false);

	wallpaper = computed(() => `data:image/png;base64,${this._homescreenService.wallpaper()}`);

	openStartMenu() {
		this.startMenuActive.update((state) => !state);
	}

	ngAfterViewInit(): void {}
}
