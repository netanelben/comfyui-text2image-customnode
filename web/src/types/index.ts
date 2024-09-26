export type MessageType =
  | "status"
  | "execution_start"
  | "executing"
  | "progress"
  | "executed"
  | "execution_interrupted";

export interface MessageData {
  type: MessageType;
  data: {
    node: string;
    max: number;
    value: number;
    prompt_id: string;
    output: any;
  };
}
