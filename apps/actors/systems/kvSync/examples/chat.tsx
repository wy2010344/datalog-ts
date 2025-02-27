import React, { useState } from "react";
import { UIProps } from "../../../types";
import { ClientState, TransactionState } from "../client";
import { Client, makeClient, useLiveQuery } from "../hooks";
import {
  apply,
  doExpr,
  int,
  lambda,
  letExpr,
  obj,
  read,
  str,
  varr,
  write,
} from "../mutations/types";
import { MutationDefns, UserInput } from "../types";
import { TxnState } from "./common";
import { KVApp } from "./types";

type Message = {
  id: number;
  sender: string;
  message: string;
  state: TransactionState;
};

function ChatUI(props: UIProps<ClientState, UserInput>) {
  const [curThread, setCurThread] = useState("foo");

  const client = makeClient(props);

  return (
    <div>
      <h3>Chat</h3>
      <table>
        <tbody>
          <tr>
            <td valign="top">
              <ThreadList
                client={client}
                curThread={curThread}
                setCurThread={setCurThread}
                threads={EXAMPLE_THREADS}
              />
            </td>
            <td>
              <MessageTable threadID={curThread} client={client} />
              <SendBox threadID={curThread} client={client} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function MessageTable(props: { threadID: string; client: Client }) {
  const [messages, messagesStatus] = useLiveQuery(
    props.client,
    `messages-${props.threadID}`,
    { prefix: `/messages/${props.threadID}` }
  );

  if (messagesStatus === "Loading") {
    return (
      <p>
        <em>Loading...</em>
      </p>
    );
  }

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Sender</th>
            <th>Message</th>
            <th>State</th>
          </tr>
        </thead>
        <tbody>
          {/* sort by date? */}
          {Object.values(messages).map((message) => {
            const msg = message.value as Message;
            return (
              <tr key={message.transactionID}>
                <td>{msg.sender}</td>
                <td>{msg.message}</td>
                <td>
                  <TxnState
                    client={props.client}
                    txnID={message.transactionID}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function SendBox(props: { threadID: string; client: Client }) {
  const [message, setMessage] = useState("");
  const latestSeqNo =
    props.client.state.data[`/latestMessage/${props.threadID}`];

  return (
    <form
      onSubmit={(evt) => {
        evt.preventDefault();
        setMessage("");
        props.client.runMutation({
          name: "sendMessage",
          args: [props.threadID, message],
        });
      }}
    >
      <input
        onChange={(evt) => setMessage(evt.target.value)}
        value={message}
        onFocus={() => {
          if (latestSeqNo) {
            props.client.runMutation({
              name: "markRead",
              args: [props.threadID, latestSeqNo.value],
            });
          }
        }}
      />
      <button>Send</button>
    </form>
  );
}

function ThreadList(props: {
  client: Client;
  threads: string[];
  curThread: string;
  setCurThread: (th: string) => void;
}) {
  // TODO: this should be only for chats that this user is in
  const [latestMessage, latestMessageStatus] = useLiveQuery(
    props.client,
    "latest-messages",
    {
      prefix: "/latestMessage",
    }
  );
  const [latestMessageRead, latestMessageReadStatus] = useLiveQuery(
    props.client,
    "latest-message-read",
    {
      prefix: `/latestMessageRead/${props.client.state.id}`,
    }
  );

  return (
    <ul>
      {props.threads.map((threadID) => {
        // TODO: need full keys
        const latestMessageInThread =
          latestMessage[`/latestMessage/${threadID}`];

        const key = `/latestMessageRead/${props.client.state.id}/${threadID}`;
        const latestMessageReadInThread = latestMessageRead[key];
        const hasUnread =
          latestMessageInThread?.value >
          (latestMessageReadInThread?.value || -1);
        // console.log(
        //   "ThreadList item hasUnread",
        //   props.client.state.id,
        //   latestMessageInThread,
        //   ">",
        //   latestMessageReadInThread
        // );
        return (
          <li
            key={threadID}
            onClick={() => props.setCurThread(threadID)}
            style={{
              cursor: "pointer",
              fontWeight: threadID == props.curThread ? "bold" : "normal",
            }}
          >
            {hasUnread ? "* " : ""}
            {threadID}
          </li>
        );
      })}
    </ul>
  );
}

const mutations: MutationDefns = {
  sendMessage: lambda(
    ["threadID", "message"],
    letExpr(
      [
        {
          varName: "latestSeqNo",
          val: apply("parseInt", [
            read(
              apply("concat", [str("/latestMessage/"), varr("threadID")]),
              0
            ),
          ]),
        },
        {
          varName: "newSeqNo",
          val: apply("+", [varr("latestSeqNo"), int(1)]),
        },
      ],
      doExpr([
        write(
          apply("concat", [str("/latestMessage/"), varr("threadID")]),
          varr("newSeqNo")
        ),
        write(
          apply("concat", [
            str("/latestMessageRead/"),
            varr("curUser"),
            str("/"),
            varr("threadID"),
          ]),
          varr("newSeqNo")
        ),
        write(
          apply("concat", [
            str("/messages/"),
            varr("threadID"),
            str("/"),
            varr("newSeqNo"),
          ]),
          obj({ sender: varr("curUser"), message: varr("message") })
        ),
      ])
    )
  ),
  markRead: lambda(
    ["threadID", "seqNo"],
    doExpr([
      write(
        apply("concat", [
          str("/latestMessageRead/"),
          varr("curUser"),
          str("/"),
          varr("threadID"),
        ]),
        varr("seqNo")
      ),
    ])
  ),
};

const EXAMPLE_THREADS = ["foo", "bar"];

export const chat: KVApp = { name: "Chat", mutations, ui: ChatUI };
