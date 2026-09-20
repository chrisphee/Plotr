import { customAlphabet } from "nanoid";

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
const nano = customAlphabet(alphabet, 12);

export type IdPrefix =
  | "prj"
  | "fld"
  | "brd"
  | "cat"
  | "note"
  | "ref"
  | "nbf"
  | "pt"
  | "sec"
  | "it"
  | "cn"
  | "att"
  | "tr";

export function makeId(prefix: IdPrefix): string {
  return `${prefix}_${nano()}`;
}
