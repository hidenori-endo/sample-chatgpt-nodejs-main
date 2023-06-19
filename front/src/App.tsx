import * as React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Form, Row, Col } from "react-bootstrap";
import "./App.css";

function App() {
  // 定数
  let systemValue: string = "You are a useful assistant";

  // Ref
  const formRef = React.useRef<HTMLFormElement>(null)!;
  const messageAreaRef = React.useRef<HTMLTextAreaElement>(null)!;
  const pastAreaRef = React.useRef<HTMLTextAreaElement>(null)!;

  // State
  const [messageValue, setMessage] =
    React.useState<string>("よろしくおねがいします"); // input
  const [ApiInProgress, setApiInProgress] = React.useState(false); // API送信
  const usingFunctionRef = React.useRef(false);
  const [pastMessagesValue, setPastMessages] = React.useState<string>(""); // 結果

  // メッセージ履歴
  const [messageHistory, setMessageHistory] = React.useState<Message[]>([
    { role: "system", content: systemValue },
  ]); // POST用の履歴

  interface Message {
    role: "assistant" | "user" | "system";
    content: string;
  }

  async function appendResponse(role: "assistant" | "user", message: string) {
    setMessageHistory((prev) => [...prev, { role, content: message }]);
  }

  React.useEffect(() => {
    console.log(messageHistory);
  }, [messageHistory]);

  // 送信
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    afterClickedButton(e.target as HTMLFormElement);
  };

  const sendMessage = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.shiftKey && e.key === "Enter") {
      if (formRef.current) {
        afterClickedButton(formRef.current);
      }
    }
  };

  // クリックの処理後、ApiInProgressをtrueにする
  const afterClickedButton = (e: HTMLFormElement) => {
    if (messageAreaRef.current) {
      if (messageAreaRef.current.value.trim() === "") {
        return;
      }

      // 履歴に追加
      appendResponse("user", messageAreaRef.current.value);

      setMessage("");
      messageAreaRef.current?.focus();

      // console.log(data);
      if (!pastMessagesValue) {
        setPastMessages("[user]\n" + messageAreaRef.current.value.trim());
      } else {
        setPastMessages(
          pastMessagesValue +
            "\n\n[user]\n" +
            messageAreaRef.current.value.trim()
        );
      }
    }

    setApiInProgress(true);
  };

  // ApiInProgressがtrueになったら、POST
  React.useEffect(() => {
    if (ApiInProgress) {
      // falseでは実行しない
      // 非同期通信
      const fetchData = async (data: any) => {
        let res = await fetch("/api", {
          method: "POST",
          mode: "cors",
          cache: "no-cache",
          headers: {
            "Content-Type": "application/json",
          },
          redirect: "follow",
          referrerPolicy: "no-referrer",
          body: JSON.stringify({
            system: systemValue,
            messages: messageHistory,
          }),
        });

        const reader = res.body!.getReader()!;
        const decoder = new TextDecoder("utf-8");

        let allMessage = "";
        const readChunk = async () => {
          return reader.read().then(({ value, done }): any => {
            try {
              if (!done) {
                // }{ で分割、
                let dataString =
                  "[" + decoder.decode(value).replaceAll("}{", "},{") + "]";
                // console.log(dataString);
                data = JSON.parse(dataString);

                try {
                  let dataArray = JSON.parse(dataString);

                  for (let data of dataArray) {
                    // エラー時
                    if (data.error) {
                      console.error(
                        "Error while generating content: " + data.message
                      );
                    } else {
                      let content: string;

                      if (!data.finished) {
                        // function_call
                        if (data?.delta?.function_call) {
                          content = data.delta.function_call.arguments;
                          usingFunctionRef.current = true;
                          // 通常メッセージ
                        } else {
                          setPastMessages((currentPastMessages) => {
                            return currentPastMessages + "\n\n[assistant]\n";
                          });

                          content = data.delta.content;

                          setPastMessages((currentPastMessages) => {
                            return currentPastMessages + content;
                          });
                        }

                        allMessage += content;
                      } else {
                        // 終了時
                        if (usingFunctionRef.current) {
                          let variables = JSON.parse(allMessage);
                          usingFunctionRef.current = false;
                        } else {
                          appendResponse("assistant", allMessage);
                        }
                      }
                    }
                  }
                } catch (error) {
                  // JSONパースエラー
                  console.log(error);
                }
              } else {
                console.log("done");
              }
            } catch (error) {
              console.log(error);
            }
            if (!done) {
              return readChunk();
            }
          });
        };
        readChunk();
      };
      fetchData({}); // 実行

      // API呼び出しが終わったら ApiInProgressをfalseに
      setApiInProgress(false);
    }
  }, [ApiInProgress]);

  return (
    <div className="container-fluid">
      <Form ref={formRef} onSubmit={submit}>
        <Row>
          <Col xs={12} md={8} className="mx-auto">
            <Form.Group className="mt-4" controlId="input">
              <Form.Label>request</Form.Label>
              <Form.Control
                as="textarea"
                className="question"
                ref={messageAreaRef}
                name="message"
                defaultValue={messageValue}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={sendMessage}
              />
              <Form.Control as="button" type="submit" className="mt-3">
                send
              </Form.Control>
            </Form.Group>

            <Form.Group className="mt-4" controlId="input">
              <Form.Label>response</Form.Label>
              <Form.Control
                disabled
                as="textarea"
                className="answer"
                ref={pastAreaRef}
                name="pastMessage"
                value={pastMessagesValue}
                onChange={(e) => setPastMessages(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>
      </Form>
    </div>
  );
}

export default App;
