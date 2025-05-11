import { Component, output } from '@angular/core';
import { ClockComponent } from './components/clock/clock.component';
import { StartButtonComponent } from './components/start-button/start-button.component';

@Component({
    selector: 'app-taskbar',
    imports: [StartButtonComponent, ClockComponent],
    standalone: true,
    templateUrl: './taskbar.component.html',
    styleUrl: './taskbar.component.scss',
})
export class TaskbarComponent {
    openStartMenuEventEmitter = output({ alias: 'openStartMenu' });
}
