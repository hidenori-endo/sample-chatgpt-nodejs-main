import * as React from "react";
import './App.css';

function App() {

  // Ref
  const formRef = React.useRef<HTMLFormElement>(null)!;
  const messageAreaRef = React.useRef<HTMLTextAreaElement>(null)!;
  const pastAreaRef = React.useRef<HTMLTextAreaElement>(null)!;

  // input
  const systemValue: string = "返答は英語でしてください。翻訳ではなく、返答をしてください";
  const [pastMessagesValue, setPastMessages] = React.useState<string>("");
  const [messageValue, setMessage] = React.useState<string>("はじめましょう");

  // メッセージ履歴
  interface Message {
    role: 'assistant' | 'user' | 'system';
    content: string;
  }

  const [messageHistory, setMessageHistory] = React.useState<Message[]>([{ role: "system", content: systemValue }]);
  const [ApiInProgress, setApiInProgress] = React.useState(false);

  async function appendResponse(role: 'assistant' | 'user', message: string) {
    setMessageHistory(prev => [...prev, { role, content: message }]);
  }

  React.useEffect(() => {
    console.log(messageHistory);
  }, [messageHistory]);
  
  // 送信
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    afterClickedButton(e.target as HTMLFormElement);
  }

  const sendMessage = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.shiftKey && e.key === 'Enter') {
      if (formRef.current) {
        afterClickedButton(formRef.current);
      }
    }
  }

  // クリックの処理後、ApiInProgressをtrueにする
  const afterClickedButton = (e: HTMLFormElement) => {
    if (messageAreaRef.current) {
      if (messageAreaRef.current.value.trim() === "") {
        return;
      }

      // 履歴に追加
      appendResponse('user', messageAreaRef.current.value);

      setMessage("")
      messageAreaRef.current?.focus();

      // console.log(data);
      if (!pastMessagesValue) {
        setPastMessages('[user]\n' + messageAreaRef.current.value.trim());
      } else {
        setPastMessages(pastMessagesValue + '\n\n[user]\n' + messageAreaRef.current.value.trim());
      }
    }
    
    setApiInProgress(true);
  }

  // ApiInProgressがtrueになったら、POST
  React.useEffect(() => {
    if (ApiInProgress) { // falseでは実行しない
      // 非同期通信
      const fetchData = async (data: any) => {
        let res = await fetch("/api", {
          method: 'POST',
          mode: 'cors',
          cache: 'no-cache',
          headers: {
            'Content-Type': 'application/json'
          },
          redirect: 'follow',
          referrerPolicy: 'no-referrer',
          body: JSON.stringify({
            'system': systemValue,
            'messages': messageHistory,
          }),
        });

        const reader = res.body!.getReader()!;
        const decoder = new TextDecoder("utf-8");
        let assistantResponse = "";

        const readChunk = async () => {
          return reader.read().then(({ value, done }): any => {
            try {
              if (!done) {
                let dataString = decoder.decode(value);
                const data = JSON.parse(dataString);
  
                if (!data.finished) {
                  assistantResponse += data.text;
                  setPastMessages(pastMessagesValue + '\n\n[assistant]\n' + assistantResponse);
                } else {
                  appendResponse('assistant', data.text);
                }
  
                // エラー時
                if (data.error) {
                  console.error("Error while generating content: " + data.message);
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
  <div className="App">
    <header>
      <h2 className="">ChatGPT API Test</h2>
    </header>

    <main className="row">
        <form ref={formRef} onSubmit={submit}>
          <div className="col-12 col-md-8 mx-auto">
            <p className="mt-4">request</p>
            <textarea className="form-control question"
                ref={messageAreaRef} name="message" value={messageValue}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={sendMessage} />
            <button type="submit" className="btn btn-dark mt-3">send message</button>

            <p className="mt-4">response</p>
            <textarea className="form-control answer"
                ref={pastAreaRef} name="pastMessage" value={pastMessagesValue} />
          </div>
        </form>
    </main>
  </div>
  );
}

export default App;
