import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { AppGridComponent } from './components/app-grid/app-grid.component';
import { ContextMenuComponent } from './components/context-menu/context-menu.component';
import { DateComponent } from './components/date/date.component';
import { StartMenuComponent } from './components/start-menu/start-menu.component';
import { TaskbarComponent } from './components/taskbar/taskbar.component';
import { WeatherComponent } from './components/weather/weather.component';

@Component({
	selector: 'app-root',
	imports: [TaskbarComponent, StartMenuComponent, DateComponent, AppGridComponent, CommonModule, ContextMenuComponent, WeatherComponent],
	standalone: true,
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss',
})
export class AppComponent {
	startMenuActive = signal<boolean>(false);

	openStartMenu() {
		this.startMenuActive.update((state) => !state);
	}
}
