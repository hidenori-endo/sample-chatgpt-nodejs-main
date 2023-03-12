import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import express from "express";
import { Readable } from "stream";

export const getCompletion = async (jsonData: any, res: express.Response) => {
    const message = jsonData.message;
    if (message.trim() == "") {
        res.json();
        return;
    }

    let configuration;
    if (jsonData.openaiApiKey != "") {
        configuration = new Configuration({
            apiKey: jsonData.openaiApiKey,
        });
    }
    else if (process.env.OPENAI_API_KEY) {
        configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    const openai = new OpenAIApi(configuration);

    const pastMessagea = jsonData.pastMessage.split('\n');

    const messages: Array<ChatCompletionRequestMessage> = new Array<ChatCompletionRequestMessage>();
    let m: ChatCompletionRequestMessage = { role: "user", content: "" };
    if (jsonData.system != "") {
        messages.push({ role: "system", content: jsonData.system })
    }
    pastMessagea.forEach((line: string) => {
        switch (line) {
            case '[user]':
                if (m.content.trim() != "") {
                    messages.push(m);
                }
                m = { role: "user", content: "" };
                break;
            case '[assistant]':
                if (m.content.trim() != "") {
                    messages.push(m);
                }
                m = { role: "assistant", content: "" };
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

    try {

        // call api
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: messages,
            stream: true,
        }, { responseType: 'stream' });

        const stream = completion.data as any as Readable;
        let allMesages = "";

        // stream on
        stream.on("data", (chunk) => {
            try {
                let str: string = chunk.toString();

                console.log(str);
                // [DONE] is the last of steram
                if (str.indexOf("[DONE]") > 0) {
                    return;
                }

                // ignore null
                if (str.indexOf("delta\":{}") > 0) {
                    return;
                }

                // Lines to json
                const lines: Array<string> = str.split("\n");
                lines.forEach(line => {

                    // Remove beginning of line 
                    if (line.startsWith("data: ")) {
                        line = line.substring("data: ".length);
                    }

                    // Ignore Empty
                    if (line.trim() == "") {
                        return;
                    }

                    // parse json
                    const data = JSON.parse(line);
                    if (data.choices[0].delta.content === null || data.choices[0].delta.content === undefined) {
                        return;
                    }
                    process.stdout.write(data.choices[0].delta.content);
                    allMesages += data.choices[0].delta.content;
                    res.write(JSON.stringify({ text: data.choices[0].delta.content }));
                    //res.flush();
            });
            } catch (error) {
                console.error(error);
            }
        });


        stream.on("end", () => {
            res.write(JSON.stringify({ finished: true, text: allMesages }));
            res.end();
        });
        stream.on("error", (error) => {
            console.error(error);
            res.end(JSON.stringify({ error: true, message: "Error generating response." }));
        });

    } catch (error) {
        console.error(error);
        res.end();
    }
}

