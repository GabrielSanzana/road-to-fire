import { LoggerService, LoggerEvent } from '../services/logger.service';
import { Observable, of } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable()
export class MockLoggerService extends LoggerService {
  info(msg: string): void {
  }
  warn(msg: string): void {
  }
  error(msg: string, error?: any): void {
  }
  asObservable(): Observable<LoggerEvent> {
    return of();
  }
}
