import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {Observable} from "rxjs";

@Injectable({ providedIn: 'root' })
export class ClaimsService {
  constructor(private http: HttpClient) {}

  getClaims(userId: string) {
    return this.http.get<any>(`/api/claims?userId=${userId}`);
  }

  saveClaims(payload: any): Observable<any> {
    return this.http.post<any>(`/api/claims/saveClaims`, payload);
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
