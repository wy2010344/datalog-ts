import React, { useState } from "react";
import ReactDOM from "react-dom";
import { LANGUAGES } from "../../languageWorkbench/languages";
import { LingoEditor } from "../../uiCommon/ide/editor";
import { initialEditorState } from "../../uiCommon/ide/types";
import * as sqlParser from "../../languageWorkbench/languages/sql/parser";
import ReactJson from "react-json-view";

const INIT_SQL = "SELECT id, name FROM users;";

function Main() {
  const [sqlEditorState, setSQLEditorState] = useState(
    initialEditorState(INIT_SQL)
  );

  const sqlAST = sqlParser.parse(sqlEditorState.source);

  return (
    <>
      <h1>Rel &lt;=&gt; SQL Playground</h1>
      <LingoEditor
        editorState={sqlEditorState}
        setEditorState={setSQLEditorState}
        langSpec={LANGUAGES.sql}
      />

      <h2>SQL Ast</h2>
      <ReactJson
        src={sqlAST}
        displayDataTypes={false}
        displayObjectSize={false}
      />
    </>
  );
}

ReactDOM.render(<Main />, document.getElementById("main"));
