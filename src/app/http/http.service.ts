import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CurrencyForm } from '../types/currency-form'
import { ConversionForm } from '../types/convesion-form'

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(private http: HttpClient) { }
  public getCurrency(): Observable<CurrencyForm> {
    return this.http.get<CurrencyForm>('https://v6.exchangerate-api.com/v6/77f8399df95eb60f594d5c81/codes')
  }
  public getConvesion(C1: string, C2: string): Observable<ConversionForm> {
    return this.http.get<ConversionForm>(`https://v6.exchangerate-api.com/v6/77f8399df95eb60f594d5c81/pair/${C1}/${C2}`)
  }
}
