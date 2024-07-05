import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {Observable} from "rxjs";

@Injectable({ providedIn: 'root' })
export class ClaimsService {
  constructor(private http: HttpClient) {}

  getPaperClaims(userId: string) {
    return this.http.get<any>(`/api/claims/paper/?userId=${userId}`);
  }

  getInternetClaims(userId: string) {
    return this.http.get<any>(`/api/claims/internet/?userId=${userId}`);
  }

  getTvClaims(userId: string) {
    return this.http.get<any>(`/api/claims/tv/?userId=${userId}`);
  }

  getRadioClaims(userId: string) {
    return this.http.get<any>(`/api/claims/radio/?userId=${userId}`);
  }

  savePaperClaims(payload: any): Observable<any> {
    return this.http.post<any>(`/api/claims/paper/saveClaims`, payload);
  }

  saveInternetClaims(payload: any): Observable<any> {
    return this.http.post<any>(`/api/claims/internet/saveClaims`, payload);
  }

  saveTvClaims(payload: any): Observable<any> {
    return this.http.post<any>(`/api/claims/tv/saveClaims`, payload);
  }

  saveRadioClaims(payload: any): Observable<any> {
    return this.http.post<any>(`/api/claims/radio/saveClaims`, payload);
  }

  getDropdownData(): Observable<any> {
    return this.http.get<any>('/api/claims/dropdownData');
  }
}
