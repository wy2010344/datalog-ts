import React from "react";
import { ppt } from "../../core/pretty";
import { Array, int, Rec } from "../../core/types";
import { substitute } from "../../core/unify";
import { VizArgs, VizTypeSpec } from "./typeSpec";

// TODO: shouldn't the normal table just be an editor?
export const tableEditor: VizTypeSpec = {
  name: "Editor",
  description: "edit some records",
  component: TableEditor,
};

function TableEditor(props: VizArgs) {
  // get data
  let dataError: string | null = null;
  let data: Rec[] = [];
  try {
    const recordsQuery = props.spec.attrs.query as Rec;
    data = props.interp.queryRec(recordsQuery).map((res) => res.term as Rec);
  } catch (e) {
    dataError = e.toString();
  }
  if (dataError) {
    return <pre style={{ color: "red" }}>getting data: {dataError}</pre>;
  }

  // get news
  let news: Rec[] = [];
  let newsError: string | null = null;
  try {
    news = (props.spec.attrs.new as Array).items.map((item) => item as Rec);
  } catch (e) {
    newsError = e.toString();
  }

  return (
    <>
      Data
      <ul>
        {data.map((rec) => (
          <li key={ppt(rec)}>
            <button
              onClick={() => {
                console.log("delete", rec);
              }}
            >
              x
            </button>{" "}
            <code>{ppt(rec)}</code>
          </li>
        ))}
      </ul>
      Create new:
      <ul>
        {news.map((newRec) => (
          <li key={ppt(newRec)}>
            <button
              onClick={() => {
                props.runStatements([
                  { type: "Insert", record: withID(newRec) },
                ]);
              }}
            >
              {ppt(newRec)}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

// TODO: can we do sequential numbers instead?
function withID(rec: Rec): Rec {
  return {
    ...rec,
    attrs: {
      ...rec.attrs,
      id: int(Math.random()),
    },
  };
}
