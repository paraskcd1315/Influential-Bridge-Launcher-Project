import { CommonModule } from '@angular/common';
import { Component, effect, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { StartMenuDialogService } from './dialog.service';
import { DialogType, IDialogConfig } from './dialog.types';

@Component({
	selector: 'start-menu-dialog',
	imports: [CommonModule],
	templateUrl: './dialog.component.html',
	styleUrl: './dialog.component.scss',
})
export class DialogComponent {
	readonly DialogType = DialogType;

	private readonly _dialogService = inject(StartMenuDialogService);

	isVisible = this._dialogService.isVisible;
	dialogType = this._dialogService.dialogType;

	dialogConfig = input<IDialogConfig | null>(null);

	isHiding = signal<boolean>(false);
	textField = signal<string | undefined>(undefined);

	textInput = viewChild<ElementRef<HTMLInputElement>>('textInput');

	action = output<void>();

	constructor() {
		effect(() => {
			if (this.isVisible()) {
				setTimeout(() => {
					this.textInput()?.nativeElement?.focus();
				}, 0);
			}
		});

		effect(() => {
			this._dialogService.textField.set(this.textField());
		});
	}

	dismiss() {
		this.isHiding.set(true); // trigger fade-out
		setTimeout(() => {
			this.isHiding.set(false);
			this._dialogService.dismissDialog(); // actually hides the dialog
		}, 200); // match your fade-out animation duration
	}

	invokeAction() {
		this.action.emit();
		this.dismiss();
	}
}
