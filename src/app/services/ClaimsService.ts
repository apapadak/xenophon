import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ClaimsService {
  constructor(private http: HttpClient) {}

  getClaims(username: string) {
    return this.http.get<any>(`/api/claims?username=${username}`);
  }

  getArticleTitles() {
    return this.http.get<any>('/api/claims/articleTitles');
  }

  getTypes() {
    return this.http.get<any>('/api/claims/types');
  }

  getPeriodicity() {
    return this.http.get<any>('/api/claims/periodicity');
  }
}
