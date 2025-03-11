import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {Observable} from "rxjs";

@Injectable({ providedIn: 'root' })
export class DownloadService {
  private apiDownloadUrl = '/api/download';

  constructor(private http: HttpClient) {}

  downloadDistributionPDF(am: string) {
    return this.http.get(`${this.apiDownloadUrl}/distributions/?am=${am}`, {
          responseType: 'blob', // This ensures the response is treated as a file (PDF)
    });
  }

  downloadContractPDF(am: string) {
    return this.http.get(`${this.apiDownloadUrl}/contracts/?am=${am}`, {
          responseType: 'blob', // This ensures the response is treated as a file (PDF)
    });
  }

}
