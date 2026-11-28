import { Routes } from '@angular/router';
import { loadCalendarPage } from './calendar-renderer';

export default [{ path: '', loadComponent: loadCalendarPage }] satisfies Routes;
