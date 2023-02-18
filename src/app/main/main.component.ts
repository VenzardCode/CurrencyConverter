import { SupportedCodesType } from '../types/supported-codes-type';
import { HttpService } from './../http/http.service';
import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CurrencyRecord } from '../types/currensy-record-type';
@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent {
  public fCFrom: FormControl = new FormControl("USD");
  public fCTo: FormControl = new FormControl("UAH");
  public fCAmmountFrom: FormControl = new FormControl(1);
  public fCAmmountTo: FormControl = new FormControl();
  public supportedCountries: SupportedCodesType[] = [];
  public prevFrom: string = 'USD';
  public prevTo: string = 'UAH';
  public euroHeader: number = 0;
  public dollarHeader: number = 0;
  public loaded: boolean = false;


  public currentCurrensies: { convert: CurrencyRecord, eur: CurrencyRecord, usd: CurrencyRecord } = {
    convert: null,
    eur: null,
    usd: null
  }
  public currenсyRates: Record<string, Record<string, CurrencyRecord>> = {};

  constructor(public HttpService: HttpService) {
    this.init();
  }

  private async init(): Promise<void> {
    let currenсyRatesStr: string | null = localStorage.getItem('currenсyRates');
    if (currenсyRatesStr != null) {
      this.currenсyRates = JSON.parse(currenсyRatesStr);
    }
    await this.updateСonversion('convert', this.fCFrom.value, this.fCTo.value)
    await this.uppdateCurrency();
    this.initCallbacks();
    this.fCAmmountFrom.setValue(1);
    await this.getHederInfo();
    this.loaded = true;

  }

  private async getCurrentCurrecyRate(record: "convert" | "eur" | "usd", from: string, to: string): Promise<number> {
    if (this.currentCurrensies[record] != null) {
      // обновление каждые 2 часа
      if (Date.now() - (this.currentCurrensies[record]?.lastUpdated ?? 0) < 7200000) {
        await this.updateСonversion(record, from, to);
      }
    }
    else {
      await this.updateСonversion(record, from, to);
    }
    return this.currentCurrensies[record]?.rate ?? 0;
  }
  private updateСonversion(record: "convert" | "eur" | "usd", from: string, to: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.currenсyRates[from] != null) {
        if (this.currenсyRates[from][to] != null) {
          this.currentCurrensies[record] = this.currenсyRates[from][to];
          resolve();
          return;
        }
      }
      else {
        this.currenсyRates[from] = {};
      }
      if (this.currenсyRates[to]?.[from] != null) {
        let tmpRate: number = this.currenсyRates[to][from]?.rate ?? 0;
        let tmpLastUppadate: number = this.currenсyRates[to][from]?.lastUpdated ?? 0;
        this.currenсyRates[from][to] = { rate: 1 / tmpRate, lastUpdated: tmpLastUppadate };
        this.currentCurrensies[record] = this.currenсyRates[from][to];
        resolve();
        return;
      }
      this.HttpService.getConvesion(from, to).subscribe(res => {

        this.currenсyRates[from][to] = { rate: res.conversion_rate, lastUpdated: Date.now() }
        this.currentCurrensies[record] = this.currenсyRates[from][to];
        localStorage.setItem('currenсyRates', JSON.stringify(this.currenсyRates));
        resolve();
      });
    });
  }
  public async getHederInfo(): Promise<void> {
    this.euroHeader = Math.round(await this.getCurrentCurrecyRate('eur', 'EUR', 'UAH') * 1000) / 1000;
    this.dollarHeader = Math.round(await this.getCurrentCurrecyRate('usd', 'USD', 'UAH') * 1000) / 1000;
    setInterval(async () => {
      this.euroHeader = Math.round(await this.getCurrentCurrecyRate('eur', 'EUR', 'UAH') * 1000) / 1000;
      this.dollarHeader = Math.round(await this.getCurrentCurrecyRate('usd', 'USD', 'UAH') * 1000) / 1000;
    }, 300000);
  }
  public swapClick(): void {
    this.fCFrom.setValue(this.fCTo.value);
  }

  private uppdateCurrency(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.HttpService.getCurrency().subscribe(res => {

        this.supportedCountries = res.supported_codes;
        resolve();
      });
    });
  }
  private ConvesionFrom(amount: number, rate: number): number {
    return Math.round(amount * rate * 1000) / 1000;
  }
  private ConvesionTo(amount: number, rate: number): number {
    return Math.round(amount / rate * 1000) / 1000;
  }
  private initCallbacks(): void {
    let amountUpdating: boolean = false;
    let currensyUpdating: boolean = false;

    this.fCTo.valueChanges.subscribe(async data => {
      if (!currensyUpdating) {
        if (data == this.fCFrom.value) {
          currensyUpdating = true;
          this.fCFrom.setValue(this.prevTo);
          currensyUpdating = false;
        }

        await this.updateСonversion('convert', this.fCFrom.value, data);
        if (!amountUpdating) {
          amountUpdating = true;
          this.fCAmmountTo.setValue(this.ConvesionFrom(
            this.fCAmmountFrom.value,
            await this.getCurrentCurrecyRate('convert', this.fCFrom.value, this.fCTo.value)));
          amountUpdating = false;
        }
      }
      this.prevTo = data;

    });

    this.fCFrom.valueChanges.subscribe(async data => {
      if (!currensyUpdating) {
        if (data == this.fCTo.value) {
          currensyUpdating = true;
          this.fCTo.setValue(this.prevFrom);
          currensyUpdating = false;
        }
        await this.updateСonversion('convert', data, this.fCTo.value);
        if (!amountUpdating) {
          amountUpdating = true;
          this.fCAmmountTo.setValue(this.ConvesionFrom(
            this.fCAmmountFrom.value,
            await this.getCurrentCurrecyRate('convert', this.fCFrom.value, this.fCTo.value)));
          amountUpdating = false;
        }
      }
      this.prevFrom = data;

    });

    this.fCAmmountFrom.valueChanges.subscribe(async () => {
      if (!amountUpdating) {
        amountUpdating = true;
        this.fCAmmountTo.setValue(this.ConvesionFrom(
          this.fCAmmountFrom.value,
          await this.getCurrentCurrecyRate('convert', this.fCFrom.value, this.fCTo.value)));
        amountUpdating = false;
      }
    });

    this.fCAmmountTo.valueChanges.subscribe(async () => {
      if (!amountUpdating) {
        amountUpdating = true;
        this.fCAmmountFrom.setValue(this.ConvesionTo(
          this.fCAmmountTo.value,
          await this.getCurrentCurrecyRate('convert', this.fCFrom.value, this.fCTo.value)));
        amountUpdating = false;
      }
    });
  }





}
