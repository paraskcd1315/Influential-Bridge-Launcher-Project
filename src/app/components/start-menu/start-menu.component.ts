import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { StartMenuService } from './start-menu.service';

@Component({
    selector: 'app-start-menu',
    imports: [CommonModule, MatIconModule],
    standalone: true,
    templateUrl: './start-menu.component.html',
    styleUrl: './start-menu.component.scss',
})
export class StartMenuComponent {
    private readonly _startMenuService = inject(StartMenuService);
    active = input();
    apps = this._startMenuService.apps;

    getAppIcon(packageName: string) {
        return this._startMenuService.getAppIcon(packageName);
    }
    openApp(packageName: string) {
        return this._startMenuService.openApp(packageName);
    }
}
