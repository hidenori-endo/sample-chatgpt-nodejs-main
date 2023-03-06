import * as React from "react";

import './App.css';

function App() {

  // Ref
  const formRef = React.useRef<HTMLFormElement>(null)!;
  const systemAreaRef = React.useRef<HTMLTextAreaElement>(null)!;
  const messageAreaRef = React.useRef<HTMLTextAreaElement>(null)!;
  const responseAreaRef = React.useRef<HTMLTextAreaElement>(null)!;
  const pastAreaRef = React.useRef<HTMLTextAreaElement>(null)!;
  const nameAreaRef = React.useRef<HTMLInputElement>(null)!;

  const systemAreaHeightRef = React.useRef<HTMLInputElement>(null)!;
  const systemAreaWidthRef = React.useRef<HTMLInputElement>(null)!;
  const messageAreaHeightRef = React.useRef<HTMLInputElement>(null)!;
  const openaiApiKeyRef = React.useRef<HTMLInputElement>(null)!;
  const pastMessageAreaHeightRef = React.useRef<HTMLInputElement>(null)!;
  const pastMessageAreaWidthRef = React.useRef<HTMLInputElement>(null)!;


  // input
  const [systemValue, setSystem] = React.useState<string>("You are a helpful assistant.");
  const [pastMessagesValue, setPastMessages] = React.useState<string>("");
  const [messageValue, setMessage] = React.useState<string>("Hello, secretary!");
  const [responseValue, setResponse] = React.useState<string>("");


  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    callApi(e.target as HTMLFormElement);
  }

  const callApi = (e: HTMLFormElement) => {
    if (messageAreaRef.current?.value?.trim() === "") {
      return;
    }
    const formData = new FormData(e);

    const fetchData = async (data: any) => {
      let resJson: any = [];
      fetch("api", {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json'
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(Object.fromEntries(formData.entries()))
      }).then((response) => {
        if (!response.ok) {
          console.log('error!');
        }
        resJson = response.json();
        resJson.then((value: any) => {

          if (pastAreaRef.current) {
            let newMessages = pastAreaRef.current.value;
            newMessages += '\n\n' + '[user]' + '\n' + messageValue.trim() + '\n';
            newMessages += '\n' + '[assistant]' + '\n' + value.message.content;
            setPastMessages(newMessages.trim());
            pastAreaRef.current.value += newMessages.trim();
            pastAreaRef.current.scrollTop = pastAreaRef.current.scrollHeight;
          }
        });
      }).then((response) => {
        console.log(response);
      }).catch((e) => {
        console.log(e);
      });
    };
    fetchData({});
    if (messageAreaRef.current) {
      setResponse(messageAreaRef.current.value);
      messageAreaRef.current.value = "";
      setMessage("");
    }
  }

  const summarize = () =>{
    if (messageAreaRef.current && pastAreaRef.current && formRef.current) {
      messageAreaRef.current.value = "";
      messageAreaRef.current.value = "次のuserとassistantの会話を要約してください。\n\n" //"Summarize the following conversation separately for user and assistant.\n\n";
      messageAreaRef.current.value += pastAreaRef.current.value;
      pastAreaRef.current.value = "";
      setPastMessages("");
      setMessage("");
      callApi(formRef.current);
    }
  }
  

  const setHeight = (e: React.ChangeEvent<HTMLInputElement>) => {

    if (e.target.name === "systemAreaHeight") {
      if (systemAreaRef.current) {
        systemAreaRef.current.rows = parseInt(e.target.value);
      }
    }
    else if (e.target.name === "messageAreaHeight") {
      if (messageAreaRef.current) {
        messageAreaRef.current.rows = parseInt(e.target.value);
      }
    }
    else if (e.target.name === "pastMessageAreaHeight") {

      if (pastAreaRef.current) {
        pastAreaRef.current.rows = parseInt(e.target.value);
      }
    }
  }

  const setWidthHeight = (e: any) => {

    if (systemAreaRef.current &&
      messageAreaRef.current &&
      responseAreaRef.current &&
      pastAreaRef.current) {
      if (systemAreaWidthRef.current && systemAreaWidthRef.current?.value !== "") {
        systemAreaRef.current.cols = parseInt(systemAreaWidthRef.current.value);
        messageAreaRef.current.cols = parseInt(systemAreaWidthRef.current.value);
        responseAreaRef.current.cols = parseInt(systemAreaWidthRef.current.value);
      }
      if (pastMessageAreaWidthRef.current && pastMessageAreaWidthRef.current?.value !== "") {
        pastAreaRef.current.cols = parseInt(pastMessageAreaWidthRef.current?.value);
      }

      
      if (messageAreaHeightRef.current && messageAreaHeightRef.current?.value !== "") {
        messageAreaRef.current.rows = parseInt(messageAreaHeightRef.current.value);
      }
      if (systemAreaHeightRef.current && systemAreaHeightRef.current?.value !== "") {
        systemAreaRef.current.rows = parseInt(systemAreaHeightRef.current.value);
      }
      if (pastMessageAreaHeightRef.current && pastMessageAreaHeightRef.current?.value !== "") {
        pastAreaRef.current.rows = parseInt(pastMessageAreaHeightRef.current.value);
      }
  }
  }
  const sendMessage = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.shiftKey && e.key === 'Enter') {
      if (formRef.current) {
        callApi(formRef.current);
      }
    }
  }

  const save = (e: any) => {
    e.preventDefault();

    if(!window.confirm('save?')){
      return;
    }

    if (formRef.current) {
      const formData = new FormData(formRef.current);
      const fetchData = async (data: any) => {
        let resJson: any = [];
        fetch("save-json", {
          method: 'POST',
          mode: 'cors',
          cache: 'no-cache',
          headers: {
            'Content-Type': 'application/json'
          },
          redirect: 'follow',
          referrerPolicy: 'no-referrer',
          body: JSON.stringify(Object.fromEntries(formData.entries()))
        }).then((response) => {
          if (!response.ok) {
            console.log('error!');
          }
          else{
            window.confirm('saved!');
          }

        }).then((response) => {
          // console.log(response);
        }).catch((e) => {
          console.log(e);
        });
      };
      fetchData({});
    }
  }

  const load = (e: any) => {
    e.preventDefault();
    if (formRef.current && nameAreaRef.current) {
      const formData = new FormData(formRef.current);
      const fetchData = async (data: any) => {
        let resJson: any = [];
        fetch("load-json" + "?name=" + encodeURI(nameAreaRef.current?.value ?? ""), {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache',
          headers: {
            'Content-Type': 'application/json'
          },
          redirect: 'follow',
          referrerPolicy: 'no-referrer',
        }).then((response) => {
          if (!response.ok) {
            console.log('error!');
          }
          resJson = response.json();
          resJson.then((value: any) => {
            setMessage(value.message.trim());
            setPastMessages(value.pastMessage.trim());
            setSystem(value.system.trim());

            if (systemAreaHeightRef.current &&
              systemAreaWidthRef.current &&
              messageAreaHeightRef.current &&
              openaiApiKeyRef.current &&
              pastMessageAreaHeightRef.current &&
              pastMessageAreaWidthRef.current
            ) {
              systemAreaHeightRef.current.value = value.systemAreaHeight;
              systemAreaWidthRef.current.value = value.systemAreaWidth;
              messageAreaHeightRef.current.value = value.messageAreaHeight;
              openaiApiKeyRef.current.value = value.openaiApiKey;
              pastMessageAreaHeightRef.current.value = value.pastMessageAreaHeight;
              pastMessageAreaWidthRef.current.value = value.pastMessageAreaWidth;
            }
            setWidthHeight(null);
          });

        }).then((response) => {
          console.log(response);
        }).catch((e) => {
          console.log(e);
        });
      };
      fetchData({});
    }
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
                <tr>
                  <td valign="top">
                    <p>system</p>
                    <p>(rows:<input type="text" ref={systemAreaHeightRef} name="systemAreaHeight" onChange={setWidthHeight} style={{ width: 40, textAlign: "right" }} />)</p>
                    <p>(cols:<input type="text" ref={systemAreaWidthRef} name="systemAreaWidth" onChange={setWidthHeight} style={{ width: 40, textAlign: "right" }} />)</p>
                  </td>
                  <td>
                    <textarea ref={systemAreaRef} name="system" value={systemValue} onChange={(e) => setSystem(e.target.value)} rows={10} cols={80} />
                  </td>
                </tr>
                <tr>
                  <td valign="top">
                    <p>request</p>
                    <p>(rows:<input type="text" ref={messageAreaHeightRef} name="messageAreaHeight" onChange={setWidthHeight} style={{ width: 40, textAlign: "right" }} />)</p>
                  </td>
                  <td>
                    <textarea
                      ref={messageAreaRef} name="message" value={messageValue}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={sendMessage}
                      rows={30} cols={80} />
                    <td valign="top"><button type="submit">send message</button></td>
                  </td>
                </tr>
                <tr>
                  <td valign="top">last request is</td>
                  <td>
                    <textarea ref={responseAreaRef} value={responseValue} onChange={(e) => setResponse(e.target.value)} rows={6} cols={80} />
                  </td>
                </tr>
                <tr>
                  <td valign="top">
                    <p>save </p>
                  </td>
                  <td>
                    <input type="text" ref={nameAreaRef} name="name" width={4600} />
                    <input type="button" onClick={save} value="save" />
                    <input type="button" onClick={load} value="load" />
                  </td>
                </tr>
                <tr>
                  <td valign="top">
                    <p>API KEY</p>
                  </td>
                  <td>
                    <input type="password" ref={openaiApiKeyRef} name="openaiApiKey" width={400} />
                  </td>
                </tr>
              </table>
            </div>
            <div className="contents">
              <div>
                <p>chat gpt response</p>
                <p>(rows:<input type="text" ref={pastMessageAreaHeightRef} name="pastMessageAreaHeight" onChange={setWidthHeight} style={{ width: 40, textAlign: "right" }} />)</p>
                <p>(cols:<input type="text" ref={pastMessageAreaWidthRef} name="pastMessageAreaWidth" onChange={setWidthHeight} style={{ width: 40, textAlign: "right" }} />)</p>
                <p><input type="button" onClick={summarize} value="summarize" /></p>
                <p><input type="button" onClick={(e) => {setPastMessages("") ; setMessage("")}} value="clear" /></p>
              </div>
              <div>
                <textarea ref={pastAreaRef} name="pastMessage" value={pastMessagesValue} onChange={(e) => setPastMessages(e.target.value)} rows={60} cols={80} />
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

export default App;
