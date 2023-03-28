import { ExportTypes } from "../../common/constants";

export class ExportDto {
  type: ExportTypes;
  zip_checkbox: string;
  zip_password: string;
}
