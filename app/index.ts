import {EnapiApiClientMockImplementation} from "../core/enapi-tariff-api-client";
import {formatResults} from "./output-handler";
import {CpoConfig} from "../core";
import finestChargeConfig from "../cpo-finest-charge-ltd";
import globalChargeConfig from "../cpo-global-charge-services";
import {hideBin} from "yargs/helpers";
import yargs from "yargs";


/**
 * this sadly exposes the name of the other CPO's into the bundled version
 * this could be handled by a dynmaic import,
 * but I was not able to make it work in the timeframe of the task
 */
const cpoConfigMap: Record<string, CpoConfig<any>> = {
    "finest-charge-ltd": finestChargeConfig,
    "global-charge-services": globalChargeConfig,
};

/**
 * This is not tested, only prototyped code! could be improved on many layers
 * - a fronted instead of this hacky cli option
 * - only check for file if actually needed
 * ...
 */

(async () => {
    try {
        if (!CPO) {
            console.error("Error: No CPO defined at build time. Use --define:CPO='<cpo-name>' in esbuild.");
            process.exit(1);
        }

        console.log(`Loading configuration for CPO: ${CPO}`);

        const cpoConfig = cpoConfigMap[CPO];

        console.log(`Using validator for: ${cpoConfig.name}`);

        const argv = yargs(hideBin(process.argv))
            .option("file", {
                alias: "f",
                type: "string",
                description: "Path to the input file",
                demandOption: false,
            })
            .help()
            .argv;


        if (!argv.file) {
            console.log("No input file provided. Using default data sources (e.g., API).");
        }

        const enapiClient = new EnapiApiClientMockImplementation("")
        const enapiTariffs = await enapiClient.fetchTariffs(cpoConfig.cpoIds);


        const cpoData = await cpoConfig.dataProvider.getData(argv.file);

        const results = cpoConfig.validator.validateData(cpoData, enapiTariffs);

        formatResults(results);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
})();