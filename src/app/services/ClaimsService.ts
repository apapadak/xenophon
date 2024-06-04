import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ClaimsService {
  constructor(private http: HttpClient) {}

  getClaims(username: string) {
    return this.http.get<any>(`/api/claims?username=${username}`);
  }

  getPublicationTitles() {
    return this.http.get<any>('/api/claims/publicationTitles');
  }

  getTypes() {
    return this.http.get<any>('/api/claims/types');
  }

  getPeriodicity() {
    return this.http.get<any>('/api/claims/periodicity');
  }
}
