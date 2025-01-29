# README

## Overview
This project demonstrates a modular CLI tool for validating tariff data for CPOs (Charge Point Operators). Each CPO has its specific validation logic implemented in a dedicated folder. The tool supports building, testing, and running the validation process.

---

## Prerequisites

Before proceeding, ensure you have the following installed:

1. **Node.js** (v18)
2. **npm** (comes with Node.js)
3. **pkg** for creating executable binaries (installed as a project dependency).

---

## Project Structure

The project is organized as follows:

```
project-root/
├── app/
├── core/
├── cpo-global-charge-services/
├── cpo-finest-charge-ltd/
├── tariffs.csv
├── package.json
├── tsconfig.json
```

- `app/` - Contains the CLI entry point.
- `core/` - Shared validation logic.
- `cpo-global-charge-services/` - CPO-specific validation for "Global Charge Services"
- `cpo-finest-charge-ltd/` - CPO-specific validation for "Finest Charge Ltd."
- `tariffs.csv` - Example input file for testing "Global Charge Services"

---

## Building

To build the project for a specific CPO:

1. run `nvm use 18` to make sure that you use the correct node version

2. Use the `build-and-package` command with the desired CPO name:

    ```bash
    npm run build-and-package:global-charge-services
    npm run build-and-package:finest-charge-ltd
    ```
    this combines the build and packaging step, it is also possible to run `build` and `package` seperated
4. Output binaries will be located in the root folder 

## Running the CLI Tool

To run the CLI tool for a specific CPO:

1. Ensure the `tariffs.csv` file is in the root directory.

2. Run the appropriate binary with the input file:

    ```bash
    ./dist/global-charge-services tariffs.csv
    ./dist/finest-charge-ltd
    ```

## Testing

To run tests for the project:

1. Execute the following command:

    ```bash
    npm test
    ```

2. This will run all unit tests, including validations for:

    - Correct reading of input files for each cpo.
    - Proper validation logic for each CPO.

---

## Example

### Building for "Global Charge Services"

```bash
npm run build:global-charge-services
```

## Notes

- Ensure `tariffs.csv` exists and is formatted correctly before running the CLI tool.
- To add a new CPO, create a new folder following the existing structure and add a corresponding build script in `package.json`.
