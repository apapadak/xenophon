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

  getDropdownData(): Observable<any> {
    return this.http.get<any>('/api/claims/dropdownData');
  }
}
