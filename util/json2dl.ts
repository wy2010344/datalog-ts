import { rec, str, Rec, array, int, Term, bool } from "../core/types";
import { Json } from "./json";

type ADT = { type: string; [more: string]: Json };

export function jsonToDL(json: Json): Term {
  const res = (() => {
    if (json === null) {
      return rec("null", {});
    }
    switch (typeof json) {
      case "number":
        return int(json);
      case "string":
        return str(json);
      case "boolean":
        return bool(json);
      case "object":
        if (Array.isArray(json)) {
          return array(json.map(jsonToDL));
        }
        // this might not always be desired... but meh
        if (json.hasOwnProperty("type") && typeof json.type === "string") {
          return adtToRec(json as ADT);
        }
        const out: { [key: string]: Term } = {};
        for (const key in json) {
          out[key] = jsonToDL(json[key]);
        }
        return rec("", out);
      default:
        throw new Error(`unsupported value: ${json}`);
    }
  })();
  // console.groupEnd();
  return res;
}

export function adtToRec(adt: ADT): Rec {
  const copy = { ...adt };
  delete copy.type;
  return rec(adt.type, (jsonToDL(copy) as Rec).attrs);
}

export function dlToJson(term: Term, addTypeTags: boolean = true): Json {
  switch (term.type) {
    case "StringLit":
      return term.val;
    case "Bool":
      return term.val;
    case "IntLit":
      return term.val;
    case "Record":
      if (term.relation === "null" && Object.keys(term.attrs).length === 0) {
        return null;
      }
      const out: Json = {};
      for (const key in term.attrs) {
        out[key] = dlToJson(term.attrs[key], addTypeTags);
      }
      if (addTypeTags) {
        if (term.relation) {
          out.type = term.relation;
        }
      }
      return out;
    case "Array":
      return term.items.map((i) => dlToJson(i, addTypeTags));
  }
}
