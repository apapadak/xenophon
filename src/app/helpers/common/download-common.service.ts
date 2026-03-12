import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {UserService} from '../../services/UserService';
import { Observable } from 'rxjs';
import {DownloadService} from '../../services/DownloadService';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DownloadCommonService {

  userInfo: any;

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    private downloadService: DownloadService,
    private userService: UserService
    ) {
      this.userInfo = userService.getUserInfo();
  }

  /*downloadDistributionPDF(am: string): Observable<Blob> {
      console.log('userInfo: ', this.userInfo);
      return this.downloadService.downloadDistributionPDF(am);
  }*/

  downloadDistributionPDF(am: string, distributionYear: number): void {
    console.log('Downloading Distribution PDF for user:', this.userInfo);

    this.downloadService.downloadDistributionPDF(am, distributionYear).pipe(
      catchError((error) => {
        if (error.status === 404) {
          this.messageService.add({
            severity: 'error',
            summary: 'Σφάλμα Λήψης',
            detail: `Το αρχείο PDF για τη διανομή ${distributionYear} δεν βρέθηκε.`,
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Σφάλμα',
            detail: 'Παρουσιάστηκε σφάλμα κατά τη λήψη του αρχείου.',
          });
        }
        return throwError(() => error);
      })
    ).subscribe((blob: Blob) => {
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${am}_distribution_${distributionYear}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.messageService.add({
          severity: 'success',
          summary: 'Επιτυχής Λήψη',
          detail: `Το αρχείο PDF της διανομής ${distributionYear} λήφθηκε επιτυχώς.`,
        });
      }
    });
  }

  downloadContractPDF(am: string): void {
    console.log('Downloading Contract PDF for user:', this.userInfo);

    this.downloadService.downloadContractPDF(am).pipe(
      catchError((error) => {
        if (error.status === 404) {
          this.messageService.add({
            severity: 'error',
            summary: 'Σφάλμα Λήψης',
            detail: 'Το αρχείο PDF δεν βρέθηκε.',
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Σφάλμα',
            detail: 'Παρουσιάστηκε σφάλμα κατά τη λήψη του αρχείου.',
          });
        }
        return throwError(() => error);
      })
    ).subscribe((blob: Blob) => {
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${am}_contract_2023.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.messageService.add({
          severity: 'success',
          summary: 'Επιτυχής Λήψη',
          detail: `Το αρχείο PDF λήφθηκε επιτυχώς.`,
        });
      }
    });
  }

}
