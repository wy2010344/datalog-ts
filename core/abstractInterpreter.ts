import { Program, Rec, Relation, Res, Rule, Statement } from "./types";
import { Loader } from "./loaders";
import { DLStmt, parse } from "../languageWorkbench/languages/dl/parser";

export abstract class AbstractInterpreter {
  loadStack: string[];
  loader: Loader;
  cwd: string;

  protected constructor(cwd: string, loader: Loader) {
    this.loadStack = []; // TODO: use
    this.loader = loader;
    this.cwd = cwd;
  }

  abstract evalStmt(stmt: DLStmt): [Res[], AbstractInterpreter];

  // default impl that isn't bulk
  bulkInsert(records: Rec[]): AbstractInterpreter {
    let interp: AbstractInterpreter = this;
    for (const record of records) {
      interp = interp.evalStmt({ type: "Insert", record })[1];
    }
    return interp;
  }

  evalStmts(stmts: DLStmt[]): [Res[], AbstractInterpreter] {
    const results: Res[] = [];
    let interp: AbstractInterpreter = this;
    stmts.forEach((stmt) => {
      const [newResults, newInterp] = interp.evalStmt(stmt);
      newResults.forEach((res) => results.push(res));
      interp = newInterp;
    });
    return [results, interp];
  }

  insert(record: Rec): AbstractInterpreter {
    const [_, newInterp] = this.evalStmt({ type: "Insert", record });
    return newInterp;
  }

  insertAll(records: Rec[]): AbstractInterpreter {
    return records.reduce((interp, rec) => interp.insert(rec), this);
  }

  queryStr(str: string): Res[] {
    const record = dlLanguage.record.tryParse(str) as Rec;
    const [res, _] = this.evalStmt({ type: "Query", record });
    return res;
  }

  queryRec(record: Rec) {
    const [res, _] = this.evalStmt({ type: "Query", record });
    return res;
  }

  evalStr(str: string): [Res[], AbstractInterpreter] {
    const main = parse("str");
    return this.evalStmts(main.statement);
  }

  doLoad(path: string): AbstractInterpreter {
    const contents = this.loader(this.cwd + "/" + path);
    const program: Program = dlLanguage.program.tryParse(contents);
    let out: AbstractInterpreter = this;
    for (const stmt of program) {
      const [_, newInterp] = out.evalStmt(stmt);
      out = newInterp;
    }
    return out;
  }

  getRelation(name: string): Relation | null {
    const table = this.getTables().find((t) => t === name);
    if (table) {
      return { type: "Table", name: table };
    }
    const rule = this.getRules().find((r) => r.head.relation === name);
    if (rule) {
      return { type: "Rule", name, rule };
    }
    return null;
  }

  // TODO: do these two with queries to virtual tables
  abstract getRules(): Rule[];
  abstract getTables(): string[];
}
