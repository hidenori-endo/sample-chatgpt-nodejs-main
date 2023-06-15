import * as React from "react";

import './App.css';

function App() {

  // Ref
  const formRef = React.useRef<HTMLFormElement>(null)!;
  const messageAreaRef = React.useRef<HTMLTextAreaElement>(null)!;
  const responseAreaRef = React.useRef<HTMLTextAreaElement>(null)!; // last request
  const pastAreaRef = React.useRef<HTMLTextAreaElement>(null)!;

  // メッセージ履歴
  interface Message {
    role: 'assistant' | 'user';
    content: string;
  }
  const [messageHistory, setMessageHistory] = React.useState<Message[]>([]);

  async function appendResponse(role: 'assistant' | 'user', message: string) {
    setMessageHistory(prev => [...prev, { role, content: message }]);
  }

  // input
  const systemValue: string = "You are a helpful assistant.";
  const [pastMessagesValue, setPastMessages] = React.useState<string>("");
  const [messageValue, setMessage] = React.useState<string>("Hello, secretary!");
  const [responseValue, setResponse] = React.useState<string>(""); // last request
  
  // 送信
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    callApi(e.target as HTMLFormElement);
  }

  const sendMessage = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.shiftKey && e.key === 'Enter') {
      if (formRef.current) {
        callApi(formRef.current);
      }
    }
  }

  const callApi = (e: HTMLFormElement) => {
    if (messageAreaRef.current?.value?.trim() === "") {
      return;
    } 
    if (messageAreaRef.current) {
      setResponse(messageAreaRef.current.value); // last request
      // messageAreaRef.current.value = "";
      // setMessage(""); // 空にする
      appendResponse('user', messageAreaRef.current.value);
    }
    const formData = new FormData(e);

    const fetchData = async (data: any) => {
      let resJson: any = [];
      let res = await fetch("/api", {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json'
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(Object.fromEntries(formData.entries()))
      });
      const reader = res.body!.getReader()!;
      const decoder = new TextDecoder("utf-8");
      let isFirst = true;
      let isDone = false;
      let allMesages = "";
      const readChunk = async () => {
        return reader.read().then(({ value, done }): any => { // Added async here
          try {
            if (!done) {
              let dataString = decoder.decode(value);
              const data = JSON.parse(dataString);
              //console.log(data);

              if (data.finished == true) {
                appendResponse('assistant', data);
              }

              // エラー時
              if (data.error) {
                console.error("Error while generating content: " + data.message);
              } else if (!data.finished) {
                if (pastAreaRef.current) {
                  if (isFirst) {
                    isFirst = false;
                    let newMessages = pastAreaRef.current.value;
                    newMessages += '\n\n' + '[user]' + '\n' + messageValue.trim() + '\n';
                    newMessages += '\n' + '[assistant]' + '\n';
                    allMesages = newMessages
                    newMessages += data.text;
                    pastAreaRef.current.value = newMessages.trim();
                  } else {
                    pastAreaRef.current.value += data.text;
                  }
                  pastAreaRef.current.scrollTop = pastAreaRef.current.scrollHeight;
                }
              } else {
                if (pastAreaRef.current) {
                  pastAreaRef.current.value = (allMesages + data.text).trim();
                }
              }

            } else {
              console.log("done");
              if (pastAreaRef.current) {
                setPastMessages(pastAreaRef.current.value);
              }
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
    fetchData({});
    console.log(messageHistory);
  }

  return (
    <>
      <div className="" style={{ marginTop: 20, marginLeft: 20 }}>
        <div>
          <h2 className="">ChatGPT API Test</h2>
        </div>
        <form ref={formRef} onSubmit={submit}>
          <div className="contents">
            <div>
              <table>
                <tbody>
                  <tr>
                    <td valign="top">
                      <p>request</p>
                    </td>
                    <td>
                      <textarea
                        ref={messageAreaRef} name="message" value={messageValue}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={sendMessage}
                        rows={30} cols={80} />
                    </td>
                  </tr>
                  <tr><td></td><td>
                      <button type="submit">send message</button></td>
                      </tr>
                  <tr>
                    <td valign="top">last request is</td>
                    <td>
                      <textarea ref={responseAreaRef} value={responseValue} onChange={(e) => setResponse(e.target.value)} rows={6} cols={80} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="contents">
              <div>
                <p>chat gpt response</p>
                <p><input type="button" onClick={(e) => { setPastMessages(""); setMessage("") }} value="clear" /></p>
              </div>
              <div>
                <textarea ref={pastAreaRef} name="pastMessage" value={pastMessagesValue} onChange={(e) => setPastMessages(e.target.value)} rows={60} cols={80} />
              </div>
            </div>
          </div>
          <input type="hidden" name="system" value={systemValue} />
        </form>
      </div>
    </>
  );
}

export default App;
