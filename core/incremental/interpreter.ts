import { EmissionLogAndGraph, emptyRuleGraph, RuleGraph } from "./types";
import { Rec, Res, Rule, Statement } from "../types";
import { declareTable } from "./build";
import { addRule, doQuery, EmissionLog, insertFact } from "./eval";
import { hasVars } from "../simple/simpleEvaluate";
import { ppb, ppr, ppt } from "../pretty";
import { Loader } from "../loaders";
import {
  datalogOut,
  datalogOutResults,
  plainTextOut,
  TestOutput,
} from "../../util/ddTest/types";
import { AbstractInterpreter } from "../abstractInterpreter";
import { parseRecord } from "../../languageWorkbench/languages/dl/parser";
import { parserTermToInternal } from "../translateAST";
import { flatMap } from "../../util/util";

export type Output =
  | { type: "EmissionLog"; log: EmissionLog }
  | { type: "Trace"; logAndGraph: EmissionLogAndGraph }
  | { type: "QueryResults"; results: Res[] }
  | { type: "Acknowledge" };

export class IncrementalInterpreter extends AbstractInterpreter {
  graph: RuleGraph;
  rules: Rule[];
  tables: string[];

  // TODO: kind of don't want to expose the graph parameter on the public
  //   constructor, but there's no constructor overloading...
  constructor(cwd: string, loader: Loader, graph: RuleGraph = emptyRuleGraph) {
    super(cwd, loader);
    this.graph = graph;
  }

  evalStmt(stmt: Statement): [Res[], AbstractInterpreter] {
    const { output, newInterp } = this.processStmt(stmt);
    return [output.type === "QueryResults" ? output.results : [], newInterp];
  }

  processStmt(stmt: Statement): {
    newInterp: AbstractInterpreter;
    output: Output;
  } {
    const interp = this;
    const graph = interp.graph;
    switch (stmt.type) {
      case "TableDecl": {
        const newGraph = declareTable(graph, stmt.name);
        return {
          newInterp: new IncrementalInterpreter(
            this.cwd,
            this.loader,
            newGraph
          ),
          output: ack,
        };
      }
      case "Rule": {
        const { newGraph, emissionLog } = addRule(graph, stmt.rule);
        return {
          newInterp: new IncrementalInterpreter(
            this.cwd,
            this.loader,
            newGraph
          ),
          output: { type: "EmissionLog", log: emissionLog },
        };
      }
      case "Fact": {
        const { newGraph, emissionLog } = insertFact(graph, {
          term: stmt.record,
          trace: { type: "BaseFactTrace" },
          bindings: {},
        });
        return {
          newInterp: new IncrementalInterpreter(
            this.cwd,
            this.loader,
            newGraph
          ),
          output: { type: "EmissionLog", log: emissionLog },
        };
      }
      case "Query": {
        return {
          newInterp: interp,
          output: {
            type: "QueryResults",
            results: doQuery(graph, stmt.record),
          },
        };
      }
      case "LoadStmt":
        return {
          newInterp: this.doLoad(stmt.path),
          output: ack,
        };
    }
  }

  // TODO: shouldn't this be in AbstractInterpreter?
  queryStr(str: string): Res[] {
    const rawRecord = parseRecord(str);
    const record = parserTermToInternal(rawRecord) as Rec;
    return doQuery(this.graph, record);
  }

  getRules(): Rule[] {
    return this.graph.rules;
  }

  getTables(): string[] {
    return this.graph.tables;
  }
}

const ack: Output = { type: "Acknowledge" };

type OutputOptions = {
  emissionLogMode: "test" | "repl";
  showBindings: boolean;
};

export function formatOutput(
  graph: RuleGraph,
  output: Output,
  opts: OutputOptions
): TestOutput {
  switch (output.type) {
    case "Acknowledge":
      return datalogOut([]);
    case "EmissionLog":
      if (opts.emissionLogMode === "test") {
        return {
          mimeType: "incremental-datalog/trace",
          content: output.log
            .map(
              ({ fromID, output }) =>
                `${fromID}: [${output
                  .map((res) => (res.term ? ppr(res) : ppb(res.bindings)))
                  .join(", ")}]`
            )
            .join("\n"),
        };
      } else {
        return datalogOut(
          flatMap(
            output.log.filter((emissionBatch) => {
              const fromNode = graph.nodes.get(emissionBatch.fromID);
              return (
                !fromNode.isInternal && fromNode.desc.type !== "BaseFactTable"
              );
            }),
            ({ output }) => output.map((res) => res.term)
          )
        );
      }
    case "QueryResults":
      return opts.showBindings
        ? datalogOutResults(output.results)
        : datalogOut(output.results.map((res) => res.term));
    case "Trace":
      return {
        content: JSON.stringify(output.logAndGraph),
        mimeType: "incremental-datalog/trace",
      };
  }
}
