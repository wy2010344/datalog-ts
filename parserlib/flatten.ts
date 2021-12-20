import { rec, int, Rec, Term, str } from "../core/types";
import { groupBy } from "../util/util";
import { RuleTree } from "./ruleTree";

type State = {
  records: Rec[];
  nextID: number;
  source: string;
};

export function flatten(tree: RuleTree, source: string): Rec[] {
  const state: State = {
    records: [],
    nextID: 0,
    source,
  };
  recur(state, tree, -1);
  return state.records;
}

function recur(state: State, tree: RuleTree, parentID: number): number {
  const childrenByName = groupBy(
    tree.children.map((child) => [child.name, child])
  );

  const id = state.nextID;
  state.nextID++;
  const props: { [name: string]: Term } = {
    id: int(id),
    span: rec("span", {
      from: int(tree.span.from),
      to: int(tree.span.to),
    }),
    parentID: int(parentID),
    text: str(state.source.substring(tree.span.from, tree.span.to)),
  };
  tree.children.forEach((child) => {
    const childID = recur(state, child, id);
    if (childrenByName[child.name].length === 1) {
      props[child.name] = int(childID);
    }
  });
  state.records.push(rec(`ast.${tree.name}`, props));
  return id;
}