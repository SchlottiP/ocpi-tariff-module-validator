import * as fs from "fs";
import {GlobalChargeServicesDataProvider} from "./global-charge-services-data";
import {GlobalChargeRow} from "./index";

jest.mock("fs");

describe("GlobalChargeServicesValidator.getData", () => {
    let dataProvider: GlobalChargeServicesDataProvider;

    beforeEach(() => {
        dataProvider = new GlobalChargeServicesDataProvider();
    });

    it("should correctly load valid rows with proper headers", async () => {
        const mockCsv = `plan_name;currency;provider;price_per_kwh;hourly_parking_rate;start_time;end_time
Basic Plan;USD;US*CPO;0.25;2.00;09:00;18:00
Value Rate;EUR;ES*CPO;0.32;2.50;09:00;18:00`;

        (fs.readFileSync as jest.Mock).mockReturnValue(mockCsv);

        const result = await dataProvider.getData("mock.csv");

        expect(result).toEqual<GlobalChargeRow[]>([
            {
                plan_name: "Basic Plan",
                currency: "USD",
                provider: "US*CPO",
                price_per_kwh: 0.25,
                hourly_parking_rate: 2,
                start_time: "09:00",
                end_time: "18:00",
            },
            {
                plan_name: "Value Rate",
                currency: "EUR",
                provider: "ES*CPO",
                price_per_kwh: 0.32,
                hourly_parking_rate: 2.5,
                start_time: "09:00",
                end_time: "18:00",
            },
        ]);
    });

    it("should throw an error if headers are missing", () => {
        const mockCsv = `plan_name;currency;provider;price_per_kwh;hourly_parking_rate;start_time
Basic Plan;USD;US*CPO;0.25;2.00;09:00`;

        (fs.readFileSync as jest.Mock).mockReturnValue(mockCsv);

        expect(() => dataProvider.getData("mock.csv")).toThrowError(
            "Missing headers in CSV: end_time."
        );
    });

    it("should throw an error if there are unexpected headers", () => {
        const mockCsv = `plan_name;currency;provider;price_per_kwh;hourly_parking_rate;start_time;end_time;extra_column
Basic Plan;USD;US*CPO;0.25;2.00;09:00;18:00;unexpected_value`;

        (fs.readFileSync as jest.Mock).mockReturnValue(mockCsv);

        expect(() => dataProvider.getData("mock.csv")).toThrowError(
            "Unexpected headers in CSV: extra_column."
        );
    });

    it("should throw an error if the CSV file is empty", () => {
        const mockCsv = "";

        (fs.readFileSync as jest.Mock).mockReturnValue(mockCsv);

        expect(() => dataProvider.getData("mock.csv")).toThrowError(
            "The CSV file is empty or has insufficient data."
        );
    });

    it("should throw an error if a row has an invalid numeric value", () => {
        const mockCsv = `plan_name;currency;provider;price_per_kwh;hourly_parking_rate;start_time;end_time
Basic Plan;USD;US*CPO;invalid_value;2.00;09:00;18:00`;

        (fs.readFileSync as jest.Mock).mockReturnValue(mockCsv);

        expect(() => dataProvider.getData("mock.csv")).toThrowError(
            "Invalid number for key 'price_per_kwh': invalid_value"
        );
    });
});
