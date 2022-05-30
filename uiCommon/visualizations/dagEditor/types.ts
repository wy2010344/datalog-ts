import { Res, Term } from "../../../core/types";

export type AttributeEditorSpec = {
  relation: string;
  attribute: string;
  editor: TermEditorSpec;
};

export type TermEditorSpec = SliderSpec;

export type SliderSpec = { type: "Slider"; min: number; max: number };

export type RemovableNodeData = {
  res: Res;
  editors: AttributeEditorSpec[];
  onClick: () => void;
  onChange: (newTerm: Term) => void;
};

export type RemovableEdgeData = {
  onClick: () => void;
};
