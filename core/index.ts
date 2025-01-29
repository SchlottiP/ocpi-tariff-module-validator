import {CpoDataProvider, CpoValidationProvider} from "./tariff-validation.model";

export const validateTariff = (): string => {
    return "validate"
};

export interface CpoConfig<T> {
    // One CPO can have several sub CPO's (e.g. Global Charge Services Co.)
    cpoIds: string[];
    name: string;
    dataProvider: CpoDataProvider<T>;
    validator: CpoValidationProvider<T>
}