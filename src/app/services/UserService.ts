import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

export interface UserData {
  user_id:        number;
  afm:            string | null;
  mhtrwo:         string | null;
  legal_form:     string | null;
  tax_office:     string | null;
  firstname:      string | null;
  surname:        string | null;
  father_name:    string | null;
  dob:            string | null;
  adt:            string | null;
  iban:           string | null;
  bank:           string | null;

  address:        string | null;
  city:           string | null;
  postal_code:    string | null;
  country:        string | null;
  telephone:      string | null;
  mobile:         string | null;
  email_1:        string | null;
  email_2:        string | null;
  notes:          string | null;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  userInfo: any;

  constructor(private http: HttpClient) {
    this.loadProfileData();
  }

  getUser(username: string) {
    return this.http.get<any>(`/api/user?username=${username}`);
  }

  saveUser(user: UserData) {
    return this.http.post<any>('/api/user', user);
  }

  checkCredentials(username: string) {
    return this.http.get<any>(`/api/user/checkCredentials?username=${username}`);
  }

  loadProfileData() {
    const userInfo = localStorage.getItem('userInfo');

    this.userInfo = userInfo ? JSON.parse(userInfo) : this.initializeUserData();
    console.log('this.userInfo: ', userInfo);
  }

  initializeUserData(): UserData {
    return {
      user_id: -1,
      afm: null,
      mhtrwo: null,
      legal_form: null,
      tax_office: null,
      firstname: null,
      surname: null,
      father_name: null,
      dob: null,
      adt: null,
      iban: null,
      bank: null,
      address: null,
      city: null,
      postal_code: null,
      country: null,
      telephone: null,
      mobile: null,
      email_1: null,
      email_2: null,

      notes: null,
    };
  }

  getUserInfo() {
    const userInfoString = localStorage.getItem('userInfo');
    this.userInfo = userInfoString ? JSON.parse(userInfoString) : '';
console.log(this.userInfo);
    return this.userInfo;
  }
}
