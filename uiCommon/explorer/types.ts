import { Relation, Rule } from "../../core/types";
import { TreeCollapseState } from "../generic/treeView";

export type TableCollapseState = {
  [key: string]: TreeCollapseState;
};

export type RelationStatus =
  | { type: "Count"; count: number }
  | { type: "Error" };

export type RelationWithStatus = { relation: Relation; status: RelationStatus };

export type RelationCollapseStates = { [key: string]: TableCollapseState };
