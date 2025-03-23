import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {Observable} from "rxjs";

@Injectable({ providedIn: 'root' })
export class ClaimsService {
  private apiClaimsUrl = '/api/claims';

  constructor(private http: HttpClient) {}

  getPaperClaims(userId: string, distributionYear?: string) {
    return this.http.get<any>(`${this.apiClaimsUrl}/${distributionYear ? distributionYear + '/' : ''}paper/?userId=${userId}`);
  }

  getInternetClaims(userId: string, distributionYear?: string) {
     return this.http.get<any>(`${this.apiClaimsUrl}/${distributionYear ? distributionYear + '/' : ''}internet/?userId=${userId}`);
  }

  getTvClaims(userId: string, distributionYear?: string) {
      return this.http.get<any>(`${this.apiClaimsUrl}/${distributionYear ? distributionYear + '/' : ''}tv/?userId=${userId}`);
  }

  getRadioClaims(userId: string, distributionYear?: string) {
     return this.http.get<any>(`${this.apiClaimsUrl}/${distributionYear ? distributionYear + '/' : ''}radio/?userId=${userId}`);
  }

  getOtherClaims(userId: string, distributionYear?: string) {
     return this.http.get<any>(`${this.apiClaimsUrl}/${distributionYear ? distributionYear + '/' : ''}other/?userId=${userId}`);
  }

  savePaperClaims(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiClaimsUrl}/paper/saveClaims`, payload);
  }

  saveInternetClaims(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiClaimsUrl}/internet/saveClaims`, payload);
  }

  saveTvClaims(payload: any): Observable<any> {
    return  this.http.post<any>(`${this.apiClaimsUrl}/tv/saveClaims`, payload);
  }

  saveRadioClaims(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiClaimsUrl}/radio/saveClaims`, payload);
  }

  saveOtherClaims(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiClaimsUrl}/other/saveClaims`, payload);
  }

  getDropdownData(): Observable<any> {
    return this.http.get<any>(`${this.apiClaimsUrl}/dropdownData`);
  }
}
