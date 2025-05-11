import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-clock',
    imports: [DatePipe],
    standalone: true,
    templateUrl: './clock.component.html',
    styleUrl: './clock.component.scss',
})
export class ClockComponent implements OnInit {
    isoDate = new Date().toISOString();

    ngOnInit(): void {
        this._updateDate();
    }

    _updateDate() {
        this.isoDate = new Date().toISOString();

        setTimeout(() => this._updateDate(), 1000);
    }
}
