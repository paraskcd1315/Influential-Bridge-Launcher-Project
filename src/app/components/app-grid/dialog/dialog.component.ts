import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { DialogService } from './dialog.service';

@Component({
	selector: 'app-dialog',
	imports: [CommonModule],
	templateUrl: './dialog.component.html',
	styleUrl: './dialog.component.scss',
})
export class DialogComponent {
	private readonly _dialogService = inject(DialogService);
	isVisible = this._dialogService.isVisible;
	selectedApp = this._dialogService.selectedApp;
	isHiding = signal(false);

	dismiss() {
		this.isHiding.set(true); // trigger fade-out
		setTimeout(() => {
			this.isHiding.set(false);
			this._dialogService.dismissDialog(); // actually hides the dialog
		}, 200); // match your fade-out animation duration
	}

	remove() {
		this._dialogService.removeAppFromFavourites();
	}

	uninstall() {
		this._dialogService.uninstallApp();
	}
}
