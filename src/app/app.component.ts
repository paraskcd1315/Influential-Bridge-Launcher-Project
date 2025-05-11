import { Component, signal } from '@angular/core';
import { StartMenuComponent } from './components/start-menu/start-menu.component';
import { TaskbarComponent } from './components/taskbar/taskbar.component';

@Component({
    selector: 'app-root',
    imports: [TaskbarComponent, StartMenuComponent],
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
