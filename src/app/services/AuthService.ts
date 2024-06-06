import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {Observable} from "rxjs";

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return this.http.post<any>('/api/login', { username, password });
  }

  validateToken(): Observable<{ valid: boolean }> {
    return this.http.get<{ valid: boolean }>('/api/validateToken', { withCredentials: true });
  }

  logout(): Observable<any> {
    return this.http.post<any>('/api/logout', {}, { withCredentials: true });
  }
}
