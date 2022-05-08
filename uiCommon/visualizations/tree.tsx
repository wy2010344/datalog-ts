import React, { useMemo } from "react";
import { Bool, Rec, StringLit, Term } from "../../core/types";
import { VizTypeSpec } from "./typeSpec";
import { AbstractInterpreter } from "../../core/abstractInterpreter";
import {
  emptyCollapseState,
  TreeCollapseState,
  TreeView,
} from "../generic/treeView";
import { BareTerm } from "../dl/replViews";
import { treeFromRecords } from "../generic/treeFromRecords";
import { useJSONLocalStorage } from "../generic/hooks";

export const tree: VizTypeSpec = {
  name: "Tree",
  description: "visualize a tree",
  component: TreeViz,
};

function TreeViz(props: {
  interp: AbstractInterpreter;
  id: string;
  spec: Rec;
  setHighlightedTerm: (t: Term | null) => void;
}) {
  const [collapseState, setCollapseState] =
    useJSONLocalStorage<TreeCollapseState>(
      `tree-viz-${props.id}`,
      emptyCollapseState
    );
  try {
    const nodesQuery = (props.spec.attrs.nodes as StringLit).val;
    const sortChildren = (props.spec.attrs.sortChildren as Bool)?.val;
    const tree = useMemo(() => {
      const nodesRes = props.interp.queryStr(nodesQuery);
      const rootTerm = props.spec.attrs.rootTerm;
      return treeFromRecords(nodesRes, rootTerm, sortChildren);
    }, [props.interp]);
    return (
      <TreeView
        collapseState={collapseState}
        setCollapseState={setCollapseState}
        hideRoot={true}
        tree={tree}
        render={({ item }) =>
          item.bindings.Display ? (
            <BareTerm term={item.bindings.Display} />
          ) : (
            <BareTerm term={item.term} />
          )
        }
      />
    );
  } catch (e) {
    // TODO: use error boundary in VizArea instead of duplicating this
    console.error(e);
    return <pre style={{ color: "red" }}>{e.toString()}</pre>;
  }
}

// currently dead
// TODO: use this for "viz suggestions"
export function canTreeViz(rec: Rec): boolean {
  const fields = Object.keys(rec.attrs);
  return fields.includes("id") && fields.includes("parent");
}
