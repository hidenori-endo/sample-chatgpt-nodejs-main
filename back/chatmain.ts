import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import express from "express";

export const getCompletion = (jsonData: any, res: express.Response) => {
    const message = jsonData.message;
    if (message.trim() == "") {
        res.json();
        return;
    }
    const configuration = new Configuration({
        apiKey: jsonData.openaiApiKey,
    });
    const openai = new OpenAIApi(configuration);

    const pastMessagea = jsonData.pastMessage.split('\n');

    const messages:Array<ChatCompletionRequestMessage> = new Array<ChatCompletionRequestMessage>();
    let m:ChatCompletionRequestMessage = { role: "user", content: ""};
    if (jsonData.system != "") {
        messages.push({ role: "system", content: jsonData.system })
    }
    pastMessagea.forEach((line: string) => {
        switch (line) {
            case '[user]':
                if (m.content.trim() != "") {
                    messages.push(m);
                }
                m = { role: "user", content: ""};
                break;
            case '[assistant]':
                if (m.content.trim() != "") {
                    messages.push(m);
                }
                m = { role: "assistant", content: ""};
                break;
            default:
                m.content += line + "\n";
                m.content = m.content.trim();
                break;
        }
    })

    if (m.content) {
        messages.push(m);
    }

    messages.push({ role: "user", content: message })

    const completion = openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
    });
    completion.then(response => {
        res.json({ message : response.data.choices[0].message});
    }).then(response => {
        console.log(response);
    }).catch(e => {
        res.json({ message : e });
    });

}

