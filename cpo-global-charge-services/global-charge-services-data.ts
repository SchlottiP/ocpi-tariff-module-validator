import {CpoDataProvider} from "../core/tariff-validation.model";
import {readFileSync} from "fs";
import {GlobalChargeRow} from "./index";


export class GlobalChargeServicesDataProvider
    implements CpoDataProvider<GlobalChargeRow> {
    /**
     * Parse the CSV input into an array of GlobalChargeRow objects.
     * @param inputFilePath - Path to the CSV input file
     */
    getData(inputFilePath: string): Promise<GlobalChargeRow[]> {
        const csv = readFileSync(inputFilePath, "utf8");

        // Split rows by newline and columns by ";"
        const rows = csv.trim().split("\n").map((row) => row.split(";"));

        if (rows.length < 2) {
            throw new Error("The CSV file is empty or has insufficient data.");
        }


        const actualHeaders = rows[0];
        this.validateHeader(actualHeaders);

        return Promise.resolve(rows.slice(1).map((row, _) => {
            const data: any = {};
            actualHeaders.forEach((header, i) => {
                data[header] = this.parseValue(header as keyof GlobalChargeRow, row[i]);
            });

            return data as GlobalChargeRow;
        }));
    }

    /**
     * Parses a value based on its key.
     * @param key - The key of the field being parsed.
     * @param value - The raw value from the CSV.
     */
    private parseValue(key: keyof GlobalChargeRow, value: string): any {
        if (key === "price_per_kwh" || key === "hourly_parking_rate") {
            const parsedValue = parseFloat(value);
            if (isNaN(parsedValue)) {
                throw new Error(`Invalid number for key '${key}': ${value}`);
            }
            return parsedValue;
        }
        return value.trim();
    }


    /**
     * Validates the headers in the CSV against the keys of the specified interface.
     * @param actualHeaders - Headers extracted from the CSV file.
     */
    private validateHeader(actualHeaders: string[]): void {
        //done like this to get keys at runtime but still typesavety
        var emptyRow: GlobalChargeRow = {
            plan_name: "",
            currency: "",
            provider: "",
            price_per_kwh: 0,
            hourly_parking_rate: 0,
            start_time: "",
            end_time: "",
        }
        const expectedHeaders = Object.keys(emptyRow)
        const missingHeaders = expectedHeaders.filter(
            (key) => !actualHeaders.includes(key)
        );

        const unexpectedHeaders = actualHeaders.filter(
            (key) => !expectedHeaders.includes(key)
        );

        if (missingHeaders.length > 0) {
            throw new Error(`Missing headers in CSV: ${missingHeaders.join(", ")}.`);
        }

        if (unexpectedHeaders.length > 0) {
            throw new Error(`Unexpected headers in CSV: ${unexpectedHeaders.join(", ")}.`);
        }
    }
}