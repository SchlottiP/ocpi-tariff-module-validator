export enum DayOfWeek {
    MONDAY = "MONDAY",
    TUESDAY = "TUESDAY",
    WEDNESDAY = "WEDNESDAY",
    THURSDAY = "THURSDAY",
    FRIDAY = "FRIDAY",
    SATURDAY = "SATURDAY",
    SUNDAY = "SUNDAY",
}

export enum TariffDimensionType {
    ENERGY = "ENERGY",
    FLAT = "FLAT", //Start or transaction fee
    PARKING_TIME = "PARKING_TIME",
    TIME = "TIME",
}

export enum ReservationRestrictionType {
    RESERVATION = "RESERVATION",
    RESERVATION_EXPIRES = "RESERVATION_EXPIRES",
}

export enum TariffType {
    AD_HOC_PAYMENT = "AD_HOC_PAYMENT",
    PROFILE_CHEAP = "PROFILE_CHEAP",
    PROFILE_FAST = "PROFILE_FAST",
    PROFILE_GREEN = "PROFILE_GREEN",
    REGULAR = "REGULAR",
}

export interface PriceComponent {
    type: TariffDimensionType;
    price: number;
    vat?: number;
    step_size: number;
}

export interface TariffRestrictions {
    start_time?: string;
    end_time?: string;
    start_date?: string;
    end_date?: string;
    min_kwh?: number;
    max_kwh?: number;
    min_current?: number;
    max_current?: number;
    min_power?: number;
    max_power?: number;
    min_duration?: number;
    max_duration?: number;
    day_of_week?: DayOfWeek[];
    reservation?: ReservationRestrictionType;
}

export interface TariffElement {
    price_components: PriceComponent[];
    restrictions?: TariffRestrictions;
}

export interface EnergyMix {
    // Not relevant for the validation and not part of the TariffModul.
    // Could be added in a later state of the project
}
export interface ValidationTariffData {
    min_price?: number;
    max_price?: number;
    elements: TariffElement[];
    type?: TariffType;
    currency: string; // ISO-4217 currency code
    country_code: string; // ISO-3166 alpha-2 country code of the CPO
    party_id: string;
}

export interface Tariff extends ValidationTariffData {
    country_code: string; // ISO-3166 alpha-2 country code of the CPO
    party_id: string; // ID of the CPO that owns this Tariff //TODO: where do I get the tariff code from?
    id: string;
    currency: string; // ISO-4217 currency code
    type?: TariffType;
    tariff_alt_text?: string[];
    tariff_alt_url?: string;
    min_price?: number;
    max_price?: number;
    elements: TariffElement[];
    start_date_time?: string; // Start time of tariff validity (UTC)
    end_date_time?: string; // End time of tariff validity (UTC)
    energy_mix?: EnergyMix; // not relevant in this context so far
    last_updated: string;
}