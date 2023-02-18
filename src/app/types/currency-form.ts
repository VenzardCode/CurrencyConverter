import { SupportedCodesType } from './supported-codes-type'
export interface CurrencyForm {
  result: string;
  documentation: string;
  terms_of_use: string;
  supported_codes: SupportedCodesType[]
}
