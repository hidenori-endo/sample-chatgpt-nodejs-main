import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import express from "express";
import { Readable } from "stream";
import dotenv from "dotenv";

dotenv.config();

export const getCompletion = async (jsonData: any, res: express.Response) => {

    let configuration;
    
    configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const messages = jsonData.messages;
    console.log(messages)

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

