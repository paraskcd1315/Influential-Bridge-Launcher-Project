import { Component, HostListener, output } from '@angular/core';

@Component({
    selector: 'app-start-button',
    imports: [],
    standalone: true,
    templateUrl: './start-button.component.html',
    styleUrl: './start-button.component.scss',
})
export class StartButtonComponent {
    startEmitter = output();

    @HostListener('click', ['$event.target'])
    onClick(btn: HTMLDivElement) {
        btn.classList.toggle('active');
        this.startEmitter.emit();
    }
}
